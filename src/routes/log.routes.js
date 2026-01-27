/**
 * 日志管理路由
 */

import express from 'express';
import * as logController from '../controllers/log.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 登录日志（管理员）
router.get('/login-logs', auth, adminAuth, logController.getLoginLogs);

// 审计日志（管理员）
router.get('/audit-logs', auth, adminAuth, logController.getAuditLogs);
router.post('/audit-logs', auth, adminAuth, logController.createAuditLog);

export default router;
