/**
 * 分片上传组件
 * 支持大文件分片上传、断点续传和进度显示
 */

import React, { useState, useRef } from 'react';
import { Upload, Progress, Button, message, Space, Alert } from 'antd';
import { UploadOutlined, PauseOutlined, PlayCircleOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

interface ChunkedUploadProps {
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number; // 最大文件大小（字节）
}

interface UploadState {
  file: File | null;
  sessionId: string | null;
  totalChunks: number;
  uploadedChunks: number;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: number;
  error: string | null;
}

export const ChunkedUpload: React.FC<ChunkedUploadProps> = ({
  onComplete,
  onError,
  accept = '.xlsx,.xls,.docx,.json',
  maxSize = 100 * 1024 * 1024 // 默认100MB
}) => {
  const [state, setState] = useState<UploadState>({
    file: null,
    sessionId: null,
    totalChunks: 0,
    uploadedChunks: 0,
    status: 'idle',
    progress: 0,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);

  /**
   * 初始化上传会话
   */
  const initUpload = async (file: File): Promise<string> => {
    try {
      const response = await axios.post('/api/upload/init', {
        fileName: file.name,
        fileSize: file.size
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '初始化上传失败');
      }

      return response.data.data.sessionId;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || '初始化上传失败');
    }
  };

  /**
   * 上传单个分片（带重试）
   */
  const uploadChunk = async (
    sessionId: string,
    chunkIndex: number,
    chunkData: Blob,
    retries = 3
  ): Promise<void> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // 检查是否暂停
        if (isPausedRef.current) {
          throw new Error('Upload paused');
        }

        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('chunk', chunkData);

        abortControllerRef.current = new AbortController();

        const response = await axios.post('/api/upload/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: abortControllerRef.current.signal
        });

        if (!response.data.success) {
          throw new Error(response.data.message || '上传分片失败');
        }

        return;
      } catch (error: any) {
        if (error.message === 'Upload paused' || axios.isCancel(error)) {
          throw error;
        }

        if (attempt === retries - 1) {
          throw new Error(`分片 ${chunkIndex} 上传失败: ${error.message}`);
        }

        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  /**
   * 完成上传
   */
  const completeUpload = async (sessionId: string): Promise<any> => {
    try {
      const response = await axios.post('/api/upload/complete', {
        sessionId
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '完成上传失败');
      }

      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || '完成上传失败');
    }
  };

  /**
   * 开始上传
   */
  const startUpload = async (file: File) => {
    try {
      // 检查文件大小
      if (file.size > maxSize) {
        throw new Error(`文件大小超过限制（最大${Math.floor(maxSize / 1024 / 1024)}MB）`);
      }

      // 初始化状态
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      setState(prev => ({
        ...prev,
        file,
        totalChunks,
        uploadedChunks: 0,
        status: 'uploading',
        progress: 0,
        error: null
      }));

      isPausedRef.current = false;

      // 初始化上传会话
      const sessionId = await initUpload(file);
      setState(prev => ({ ...prev, sessionId }));

      // 分片上传
      for (let i = 0; i < totalChunks; i++) {
        if (isPausedRef.current) {
          setState(prev => ({ ...prev, status: 'paused' }));
          return;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(sessionId, i, chunk);

        // 更新进度
        const uploadedChunks = i + 1;
        const progress = Math.floor((uploadedChunks / totalChunks) * 100);
        setState(prev => ({
          ...prev,
          uploadedChunks,
          progress
        }));
      }

      // 完成上传
      const result = await completeUpload(sessionId);

      setState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100
      }));

      message.success('文件上传成功！');
      onComplete?.(result);
    } catch (error: any) {
      if (error.message === 'Upload paused' || axios.isCancel(error)) {
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));

      message.error(error.message || '上传失败');
      onError?.(error);
    }
  };

  /**
   * 暂停上传
   */
  const pauseUpload = () => {
    isPausedRef.current = true;
    abortControllerRef.current?.abort();
    setState(prev => ({ ...prev, status: 'paused' }));
    message.info('上传已暂停');
  };

  /**
   * 恢复上传
   */
  const resumeUpload = () => {
    if (state.file && state.sessionId) {
      isPausedRef.current = false;
      setState(prev => ({ ...prev, status: 'uploading' }));
      
      // 从当前进度继续上传
      const totalChunks = Math.ceil(state.file.size / CHUNK_SIZE);
      const continueUpload = async () => {
        try {
          for (let i = state.uploadedChunks; i < totalChunks; i++) {
            if (isPausedRef.current) {
              setState(prev => ({ ...prev, status: 'paused' }));
              return;
            }

            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, state.file!.size);
            const chunk = state.file!.slice(start, end);

            await uploadChunk(state.sessionId!, i, chunk);

            const uploadedChunks = i + 1;
            const progress = Math.floor((uploadedChunks / totalChunks) * 100);
            setState(prev => ({
              ...prev,
              uploadedChunks,
              progress
            }));
          }

          // 完成上传
          const result = await completeUpload(state.sessionId!);

          setState(prev => ({
            ...prev,
            status: 'completed',
            progress: 100
          }));

          message.success('文件上传成功！');
          onComplete?.(result);
        } catch (error: any) {
          if (error.message === 'Upload paused' || axios.isCancel(error)) {
            return;
          }

          setState(prev => ({
            ...prev,
            status: 'error',
            error: error.message
          }));

          message.error(error.message || '上传失败');
          onError?.(error);
        }
      };

      continueUpload();
    }
  };

  /**
   * 取消上传
   */
  const cancelUpload = async () => {
    isPausedRef.current = true;
    abortControllerRef.current?.abort();

    if (state.sessionId) {
      try {
        await axios.delete(`/api/upload/cancel/${state.sessionId}`);
      } catch (error) {
        console.error('取消上传失败:', error);
      }
    }

    setState({
      file: null,
      sessionId: null,
      totalChunks: 0,
      uploadedChunks: 0,
      status: 'idle',
      progress: 0,
      error: null
    });

    message.info('上传已取消');
  };

  /**
   * 文件选择处理
   */
  const handleFileSelect = (file: File) => {
    startUpload(file);
    return false; // 阻止默认上传行为
  };

  return (
    <div style={{ width: '100%' }}>
      {state.status === 'idle' && (
        <Upload.Dragger
          accept={accept}
          beforeUpload={handleFileSelect}
          showUploadList={false}
          multiple={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 Excel (.xlsx, .xls)、Word (.docx) 和 JSON 文件
            <br />
            最大文件大小: {Math.floor(maxSize / 1024 / 1024)}MB
          </p>
        </Upload.Dragger>
      )}

      {state.status !== 'idle' && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message={`文件: ${state.file?.name}`}
            description={
              <div>
                <Progress
                  percent={state.progress}
                  status={
                    state.status === 'error'
                      ? 'exception'
                      : state.status === 'completed'
                      ? 'success'
                      : 'active'
                  }
                />
                <div style={{ marginTop: 8 }}>
                  {state.status === 'uploading' && (
                    <span>正在上传: {state.uploadedChunks} / {state.totalChunks} 分片</span>
                  )}
                  {state.status === 'paused' && (
                    <span>已暂停: {state.uploadedChunks} / {state.totalChunks} 分片</span>
                  )}
                  {state.status === 'completed' && <span>上传完成！</span>}
                  {state.status === 'error' && <span style={{ color: 'red' }}>{state.error}</span>}
                </div>
              </div>
            }
            type={
              state.status === 'error'
                ? 'error'
                : state.status === 'completed'
                ? 'success'
                : 'info'
            }
            style={{ marginBottom: 16 }}
          />

          <Space>
            {state.status === 'uploading' && (
              <Button icon={<PauseOutlined />} onClick={pauseUpload}>
                暂停
              </Button>
            )}
            {state.status === 'paused' && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={resumeUpload}>
                继续
              </Button>
            )}
            {(state.status === 'uploading' || state.status === 'paused' || state.status === 'error') && (
              <Button danger icon={<CloseOutlined />} onClick={cancelUpload}>
                取消
              </Button>
            )}
            {state.status === 'completed' && (
              <Button onClick={cancelUpload}>
                上传新文件
              </Button>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default ChunkedUpload;
