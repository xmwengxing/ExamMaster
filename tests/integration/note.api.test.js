// 笔记 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import noteRoutes from '../../src/routes/note.routes.js';
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
  app.use('/api/notes', noteRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;

describe('笔记 API 集成测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
    
    // 生成测试 token
    validToken = generateTestToken();
    
    app = createTestApp();
  });

  describe('POST /api/notes', () => {
    it('应该成功保存笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', content: '这是一条笔记' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(false);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        expect.any(Array)
      );
    });

    it('应该成功删除空内容笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', content: '' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Array)
      );
    });

    it('缺少题目ID时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '笔记内容' })
        .expect(400);
      
      expect(response.body.error).toBe('题目ID不能为空');
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .post('/api/notes')
        .send({ questionId: 'q-1', content: '笔记' })
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/notes/:qId', () => {
    it('应该返回笔记内容', async () => {
      const mockNote = {
        user_id: 'user-123',
        question_id: 'q-1',
        content: '这是笔记内容',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      mockDb.getOne.mockResolvedValue(mockNote);
      
      const response = await request(app)
        .get('/api/notes/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.userId).toBe('user-123');
      expect(response.body.questionId).toBe('q-1');
      expect(response.body.content).toBe('这是笔记内容');
    });

    it('应该返回 null 当笔记不存在时', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/notes/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.content).toBeNull();
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/notes/q-1')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('错误处理', () => {
    it('保存笔记时数据库错误应该返回 500', async () => {
      mockDb.execute.mockRejectedValue(new Error('数据库写入失败'));
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'q-1', content: '笔记' })
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });

    it('获取笔记时数据库错误应该返回 500', async () => {
      mockDb.getOne.mockRejectedValue(new Error('数据库查询失败'));
      
      const response = await request(app)
        .get('/api/notes/q-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
