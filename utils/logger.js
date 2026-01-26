// 日志配置模块
// 使用 winston 实现结构化日志记录

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志目录
const LOG_DIR = path.join(__dirname, '..', 'logs');

// 日志级别
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'edumaster-api' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // 所有日志（按天轮转）
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),
    
    // 错误日志（单独文件）
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
});

// 请求日志中间件
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 记录请求开始
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
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
    };
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('HTTP Response', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Response', logData);
    } else {
      logger.info('HTTP Response', logData);
    }
  });
  
  next();
};

// 错误日志中间件
export const errorLogger = (err, req, res, next) => {
  logger.error('Application Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  
  next(err);
};

// 数据库查询日志
export const logDatabaseQuery = (query, params, duration) => {
  logger.debug('Database Query', {
    query: query.substring(0, 200), // 限制查询长度
    params: params ? JSON.stringify(params).substring(0, 200) : null,
    duration: `${duration}ms`,
  });
};

// 数据库错误日志
export const logDatabaseError = (error, query, params) => {
  logger.error('Database Error', {
    error: error.message,
    code: error.code,
    query: query ? query.substring(0, 200) : null,
    params: params ? JSON.stringify(params).substring(0, 200) : null,
  });
};

// 认证日志
export const logAuth = (action, userId, success, details = {}) => {
  const logData = {
    action,
    userId,
    success,
    ...details,
  };
  
  if (success) {
    logger.info('Authentication', logData);
  } else {
    logger.warn('Authentication Failed', logData);
  }
};

// 业务操作日志
export const logOperation = (operation, userId, details = {}) => {
  logger.info('Business Operation', {
    operation,
    userId,
    ...details,
  });
};

export default logger;
