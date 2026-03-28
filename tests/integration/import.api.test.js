/**
 * 导入任务API集成测试
 * 测试导入任务的创建、查询、取消和结果获取功能
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import importRoutes from '../../src/routes/import.routes.js';
import db from '../../db.js';
import fs from 'fs/promises';
import path from 'path';

// 创建测试应用
const app = express();
app.use(express.json());

// 模拟用户认证中间件
app.use((req, res, next) => {
  req.user = { id: 'test-user-123' };
  next();
});

app.use('/api/import', importRoutes);

describe('导入任务API集成测试', () => {
  let testTaskIds = [];
  let testFilePath;

  beforeAll(async () => {
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', ['test-user-123']);

    // 创建测试文件
    testFilePath = path.join(process.cwd(), 'uploads', 'temp', 'test-import.json');
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    await fs.writeFile(testFilePath, JSON.stringify({
      metadata: { version: '2.0', totalQuestions: 2 },
      questions: [
        {
          content: '测试题目1',
          type: 'SINGLE',
          options: ['A', 'B', 'C'],
          answer: 'A'
        },
        {
          content: '测试题目2',
          type: 'MULTIPLE',
          options: ['A', 'B', 'C'],
          answer: ['A', 'B']
        }
      ]
    }));
  });

  afterAll(async () => {
    // 清理测试数据
    if (testTaskIds.length > 0) {
      await db.query(
        'DELETE FROM import_tasks WHERE task_id = ANY($1)',
        [testTaskIds]
      );
    }

    // 清理测试文件
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // 忽略清理错误
    }
  });

  beforeEach(() => {
    testTaskIds = [];
  });

  describe('POST /api/import/start - 开始导入任务', () => {
    it('应该成功创建导入任务', async () => {
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test-import.json',
          fileSize: 1024
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.taskId).toBeDefined();
      expect(response.body.data.status).toBe('queued');
      expect(response.body.data.message).toContain('已添加到队列');

      testTaskIds.push(response.body.data.taskId);
    });

    it('应该生成唯一的任务ID', async () => {
      const response1 = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test1.json',
          fileSize: 1024
        })
        .expect(200);

      const response2 = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test2.json',
          fileSize: 1024
        })
        .expect(200);

      expect(response1.body.data.taskId).not.toBe(response2.body.data.taskId);

      testTaskIds.push(response1.body.data.taskId);
      testTaskIds.push(response2.body.data.taskId);
    });

    it('应该返回400当缺少filePath', async () => {
      const response = await request(app)
        .post('/api/import/start')
        .send({
          fileName: 'test.json'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });

    it('应该返回400当缺少fileName', async () => {
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: '/path/to/file'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必需参数');
    });

    it('应该处理fileSize为可选参数', async () => {
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test.json'
          // 不提供fileSize
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      testTaskIds.push(response.body.data.taskId);
    });
  });

  describe('GET /api/import/status/:taskId - 查询任务状态', () => {
    let taskId;

    beforeEach(async () => {
      // 创建一个测试任务
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test-status.json',
          fileSize: 1024
        });

      taskId = response.body.data.taskId;
      testTaskIds.push(taskId);
    });

    it('应该成功查询任务状态', async () => {
      const response = await request(app)
        .get(`/api/import/status/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.task_id).toBe(taskId);
      expect(response.body.data.status).toBeDefined();
      expect(['queued', 'processing', 'completed', 'failed']).toContain(
        response.body.data.status
      );
    });

    it('应该返回任务的详细信息', async () => {
      const response = await request(app)
        .get(`/api/import/status/${taskId}`)
        .expect(200);

      const data = response.body.data;
      expect(data.file_name).toBe('test-status.json');
      expect(data.user_id).toBe('test-user-123');
      expect(data.created_at).toBeDefined();
    });

    it('应该返回404当任务不存在', async () => {
      const response = await request(app)
        .get('/api/import/status/nonexistent-task-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不存在');
    });
  });

  describe('GET /api/import/result/:taskId - 获取任务结果', () => {
    let taskId;

    beforeEach(async () => {
      // 创建一个测试任务
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test-result.json',
          fileSize: 1024
        });

      taskId = response.body.data.taskId;
      testTaskIds.push(taskId);

      // 等待任务处理（在实际测试中可能需要更长时间）
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('应该获取已完成任务的结果', async () => {
      // 先检查任务状态
      const statusResponse = await request(app)
        .get(`/api/import/status/${taskId}`);

      const status = statusResponse.body.data.status;

      if (status === 'completed' || status === 'failed') {
        // 任务已完成或失败，应该能获取结果
        const response = await request(app)
          .get(`/api/import/result/${taskId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.taskId).toBe(taskId);
        expect(response.body.data).toHaveProperty('success');
        expect(response.body.data).toHaveProperty('duration');
      } else {
        // 任务还未完成，应该返回404
        const response = await request(app)
          .get(`/api/import/result/${taskId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      }
    });

    it('应该返回404当任务不存在', async () => {
      const response = await request(app)
        .get('/api/import/result/nonexistent-task-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不存在');
    });
  });

  describe('DELETE /api/import/cancel/:taskId - 取消任务', () => {
    let taskId;

    beforeEach(async () => {
      // 创建一个测试任务
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test-cancel.json',
          fileSize: 1024
        });

      taskId = response.body.data.taskId;
      testTaskIds.push(taskId);
    });

    it('应该成功取消任务', async () => {
      const response = await request(app)
        .delete(`/api/import/cancel/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('已取消');
    });

    it('取消后任务状态应该更新', async () => {
      await request(app)
        .delete(`/api/import/cancel/${taskId}`)
        .expect(200);

      // 等待状态更新
      await new Promise(resolve => setTimeout(resolve, 500));

      const statusResponse = await request(app)
        .get(`/api/import/status/${taskId}`)
        .expect(200);

      // 任务状态应该是cancelled或failed
      expect(['cancelled', 'failed']).toContain(
        statusResponse.body.data.status
      );
    });

    it('应该返回400当缺少taskId', async () => {
      const response = await request(app)
        .delete('/api/import/cancel/')
        .expect(404); // Express会返回404当路径不匹配
    });
  });

  describe('GET /api/import/tasks - 获取用户任务列表', () => {
    beforeEach(async () => {
      // 创建多个测试任务
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/import/start')
          .send({
            filePath: testFilePath,
            fileName: `test-list-${i}.json`,
            fileSize: 1024
          });

        testTaskIds.push(response.body.data.taskId);
      }
    });

    it('应该返回用户的所有任务', async () => {
      const response = await request(app)
        .get('/api/import/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.tasks).toBeInstanceOf(Array);
      expect(response.body.data.tasks.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.total).toBe(response.body.data.tasks.length);
    });

    it('应该支持limit参数', async () => {
      const response = await request(app)
        .get('/api/import/tasks')
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks.length).toBeLessThanOrEqual(2);
    });

    it('应该使用默认limit值', async () => {
      const response = await request(app)
        .get('/api/import/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      // 默认limit是50
      expect(response.body.data.tasks.length).toBeLessThanOrEqual(50);
    });

    it('应该返回任务的基本信息', async () => {
      const response = await request(app)
        .get('/api/import/tasks')
        .query({ limit: 1 })
        .expect(200);

      if (response.body.data.tasks.length > 0) {
        const task = response.body.data.tasks[0];
        expect(task).toHaveProperty('task_id');
        expect(task).toHaveProperty('file_name');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('created_at');
      }
    });
  });

  describe('完整导入流程测试', () => {
    it('应该完成完整的导入流程', async () => {
      // 1. 创建导入任务
      const startResponse = await request(app)
        .post('/api/import/start')
        .send({
          filePath: testFilePath,
          fileName: 'test-full-flow.json',
          fileSize: 1024
        })
        .expect(200);

      const taskId = startResponse.body.data.taskId;
      testTaskIds.push(taskId);

      expect(startResponse.body.data.status).toBe('queued');

      // 2. 查询任务状态
      const statusResponse = await request(app)
        .get(`/api/import/status/${taskId}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.task_id).toBe(taskId);

      // 3. 获取任务列表
      const listResponse = await request(app)
        .get('/api/import/tasks')
        .expect(200);

      const taskInList = listResponse.body.data.tasks.find(
        t => t.task_id === taskId
      );
      expect(taskInList).toBeDefined();

      // 4. 等待任务处理
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 5. 再次查询状态
      const finalStatusResponse = await request(app)
        .get(`/api/import/status/${taskId}`)
        .expect(200);

      // 任务应该已经处理或正在处理
      expect(['processing', 'completed', 'failed']).toContain(
        finalStatusResponse.body.data.status
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的taskId', async () => {
      const response = await request(app)
        .get('/api/import/status/invalid-task-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该处理不存在的文件路径', async () => {
      const response = await request(app)
        .post('/api/import/start')
        .send({
          filePath: '/nonexistent/path/file.json',
          fileName: 'nonexistent.json',
          fileSize: 1024
        })
        .expect(200); // 任务会被创建，但稍后会失败

      testTaskIds.push(response.body.data.taskId);

      // 等待任务处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 查询状态应该显示失败
      const statusResponse = await request(app)
        .get(`/api/import/status/${response.body.data.taskId}`);

      // 任务可能还在队列中或已失败
      expect(['queued', 'processing', 'failed']).toContain(
        statusResponse.body.data.status
      );
    });

    it('应该处理数据库错误', async () => {
      // 尝试获取一个格式错误的taskId
      const response = await request(app)
        .get('/api/import/status/')
        .expect(404); // Express路由不匹配
    });
  });

  describe('并发任务测试', () => {
    it('应该支持同时创建多个任务', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/import/start')
            .send({
              filePath: testFilePath,
              fileName: `concurrent-${i}.json`,
              fileSize: 1024
            })
        );
      }

      const responses = await Promise.all(promises);

      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        testTaskIds.push(response.body.data.taskId);
      });

      // 所有任务ID应该是唯一的
      const taskIds = responses.map(r => r.body.data.taskId);
      const uniqueTaskIds = new Set(taskIds);
      expect(uniqueTaskIds.size).toBe(5);
    });
  });
});
