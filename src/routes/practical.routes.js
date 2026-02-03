/**
 * 实操模块路由
 */

import express from 'express';
import * as practicalController from '../controllers/practical.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 实操任务路由
router.get('/tasks', auth, practicalController.getPracticalTasks);
// 实操任务管理需要先验证 JWT token，再验证管理员权限
router.post('/tasks', auth, adminAuth, practicalController.createPracticalTask);
router.put('/tasks/:id', auth, adminAuth, practicalController.updatePracticalTask);
router.delete('/tasks/:id', auth, adminAuth, practicalController.deletePracticalTask);

// 实操记录路由
router.get('/records', auth, practicalController.getPracticalRecords);
router.post('/records', auth, practicalController.createPracticalRecord);
router.delete('/records/:id', auth, practicalController.deletePracticalRecord);

export default router;
