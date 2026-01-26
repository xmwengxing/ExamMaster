// 请求日志中间件
// 记录 HTTP 请求和响应信息

import logger from '../../utils/logger.js';

/**
 * 请求日志中间件
 * 记录每个 HTTP 请求的详细信息和响应时间
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // 记录请求开始
  logger.info('HTTP 请求', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || null
    };
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('HTTP 响应 - 服务器错误', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP 响应 - 客户端错误', logData);
    } else {
      logger.info('HTTP 响应 - 成功', logData);
    }
  });
  
  next();
}

/**
 * 慢请求日志中间件
 * 记录响应时间超过阈值的请求
 * 
 * @param {number} threshold - 时间阈值（毫秒），默认 1000ms
 * @returns {Function} Express 中间件函数
 */
export function slowRequestLogger(threshold = 1000) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        logger.warn('慢请求检测', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          status: res.statusCode,
          ip: req.ip,
          userId: req.user?.id || null
        });
      }
    });
    
    next();
  };
}

/**
 * 请求体日志中间件
 * 记录请求体内容（用于调试）
 * 注意：生产环境慎用，可能包含敏感信息
 * 
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件函数
 */
export function requestBodyLogger(options = {}) {
  const {
    maxLength = 1000,
    excludeFields = ['password', 'token', 'secret'],
    onlyMethods = ['POST', 'PUT', 'PATCH']
  } = options;
  
  return (req, res, next) => {
    // 只记录指定的 HTTP 方法
    if (!onlyMethods.includes(req.method)) {
      return next();
    }
    
    // 只在开发环境记录
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      // 过滤敏感字段
      const sanitizedBody = { ...req.body };
      excludeFields.forEach(field => {
        if (sanitizedBody[field]) {
          sanitizedBody[field] = '***';
        }
      });
      
      // 限制长度
      let bodyStr = JSON.stringify(sanitizedBody);
      if (bodyStr.length > maxLength) {
        bodyStr = bodyStr.substring(0, maxLength) + '...';
      }
      
      logger.debug('请求体', {
        method: req.method,
        url: req.originalUrl,
        body: bodyStr
      });
    }
    
    next();
  };
}

/**
 * 错误日志中间件
 * 记录应用错误（在错误处理中间件之前使用）
 * 
 * @param {Error} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function errorLogger(err, req, res, next) {
  logger.error('应用错误', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || null,
    body: req.body
  });
  
  // 传递给下一个错误处理中间件
  next(err);
}

/**
 * 跳过日志中间件工厂函数
 * 为特定路径跳过日志记录
 * 
 * @param {Array<string|RegExp>} paths - 要跳过的路径列表
 * @param {Function} middleware - 要包装的中间件
 * @returns {Function} 包装后的中间件
 */
export function skipLogging(paths, middleware) {
  return (req, res, next) => {
    // 检查是否应该跳过
    const shouldSkip = paths.some(path => {
      if (typeof path === 'string') {
        return req.originalUrl.startsWith(path);
      } else if (path instanceof RegExp) {
        return path.test(req.originalUrl);
      }
      return false;
    });
    
    if (shouldSkip) {
      return next();
    }
    
    return middleware(req, res, next);
  };
}

/**
 * 认证日志辅助函数
 * 记录认证相关操作
 * 
 * @param {string} action - 操作类型（login, logout, token_refresh 等）
 * @param {number} userId - 用户 ID
 * @param {boolean} success - 是否成功
 * @param {Object} details - 额外详情
 */
export function logAuth(action, userId, success, details = {}) {
  const logData = {
    action,
    userId,
    success,
    ...details
  };
  
  if (success) {
    logger.info('认证操作', logData);
  } else {
    logger.warn('认证失败', logData);
  }
}

/**
 * 业务操作日志辅助函数
 * 记录重要的业务操作
 * 
 * @param {string} operation - 操作类型
 * @param {number} userId - 用户 ID
 * @param {Object} details - 操作详情
 */
export function logOperation(operation, userId, details = {}) {
  logger.info('业务操作', {
    operation,
    userId,
    ...details
  });
}

/**
 * 数据库查询日志辅助函数
 * 记录数据库查询（用于性能分析）
 * 
 * @param {string} query - SQL 查询语句
 * @param {Array} params - 查询参数
 * @param {number} duration - 执行时间（毫秒）
 */
export function logDatabaseQuery(query, params, duration) {
  logger.debug('数据库查询', {
    query: query.substring(0, 200), // 限制查询长度
    params: params ? JSON.stringify(params).substring(0, 200) : null,
    duration: `${duration}ms`
  });
}

/**
 * 数据库错误日志辅助函数
 * 记录数据库错误
 * 
 * @param {Error} error - 错误对象
 * @param {string} query - SQL 查询语句
 * @param {Array} params - 查询参数
 */
export function logDatabaseError(error, query, params) {
  logger.error('数据库错误', {
    error: error.message,
    code: error.code,
    query: query ? query.substring(0, 200) : null,
    params: params ? JSON.stringify(params).substring(0, 200) : null
  });
}

// 默认导出
export default {
  requestLogger,
  slowRequestLogger,
  requestBodyLogger,
  errorLogger,
  skipLogging,
  logAuth,
  logOperation,
  logDatabaseQuery,
  logDatabaseError
};
