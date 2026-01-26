/**
 * 讨论模块 API 集成测试
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import discussionRoutes, { commentRouter, questionDiscussionRouter } from '../../src/routes/discussion.routes.js';
import db from '../../db.js';

// Mock db 模块
vi.mock('../../db.js', () => ({
  default: {
    getOne: vi.fn(),
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

describe('讨论模块 API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/discussions', discussionRoutes);
    app.use('/api/comments', commentRouter);
    app.use('/api/questions', questionDiscussionRouter);
  });

  describe('GET /api/discussions', () => {
    it('应该返回讨论列表', async () => {
      db.getOne.mockResolvedValue({ total: 10 });
      db.getMany.mockResolvedValue([
        {
          id: 'disc-1',
          title: '讨论1',
          is_pinned: false,
          is_hidden: false
        }
      ]);

      const response = await request(app)
        .get('/api/discussions')
        .expect(200);

      expect(response.body.discussions).toHaveLength(1);
      expect(response.body.total).toBe(10);
    });
  });

  describe('POST /api/discussions', () => {
    it('应该创建讨论', async () => {
      db.getOne.mockResolvedValue({ nickname: '测试用户' });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const discussionData = {
        title: '新讨论',
        content: '讨论内容'
      };

      const response = await request(app)
        .post('/api/discussions')
        .send(discussionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it('应该在标题为空时返回400', async () => {
      await request(app)
        .post('/api/discussions')
        .send({ title: '', content: '内容' })
        .expect(400);
    });
  });

  describe('GET /api/discussions/:id', () => {
    it('应该返回讨论详情', async () => {
      db.getOne.mockResolvedValue({
        id: 'disc-1',
        title: '讨论1',
        is_pinned: false,
        is_hidden: false
      });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .get('/api/discussions/disc-1')
        .expect(200);

      expect(response.body.discussion.id).toBe('disc-1');
    });

    it('应该在讨论不存在时返回404', async () => {
      db.getOne.mockResolvedValue(null);

      await request(app)
        .get('/api/discussions/disc-999')
        .expect(404);
    });
  });

  describe('PUT /api/discussions/:id', () => {
    it('应该更新讨论', async () => {
      db.getOne.mockResolvedValue({ author_id: 'test-user' });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .put('/api/discussions/disc-1')
        .send({ title: '更新的标题' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该在无权限时返回403', async () => {
      db.getOne.mockResolvedValue({ author_id: 'other-user' });

      await request(app)
        .put('/api/discussions/disc-1')
        .send({ title: '更新的标题' })
        .expect(403);
    });
  });

  describe('DELETE /api/discussions/:id', () => {
    it('应该删除讨论', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/discussions/disc-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/discussions/:id/toggle-visibility', () => {
    it('应该切换讨论可见性', async () => {
      db.getOne.mockResolvedValue({ is_hidden: false });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/discussions/disc-1/toggle-visibility')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isHidden).toBe(true);
    });
  });

  describe('POST /api/discussions/:id/toggle-pin', () => {
    it('应该切换讨论置顶', async () => {
      db.getOne.mockResolvedValue({ is_pinned: false });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/discussions/disc-1/toggle-pin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isPinned).toBe(true);
    });
  });

  describe('POST /api/discussions/:id/like', () => {
    it('应该切换讨论点赞', async () => {
      db.getOne.mockResolvedValue(null); // 未点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/discussions/disc-1/like')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.liked).toBe(true);
    });
  });

  describe('GET /api/discussions/:id/comments', () => {
    it('应该返回评论列表', async () => {
      db.getMany.mockResolvedValue([
        { id: 'comment-1', is_deleted: false }
      ]);

      const response = await request(app)
        .get('/api/discussions/disc-1/comments')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/discussions/:id/comments', () => {
    it('应该创建评论', async () => {
      db.getOne
        .mockResolvedValueOnce({ id: 'disc-1', is_hidden: false })
        .mockResolvedValueOnce({ nickname: '测试用户' });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/discussions/disc-1/comments')
        .send({ content: '评论内容' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it('应该在内容为空时返回400', async () => {
      await request(app)
        .post('/api/discussions/disc-1/comments')
        .send({ content: '' })
        .expect(400);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('应该删除评论', async () => {
      db.getOne.mockResolvedValue({
        id: 'comment-1',
        author_id: 'test-user',
        discussion_id: 'disc-1'
      });
      db.getMany.mockResolvedValue([]);
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/comments/comment-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/comments/:id/like', () => {
    it('应该切换评论点赞', async () => {
      db.getOne
        .mockResolvedValueOnce({ id: 'comment-1' })
        .mockResolvedValueOnce(null); // 未点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const response = await request(app)
        .post('/api/comments/comment-1/like')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.liked).toBe(true);
    });
  });

  describe('GET /api/questions/:id/discussions', () => {
    it('应该返回题目相关讨论', async () => {
      db.getMany.mockResolvedValue([
        { id: 'disc-1', is_pinned: false, is_hidden: false }
      ]);

      const response = await request(app)
        .get('/api/questions/q-1/discussions')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });
});
