/**
 * 管理员模块路由
 */

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/students', adminAuth, adminController.getStudents);
router.get('/admins', adminAuth, adminController.getAdmins);
router.get('/login-logs', adminAuth, adminController.getLoginLogs);
router.get('/audit-logs', adminAuth, adminController.getAuditLogs);
router.post('/audit-logs', adminAuth, adminController.createAuditLog);

export default router;
