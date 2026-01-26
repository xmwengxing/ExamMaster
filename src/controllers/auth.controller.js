// 认证控制器
// 处理认证相关的 HTTP 请求

import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * 用户登录控制器
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { phone, password, role } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  
  const result = await authService.login(phone, password, role, ip);
  
  res.json(result);
});

/**
 * 修改密码控制器
 * POST /api/user/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { old, newP } = req.body;
  const userId = req.user.id;
  
  await authService.changePassword(userId, old, newP);
  
  res.json({ 
    success: true, 
    message: '密码修改成功' 
  });
});

/**
 * 心跳控制器
 * POST /api/user/heartbeat
 */
export const heartbeat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const lastActivity = await authService.updateLastActivity(userId);
  
  res.json({ 
    success: true, 
    lastActivity 
  });
});

/**
 * 刷新 token 控制器
 * POST /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const oldToken = authHeader?.split(' ')[1];
  
  if (!oldToken) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: '未提供认证令牌' 
    });
  }
  
  const newToken = authService.refreshToken(oldToken);
  
  res.json({ 
    success: true, 
    token: newToken 
  });
});

/**
 * 验证 token 控制器
 * GET /api/auth/verify
 */
export const verifyToken = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: '未提供认证令牌' 
    });
  }
  
  const decoded = authService.verifyToken(token);
  
  res.json({ 
    valid: true, 
    user: decoded 
  });
});

/**
 * 登出控制器
 * POST /api/auth/logout
 * 注意：JWT 是无状态的，登出主要由客户端处理（删除 token）
 * 服务端可以记录登出日志
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  // 可以在这里记录登出日志
  if (userId) {
    // TODO: 记录登出日志到数据库
    console.log('[Logout] User logged out:', userId);
  }
  
  res.json({ 
    success: true, 
    message: '登出成功' 
  });
});

// 默认导出
export default {
  login,
  changePassword,
  heartbeat,
  refreshToken,
  verifyToken,
  logout
};
