// 题目路由
// 定义题目相关的 API 路由

import express from 'express';
import * as questionController from '../controllers/question.controller.js';
import * as bankController from '../controllers/bank.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 获取题目列表（需要认证）
router.get('/', auth, questionController.getQuestions);

// 获取指定题目（需要认证）
router.get('/:id', auth, questionController.getQuestionById);

// 创建题目（管理员）
router.post('/', auth, adminAuth, questionController.createQuestion);

// 更新题目（管理员）
router.put('/:id', auth, adminAuth, questionController.updateQuestion);

// 删除题目（管理员）
router.delete('/:id', auth, adminAuth, questionController.deleteQuestion);

// 批量删除题目（管理员）
router.post('/batch-delete', auth, adminAuth, questionController.batchDeleteQuestions);

// 批量导入题目到指定题库（管理员）
// 注意：这个路由需要放在题库路由中，因为路径是 /api/banks/:id/import
// 但为了保持控制器的组织，我们在这里导出，然后在主应用中挂载

// 填空题评分（需要认证）
router.post('/grade-fill-blank', auth, questionController.gradeFillInBlank);

export default router;

// 导出批量导入路由，用于在题库路由中使用
export { questionController };

