// 题库路由
// 定义题库相关的 API 路由

import express from 'express';
import * as bankController from '../controllers/bank.controller.js';
import * as questionController from '../controllers/question.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 获取所有题库（需要认证）
router.get('/', auth, bankController.getAllBanks);

// 获取指定题库（需要认证）
router.get('/:id', auth, bankController.getBankById);

// 创建题库（管理员）
router.post('/', auth, adminAuth, bankController.createBank);

// 更新题库（管理员）
router.put('/:id', auth, adminAuth, bankController.updateBank);

// 删除题库（管理员）
router.delete('/:id', auth, adminAuth, bankController.deleteBank);

// 更新题库分值配置（管理员）
router.put('/:id/score', auth, adminAuth, bankController.updateBankScoreConfig);

// 批量导入题目到指定题库（管理员）
router.post('/:id/import', auth, adminAuth, questionController.batchImportQuestions);

export default router;

