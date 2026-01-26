// 认证路由
// 定义认证相关的 API 路由

import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validateBody } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post(
  '/login',
  validateBody(['phone', 'password', 'role']),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post(
  '/logout',
  auth,
  authController.logout
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    刷新 token
 * @access  Public
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * @route   GET /api/auth/verify
 * @desc    验证 token
 * @access  Public
 */
router.get(
  '/verify',
  authController.verifyToken
);

/**
 * @route   POST /api/user/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post(
  '/change-password',
  auth,
  validateBody(['old', 'newP']),
  authController.changePassword
);

/**
 * @route   POST /api/user/heartbeat
 * @desc    心跳（更新最后活动时间）
 * @access  Private
 */
router.post(
  '/heartbeat',
  auth,
  authController.heartbeat
);

export default router;
