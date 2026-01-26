/**
 * AI 模块路由
 */

import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// AI 生成和解析路由
router.post('/generate', auth, aiController.generateContent);
router.post('/analysis', auth, aiController.saveAnalysis);
router.get('/analysis/:questionId', auth, aiController.getAnalysis);
router.post('/grade-answer', auth, aiController.gradeAnswer);

// 管理员路由（需要单独导出）
export const adminAiRouter = express.Router();
adminAiRouter.get('/ai-analysis', adminAuth, aiController.getAllAnalysis);

export default router;
