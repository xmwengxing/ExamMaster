/**
 * 系统配置和监控模块路由
 */

import express from 'express';
import * as systemController from '../controllers/system.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    const db = (await import('../../db.js')).default;
    await db.execute('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 数据库监控（管理员）
// 需要先验证 JWT token，再验证管理员权限
router.get('/monitor/database', auth, adminAuth, systemController.getDatabaseMonitor);

export default router;

// 用户进度路由（需要单独挂载）
export const progressRouter = express.Router();
progressRouter.get('/progress', auth, systemController.getUserProgress);

// 管理员进度路由
export const adminProgressRouter = express.Router();
// 需要先验证 JWT token，再验证管理员权限
adminProgressRouter.get('/all-progress', auth, adminAuth, systemController.getAllProgress);
