// 系统配置控制器
// 处理系统配置相关的 HTTP 请求

import * as configService from '../services/config.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取系统配置
 */
export async function getSystemConfig(req, res, next) {
  try {
    const config = await configService.getSystemConfig(req.db);
    res.json(config);
  } catch (error) {
    logger.error('[Config] 获取系统配置失败:', error);
    // 返回空配置而不是错误，保持向后兼容
    res.json(null);
  }
}

/**
 * 更新系统配置（管理员）
 */
export async function updateSystemConfig(req, res, next) {
  try {
    const configData = req.body || {};
    await configService.updateSystemConfig(req.db, configData);
    
    logger.info('[Config] 系统配置更新成功');
    res.json({ success: true });
  } catch (error) {
    logger.error('[Config] 更新系统配置失败:', error);
    next(error);
  }
}

/**
 * 添加自定义字段（管理员）
 */
export async function addCustomField(req, res, next) {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '字段名称不能为空' });
    }
    
    await configService.addCustomField(req.db, name);
    
    logger.info('[Config] 自定义字段添加成功:', { fieldName: name });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Config] 添加自定义字段失败:', error);
    next(error);
  }
}

/**
 * 删除自定义字段（管理员）
 */
export async function removeCustomField(req, res, next) {
  try {
    const { name } = req.params;
    
    await configService.removeCustomField(req.db, name);
    
    logger.info('[Config] 自定义字段删除成功:', { fieldName: name });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Config] 删除自定义字段失败:', error);
    next(error);
  }
}
