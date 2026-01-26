// 认证中间件单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { 
  auth, 
  adminAuth, 
  optionalAuth, 
  requireRole, 
  requireSelfOrAdmin 
} from '../../../src/middleware/auth.js';

// JWT 密钥（与中间件保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('认证中间件单元测试', () => {
  
  let req, res, next;
  
  beforeEach(() => {
    // 重置 mock 对象
    req = {
      headers: {},
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
    
    next = vi.fn();
  });
  
  describe('auth 中间件', () => {
    it('应该在提供有效 token 时通过认证', () => {
      const token = jwt.sign({ id: 1, role: 'student' }, JWT_SECRET);
      req.headers['authorization'] = `Bearer ${token}`;
      
      auth(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.role).toBe('student');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该在缺少 token 时返回 401', () => {
      auth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该在 token 无效时返回 403', () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      
      auth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该在 token 过期时返回 403', () => {
      const expiredToken = jwt.sign(
        { id: 1, role: 'student' }, 
        JWT_SECRET, 
        { expiresIn: '-1h' }
      );
      req.headers['authorization'] = `Bearer ${expiredToken}`;
      
      auth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该处理没有 Bearer 前缀的 token', () => {
      req.headers['authorization'] = 'invalid-format';
      
      auth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('adminAuth 中间件', () => {
    it('应该允许管理员通过', () => {
      req.user = { id: 1, role: 'admin' };
      
      adminAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该拒绝非管理员用户', () => {
      req.user = { id: 2, role: 'student' };
      
      adminAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: '需要管理员权限'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该拒绝未认证的请求', () => {
      // req.user 未设置
      
      adminAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('optionalAuth 中间件', () => {
    it('应该在提供有效 token 时设置 req.user', () => {
      const token = jwt.sign({ id: 1, role: 'student' }, JWT_SECRET);
      req.headers['authorization'] = `Bearer ${token}`;
      
      optionalAuth(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });
    
    it('应该在没有 token 时继续执行', () => {
      optionalAuth(req, res, next);
      
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该在 token 无效时继续执行', () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      
      optionalAuth(req, res, next);
      
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('requireRole 中间件', () => {
    it('应该允许具有正确角色的用户通过', () => {
      req.user = { id: 1, role: 'teacher' };
      const middleware = requireRole('teacher');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该允许多个角色中的任一角色通过', () => {
      req.user = { id: 1, role: 'teacher' };
      const middleware = requireRole(['admin', 'teacher']);
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('应该拒绝角色不匹配的用户', () => {
      req.user = { id: 1, role: 'student' };
      const middleware = requireRole('teacher');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该拒绝未认证的请求', () => {
      const middleware = requireRole('teacher');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('requireSelfOrAdmin 中间件', () => {
    it('应该允许用户访问自己的资源', () => {
      req.user = { id: 1, role: 'student' };
      req.params.userId = '1';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该允许管理员访问任何资源', () => {
      req.user = { id: 1, role: 'admin' };
      req.params.userId = '999';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该拒绝用户访问他人的资源', () => {
      req.user = { id: 1, role: 'student' };
      req.params.userId = '2';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: '无权访问他人的资源'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该从查询参数中获取用户 ID', () => {
      req.user = { id: 1, role: 'student' };
      req.query.userId = '1';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('应该从请求体中获取用户 ID', () => {
      req.user = { id: 1, role: 'student' };
      req.body.userId = '1';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('应该拒绝未认证的请求', () => {
      req.params.userId = '1';
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该处理字符串和数字 ID 的比较', () => {
      req.user = { id: 1, role: 'student' };
      req.params.userId = 1;  // 数字类型
      const middleware = requireSelfOrAdmin('userId');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
  
});
