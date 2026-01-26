// 练习 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import practiceRoutes from '../../src/routes/practice.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { generateTestToken } from '../helpers/testUtils.js';

// 创建测试应用
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // 模拟数据库中间件
  app.use((req, res, next) => {
    req.db = mockDb;
    next();
  });
  
  // 挂载路由
  app.use('/api/practice', practiceRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;

describe('练习 API 集成测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
    
    // 生成测试 token
    validToken = generateTestToken();
    
    app = createTestApp();
  });

  describe('GET /api/practice', () => {
    it('应该返回用户的练习记录列表', async () => {
      const mockRecords = [
        {
          id: 'practice-1',
          user_id: 'test-user',
          bank_id: 'bank-1',
          bank_name: '题库1',
          type: 'RANDOM',
          question_type_filter: 'ALL',
          mode: 'PRACTICE',
          count: 10,
          date: '2024-01-01',
          current_index: 5,
          user_answers: { 'q1': 'A' },
          is_custom: false
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockRecords);
      
      const response = await request(app)
        .get('/api/practice')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('practice-1');
      expect(response.body[0].userId).toBe('test-user');
    });

    it('应该在未认证时返回 401', async () => {
      await request(app)
        .get('/api/practice')
        .expect(401);
    });
  });

  describe('GET /api/practice/:id', () => {
    it('应该返回指定的练习记录', async () => {
      const mockRecord = {
        id: 'practice-1',
        user_id: 'test-user',
        bank_id: 'bank-1',
        bank_name: '题库1',
        type: 'RANDOM',
        question_type_filter: 'ALL',
        mode: 'PRACTICE',
        count: 10,
        date: '2024-01-01',
        current_index: 5,
        user_answers: { 'q1': 'A' },
        is_custom: false
      };
      
      mockDb.getOne.mockResolvedValue(mockRecord);
      
      const response = await request(app)
        .get('/api/practice/practice-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.id).toBe('practice-1');
    });

    it('应该在记录不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      await request(app)
        .get('/api/practice/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/practice', () => {
    it('应该创建新的练习记录', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/practice')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          bankId: 'bank-1',
          bankName: '题库1',
          type: 'RANDOM',
          questionTypeFilter: 'ALL',
          mode: 'PRACTICE',
          count: 10,
          date: '2024-01-01'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^practice-\d+$/);
    });
  });

  describe('PUT /api/practice/:id', () => {
    it('应该更新练习记录', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/practice/practice-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentIndex: 8,
          userAnswers: { 'q1': 'A', 'q2': 'B' }
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在记录不存在时返回 404', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 0 });
      
      await request(app)
        .put('/api/practice/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentIndex: 5 })
        .expect(404);
    });
  });

  describe('DELETE /api/practice/:id', () => {
    it('应该删除练习记录', async () => {
      mockDb.getOne.mockResolvedValue({ id: 'practice-1', user_id: 'test-user' });
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .delete('/api/practice/practice-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在记录不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      await request(app)
        .delete('/api/practice/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('GET /api/practice/srs/records', () => {
    it('应该返回用户的 SRS 记录列表', async () => {
      const mockRecords = [
        {
          id: 'srs-1',
          user_id: 'test-user',
          question_id: 'q1',
          interval: 1,
          ease_factor: 2.5,
          repetitions: 1,
          next_review_date: '2024-01-02',
          status: 'active'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockRecords);
      
      const response = await request(app)
        .get('/api/practice/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].question_id).toBe('q1');
    });
  });

  describe('POST /api/practice/srs/update', () => {
    it('应该更新 SRS 记录', async () => {
      mockDb.getOne.mockResolvedValue(null);
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/practice/srs/update')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'q1',
          level: 'GOOD'
        })
        .expect(200);
      
      expect(response.body.userId).toBe('user-123');
      expect(response.body.questionId).toBe('q1');
      expect(response.body.interval).toBe(1);
    });

    it('应该在缺少必需参数时返回 400', async () => {
      await request(app)
        .post('/api/practice/srs/update')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q1' })
        .expect(400);
    });
  });
});
