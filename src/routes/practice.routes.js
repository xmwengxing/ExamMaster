// 练习路由
// 定义练习和 SRS 相关的 API 路由

import express from 'express';
import * as practiceController from '../controllers/practice.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 练习记录路由
router.get('/', auth, practiceController.getPracticeRecords);
router.get('/:id', auth, practiceController.getPracticeRecordById);
router.post('/', auth, practiceController.createPracticeRecord);
router.put('/:id', auth, practiceController.updatePracticeRecord);
router.delete('/:id', auth, practiceController.deletePracticeRecord);

// SRS 记录路由
router.get('/srs/records', auth, practiceController.getSRSRecords);
router.post('/srs/update', auth, practiceController.updateSRSRecord);

export default router;
