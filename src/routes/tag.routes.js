/**
 * 标签模块路由
 */

import express from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, tagController.getTags);
router.post('/', adminAuth, tagController.createTag);
router.put('/:id', adminAuth, tagController.updateTag);
router.delete('/:id', adminAuth, tagController.deleteTag);
router.post('/merge', adminAuth, tagController.mergeTags);

export default router;
