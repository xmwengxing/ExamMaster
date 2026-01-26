// 题库 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
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
  app.use('/api/banks', bankRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;
let adminToken;

describe('题库 API 集成测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn(),
      transaction: vi.fn()
    };
    
    // 生成测试 token
    validToken = generateTestToken();
    adminToken = generateAdminToken();
    
    app = createTestApp();
  });

  describe('GET /api/banks', () => {
    it('应该返回所有题库列表', async () => {
      const mockBanks = [
        {
          id: 'bank-1',
          name: '题库1',
          category: '分类1',
          level: '初级',
          description: '描述1',
          question_count: 10,
          score_config: { SINGLE: 1 },
          usage_count: 5
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockBanks);
      
      const response = await request(app)
        .get('/api/banks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('bank-1');
      expect(response.body[0].questionCount).toBe(10);
    });

    it('应该在未认证时返回 401', async () => {
      await request(app)
        .get('/api/banks')
        .expect(401);
    });
  });

  describe('GET /api/banks/:id', () => {
    it('应该返回指定的题库', async () => {
      const mockBank = {
        id: 'bank-1',
        name: '题库1',
        category: '分类1',
        level: '初级',
        description: '描述1',
        question_count: 10,
        score_config: { SINGLE: 1 },
        usage_count: 5
      };
      
      mockDb.getOne.mockResolvedValue(mockBank);
      
      const response = await request(app)
        .get('/api/banks/bank-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.id).toBe('bank-1');
      expect(response.body.name).toBe('题库1');
    });

    it('应该在题库不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      await request(app)
        .get('/api/banks/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/banks', () => {
    it('应该创建新题库（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '新题库',
          category: '分类',
          level: '初级',
          description: '描述'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^bank-\d+$/);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/banks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: '新题库' })
        .expect(403);
    });
  });

  describe('PUT /api/banks/:id', () => {
    it('应该更新题库（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/banks/bank-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '更新后的名称',
          description: '更新后的描述'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .put('/api/banks/bank-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: '更新' })
        .expect(403);
    });
  });

  describe('DELETE /api/banks/:id', () => {
    it('应该删除题库（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .delete('/api/banks/bank-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .delete('/api/banks/bank-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/banks/:id/score', () => {
    it('应该更新分值配置（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/banks/bank-1/score')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scoreConfig: { SINGLE: 2, MULTIPLE: 3 }
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .put('/api/banks/bank-1/score')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ scoreConfig: {} })
        .expect(403);
    });
  });
});

