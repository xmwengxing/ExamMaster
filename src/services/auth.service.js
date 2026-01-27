// 认证服务层
// 处理用户登录、密码修改、心跳等认证相关业务逻辑

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import logger from '../../utils/logger.js';
import { UnauthorizedError, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 用户登录
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 * @param {string} role - 角色
 * @param {string} ip - IP 地址
 * @returns {Promise<Object>} - {token, user}
 */
export async function login(phone, password, role, ip = 'unknown') {
  // 参数验证
  if (!phone || !password || !role) {
    throw new ValidationError('手机号、密码和角色不能为空');
  }
  
  // 查询用户
  const user = await db.getOne(
    'SELECT * FROM users WHERE phone = $1 AND role = $2',
    [phone, role]
  );
  
  // 验证用户和密码
  if (!user || !bcrypt.compareSync(password, user.password)) {
    logger.warn('登录失败：账号或密码错误', { phone, role, ip });
    throw new UnauthorizedError('账号或密码错误');
  }
  
  // 生成时间戳
  const nowISO = new Date().toISOString();
  const now = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
  
  // 处理登录历史
  let loginHistory = [];
  try {
    loginHistory = user.login_history ? user.login_history : [];
  } catch (e) {
    loginHistory = [];
  }
  
  // 添加新的登录记录（保留最近100条）
  loginHistory.push(now);
  if (loginHistory.length > 100) {
    loginHistory = loginHistory.slice(-100);
  }
  
  // 更新用户登录信息
  await db.execute(
    'UPDATE users SET last_login = $1, login_history = $2, last_activity = $3 WHERE id = $4',
    [now, JSON.stringify(loginHistory), nowISO, user.id]
  );
  
  // 插入登录日志
  const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await db.execute(
    'INSERT INTO login_logs (id, user_id, phone, role, time, ip) VALUES ($1, $2, $3, $4, $5, $6)',
    [logId, user.id, phone, role, nowISO, ip]
  );
  
  logger.info('用户登录成功', { userId: user.id, phone, role, ip });
  
  // 生成 JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // 移除密码字段
  const { password: _, ...safeUser } = user;
  
  // 转换字段名为 camelCase（前端兼容）
  const userResponse = {
    ...safeUser,
    lastLogin: now,
    loginHistory: loginHistory,
    studentPerms: safeUser.student_perms || [],
    allowedBankIds: safeUser.allowed_bank_ids || [],
    realName: safeUser.real_name,
    lastActivity: safeUser.last_activity,
    deepseekApiKey: safeUser.deepseek_api_key,
    permissions: safeUser.permissions || []  // 添加管理员权限字段
  };
  
  return { 
    token, 
    user: userResponse
  };
}

/**
 * 修改密码
 * @param {number} userId - 用户 ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<void>}
 */
export async function changePassword(userId, oldPassword, newPassword) {
  // 参数验证
  if (!oldPassword || !newPassword) {
    throw new ValidationError('请提供旧密码和新密码');
  }
  
  if (newPassword.length < 4) {
    throw new ValidationError('新密码长度至少为4位');
  }
  
  // 获取当前用户信息
  const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  // 验证旧密码
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    logger.warn('修改密码失败：旧密码不正确', { userId });
    throw new UnauthorizedError('旧密码不正确');
  }
  
  // 加密新密码
  const newHash = bcrypt.hashSync(newPassword, 10);
  
  // 更新密码
  await db.execute('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
  
  logger.info('密码修改成功', { userId });
}

/**
 * 更新用户最后活动时间（心跳）
 * @param {number} userId - 用户 ID
 * @returns {Promise<string>} - 最后活动时间（ISO 格式）
 */
export async function updateLastActivity(userId) {
  const lastActivity = new Date().toISOString();
  
  await db.execute(
    'UPDATE users SET last_activity = $1 WHERE id = $2', 
    [lastActivity, userId]
  );
  
  logger.debug('更新用户活动时间', { userId, lastActivity });
  
  return lastActivity;
}

/**
 * 验证 JWT token
 * @param {string} token - JWT token
 * @returns {Object} - 解码后的用户信息
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('认证令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('无效的认证令牌');
    }
    throw error;
  }
}

/**
 * 生成 JWT token
 * @param {Object} payload - token 载荷
 * @param {string} expiresIn - 过期时间（默认 7 天）
 * @returns {string} - JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 刷新 token
 * @param {string} oldToken - 旧 token
 * @returns {string} - 新 token
 */
export function refreshToken(oldToken) {
  const decoded = verifyToken(oldToken);
  
  // 生成新 token（移除 iat 和 exp 字段）
  const { iat, exp, ...payload } = decoded;
  return generateToken(payload);
}

/**
 * 记录用户登出
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function recordLogout(userId) {
  try {
    const nowISO = new Date().toISOString();
    
    // 查找该用户最近的一条未记录登出时间的登录日志
    const lastLoginLog = await db.getOne(
      'SELECT * FROM login_logs WHERE user_id = $1 AND logout_time IS NULL ORDER BY time DESC LIMIT 1',
      [userId]
    );
    
    if (lastLoginLog) {
      // 计算本次登录时长（秒）
      const loginTime = new Date(lastLoginLog.time);
      const logoutTime = new Date(nowISO);
      const sessionDuration = Math.floor((logoutTime - loginTime) / 1000);
      
      // 更新登出时间和本次登录时长
      await db.execute(
        'UPDATE login_logs SET logout_time = $1, session_duration = $2 WHERE id = $3',
        [nowISO, sessionDuration, lastLoginLog.id]
      );
      
      logger.info('记录用户登出', { 
        userId, 
        sessionDuration: `${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒` 
      });
    }
  } catch (error) {
    logger.error('记录登出失败', { userId, error: error.message });
    // 不抛出错误，避免影响登出流程
  }
}

// 默认导出
export default {
  login,
  changePassword,
  updateLastActivity,
  verifyToken,
  generateToken,
  refreshToken,
  recordLogout
};
