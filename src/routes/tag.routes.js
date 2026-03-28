/**
 * 标签模块路由
 */

import express from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, tagController.getTags);
// 标签管理需要先验证 JWT token，再验证管理员权限
router.post('/', auth, adminAuth, tagController.createTag);
router.put('/:id', auth, adminAuth, tagController.updateTag);
router.delete('/:id', auth, adminAuth, tagController.deleteTag);
router.post('/merge', auth, adminAuth, tagController.mergeTags);

export default router;
