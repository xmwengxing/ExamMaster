// 错题路由
// 定义错题相关的 API 路由

import express from 'express';
import * as mistakeController from '../controllers/mistake.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 获取当前用户的错题列表（需要认证）
router.get('/', auth, mistakeController.getMistakes);

// 添加错题到错题集（需要认证）
router.post('/', auth, mistakeController.addMistake);

export default router;
