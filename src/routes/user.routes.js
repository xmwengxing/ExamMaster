// 用户路由
// 定义用户相关的 API 路由

import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 用户资料路由
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);

// 密码修改路由（注意：这里使用 /user/change-password，与 /auth/change-password 不同）
// 实际上 server.js 中使用的是 /api/user/change-password
// 但认证模块已经有 /api/auth/change-password 了
// 为了避免重复，这里不再添加，使用认证模块的即可

// 心跳路由
router.post('/heartbeat', auth, userController.heartbeat);

// 重置用户数据路由
router.post('/reset', auth, userController.resetUserData);

// 每日进度路由
router.get('/progress', auth, userController.getUserProgress);
router.post('/progress/increment', auth, userController.incrementDailyProgress);

// 管理员路由 - 获取所有用户进度（需要先通过 auth，再通过 adminAuth）
router.get('/admin/all-progress', auth, adminAuth, userController.getAllUsersProgress);

export default router;
