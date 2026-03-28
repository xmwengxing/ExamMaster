/**
 * SRS 路由
 * 定义 SRS（间隔重复系统）相关的 API 端点
 */

import express from 'express';
import { getSRSRecordsController, updateSRSRecordController } from '../controllers/srs.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 获取用户的 SRS 记录列表
router.get('/records', auth, getSRSRecordsController);

// 更新 SRS 记录
router.post('/records', auth, updateSRSRecordController);

// 更新 SRS 记录（别名路由，兼容前端调用）
router.post('/update', auth, updateSRSRecordController);

export default router;
