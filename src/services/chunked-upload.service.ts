/**
 * 分片上传服务
 * 支持大文件分片上传、断点续传和进度跟踪
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db.js';

// 上传临时目录
const UPLOAD_TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');

// 分片大小: 2MB
export const CHUNK_SIZE = 2 * 1024 * 1024;

export interface UploadSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface ChunkUploadResult {
  chunkIndex: number;
  uploaded: boolean;
  totalChunks: number;
  uploadedChunks: number;
}

export interface CompleteUploadResult {
  sessionId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
}

export class ChunkedUploadService {
  /**
   * 初始化上传目录
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error('创建上传临时目录失败:', error);
    }
  }

  /**
   * 初始化上传会话
   */
  async initUpload(
    fileName: string,
    fileSize: number,
    userId: string
  ): Promise<UploadSession> {
    const sessionId = uuidv4();
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    // 在数据库中创建上传会话记录
    await db.query(
      `INSERT INTO upload_sessions 
       (session_id, user_id, file_name, file_size, total_chunks, uploaded_chunks, status, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [sessionId, userId, fileName, fileSize, totalChunks, '[]', 'pending', createdAt, expiresAt]
    );

    // 创建会话临时目录
    const sessionDir = path.join(UPLOAD_TEMP_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    return {
      sessionId,
      fileName,
      fileSize,
      totalChunks,
      uploadedChunks: [],
      status: 'pending',
      createdAt,
      expiresAt
    };
  }

  /**
   * 上传单个分片
   */
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<ChunkUploadResult> {
    // 获取会话信息
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('上传会话不存在');
    }

    if (session.status === 'cancelled') {
      throw new Error('上传已取消');
    }

    if (session.status === 'completed') {
      throw new Error('上传已完成');
    }

    // 检查分片索引是否有效
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error(`无效的分片索引: ${chunkIndex}`);
    }

    // 保存分片文件
    const sessionDir = path.join(UPLOAD_TEMP_DIR, sessionId);
    const chunkPath = path.join(sessionDir, `chunk_${chunkIndex}`);
    await fs.writeFile(chunkPath, chunkData);

    // 更新已上传分片列表
    const uploadedChunks = [...session.uploadedChunks, chunkIndex].sort((a, b) => a - b);
    
    // 更新数据库
    await db.query(
      `UPDATE upload_sessions 
       SET uploaded_chunks = $1, status = $2, updated_at = NOW()
       WHERE session_id = $3`,
      [JSON.stringify(uploadedChunks), 'uploading', sessionId]
    );

    return {
      chunkIndex,
      uploaded: true,
      totalChunks: session.totalChunks,
      uploadedChunks: uploadedChunks.length
    };
  }

  /**
   * 完成上传（合并分片）
   */
  async completeUpload(sessionId: string): Promise<CompleteUploadResult> {
    // 获取会话信息
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('上传会话不存在');
    }

    // 检查是否所有分片都已上传
    if (session.uploadedChunks.length !== session.totalChunks) {
      throw new Error(
        `上传未完成: ${session.uploadedChunks.length}/${session.totalChunks} 分片已上传`
      );
    }

    // 合并分片
    const sessionDir = path.join(UPLOAD_TEMP_DIR, sessionId);
    const finalPath = path.join(UPLOAD_TEMP_DIR, `${sessionId}_${session.fileName}`);
    const writeStream = await fs.open(finalPath, 'w');

    try {
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
      }
    } finally {
      await writeStream.close();
    }

    // 清理分片文件
    await fs.rm(sessionDir, { recursive: true, force: true });

    // 更新数据库状态
    await db.query(
      `UPDATE upload_sessions 
       SET status = $1, completed_at = NOW(), updated_at = NOW()
       WHERE session_id = $2`,
      ['completed', sessionId]
    );

    return {
      sessionId,
      filePath: finalPath,
      fileName: session.fileName,
      fileSize: session.fileSize
    };
  }

  /**
   * 取消上传
   */
  async cancelUpload(sessionId: string): Promise<void> {
    // 获取会话信息
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('上传会话不存在');
    }

    // 清理分片文件
    const sessionDir = path.join(UPLOAD_TEMP_DIR, sessionId);
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch (error) {
      console.error('清理分片文件失败:', error);
    }

    // 更新数据库状态
    await db.query(
      `UPDATE upload_sessions 
       SET status = $1, updated_at = NOW()
       WHERE session_id = $2`,
      ['cancelled', sessionId]
    );
  }

  /**
   * 获取上传会话信息
   */
  async getSession(sessionId: string): Promise<UploadSession | null> {
    const result = await db.query(
      `SELECT session_id, file_name, file_size, total_chunks, uploaded_chunks, status, created_at, expires_at
       FROM upload_sessions
       WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      sessionId: row.session_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      totalChunks: row.total_chunks,
      uploadedChunks: JSON.parse(row.uploaded_chunks || '[]'),
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  /**
   * 清理过期的上传会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    // 查找过期的会话
    const result = await db.query(
      `SELECT session_id FROM upload_sessions
       WHERE expires_at < NOW() AND status != 'completed'`
    );

    let cleanedCount = 0;

    for (const row of result.rows) {
      try {
        await this.cancelUpload(row.session_id);
        cleanedCount++;
      } catch (error) {
        console.error(`清理会话失败 ${row.session_id}:`, error);
      }
    }

    return cleanedCount;
  }
}

// 导出单例
export const chunkedUploadService = new ChunkedUploadService();
