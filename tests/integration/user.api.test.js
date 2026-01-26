// 用户 API 集成测试

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import userRoutes from '../../src/routes/user.routes.js';
import { auth, adminAuth } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { JWT_SECRET } from '../../src/config/jwt.js';

describe('用户 API 集成测试', () => {
  let app;
  let mockDb;
  let studentToken;
  let adminToken;

  beforeAll(() => {
    // 创建测试应用
    app = express();
    app.use(express.json());
    
    // 添加 db 中间件
    app.use((req, res, next) => {
      req.db = mockDb;
      next();
    });
    
    // 挂载路由
    app.use('/api/user', userRoutes);
    
    // 错误处理
    app.use(errorHandler);
    
    // 生成测试 token
    studentToken = jwt.sign({ id: 1, role: 'STUDENT' }, JWT_SECRET);
    adminToken = jwt.sign({ id: 2, role: 'ADMIN' }, JWT_SECRET);
  });

  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getOne: vi.fn(),
      getMany: vi.fn(),
      execute: vi.fn(),
      transaction: vi.fn()
    };
  });

  describe('GET /api/user/profile - 获取用户资料', () => {
    it('应该成功获取用户资料', async () => {
      const mockUser = {
        id: 1,
        phone: '13800138000',
        role: 'STUDENT',
        nickname: '测试用户',
        avatar: null,
        gender: null,
        school: null,
        major: null,
        company: null,
        accuracy: 0,
        real_name: null,
        id_card: null,
        education_type: null,
        education_level: null,
        class_name: null,
        student_perms: null,
        allowed_bank_ids: null,
        last_login: null,
        last_activity: null,
        login_history: null,
        deepseek_api_key: null,
        total_online_time: null,
        custom_fields: null,
        mistake_count: null,
        daily_goal: null
      };

      mockDb.getOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('phone', '13800138000');
      expect(response.body).toHaveProperty('role', 'STUDENT');
      expect(response.body).not.toHaveProperty('password');
    });

    it('应该在用户不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', '用户不存在');
    });

    it('应该在未认证时返回 401', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/user/profile - 更新用户资料', () => {
    it('应该成功更新用户资料', async () => {
      mockDb.execute.mockResolvedValue();

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          nickname: '新昵称',
          school: '新学校'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('应该在未认证时返回 401', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .send({ nickname: '新昵称' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/user/heartbeat - 心跳更新', () => {
    it('应该成功更新最后活动时间', async () => {
      mockDb.execute.mockResolvedValue();

      const response = await request(app)
        .post('/api/user/heartbeat')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('lastActivity');
      expect(mockDb.execute).toHaveBeenCalled();
    });
  });

  describe('POST /api/user/reset - 重置用户数据', () => {
    it('应该成功重置用户学习数据', async () => {
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: vi.fn().mockResolvedValue()
        };
        return await callback(mockClient);
      });

      const response = await request(app)
        .post('/api/user/reset')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '学习数据已成功重置');
      expect(response.body).toHaveProperty('clearedTables', 10);
    });
  });

  describe('GET /api/user/progress - 获取用户进度', () => {
    it('应该成功获取用户每日进度', async () => {
      const mockProgress = [
        { id: '1_2024-01-01', user_id: 1, date: '2024-01-01', count: 10 },
        { id: '1_2024-01-02', user_id: 1, date: '2024-01-02', count: 15 }
      ];

      mockDb.getMany.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/user/progress')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgress);
    });

    it('应该在没有进度时返回空数组', async () => {
      mockDb.getMany.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/progress')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/user/progress/increment - 增加进度计数', () => {
    it('应该成功增加每日进度计数（新记录）', async () => {
      mockDb.getOne.mockResolvedValue(null);
      mockDb.execute.mockResolvedValue();

      const response = await request(app)
        .post('/api/user/progress/increment')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('应该成功增加每日进度计数（已有记录）', async () => {
      mockDb.getOne.mockResolvedValue({ id: '1_2024-01-01', count: 10 });
      mockDb.execute.mockResolvedValue();

      const response = await request(app)
        .post('/api/user/progress/increment')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('GET /api/user/admin/all-progress - 获取所有用户进度（管理员）', () => {
    it('应该允许管理员获取所有用户进度', async () => {
      const mockProgress = [
        { id: '1_2024-01-02', user_id: 1, date: '2024-01-02', count: 15 },
        { id: '2_2024-01-02', user_id: 2, date: '2024-01-02', count: 20 }
      ];

      mockDb.getMany.mockResolvedValue(mockProgress);

      const response = await request(app)
        .get('/api/user/admin/all-progress')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgress);
    });

    it('应该拒绝非管理员访问', async () => {
      const response = await request(app)
        .get('/api/user/admin/all-progress')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
