// 认证 API 集成测试
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import authRoutes from '../../src/routes/auth.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createMockDb, createMockUser } from '../helpers/mockDb.js';

// 创建测试应用
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // 挂载认证路由
  app.use('/api/auth', authRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

describe('认证 API 集成测试', () => {
  let app;
  let mockDb;
  let testUser;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  beforeEach(async () => {
    // 创建 mock 数据库
    mockDb = createMockDb();
    
    // 创建测试用户
    testUser = createMockUser({
      phone: '13800138000',
      password: bcrypt.hashSync('password123', 10),
      role: 'student'
    });
    
    // 注入 mock 数据库
    const db = await import('../../db.js');
    db.default.getOne = mockDb.getOne;
    db.default.execute = mockDb.execute;
  });
  
  describe('POST /api/auth/login', () => {
    it('应该成功登录并返回 token', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user.phone).toBe('13800138000');
    });
    
    it('应该在密码错误时返回 401', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'wrongpassword',
          role: 'student'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('应该在用户不存在时返回 401', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      expect(response.status).toBe(401);
    });
    
    it('应该在缺少必需字段时返回 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000'
          // 缺少 password 和 role
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/auth/change-password', () => {
    it('应该成功修改密码', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录获取 token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const token = loginResponse.body.token;
      
      // 修改密码
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old: 'password123',
          newP: 'newpassword456'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('成功');
    });
    
    it('应该在未认证时返回 401', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          old: 'password123',
          newP: 'newpassword456'
        });
      
      expect(response.status).toBe(401);
    });
    
    it('应该在旧密码错误时返回 401', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const token = loginResponse.body.token;
      
      // 修改密码（旧密码错误）
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old: 'wrongpassword',
          newP: 'newpassword456'
        });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/auth/heartbeat', () => {
    it('应该成功更新活动时间', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const token = loginResponse.body.token;
      
      // 发送心跳
      const response = await request(app)
        .post('/api/auth/heartbeat')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('lastActivity');
    });
    
    it('应该在未认证时返回 401', async () => {
      const response = await request(app)
        .post('/api/auth/heartbeat');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/auth/refresh-token', () => {
    it('应该成功刷新 token', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录获取 token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const oldToken = loginResponse.body.token;
      
      // 刷新 token
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${oldToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      // 新 token 应该是有效的（可能和旧 token 相同，因为 payload 相同）
      expect(response.body.token).toBeTruthy();
    });
    
    it('应该在 token 无效时返回 401', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/auth/verify', () => {
    it('应该验证有效的 token', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录获取 token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const token = loginResponse.body.token;
      
      // 验证 token
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('role');
    });
    
    it('应该在 token 无效时返回 401', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('应该成功登出', async () => {
      mockDb.getOne.mockResolvedValue(testUser);
      mockDb.execute.mockResolvedValue({});
      
      // 先登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'student'
        });
      
      const token = loginResponse.body.token;
      
      // 登出
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('应该在未认证时返回 401', async () => {
      const response = await request(app)
        .post('/api/auth/logout');
      
      expect(response.status).toBe(401);
    });
  });
  
});
