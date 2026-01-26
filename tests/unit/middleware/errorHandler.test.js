// 错误处理中间件单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateBody,
  validateQuery,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError
} from '../../../src/middleware/errorHandler.js';

describe('错误处理中间件单元测试', () => {
  
  let req, res, next;
  
  beforeEach(() => {
    // 重置 mock 对象
    req = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      body: {},
      query: {},
      user: null
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };
    
    next = vi.fn();
    
    // 设置环境为测试
    process.env.NODE_ENV = 'test';
  });
  
  describe('错误类', () => {
    it('AppError 应该创建带状态码的错误', () => {
      const error = new AppError('测试错误', 400);
      
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
    
    it('ValidationError 应该创建 400 错误', () => {
      const error = new ValidationError('验证失败');
      
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
    
    it('NotFoundError 应该创建 404 错误', () => {
      const error = new NotFoundError();
      
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
    
    it('UnauthorizedError 应该创建 401 错误', () => {
      const error = new UnauthorizedError();
      
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });
    
    it('ForbiddenError 应该创建 403 错误', () => {
      const error = new ForbiddenError();
      
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });
    
    it('DatabaseError 应该创建 500 错误', () => {
      const error = new DatabaseError();
      
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('DatabaseError');
    });
  });
  
  describe('errorHandler 中间件', () => {
    it('应该处理自定义应用错误', () => {
      const error = new AppError('自定义错误', 400);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '自定义错误',
          statusCode: 400
        })
      );
    });
    
    it('应该处理 JWT 错误', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '无效的认证令牌'
        })
      );
    });
    
    it('应该处理 JWT 过期错误', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '认证令牌已过期'
        })
      );
    });
    
    it('应该处理数据库唯一性约束错误', () => {
      const error = new Error('duplicate key');
      error.code = '23505';
      error.detail = 'Key (email)=(test@test.com) already exists.';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '数据已存在，违反唯一性约束'
        })
      );
    });
    
    it('应该处理数据库外键约束错误', () => {
      const error = new Error('foreign key violation');
      error.code = '23503';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '违反外键约束'
        })
      );
    });
    
    it('应该处理数据库非空约束错误', () => {
      const error = new Error('null value');
      error.code = '23502';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '缺少必填字段'
        })
      );
    });
    
    it('应该处理未知错误', () => {
      const error = new Error('未知错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('应该在响应已发送时调用 next', () => {
      res.headersSent = true;
      const error = new Error('测试错误');
      
      errorHandler(error, req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('应该记录用户信息（如果存在）', () => {
      req.user = { id: 123 };
      const error = new AppError('测试错误', 400);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
  
  describe('notFoundHandler 中间件', () => {
    it('应该创建 404 错误并传递给 next', () => {
      notFoundHandler(req, res, next);
      
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('GET');
      expect(error.message).toContain('/test');
    });
  });
  
  describe('asyncHandler 包装函数', () => {
    it('应该正常执行异步函数', async () => {
      const asyncFn = vi.fn(async (req, res) => {
        res.json({ success: true });
      });
      
      const wrapped = asyncHandler(asyncFn);
      await wrapped(req, res, next);
      
      expect(asyncFn).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('应该捕获异步函数中的错误', async () => {
      const error = new Error('异步错误');
      const asyncFn = vi.fn(async () => {
        throw error;
      });
      
      const wrapped = asyncHandler(asyncFn);
      await wrapped(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
    
    it('应该处理返回 rejected Promise 的函数', async () => {
      const error = new Error('Promise 错误');
      const asyncFn = vi.fn(() => Promise.reject(error));
      
      const wrapped = asyncHandler(asyncFn);
      await wrapped(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('validateBody 中间件', () => {
    it('应该在所有必需字段存在时通过', () => {
      req.body = { username: 'test', email: 'test@test.com' };
      const middleware = validateBody(['username', 'email']);
      
      expect(() => middleware(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
    
    it('应该在缺少必需字段时抛出错误', () => {
      req.body = { username: 'test' };
      const middleware = validateBody(['username', 'email']);
      
      expect(() => middleware(req, res, next)).toThrow(ValidationError);
    });
    
    it('应该在字段为空字符串时抛出错误', () => {
      req.body = { username: 'test', email: '' };
      const middleware = validateBody(['username', 'email']);
      
      expect(() => middleware(req, res, next)).toThrow(ValidationError);
    });
    
    it('应该在字段为 null 时抛出错误', () => {
      req.body = { username: 'test', email: null };
      const middleware = validateBody(['username', 'email']);
      
      expect(() => middleware(req, res, next)).toThrow(ValidationError);
    });
    
    it('应该在字段为 undefined 时抛出错误', () => {
      req.body = { username: 'test' };
      const middleware = validateBody(['username', 'email']);
      
      expect(() => middleware(req, res, next)).toThrow(ValidationError);
    });
    
    it('应该返回缺失字段列表', () => {
      req.body = { username: 'test' };
      const middleware = validateBody(['username', 'email', 'password']);
      
      try {
        middleware(req, res, next);
      } catch (error) {
        expect(error.details.missingFields).toEqual(['email', 'password']);
      }
    });
  });
  
  describe('validateQuery 中间件', () => {
    it('应该在所有必需参数存在时通过', () => {
      req.query = { page: '1', limit: '10' };
      const middleware = validateQuery(['page', 'limit']);
      
      expect(() => middleware(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
    
    it('应该在缺少必需参数时抛出错误', () => {
      req.query = { page: '1' };
      const middleware = validateQuery(['page', 'limit']);
      
      expect(() => middleware(req, res, next)).toThrow(ValidationError);
    });
    
    it('应该返回缺失参数列表', () => {
      req.query = { page: '1' };
      const middleware = validateQuery(['page', 'limit', 'sort']);
      
      try {
        middleware(req, res, next);
      } catch (error) {
        expect(error.details.missingParams).toEqual(['limit', 'sort']);
      }
    });
  });
  
});
