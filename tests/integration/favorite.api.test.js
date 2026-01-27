// 收藏 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import favoriteRoutes from '../../src/routes/favorite.routes.js';
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
  app.use('/api/favorites', favoriteRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;

describe('收藏 API 集成测试', () => {
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

  describe('GET /api/favorites', () => {
    it('应该返回用户的收藏题目列表', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '收藏题目1',
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
          content: '收藏题目2',
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
        .get('/api/favorites')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('q-1');
      expect(response.body[0].bankId).toBe('bank-1');
      expect(response.body[1].id).toBe('q-2');
    });

    it('应该返回空数组当用户没有收藏时', async () => {
      mockDb.getMany.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/favorites')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    it('属性 1：用户数据隔离 - 只返回当前用户的收藏', async () => {
      // 验证：需求 7.1
      // 对于任何学员用户，查询收藏时应该只返回该用户自己的数据
      
      const mockQuestions = [
        {
          id: 'q-user1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '用户1的收藏',
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
        .get('/api/favorites')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      // 验证查询时使用了用户ID过滤
      expect(mockDb.getMany).toHaveBeenCalledWith(
        expect.stringContaining('WHERE f.user_id = $1'),
        expect.arrayContaining([expect.any(String)])
      );
      
      // 验证返回的数据
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('q-user1');
    });
  });

  describe('POST /api/favorites/:qId', () => {
    it('应该成功添加收藏', async () => {
      mockDb.getOne.mockResolvedValue(null); // 不存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/favorites/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ success: true, isFavorited: true });
      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO favorites (user_id, question_id) VALUES ($1, $2)',
        expect.any(Array)
      );
    });

    it('应该成功取消收藏', async () => {
      mockDb.getOne.mockResolvedValue({ user_id: 'user-1', question_id: 'q-1' }); // 已存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/favorites/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ success: true, isFavorited: false });
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM favorites WHERE user_id = $1 AND question_id = $2',
        expect.any(Array)
      );
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .post('/api/favorites/q-1')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    it('属性 4：收藏切换的往返一致性 - 连续两次切换回到初始状态', async () => {
      // 验证：需求 7.4
      // 对于任何题目，连续两次切换收藏状态应该回到初始状态
      
      // 第一次切换：添加收藏
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const response1 = await request(app)
        .post('/api/favorites/q-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response1.body.isFavorited).toBe(true);
      
      // 第二次切换：取消收藏
      mockDb.getOne.mockResolvedValueOnce({ user_id: 'user-1', question_id: 'q-test' });
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const response2 = await request(app)
        .post('/api/favorites/q-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response2.body.isFavorited).toBe(false);
      
      // 验证执行了一次插入和一次删除
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('错误处理', () => {
    it('数据库错误时应该返回 500', async () => {
      mockDb.getMany.mockRejectedValue(new Error('数据库连接失败'));
      
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });

    it('切换收藏时数据库错误应该返回 500', async () => {
      mockDb.getOne.mockRejectedValue(new Error('数据库查询失败'));
      
      const response = await request(app)
        .post('/api/favorites/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
