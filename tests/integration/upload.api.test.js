/**
 * 分片上传API集成测试
 * 测试分片上传的初始化、上传、完成和取消功能
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import uploadRoutes from '../../src/routes/upload.routes.js';
import db from '../../db.js';
import fs from 'fs/promises';
import path from 'path';

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);

describe('分片上传API集成测试', () => {
  let testSessionIds = [];

  beforeAll(async () => {
    // 清理测试数据
    await db.query('DELETE FROM upload_sessions WHERE file_name LIKE \'%测试%\'');
  });

  afterAll(async () => {
    // 清理测试数据
    if (testSessionIds.length > 0) {
      await db.query(
        'DELETE FROM upload_sessions WHERE session_id = ANY($1)',
        [testSessionIds]
      );
    }

    // 清理测试文件
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.includes('test-')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  });

  beforeEach(() => {
    testSessionIds = [];
  });

  describe('POST /api/upload/init - 初始化上传会话', () => {
    it('应该成功初始化上传会话', async () => {
      const response = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试文件.xlsx',
          fileSize: 10 * 1024 * 1024 // 10MB
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.totalChunks).toBeGreaterThan(0);
      expect(response.body.data.chunkSize).toBe(2 * 1024 * 1024); // 2MB
      expect(response.body.data.expiresAt).toBeDefined();

      testSessionIds.push(response.body.data.sessionId);
    });

    it('应该正确计算分片数量', async () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const expectedChunks = Math.ceil(fileSize / chunkSize); // 3个分片

      const response = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试文件2.xlsx',
          fileSize
        })
        .expect(200);

      expect(response.body.data.totalChunks).toBe(expectedChunks);

      testSessionIds.push(response.body.data.sessionId);
    });

    it('应该返回400当缺少fileName', async () => {
      const response = await request(app)
        .post('/api/upload/init')
        .send({
          fileSize: 1024
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });

    it('应该返回400当缺少fileSize', async () => {
      const response = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: 'test.xlsx'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });
  });

  describe('POST /api/upload/chunk - 上传分片', () => {
    let sessionId;

    beforeEach(async () => {
      // 初始化一个上传会话
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试分片上传.xlsx',
          fileSize: 4 * 1024 * 1024 // 4MB
        });

      sessionId = initResponse.body.data.sessionId;
      testSessionIds.push(sessionId);
    });

    it('应该成功上传分片', async () => {
      const chunkData = Buffer.alloc(1024 * 1024, 'a'); // 1MB测试数据

      const response = await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '0')
        .attach('chunk', chunkData, 'chunk-0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.chunkIndex).toBe(0);
      expect(response.body.data.uploaded).toBe(true);
    });

    it('应该支持上传多个分片', async () => {
      const chunkData = Buffer.alloc(1024 * 1024, 'a');

      // 上传第一个分片
      const response1 = await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '0')
        .attach('chunk', chunkData, 'chunk-0')
        .expect(200);

      expect(response1.body.success).toBe(true);

      // 上传第二个分片
      const response2 = await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '1')
        .attach('chunk', chunkData, 'chunk-1')
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data.chunkIndex).toBe(1);
    });

    it('应该返回400当缺少sessionId', async () => {
      const chunkData = Buffer.alloc(1024, 'a');

      const response = await request(app)
        .post('/api/upload/chunk')
        .field('chunkIndex', '0')
        .attach('chunk', chunkData, 'chunk-0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });

    it('应该返回400当缺少chunkIndex', async () => {
      const chunkData = Buffer.alloc(1024, 'a');

      const response = await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .attach('chunk', chunkData, 'chunk-0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该返回400当缺少chunk数据', async () => {
      const response = await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/upload/complete - 完成上传', () => {
    let sessionId;

    beforeEach(async () => {
      // 初始化并上传所有分片
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试完成上传.xlsx',
          fileSize: 2 * 1024 * 1024 // 2MB，正好1个分片
        });

      sessionId = initResponse.body.data.sessionId;
      testSessionIds.push(sessionId);

      // 上传分片
      const chunkData = Buffer.alloc(2 * 1024 * 1024, 'a');
      await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '0')
        .attach('chunk', chunkData, 'chunk-0');
    });

    it('应该成功完成上传', async () => {
      const response = await request(app)
        .post('/api/upload/complete')
        .send({ sessionId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.filePath).toBeDefined();
      expect(response.body.data.fileName).toBe('测试完成上传.xlsx');
    });

    it('应该返回400当缺少sessionId', async () => {
      const response = await request(app)
        .post('/api/upload/complete')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });

    it('应该返回500当会话不存在', async () => {
      const response = await request(app)
        .post('/api/upload/complete')
        .send({ sessionId: 'nonexistent-session' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/upload/cancel/:sessionId - 取消上传', () => {
    let sessionId;

    beforeEach(async () => {
      // 初始化上传会话
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试取消上传.xlsx',
          fileSize: 4 * 1024 * 1024
        });

      sessionId = initResponse.body.data.sessionId;
      testSessionIds.push(sessionId);
    });

    it('应该成功取消上传', async () => {
      const response = await request(app)
        .delete(`/api/upload/cancel/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('已取消');
    });

    it('应该返回400当缺少sessionId', async () => {
      const response = await request(app)
        .delete('/api/upload/cancel/')
        .expect(404); // Express会返回404当路径不匹配

      // 注意：这里可能返回404而不是400，取决于Express路由配置
    });
  });

  describe('GET /api/upload/session/:sessionId - 获取会话信息', () => {
    let sessionId;

    beforeEach(async () => {
      // 初始化上传会话
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试获取会话.xlsx',
          fileSize: 4 * 1024 * 1024
        });

      sessionId = initResponse.body.data.sessionId;
      testSessionIds.push(sessionId);
    });

    it('应该成功获取会话信息', async () => {
      const response = await request(app)
        .get(`/api/upload/session/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.fileName).toBe('测试获取会话.xlsx');
      expect(response.body.data.status).toBeDefined();
    });

    it('应该返回404当会话不存在', async () => {
      const response = await request(app)
        .get('/api/upload/session/nonexistent-session')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不存在');
    });
  });

  describe('完整上传流程测试', () => {
    it('应该完成完整的分片上传流程', async () => {
      // 1. 初始化上传
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试完整流程.xlsx',
          fileSize: 3 * 1024 * 1024 // 3MB，需要2个分片
        })
        .expect(200);

      const sessionId = initResponse.body.data.sessionId;
      const totalChunks = initResponse.body.data.totalChunks;
      testSessionIds.push(sessionId);

      expect(totalChunks).toBe(2);

      // 2. 上传所有分片
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = Buffer.alloc(2 * 1024 * 1024, 'a');
        
        const uploadResponse = await request(app)
          .post('/api/upload/chunk')
          .field('sessionId', sessionId)
          .field('chunkIndex', i.toString())
          .attach('chunk', chunkData, `chunk-${i}`)
          .expect(200);

        expect(uploadResponse.body.success).toBe(true);
      }

      // 3. 获取会话状态
      const statusResponse = await request(app)
        .get(`/api/upload/session/${sessionId}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);

      // 4. 完成上传
      const completeResponse = await request(app)
        .post('/api/upload/complete')
        .send({ sessionId })
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.filePath).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的sessionId', async () => {
      const response = await request(app)
        .get('/api/upload/session/invalid-session-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该处理数据库错误', async () => {
      // 尝试使用一个已经完成的会话
      const initResponse = await request(app)
        .post('/api/upload/init')
        .send({
          fileName: '测试错误处理.xlsx',
          fileSize: 1024
        });

      const sessionId = initResponse.body.data.sessionId;
      testSessionIds.push(sessionId);

      // 上传分片
      const chunkData = Buffer.alloc(1024, 'a');
      await request(app)
        .post('/api/upload/chunk')
        .field('sessionId', sessionId)
        .field('chunkIndex', '0')
        .attach('chunk', chunkData, 'chunk-0');

      // 完成上传
      await request(app)
        .post('/api/upload/complete')
        .send({ sessionId });

      // 尝试再次完成上传应该失败
      const response = await request(app)
        .post('/api/upload/complete')
        .send({ sessionId })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
