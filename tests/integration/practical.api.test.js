/**
 * 实操模块 API 集成测试
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import practicalRoutes from '../../src/routes/practical.routes.js';
import db from '../../db.js';

// Mock db 模块
vi.mock('../../db.js', () => ({
  default: {
    getMany: vi.fn(),
    execute: vi.fn()
  }
}));

// Mock 中间件
vi.mock('../../src/middleware/auth.js', () => ({
  auth: (req, res, next) => {
    req.user = { id: 'test-user', role: 'STUDENT' };
    next();
  },
  adminAuth: (req, res, next) => {
    req.user = { id: 'admin-user', role: 'ADMIN' };
    next();
  }
}));

describe('实操模块 API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/practical', practicalRoutes);
  });

  describe('GET /api/practical/tasks', () => {
    it('应该返回所有实操任务', async () => {
      const mockTasks = [
        {
          id: 'pt-1',
          title: '任务1',
          parts: [],
          created_at: '2024-01-01'
        }
      ];
      db.getMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/practical/tasks')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('pt-1');
    });

    it('应该处理错误', async () => {
      db.getMany.mockRejectedValue(new Error('数据库错误'));

      await request(app)
        .get('/api/practical/tasks')
        .expect(500);
    });
  });

  describe('POST /api/practical/tasks', () => {
    it('应该创建实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        title: '新任务',
        parts: [{ title: '部分1' }]
      };

      const response = await request(app)
        .post('/api/practical/tasks')
        .send(taskData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });
  });

  describe('PUT /api/practical/tasks/:id', () => {
    it('应该更新实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        title: '更新的任务',
        parts: []
      };

      const response = await request(app)
        .put('/api/practical/tasks/pt-1')
        .send(taskData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/practical/tasks/:id', () => {
    it('应该删除实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/practical/tasks/pt-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/practical/records', () => {
    it('应该返回学员自己的记录', async () => {
      const mockRecords = [
        {
          id: 'ptr-1',
          user_id: 'test-user',
          task_id: 'pt-1',
          answers: {},
          submitted_at: '2024-01-01'
        }
      ];
      db.getMany.mockResolvedValue(mockRecords);

      const response = await request(app)
        .get('/api/practical/records')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe('test-user');
    });
  });

  describe('POST /api/practical/records', () => {
    it('应该创建实操记录', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const recordData = {
        taskId: 'pt-1',
        answers: { q1: 'answer1' }
      };

      const response = await request(app)
        .post('/api/practical/records')
        .send(recordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });
  });

  describe('DELETE /api/practical/records/:id', () => {
    it('应该删除实操记录', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/practical/records/ptr-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该在记录不存在时返回错误', async () => {
      db.execute.mockResolvedValue({ rowCount: 0 });

      await request(app)
        .delete('/api/practical/records/ptr-999')
        .expect(500);
    });
  });
});
