/**
 * 笔记路由
 * 定义笔记相关的 API 端点
 */

import express from 'express';
import { saveNoteController, getNoteController } from '../controllers/note.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 保存或更新题目笔记
router.post('/', auth, saveNoteController);

// 获取题目笔记
router.get('/:qId', auth, getNoteController);

export default router;
