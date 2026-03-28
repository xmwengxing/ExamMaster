// SRS API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import srsRoutes from '../../src/routes/srs.routes.js';
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
  app.use('/api/srs', srsRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;

describe('SRS API 集成测试', () => {
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

  describe('GET /api/srs/records', () => {
    it('应该返回用户的 SRS 记录列表', async () => {
      const mockRecords = [
        {
          id: 'srs-1',
          user_id: 'user-123',
          question_id: 'q-1',
          interval: 1,
          ease_factor: 2.5,
          repetitions: 1,
          next_review_date: '2024-01-02',
          status: 'active'
        },
        {
          id: 'srs-2',
          user_id: 'user-123',
          question_id: 'q-2',
          interval: 6,
          ease_factor: 2.5,
          repetitions: 2,
          next_review_date: '2024-01-08',
          status: 'active'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockRecords);
      
      const response = await request(app)
        .get('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('srs-1');
      expect(response.body[1].id).toBe('srs-2');
    });

    it('应该返回空数组当用户没有 SRS 记录时', async () => {
      mockDb.getMany.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/srs/records')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    it('属性 1：用户数据隔离 - 只返回当前用户的 SRS 记录', async () => {
      // 验证：需求 5.1
      // 对于任何学员用户，查询 SRS 记录时应该只返回该用户自己的数据
      
      const mockRecords = [
        {
          id: 'srs-user1',
          user_id: 'user-123',
          question_id: 'q-1',
          interval: 1,
          ease_factor: 2.5,
          repetitions: 1,
          next_review_date: '2024-01-02',
          status: 'active'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockRecords);
      
      const response = await request(app)
        .get('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      // 验证查询时使用了用户ID过滤
      expect(mockDb.getMany).toHaveBeenCalledWith(
        'SELECT * FROM srs_records WHERE user_id = $1',
        expect.arrayContaining([expect.any(String)])
      );
      
      // 验证返回的数据
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('srs-user1');
    });
  });

  describe('POST /api/srs/records', () => {
    it('应该成功创建新的 SRS 记录', async () => {
      mockDb.getOne.mockResolvedValue(null); // 不存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', level: 'GOOD' })
        .expect(200);
      
      expect(response.body.userId).toBe('user-123');
      expect(response.body.questionId).toBe('q-1');
      expect(response.body.interval).toBe(1);
      expect(response.body.easeFactor).toBe(2.5);
      expect(response.body.repetitions).toBe(1);
    });

    it('应该成功更新已有的 SRS 记录', async () => {
      const existingRecord = {
        id: 'srs-1',
        user_id: 'user-123',
        question_id: 'q-1',
        interval: 1,
        ease_factor: 2.5,
        repetitions: 1,
        next_review_date: '2024-01-02',
        status: 'active'
      };
      
      mockDb.getOne.mockResolvedValue(existingRecord);
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', level: 'GOOD' })
        .expect(200);
      
      expect(response.body.interval).toBe(6); // 第二次复习间隔为 6 天
      expect(response.body.repetitions).toBe(2);
    });

    it('缺少题目ID时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ level: 'GOOD' })
        .expect(400);
      
      expect(response.body.error).toBe('题目ID不能为空');
    });

    it('缺少难度级别时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1' })
        .expect(400);
      
      expect(response.body.error).toBe('难度级别不能为空');
    });

    it('无效的难度级别时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', level: 'INVALID' })
        .expect(400);
      
      expect(response.body.error).toBe('难度级别必须是 HARD、GOOD 或 EASY');
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .post('/api/srs/records')
        .send({ questionId: 'q-1', level: 'GOOD' })
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('错误处理', () => {
    it('获取记录时数据库错误应该返回 500', async () => {
      mockDb.getMany.mockRejectedValue(new Error('数据库连接失败'));
      
      const response = await request(app)
        .get('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });

    it('更新记录时数据库错误应该返回 500', async () => {
      mockDb.getOne.mockRejectedValue(new Error('数据库查询失败'));
      
      const response = await request(app)
        .post('/api/srs/records')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', level: 'GOOD' })
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
