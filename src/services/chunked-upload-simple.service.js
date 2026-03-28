/**
 * 简化版分片上传服务
 * 自动创建所需表，不依赖预先的数据库迁移
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db.js';

// 上传临时目录
const UPLOAD_TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');
const UPLOAD_FINAL_DIR = path.join(process.cwd(), 'uploads', 'files');

// 分片大小: 2MB
export const CHUNK_SIZE = 2 * 1024 * 1024;

export class SimpleChunkedUploadService {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化服务（创建目录和表）
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 创建上传目录
      await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });
      await fs.mkdir(UPLOAD_FINAL_DIR, { recursive: true });

      // 检查并创建upload_sessions表
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'upload_sessions'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.log('[SimpleChunkedUpload] 创建upload_sessions表');
        await db.query(`
          CREATE TABLE upload_sessions (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(100) UNIQUE NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            file_name VARCHAR(500) NOT NULL,
            file_size BIGINT NOT NULL,
            chunk_size INTEGER NOT NULL,
            total_chunks INTEGER NOT NULL,
            uploaded_chunks INTEGER[] DEFAULT '{}',
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            expires_at TIMESTAMP
          );
          
          CREATE INDEX idx_session_id ON upload_sessions(session_id);
          CREATE INDEX idx_user_id ON upload_sessions(user_id);
          CREATE INDEX idx_status ON upload_sessions(status);
        `);
      }

      this.initialized = true;
      console.log('[SimpleChunkedUpload] 服务初始化完成');
    } catch (error) {
      console.error('[SimpleChunkedUpload] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化上传会话
   */
  async initUpload(fileName, fileSize, userId) {
    await this.initialize();

    const sessionId = uuidv4();
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    console.log('[SimpleChunkedUpload] 初始化上传会话:', { sessionId, fileName, fileSize, totalChunks });

    // 在数据库中创建上传会话记录
    await db.query(
      `INSERT INTO upload_sessions 
       (session_id, user_id, file_name, file_size, chunk_size, total_chunks, uploaded_chunks, status, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [sessionId, userId, fileName, fileSize, CHUNK_SIZE, totalChunks, [], 'pending', createdAt, expiresAt]
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
  async uploadChunk(sessionId, chunkIndex, chunkData) {
    await this.initialize();

    console.log('[SimpleChunkedUpload] 上传分片:', { sessionId, chunkIndex, size: chunkData.length });

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
    const uploadedChunks = [...new Set([...session.uploadedChunks, chunkIndex])].sort((a, b) => a - b);
    
    // 更新数据库
    await db.query(
      `UPDATE upload_sessions 
       SET uploaded_chunks = $1, status = $2, updated_at = NOW()
       WHERE session_id = $3`,
      [uploadedChunks, 'uploading', sessionId]
    );

    console.log('[SimpleChunkedUpload] 分片上传完成:', { chunkIndex, progress: `${uploadedChunks.length}/${session.totalChunks}` });

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
  async completeUpload(sessionId) {
    await this.initialize();

    console.log('[SimpleChunkedUpload] 完成上传:', sessionId);

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
    const timestamp = Date.now();
    const ext = path.extname(session.fileName);
    const baseName = path.basename(session.fileName, ext);
    const finalFileName = `${baseName}_${timestamp}${ext}`;
    const finalPath = path.join(UPLOAD_FINAL_DIR, finalFileName);
    
    console.log('[SimpleChunkedUpload] 合并分片到:', finalPath);

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

    console.log('[SimpleChunkedUpload] 上传完成:', finalPath);

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
  async cancelUpload(sessionId) {
    await this.initialize();

    console.log('[SimpleChunkedUpload] 取消上传:', sessionId);

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
      console.error('[SimpleChunkedUpload] 清理分片文件失败:', error);
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
  async getSession(sessionId) {
    await this.initialize();

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
      fileSize: parseInt(row.file_size),
      totalChunks: row.total_chunks,
      uploadedChunks: Array.isArray(row.uploaded_chunks) ? row.uploaded_chunks : [],
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  /**
   * 清理过期的上传会话
   */
  async cleanupExpiredSessions() {
    await this.initialize();

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
        console.error(`[SimpleChunkedUpload] 清理会话失败 ${row.session_id}:`, error);
      }
    }

    console.log(`[SimpleChunkedUpload] 清理了 ${cleanedCount} 个过期会话`);

    return cleanedCount;
  }
}

// 导出单例
export const simpleChunkedUploadService = new SimpleChunkedUploadService();
