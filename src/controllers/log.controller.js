/**
 * 日志管理控制器
 */

import * as logService from '../services/log.service.js';

/**
 * 获取登录日志
 */
export async function getLoginLogs(req, res) {
  try {
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    };
    
    const logs = await logService.getLoginLogs(req.db, options);
    
    console.log(`[Logs] Retrieved ${logs.length} login logs`);
    res.json(logs);
  } catch (error) {
    console.error('[Logs] Get login logs error:', error);
    res.status(500).json({ 
      message: '获取登录日志失败',
      error: error.message 
    });
  }
}

/**
 * 获取审计日志
 */
export async function getAuditLogs(req, res) {
  try {
    const { limit, offset, action, operatorId } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      action,
      operatorId
    };
    
    const logs = await logService.getAuditLogs(req.db, options);
    
    console.log(`[Logs] Retrieved ${logs.length} audit logs`);
    res.json(logs);
  } catch (error) {
    console.error('[Logs] Get audit logs error:', error);
    res.status(500).json({ 
      message: '获取审计日志失败',
      error: error.message 
    });
  }
}

/**
 * 创建审计日志
 */
export async function createAuditLog(req, res) {
  try {
    const { action, target } = req.body;
    
    // 验证必填字段
    if (!action) {
      return res.status(400).json({ message: '操作类型不能为空' });
    }
    
    // 从认证信息中获取操作者信息
    const logData = {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname || req.user?.phone,
      action,
      target
    };
    
    const log = await logService.createAuditLog(req.db, logData);
    
    res.json({ 
      success: true,
      log
    });
  } catch (error) {
    console.error('[Logs] Create audit log error:', error);
    res.status(500).json({ 
      message: '创建审计日志失败',
      error: error.message 
    });
  }
}
