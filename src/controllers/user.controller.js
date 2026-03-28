// 用户控制器
// 处理用户相关的 HTTP 请求

import * as userService from '../services/user.service.js';
import { ValidationError } from '../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

/**
 * 获取用户资料
 */
export async function getUserProfile(req, res, next) {
  try {
    const profile = await userService.getUserProfile(req.db, req.user.id);
    
    if (!profile) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(profile);
  } catch (error) {
    logger.error('[Profile] 获取用户资料失败:', error);
    next(error);
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(req, res, next) {
  try {
    await userService.updateUserProfile(req.db, req.user.id, req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error('[Profile] 更新用户资料失败:', error);
    next(error);
  }
}

/**
 * 修改密码
 */
export async function changePassword(req, res, next) {
  try {
    const { old, newP } = req.body;
    
    const result = await userService.changePassword(req.db, req.user.id, old, newP);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    logger.info('[ChangePassword] 密码修改成功:', { userId: req.user.id });
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    logger.error('[ChangePassword] 密码修改失败:', error);
    next(error);
  }
}

/**
 * 心跳更新
 */
export async function heartbeat(req, res, next) {
  try {
    const lastActivity = await userService.updateLastActivity(req.db, req.user.id);
    res.json({ success: true, lastActivity });
  } catch (error) {
    logger.error('[Heartbeat] 更新活动时间失败:', error);
    next(error);
  }
}

/**
 * 重置用户学习数据
 */
export async function resetUserData(req, res, next) {
  try {
    logger.info('[Reset] 用户数据重置请求:', { userId: req.user.id, role: req.user.role });
    
    const result = await userService.resetUserData(req.db, req.user.id);
    
    logger.info('[Reset] 用户数据重置成功:', { userId: req.user.id });
    res.json({ 
      success: true, 
      message: '学习数据已成功重置',
      clearedTables: result.clearedTables
    });
  } catch (error) {
    logger.error('[Reset] 重置失败:', error);
    res.status(500).json({ error: '重置失败: ' + error.message });
  }
}

/**
 * 获取用户每日进度
 */
export async function getUserProgress(req, res, next) {
  try {
    const progress = await userService.getUserProgress(req.db, req.user.id);
    res.json(progress);
  } catch (error) {
    logger.error('[Progress] 获取进度失败:', error);
    next(error);
  }
}

/**
 * 增加每日进度计数
 */
export async function incrementDailyProgress(req, res, next) {
  try {
    await userService.incrementDailyProgress(req.db, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[Progress Increment] 更新进度失败:', error);
    next(error);
  }
}

/**
 * 获取所有用户的每日进度（管理员功能）
 */
export async function getAllUsersProgress(req, res, next) {
  try {
    const progress = await userService.getAllUsersProgress(req.db);
    res.json(progress);
  } catch (error) {
    logger.error('[Admin Progress] 获取进度失败:', error);
    next(error);
  }
}
