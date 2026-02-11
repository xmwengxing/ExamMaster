/**
 * 分片上传服务单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChunkedUploadService } from '../../../src/services/chunked-upload.service';
import fs from 'fs/promises';
import path from 'path';
import db from '../../../db.js';

describe('ChunkedUploadService 单元测试', () => {
  let service: ChunkedUploadService;
  const testUserId = 'test-user-123';
  const testFileName = 'test-file.json';
  const testFileSize = 10 * 1024 * 1024; // 10MB

  beforeEach(async () => {
    service = new ChunkedUploadService();
    await service.initialize();
    
    // 清理测试数据
    await db.query('DELETE FROM upload_sessions WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM upload_sessions WHERE user_id = $1', [testUserId]);
  });

  describe('初始化上传', () => {
    it('应该成功创建上传会话', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);

      expect(session.sessionId).toBeDefined();
      expect(session.fileName).toBe(testFileName);
      expect(session.fileSize).toBe(testFileSize);
      expect(session.totalChunks).toBeGreaterThan(0);
      expect(session.uploadedChunks).toEqual([]);
      expect(session.status).toBe('pending');
    });

    it('应该正确计算分片数量', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const expectedChunks = Math.ceil(testFileSize / (2 * 1024 * 1024)); // 2MB per chunk

      expect(session.totalChunks).toBe(expectedChunks);
    });

    it('应该在数据库中创建会话记录', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);

      const result = await db.query(
        'SELECT * FROM upload_sessions WHERE session_id = $1',
        [session.sessionId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].file_name).toBe(testFileName);
    });
  });

  describe('上传分片', () => {
    it('应该成功上传单个分片', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024 * 1024); // 1MB

      const result = await service.uploadChunk(session.sessionId, 0, chunkData);

      expect(result.chunkIndex).toBe(0);
      expect(result.uploaded).toBe(true);
      expect(result.uploadedChunks).toBe(1);
    });

    it('应该拒绝无效的会话ID', async () => {
      const chunkData = Buffer.alloc(1024);

      await expect(
        service.uploadChunk('invalid-session-id', 0, chunkData)
      ).rejects.toThrow('上传会话不存在');
    });

    it('应该拒绝无效的分片索引', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024);

      await expect(
        service.uploadChunk(session.sessionId, -1, chunkData)
      ).rejects.toThrow('无效的分片索引');

      await expect(
        service.uploadChunk(session.sessionId, session.totalChunks + 1, chunkData)
      ).rejects.toThrow('无效的分片索引');
    });

    it('应该正确更新已上传分片列表', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024 * 1024);

      await service.uploadChunk(session.sessionId, 0, chunkData);
      await service.uploadChunk(session.sessionId, 2, chunkData);
      await service.uploadChunk(session.sessionId, 1, chunkData);

      const updatedSession = await service.getSession(session.sessionId);
      expect(updatedSession?.uploadedChunks).toEqual([0, 1, 2]);
    });

    it('应该更新会话状态为uploading', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024);

      await service.uploadChunk(session.sessionId, 0, chunkData);

      const updatedSession = await service.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('uploading');
    });
  });

  describe('完成上传', () => {
    it('应该拒绝未完成的上传', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024 * 1024);

      // 只上传部分分片
      await service.uploadChunk(session.sessionId, 0, chunkData);

      await expect(
        service.completeUpload(session.sessionId)
      ).rejects.toThrow('上传未完成');
    });

    it('应该成功合并所有分片', async () => {
      // 创建小文件测试
      const smallFileSize = 5 * 1024 * 1024; // 5MB
      const session = await service.initUpload('small.json', smallFileSize, testUserId);
      
      // 上传所有分片
      const chunkSize = 2 * 1024 * 1024;
      for (let i = 0; i < session.totalChunks; i++) {
        const size = Math.min(chunkSize, smallFileSize - i * chunkSize);
        const chunkData = Buffer.alloc(size);
        await service.uploadChunk(session.sessionId, i, chunkData);
      }

      const result = await service.completeUpload(session.sessionId);

      expect(result.sessionId).toBe(session.sessionId);
      expect(result.fileName).toBe('small.json');
      expect(result.filePath).toBeDefined();

      // 验证文件存在
      const fileExists = await fs.access(result.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // 清理
      await fs.unlink(result.filePath).catch(() => {});
    });

    it('应该更新会话状态为completed', async () => {
      const smallFileSize = 3 * 1024 * 1024;
      const session = await service.initUpload('test.json', smallFileSize, testUserId);
      
      const chunkSize = 2 * 1024 * 1024;
      for (let i = 0; i < session.totalChunks; i++) {
        const size = Math.min(chunkSize, smallFileSize - i * chunkSize);
        const chunkData = Buffer.alloc(size);
        await service.uploadChunk(session.sessionId, i, chunkData);
      }

      await service.completeUpload(session.sessionId);

      const updatedSession = await service.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('completed');

      // 清理
      const result = await db.query(
        'SELECT * FROM upload_sessions WHERE session_id = $1',
        [session.sessionId]
      );
      if (result.rows.length > 0) {
        const filePath = path.join(process.cwd(), 'uploads', 'temp', `${session.sessionId}_test.json`);
        await fs.unlink(filePath).catch(() => {});
      }
    });
  });

  describe('取消上传', () => {
    it('应该成功取消上传', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);

      await service.cancelUpload(session.sessionId);

      const updatedSession = await service.getSession(session.sessionId);
      expect(updatedSession?.status).toBe('cancelled');
    });

    it('应该清理分片文件', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      const chunkData = Buffer.alloc(1024);

      await service.uploadChunk(session.sessionId, 0, chunkData);
      await service.cancelUpload(session.sessionId);

      const sessionDir = path.join(process.cwd(), 'uploads', 'temp', session.sessionId);
      const dirExists = await fs.access(sessionDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(false);
    });
  });

  describe('获取会话信息', () => {
    it('应该返回正确的会话信息', async () => {
      const session = await service.initUpload(testFileName, testFileSize, testUserId);

      const retrieved = await service.getSession(session.sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessionId).toBe(session.sessionId);
      expect(retrieved?.fileName).toBe(testFileName);
      expect(retrieved?.fileSize).toBe(testFileSize);
    });

    it('应该返回null对于不存在的会话', async () => {
      const retrieved = await service.getSession('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('清理过期会话', () => {
    it('应该清理过期的会话', async () => {
      // 创建一个已过期的会话
      const session = await service.initUpload(testFileName, testFileSize, testUserId);
      
      // 手动设置过期时间为过去
      await db.query(
        'UPDATE upload_sessions SET expires_at = NOW() - INTERVAL \'1 hour\' WHERE session_id = $1',
        [session.sessionId]
      );

      const cleanedCount = await service.cleanupExpiredSessions();

      expect(cleanedCount).toBeGreaterThan(0);

      const retrieved = await service.getSession(session.sessionId);
      expect(retrieved?.status).toBe('cancelled');
    });
  });
});
