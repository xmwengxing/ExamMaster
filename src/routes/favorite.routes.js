/**
 * 收藏路由
 * 定义收藏相关的 API 端点
 */

import express from 'express';
import { getFavorites, toggleFavoriteStatus } from '../controllers/favorite.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 获取用户的收藏题目列表
router.get('/', auth, getFavorites);

// 切换题目的收藏状态
router.post('/:qId', auth, toggleFavoriteStatus);

export default router;
