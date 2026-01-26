// 题目 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import questionRoutes from '../../src/routes/question.routes.js';
import bankRoutes from '../../src/routes/bank.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { generateTestToken, generateAdminToken } from '../helpers/testUtils.js';

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
  app.use('/api/questions', questionRoutes);
  app.use('/api/banks', bankRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let mockClient;
let app;
let validToken;
let adminToken;

describe('题目 API 集成测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockClient = {
      query: vi.fn()
    };
    
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn(),
      paginate: vi.fn(),
      transaction: vi.fn(async (callback) => {
        await callback(mockClient);
      })
    };
    
    // 生成测试 token
    validToken = generateTestToken();
    adminToken = generateAdminToken();
    
    app = createTestApp();
  });

  describe('GET /api/questions', () => {
    it('应该返回题目列表（分页）', async () => {
      const mockResult = {
        data: [
          {
            id: 'q-1',
            bank_id: 'bank-1',
            type: 'SINGLE',
            content: '题目1',
            options: ['A', 'B'],
            answer: 'A',
            explanation: '',
            chapter: null,
            blanks: null,
            reference_answer: null,
            ai_grading_enabled: false,
            tags: null,
            sort_order: 1,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };
      
      mockDb.paginate.mockResolvedValue(mockResult);
      
      const response = await request(app)
        .get('/api/questions?page=1&pageSize=20')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('应该返回题目列表（不分页）', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '题目1',
          options: ['A'],
          answer: 'A',
          explanation: '',
          chapter: null,
          blanks: null,
          reference_answer: null,
          ai_grading_enabled: false,
          tags: null,
          sort_order: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockQuestions);
      
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
    });

    it('应该在未认证时返回 401', async () => {
      await request(app)
        .get('/api/questions')
        .expect(401);
    });
  });

  describe('GET /api/questions/:id', () => {
    it('应该返回指定的题目', async () => {
      const mockQuestion = {
        id: 'q-1',
        bank_id: 'bank-1',
        type: 'SINGLE',
        content: '题目1',
        options: ['A', 'B'],
        answer: 'A',
        explanation: '解析',
        chapter: null,
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: false,
        tags: null,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };
      
      mockDb.getOne.mockResolvedValue(mockQuestion);
      
      const response = await request(app)
        .get('/api/questions/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.id).toBe('q-1');
      expect(response.body.content).toBe('题目1');
    });

    it('应该在题目不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      await request(app)
        .get('/api/questions/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/questions', () => {
    it('应该创建新题目（管理员）', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankId: 'bank-1',
          type: 'SINGLE',
          content: '新题目',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: '解析'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^q-\d+$/);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '新题目' })
        .expect(403);
    });

    it('应该验证填空题配置', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'FILL_IN_BLANK',
          content: '填空题',
          blanks: []
        })
        .expect(500);
      
      expect(response.body.error).toContain('填空题必须配置空白项');
    });
  });

  describe('PUT /api/questions/:id', () => {
    it('应该更新题目（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/questions/q-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '更新后的内容',
          explanation: '更新后的解析'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .put('/api/questions/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '更新' })
        .expect(403);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('应该删除题目（管理员）', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ bank_id: 'bank-1' }] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });
      
      const response = await request(app)
        .delete('/api/questions/q-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .delete('/api/questions/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('POST /api/questions/batch-delete', () => {
    it('应该批量删除题目（管理员）', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ bank_id: 'bank-1' }, { bank_id: 'bank-1' }] })
        .mockResolvedValueOnce({ rowCount: 2 })
        .mockResolvedValueOnce({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/questions/batch-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['q-1', 'q-2'] })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(2);
    });

    it('应该验证参数', async () => {
      await request(app)
        .post('/api/questions/batch-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(400);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/questions/batch-delete')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ids: ['q-1'] })
        .expect(403);
    });
  });

  describe('POST /api/banks/:id/import', () => {
    it('应该批量导入题目（管理员）', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ max_order: 10 }] })
        .mockResolvedValueOnce({ rowCount: 2 })
        .mockResolvedValueOnce({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/banks/bank-1/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questions: [
            { type: 'SINGLE', content: '题目1', options: ['A'], answer: 'A' },
            { type: 'SINGLE', content: '题目2', options: ['A'], answer: 'A' }
          ]
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.inserted).toBe(2);
    });

    it('应该验证参数', async () => {
      await request(app)
        .post('/api/banks/bank-1/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/banks/bank-1/import')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questions: [] })
        .expect(403);
    });
  });

  describe('POST /api/questions/grade-fill-blank', () => {
    it('应该对填空题进行评分', async () => {
      const mockQuestion = {
        id: 'q-1',
        type: 'FILL_IN_BLANK',
        blanks: [
          { id: 'blank1', acceptedAnswers: ['答案1'] },
          { id: 'blank2', acceptedAnswers: ['答案2'] }
        ]
      };
      
      mockDb.getOne.mockResolvedValue(mockQuestion);
      
      const response = await request(app)
        .post('/api/questions/grade-fill-blank')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'q-1',
          userAnswers: {
            blank1: '答案1',
            blank2: '答案2'
          }
        })
        .expect(200);
      
      expect(response.body.correct).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.isAllCorrect).toBe(true);
    });

    it('应该验证参数', async () => {
      await request(app)
        .post('/api/questions/grade-fill-blank')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);
    });

    it('应该在未认证时返回 401', async () => {
      await request(app)
        .post('/api/questions/grade-fill-blank')
        .send({ questionId: 'q-1', userAnswers: {} })
        .expect(401);
    });
  });
});

