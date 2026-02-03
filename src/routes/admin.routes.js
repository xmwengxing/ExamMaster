/**
 * 管理员模块路由
 */

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import bankBackupRoutes from './bank-backup.routes.js';

const router = express.Router();

// 学生管理
router.get('/students', auth, adminAuth, adminController.getStudents);
router.post('/students', auth, adminAuth, adminController.createStudent);
router.put('/students/:id', auth, adminAuth, adminController.updateStudent);
router.delete('/students/:id', auth, adminAuth, adminController.deleteStudent);
router.post('/students/batch-delete', auth, adminAuth, adminController.batchDeleteStudents);
router.post('/students/batch-perms', auth, adminAuth, adminController.batchSetStudentPerms);
router.get('/students/:userId/practice-stats', auth, adminAuth, adminController.getStudentPracticeStats);

// 管理员账号管理
router.get('/admins', auth, adminAuth, adminController.getAllAdmins);
router.post('/admins', auth, adminAuth, adminController.createAdmin);
router.put('/admins/:id', auth, adminAuth, adminController.updateAdmin);
router.delete('/admins/:id', auth, adminAuth, adminController.deleteAdmin);
router.post('/change-password', auth, adminAuth, adminController.changePassword);

// 考试历史和进度
router.get('/exam-history', auth, adminAuth, adminController.getExamHistory);
router.get('/all-progress', auth, adminAuth, adminController.getAllProgress);

// 数据库修复
router.post('/repair-student-schema', auth, adminAuth, adminController.repairStudentSchema);

// 日志管理
router.get('/login-logs', auth, adminAuth, adminController.getLoginLogs);
router.get('/audit-logs', auth, adminAuth, adminController.getAuditLogs);
router.post('/audit-logs', auth, adminAuth, adminController.createAuditLog);

// 题库备份路由（需要先通过认证）
router.use('/banks', auth, adminAuth, bankBackupRoutes);

export default router;
