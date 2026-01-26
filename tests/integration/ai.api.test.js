/**
 * AI 模块 API 集成测试
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import aiRoutes, { adminAiRouter } from '../../src/routes/ai.routes.js';
import db from '../../db.js';

// Mock db 模块
vi.mock('../../db.js', () => ({
  default: {
    getOne: vi.fn(),
    getMany: vi.fn(),
    execute: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

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

describe('AI 模块 API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
    app.use('/api/admin', adminAiRouter);
  });

  describe('POST /api/ai/generate', () => {
    it('应该生成 AI 内容', async () => {
      db.getOne.mockResolvedValue({ deepseek_api_key: 'test-key' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '生成的内容' } }]
        })
      });

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: '测试提示词' })
        .expect(200);

      expect(response.body.text).toBe('生成的内容');
    });

    it('应该在未配置 API Key 时返回 400', async () => {
      db.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await request(app)
        .post('/api/ai/generate')
        .send({ prompt: '测试' })
        .expect(400);
    });
  });

  describe('POST /api/ai/analysis', () => {
    it('应该保存 AI 解析', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/ai/analysis')
        .send({ questionId: 'q-1', content: '解析内容' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该在缺少参数时返回 400', async () => {
      await request(app)
        .post('/api/ai/analysis')
        .send({ questionId: '' })
        .expect(400);
    });
  });

  describe('GET /api/ai/analysis/:questionId', () => {
    it('应该获取 AI 解析', async () => {
      db.getOne.mockResolvedValue({ content: '解析内容' });

      const response = await request(app)
        .get('/api/ai/analysis/q-1')
        .expect(200);

      expect(response.body.content).toBe('解析内容');
    });
  });

  describe('POST /api/ai/grade-answer', () => {
    it('应该评分简答题', async () => {
      db.getOne.mockResolvedValue({ deepseek_api_key: 'test-key' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"score": 85, "feedback": "很好", "suggestions": []}' } }]
        })
      });

      const response = await request(app)
        .post('/api/ai/grade-answer')
        .send({
          questionId: 'q-1',
          userAnswer: '用户答案',
          referenceAnswer: '参考答案'
        })
        .expect(200);

      expect(response.body.score).toBe(85);
    });
  });

  describe('GET /api/admin/ai-analysis', () => {
    it('应该返回所有解析记录', async () => {
      db.getOne.mockResolvedValue({ total: 10 });
      db.getMany.mockResolvedValue([{ userId: 'user-1' }]);

      const response = await request(app)
        .get('/api/admin/ai-analysis')
        .expect(200);

      expect(response.body.records).toHaveLength(1);
      expect(response.body.total).toBe(10);
    });
  });
});
