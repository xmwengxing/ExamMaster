/**
 * 前端分片上传工具
 * 支持重试机制、指数退避和进度跟踪
 */

import axios, { AxiosProgressEvent } from 'axios';

// 分片大小: 2MB
export const CHUNK_SIZE = 2 * 1024 * 1024;

// 最大重试次数
const MAX_RETRIES = 3;

// 初始退避延迟（毫秒）
const INITIAL_BACKOFF_DELAY = 1000;

export interface UploadOptions {
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error, chunkIndex?: number) => void;
}

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  currentChunk: number;
  speed: number; // 字节/秒
  estimatedTimeLeft: number; // 秒
}

export interface ChunkRetryInfo {
  chunkIndex: number;
  retryCount: number;
  lastError?: string;
}

export class ChunkedUploader {
  private sessionId: string | null = null;
  private file: File;
  private totalChunks: number;
  private uploadedChunks: Set<number> = new Set();
  private retryInfo: Map<number, ChunkRetryInfo> = new Map();
  private startTime: number = 0;
  private uploadedBytes: number = 0;
  private cancelled: boolean = false;

  constructor(file: File) {
    this.file = file;
    this.totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  }

  /**
   * 开始上传
   */
  async upload(options: UploadOptions): Promise<string> {
    this.cancelled = false;
    this.startTime = Date.now();
    this.uploadedBytes = 0;
    this.uploadedChunks.clear();
    this.retryInfo.clear();

    try {
      // 1. 初始化上传会话
      const session = await this.initSession();
      this.sessionId = session.sessionId;

      // 2. 上传所有分片（支持并发）
      await this.uploadChunks(options);

      // 3. 完成上传（合并分片）
      const result = await this.completeUpload();

      return result.filePath;
    } catch (error: any) {
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  }

  /**
   * 取消上传
   */
  async cancel(): Promise<void> {
    this.cancelled = true;
    if (this.sessionId) {
      try {
        await axios.delete(`/api/upload/cancel/${this.sessionId}`);
      } catch (error) {
        console.error('取消上传失败:', error);
      }
    }
  }

  /**
   * 初始化上传会话
   */
  private async initSession(): Promise<any> {
    const response = await axios.post('/api/upload/init', {
      fileName: this.file.name,
      fileSize: this.file.size
    });

    if (!response.data.success) {
      throw new Error(response.data.message || '初始化上传会话失败');
    }

    return response.data.data;
  }

  /**
   * 上传所有分片
   */
  private async uploadChunks(options: UploadOptions): Promise<void> {
    // 使用并发控制，最多同时上传3个分片
    const concurrency = 3;
    const chunks: number[] = Array.from({ length: this.totalChunks }, (_, i) => i);

    // 分批上传
    for (let i = 0; i < chunks.length; i += concurrency) {
      if (this.cancelled) {
        throw new Error('上传已取消');
      }

      const batch = chunks.slice(i, i + concurrency);
      await Promise.all(
        batch.map(chunkIndex => this.uploadChunkWithRetry(chunkIndex, options))
      );
    }
  }

  /**
   * 上传单个分片（带重试）
   */
  private async uploadChunkWithRetry(
    chunkIndex: number,
    options: UploadOptions
  ): Promise<void> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
      if (this.cancelled) {
        throw new Error('上传已取消');
      }

      try {
        await this.uploadSingleChunk(chunkIndex, options);
        
        // 上传成功，清除重试信息
        this.retryInfo.delete(chunkIndex);
        
        // 通知分片完成
        if (options.onChunkComplete) {
          options.onChunkComplete(chunkIndex, this.totalChunks);
        }
        
        return;
      } catch (error: any) {
        lastError = error;
        retryCount++;

        // 记录重试信息
        this.retryInfo.set(chunkIndex, {
          chunkIndex,
          retryCount,
          lastError: error.message
        });

        if (retryCount <= MAX_RETRIES) {
          // 指数退避策略
          const delay = INITIAL_BACKOFF_DELAY * Math.pow(2, retryCount - 1);
          console.log(`分片 ${chunkIndex} 上传失败，${delay}ms 后重试 (${retryCount}/${MAX_RETRIES})`);
          await this.sleep(delay);
        }
      }
    }

    // 所有重试都失败
    throw new Error(
      `分片 ${chunkIndex} 上传失败，已重试 ${MAX_RETRIES} 次: ${lastError?.message}`
    );
  }

  /**
   * 上传单个分片
   */
  private async uploadSingleChunk(
    chunkIndex: number,
    options: UploadOptions
  ): Promise<void> {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.file.size);
    const chunk = this.file.slice(start, end);

    const formData = new FormData();
    formData.append('sessionId', this.sessionId!);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunk);

    const response = await axios.post('/api/upload/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          // 更新已上传字节数
          const chunkUploadedBytes = progressEvent.loaded;
          const previousChunkBytes = this.uploadedChunks.size * CHUNK_SIZE;
          this.uploadedBytes = previousChunkBytes + chunkUploadedBytes;

          // 计算进度
          this.updateProgress(chunkIndex, options);
        }
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || '分片上传失败');
    }

    // 标记分片已上传
    this.uploadedChunks.add(chunkIndex);
  }

  /**
   * 完成上传（合并分片）
   */
  private async completeUpload(): Promise<any> {
    const response = await axios.post('/api/upload/complete', {
      sessionId: this.sessionId
    });

    if (!response.data.success) {
      throw new Error(response.data.message || '完成上传失败');
    }

    return response.data.data;
  }

  /**
   * 更新进度信息
   */
  private updateProgress(currentChunk: number, options: UploadOptions): void {
    if (!options.onProgress) return;

    const elapsedTime = (Date.now() - this.startTime) / 1000; // 秒
    const speed = elapsedTime > 0 ? this.uploadedBytes / elapsedTime : 0;
    const remainingBytes = this.file.size - this.uploadedBytes;
    const estimatedTimeLeft = speed > 0 ? remainingBytes / speed : 0;

    const progress: UploadProgress = {
      uploadedBytes: this.uploadedBytes,
      totalBytes: this.file.size,
      percentage: Math.round((this.uploadedBytes / this.file.size) * 100),
      uploadedChunks: this.uploadedChunks.size,
      totalChunks: this.totalChunks,
      currentChunk,
      speed,
      estimatedTimeLeft
    };

    options.onProgress(progress);
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取重试信息
   */
  getRetryInfo(): ChunkRetryInfo[] {
    return Array.from(this.retryInfo.values());
  }

  /**
   * 获取上传统计
   */
  getStats() {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const speed = elapsedTime > 0 ? this.uploadedBytes / elapsedTime : 0;

    return {
      uploadedBytes: this.uploadedBytes,
      totalBytes: this.file.size,
      uploadedChunks: this.uploadedChunks.size,
      totalChunks: this.totalChunks,
      elapsedTime,
      speed,
      retryCount: Array.from(this.retryInfo.values()).reduce(
        (sum, info) => sum + info.retryCount,
        0
      )
    };
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

/**
 * 格式化速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond) + '/s';
}

/**
 * 格式化时间
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return Math.round(seconds) + ' 秒';
  if (seconds < 3600) return Math.round(seconds / 60) + ' 分钟';
  return Math.round(seconds / 3600) + ' 小时';
}
