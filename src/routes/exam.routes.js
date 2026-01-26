// 考试路由
// 定义考试和考试历史相关的 API 路由

import express from 'express';
import * as examController from '../controllers/exam.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 考试管理路由
router.get('/', auth, examController.getExams);
router.get('/:id', auth, examController.getExamById);
router.post('/', auth, adminAuth, examController.createExam);
router.put('/:id', auth, adminAuth, examController.updateExam);
router.delete('/:id', auth, adminAuth, examController.deleteExam);
router.post('/:id/toggle-visibility', auth, adminAuth, examController.toggleExamVisibility);

// 考试历史记录路由
router.get('/history/all', auth, adminAuth, examController.getAllExamHistory);
router.get('/history/my', auth, examController.getExamHistory);
router.post('/history', auth, examController.createOrUpdateExamHistory);
router.put('/history/:id', auth, examController.updateExamHistory);
router.delete('/history/:id', auth, examController.deleteExamHistory);

export default router;
