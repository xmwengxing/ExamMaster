// 请求日志中间件单元测试
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  requestLogger,
  slowRequestLogger,
  requestBodyLogger,
  errorLogger,
  skipLogging,
  logAuth,
  logOperation,
  logDatabaseQuery,
  logDatabaseError
} from '../../../src/middleware/requestLogger.js';

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import logger from '../../../utils/logger.js';

describe('请求日志中间件单元测试', () => {
  
  let req, res, next;
  
  beforeEach(() => {
    // 重置 mock 对象
    req = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: vi.fn((header) => {
        if (header === 'user-agent') return 'test-agent';
        return null;
      }),
      user: null,
      body: {}
    };
    
    res = {
      statusCode: 200,
      on: vi.fn()
    };
    
    next = vi.fn();
    
    // 清除 logger mock 调用记录
    vi.clearAllMocks();
  });
  
  describe('requestLogger 中间件', () => {
    it('应该记录请求开始', () => {
      requestLogger(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith(
        'HTTP 请求',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1'
        })
      );
      expect(next).toHaveBeenCalled();
    });
    
    it('应该监听响应结束事件', () => {
      requestLogger(req, res, next);
      
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
    
    it('应该记录成功响应（2xx）', () => {
      requestLogger(req, res, next);
      
      // 获取 finish 事件处理函数
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 200;
      
      // 触发 finish 事件
      finishHandler();
      
      expect(logger.info).toHaveBeenCalledWith(
        'HTTP 响应 - 成功',
        expect.objectContaining({
          status: 200,
          method: 'GET',
          url: '/test'
        })
      );
    });
    
    it('应该记录客户端错误（4xx）', () => {
      requestLogger(req, res, next);
      
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 404;
      
      finishHandler();
      
      expect(logger.warn).toHaveBeenCalledWith(
        'HTTP 响应 - 客户端错误',
        expect.objectContaining({
          status: 404
        })
      );
    });
    
    it('应该记录服务器错误（5xx）', () => {
      requestLogger(req, res, next);
      
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 500;
      
      finishHandler();
      
      expect(logger.error).toHaveBeenCalledWith(
        'HTTP 响应 - 服务器错误',
        expect.objectContaining({
          status: 500
        })
      );
    });
    
    it('应该记录用户 ID（如果存在）', () => {
      req.user = { id: 123 };
      
      requestLogger(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith(
        'HTTP 请求',
        expect.objectContaining({
          userId: 123
        })
      );
    });
    
    it('应该记录响应时间', () => {
      requestLogger(req, res, next);
      
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 200;
      
      finishHandler();
      
      expect(logger.info).toHaveBeenCalledWith(
        'HTTP 响应 - 成功',
        expect.objectContaining({
          duration: expect.stringMatching(/\d+ms/)
        })
      );
    });
  });
  
  describe('slowRequestLogger 中间件', () => {
    it('应该记录慢请求', async () => {
      const middleware = slowRequestLogger(50); // 50ms 阈值
      
      middleware(req, res, next);
      
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 200;
      
      // 延迟触发，模拟慢请求
      await new Promise(resolve => setTimeout(resolve, 60));
      finishHandler();
      
      expect(logger.warn).toHaveBeenCalledWith(
        '慢请求检测',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          threshold: '50ms'
        })
      );
    });
    
    it('应该不记录快速请求', () => {
      const middleware = slowRequestLogger(1000);
      
      middleware(req, res, next);
      
      const finishHandler = res.on.mock.calls[0][1];
      res.statusCode = 200;
      
      finishHandler();
      
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
  
  describe('requestBodyLogger 中间件', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });
    
    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });
    
    it('应该记录 POST 请求体', () => {
      req.method = 'POST';
      req.body = { username: 'test', email: 'test@test.com' };
      
      const middleware = requestBodyLogger();
      middleware(req, res, next);
      
      expect(logger.debug).toHaveBeenCalledWith(
        '请求体',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('username')
        })
      );
      expect(next).toHaveBeenCalled();
    });
    
    it('应该过滤敏感字段', () => {
      req.method = 'POST';
      req.body = { username: 'test', password: 'secret123' };
      
      const middleware = requestBodyLogger();
      middleware(req, res, next);
      
      expect(logger.debug).toHaveBeenCalledWith(
        '请求体',
        expect.objectContaining({
          body: expect.stringContaining('***')
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        '请求体',
        expect.objectContaining({
          body: expect.not.stringContaining('secret123')
        })
      );
    });
    
    it('应该只记录指定的 HTTP 方法', () => {
      req.method = 'GET';
      req.body = { data: 'test' };
      
      const middleware = requestBodyLogger({ onlyMethods: ['POST', 'PUT'] });
      middleware(req, res, next);
      
      expect(logger.debug).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    it('应该在生产环境跳过记录', () => {
      process.env.NODE_ENV = 'production';
      req.method = 'POST';
      req.body = { data: 'test' };
      
      const middleware = requestBodyLogger();
      middleware(req, res, next);
      
      expect(logger.debug).not.toHaveBeenCalled();
    });
    
    it('应该限制请求体长度', () => {
      req.method = 'POST';
      req.body = { data: 'x'.repeat(2000) };
      
      const middleware = requestBodyLogger({ maxLength: 100 });
      middleware(req, res, next);
      
      expect(logger.debug).toHaveBeenCalledWith(
        '请求体',
        expect.objectContaining({
          body: expect.stringMatching(/\.\.\./)
        })
      );
    });
  });
  
  describe('errorLogger 中间件', () => {
    it('应该记录错误信息', () => {
      const error = new Error('测试错误');
      error.stack = 'Error stack trace';
      
      errorLogger(error, req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith(
        '应用错误',
        expect.objectContaining({
          error: '测试错误',
          stack: 'Error stack trace',
          method: 'GET',
          url: '/test'
        })
      );
      expect(next).toHaveBeenCalledWith(error);
    });
    
    it('应该记录用户信息（如果存在）', () => {
      req.user = { id: 456 };
      const error = new Error('测试错误');
      
      errorLogger(error, req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith(
        '应用错误',
        expect.objectContaining({
          userId: 456
        })
      );
    });
  });
  
  describe('skipLogging 包装函数', () => {
    it('应该跳过指定路径的日志', () => {
      const mockMiddleware = vi.fn((req, res, next) => next());
      const wrapped = skipLogging(['/health', '/metrics'], mockMiddleware);
      
      req.originalUrl = '/health';
      wrapped(req, res, next);
      
      expect(mockMiddleware).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    it('应该对非跳过路径执行中间件', () => {
      const mockMiddleware = vi.fn((req, res, next) => next());
      const wrapped = skipLogging(['/health'], mockMiddleware);
      
      req.originalUrl = '/api/users';
      wrapped(req, res, next);
      
      expect(mockMiddleware).toHaveBeenCalled();
    });
    
    it('应该支持正则表达式路径', () => {
      const mockMiddleware = vi.fn((req, res, next) => next());
      const wrapped = skipLogging([/^\/api\/health/], mockMiddleware);
      
      req.originalUrl = '/api/health/check';
      wrapped(req, res, next);
      
      expect(mockMiddleware).not.toHaveBeenCalled();
    });
  });
  
  describe('辅助日志函数', () => {
    it('logAuth 应该记录成功的认证', () => {
      logAuth('login', 123, true, { ip: '127.0.0.1' });
      
      expect(logger.info).toHaveBeenCalledWith(
        '认证操作',
        expect.objectContaining({
          action: 'login',
          userId: 123,
          success: true,
          ip: '127.0.0.1'
        })
      );
    });
    
    it('logAuth 应该记录失败的认证', () => {
      logAuth('login', null, false, { reason: 'invalid_password' });
      
      expect(logger.warn).toHaveBeenCalledWith(
        '认证失败',
        expect.objectContaining({
          success: false,
          reason: 'invalid_password'
        })
      );
    });
    
    it('logOperation 应该记录业务操作', () => {
      logOperation('create_user', 123, { username: 'test' });
      
      expect(logger.info).toHaveBeenCalledWith(
        '业务操作',
        expect.objectContaining({
          operation: 'create_user',
          userId: 123,
          username: 'test'
        })
      );
    });
    
    it('logDatabaseQuery 应该记录数据库查询', () => {
      logDatabaseQuery('SELECT * FROM users WHERE id = $1', [123], 50);
      
      expect(logger.debug).toHaveBeenCalledWith(
        '数据库查询',
        expect.objectContaining({
          query: expect.stringContaining('SELECT'),
          duration: '50ms'
        })
      );
    });
    
    it('logDatabaseError 应该记录数据库错误', () => {
      const error = new Error('Connection failed');
      error.code = '08006';
      
      logDatabaseError(error, 'SELECT * FROM users', []);
      
      expect(logger.error).toHaveBeenCalledWith(
        '数据库错误',
        expect.objectContaining({
          error: 'Connection failed',
          code: '08006'
        })
      );
    });
  });
  
});
