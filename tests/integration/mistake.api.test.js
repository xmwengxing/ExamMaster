// 错题 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mistakeRoutes from '../../src/routes/mistake.routes.js';
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
  app.use('/api/mistakes', mistakeRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;

describe('错题 API 集成测试', () => {
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

  describe('GET /api/mistakes', () => {
    it('应该返回用户的错题列表', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '错题1',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: '解析1',
          chapter: null,
          blanks: null,
          reference_answer: null,
          ai_grading_enabled: false,
          tags: null,
          sort_order: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 'q-2',
          bank_id: 'bank-1',
          type: 'MULTIPLE',
          content: '错题2',
          options: ['A', 'B', 'C', 'D'],
          answer: ['A', 'B'],
          explanation: '解析2',
          chapter: null,
          blanks: null,
          reference_answer: null,
          ai_grading_enabled: false,
          tags: null,
          sort_order: 2,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockQuestions);
      
      const response = await request(app)
        .get('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('q-1');
      expect(response.body[0].bankId).toBe('bank-1');
      expect(response.body[1].id).toBe('q-2');
    });

    it('应该返回空数组当用户没有错题时', async () => {
      mockDb.getMany.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/mistakes')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    it('属性 1：用户数据隔离 - 只返回当前用户的错题', async () => {
      // 验证：需求 6.1
      // 对于任何学员用户，查询错题时应该只返回该用户自己的数据
      
      const mockQuestions = [
        {
          id: 'q-user1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '用户1的错题',
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
      ];
      
      mockDb.getMany.mockResolvedValue(mockQuestions);
      
      const response = await request(app)
        .get('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      // 验证查询时使用了用户ID过滤
      expect(mockDb.getMany).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.user_id = $1'),
        expect.arrayContaining([expect.any(String)])
      );
      
      // 验证返回的数据
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('q-user1');
    });
  });

  describe('POST /api/mistakes', () => {
    it('应该成功添加错题', async () => {
      mockDb.getOne.mockResolvedValue(null); // 不存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1' })
        .expect(200);
      
      expect(response.body).toEqual({ success: true, added: true });
      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO mistakes (user_id, question_id) VALUES ($1, $2)',
        expect.any(Array)
      );
    });

    it('应该不重复添加已存在的错题', async () => {
      mockDb.getOne.mockResolvedValue({ user_id: 'user-1', question_id: 'q-1' }); // 已存在
      
      const response = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1' })
        .expect(200);
      
      expect(response.body).toEqual({ success: true, added: false });
      expect(mockDb.execute).not.toHaveBeenCalled(); // 不应该执行插入
    });

    it('缺少题目ID时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('题目ID不能为空');
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .post('/api/mistakes')
        .send({ questionId: 'q-1' })
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    it('属性 5：错题添加的幂等性 - 多次添加只产生一条记录', async () => {
      // 验证：需求 6.3
      // 对于任何题目，多次添加到错题集的操作应该只产生一条记录
      
      // 第一次添加（不存在）
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const response1 = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-test' })
        .expect(200);
      
      expect(response1.body.added).toBe(true);
      
      // 第二次添加（已存在）
      mockDb.getOne.mockResolvedValueOnce({ user_id: 'user-1', question_id: 'q-test' });
      
      const response2 = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-test' })
        .expect(200);
      
      expect(response2.body.added).toBe(false);
      expect(response2.body.success).toBe(true);
      
      // 验证只执行了一次插入操作
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('错误处理', () => {
    it('数据库错误时应该返回 500', async () => {
      mockDb.getMany.mockRejectedValue(new Error('数据库连接失败'));
      
      const response = await request(app)
        .get('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });

    it('添加错题时数据库错误应该返回 500', async () => {
      mockDb.getOne.mockRejectedValue(new Error('数据库查询失败'));
      
      const response = await request(app)
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1' })
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
