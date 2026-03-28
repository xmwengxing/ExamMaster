// 错误处理中间件
// 统一处理应用中的错误，提供一致的错误响应格式

import logger from '../../utils/logger.js';

/**
 * 应用错误类
 * 用于创建带有状态码的自定义错误
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // 标记为可预期的操作错误
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误类
 * 用于表单验证和输入验证错误
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 未找到错误类
 * 用于资源不存在的情况
 */
export class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 未授权错误类
 * 用于认证失败的情况
 */
export class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 禁止访问错误类
 * 用于权限不足的情况
 */
export class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 数据库错误类
 * 用于数据库操作错误
 */
export class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', details = null) {
    super(message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误并返回统一格式的响应
 * 
 * @param {Error} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function errorHandler(err, req, res, next) {
  // 如果响应已经发送，交给 Express 默认错误处理
  if (res.headersSent) {
    return next(err);
  }
  
  // 默认错误信息
  let statusCode = 500;
  let message = '服务器内部错误';
  let details = null;
  
  // 处理自定义应用错误
  if (err.isOperational) {
    statusCode = err.statusCode || 500;
    message = err.message;
    details = err.details;
  }
  // 处理 JWT 错误
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的认证令牌';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '认证令牌已过期';
  }
  // 处理验证错误
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    details = err.details || err.message;
  }
  // 处理数据库错误
  else if (err.code && err.code.startsWith('23')) {
    // PostgreSQL 约束错误
    statusCode = 400;
    if (err.code === '23505') {
      message = '数据已存在，违反唯一性约束';
    } else if (err.code === '23503') {
      message = '违反外键约束';
    } else if (err.code === '23502') {
      message = '缺少必填字段';
    } else {
      message = '数据库约束错误';
    }
    details = process.env.NODE_ENV === 'development' ? err.detail : null;
  }
  // 处理其他数据库错误
  else if (err.code && (err.code.startsWith('42') || err.code.startsWith('08'))) {
    statusCode = 500;
    message = '数据库操作失败';
    details = process.env.NODE_ENV === 'development' ? err.message : null;
  }
  // 处理未知错误
  else {
    // 生产环境不暴露详细错误信息
    if (process.env.NODE_ENV === 'development') {
      message = err.message || message;
      details = err.stack;
    }
  }
  
  // 记录错误日志
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    statusCode,
    message,
    errorName: err.name,
    errorCode: err.code
  };
  
  // 5xx 错误记录为 error 级别，4xx 记录为 warn 级别
  if (statusCode >= 500) {
    logger.error('服务器错误', {
      ...logData,
      stack: err.stack,
      details: err.details
    });
  } else {
    logger.warn('客户端错误', logData);
  }
  
  // 构建错误响应
  const errorResponse = {
    error: message,
    statusCode
  };
  
  // 开发环境返回更多信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = err.stack;
  } else if (details) {
    // 生产环境只返回安全的 details
    errorResponse.details = details;
  }
  
  // 发送错误响应
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 错误处理中间件
 * 处理未匹配到任何路由的请求
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`路由未找到: ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * 异步路由处理器包装函数
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 * 
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的函数
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 验证请求体中间件工厂函数
 * 验证请求体是否包含必需字段
 * 
 * @param {Array<string>} requiredFields - 必需字段列表
 * @returns {Function} Express 中间件函数
 * 
 * @example
 * router.post('/users', validateBody(['username', 'email']), createUser);
 */
export function validateBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body || req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        '缺少必需字段',
        { missingFields }
      );
    }
    
    next();
  };
}

/**
 * 验证查询参数中间件工厂函数
 * 验证查询参数是否包含必需字段
 * 
 * @param {Array<string>} requiredParams - 必需参数列表
 * @returns {Function} Express 中间件函数
 */
export function validateQuery(requiredParams) {
  return (req, res, next) => {
    const missingParams = [];
    
    for (const param of requiredParams) {
      if (!req.query[param]) {
        missingParams.push(param);
      }
    }
    
    if (missingParams.length > 0) {
      throw new ValidationError(
        '缺少必需的查询参数',
        { missingParams }
      );
    }
    
    next();
  };
}

// 默认导出
export default {
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
};
