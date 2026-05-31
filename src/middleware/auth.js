// 认证中间件
// 用于验证 JWT token 和用户权限

import jwt from 'jsonwebtoken';
import logger from '../../utils/logger.js';

import { JWT_SECRET } from '../config/jwt.js';

/**
 * 基础认证中间件
 * 验证 JWT token 并将用户信息附加到 req.user
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    logger.warn('认证失败：缺少 token', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: '未提供认证令牌' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('认证成功', {
      userId: decoded.id,
      role: decoded.role,
      method: req.method,
      url: req.originalUrl,
    });
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('认证失败：token 验证失败', {
      error: err.message,
      method: req.method,
      url: req.originalUrl,
      tokenPreview: token ? token.slice(0, 20) + '...' : 'none'
    });
    return res.status(403).json({ 
      error: 'Forbidden',
      message: '无效的认证令牌' 
    });
  }
}

/**
 * 管理员认证中间件
 * 验证用户是否具有管理员权限
 * 必须在 auth 中间件之后使用
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function adminAuth(req, res, next) {
  // 检查是否已经通过基础认证
  if (!req.user) {
    logger.warn('管理员认证失败：未通过基础认证', {
      method: req.method,
      url: req.originalUrl,
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: '需要先进行身份认证' 
    });
  }
  
  // 检查用户角色（支持大小写）
  if (req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
    logger.warn('管理员认证失败：权限不足', {
      userId: req.user.id,
      role: req.user.role,
      method: req.method,
      url: req.originalUrl,
    });
    return res.status(403).json({ 
      error: 'Forbidden',
      message: '需要管理员权限' 
    });
  }
  
  logger.debug('管理员认证成功', {
    userId: req.user.id,
    method: req.method,
    url: req.originalUrl,
  });
  
  next();
}

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续执行（不强制要求认证）
 * 用于某些既支持匿名访问又支持认证访问的接口
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  // 如果没有 token，直接继续
  if (!token) {
    req.user = null;
    return next();
  }
  
  // 如果有 token，尝试验证
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('可选认证成功', {
      userId: decoded.id,
      role: decoded.role,
      method: req.method,
      url: req.originalUrl,
    });
    req.user = decoded;
    next();
  } catch (err) {
    // token 无效，但不阻止请求继续
    logger.debug('可选认证：token 无效，继续以匿名方式处理', {
      error: err.message,
      method: req.method,
      url: req.originalUrl,
    });
    req.user = null;
    next();
  }
}

/**
 * 角色验证中间件工厂函数
 * 创建一个验证特定角色的中间件
 * 
 * @param {string|Array<string>} allowedRoles - 允许的角色（单个或数组）
 * @returns {Function} Express 中间件函数
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    // 检查是否已经通过基础认证
    if (!req.user) {
      logger.warn('角色验证失败：未通过基础认证', {
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '需要先进行身份认证' 
      });
    }
    
    // 检查用户角色
    if (!roles.includes(req.user.role)) {
      logger.warn('角色验证失败：权限不足', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `需要以下角色之一：${roles.join(', ')}` 
      });
    }
    
    logger.debug('角色验证成功', {
      userId: req.user.id,
      role: req.user.role,
      method: req.method,
      url: req.originalUrl,
    });
    
    next();
  };
}

/**
 * 用户自身资源访问验证中间件
 * 验证用户只能访问自己的资源（或管理员可以访问所有资源）
 * 
 * @param {string} userIdParam - 路由参数中的用户 ID 字段名（默认 'userId'）
 * @returns {Function} Express 中间件函数
 */
export function requireSelfOrAdmin(userIdParam = 'userId') {
  return (req, res, next) => {
    // 检查是否已经通过基础认证
    if (!req.user) {
      logger.warn('资源访问验证失败：未通过基础认证', {
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '需要先进行身份认证' 
      });
    }
    
    // 管理员可以访问所有资源
    if (req.user.role === 'admin') {
      return next();
    }
    
    // 获取目标用户 ID（从路由参数、查询参数或请求体）
    const targetUserId = req.params[userIdParam] || 
                         req.query[userIdParam] || 
                         req.body[userIdParam];
    
    // 检查是否访问自己的资源
    if (String(req.user.id) !== String(targetUserId)) {
      logger.warn('资源访问验证失败：无权访问他人资源', {
        userId: req.user.id,
        targetUserId,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: '无权访问他人的资源' 
      });
    }
    
    next();
  };
}

// 默认导出
export default {
  auth,
  adminAuth,
  optionalAuth,
  requireRole,
  requireSelfOrAdmin
};
