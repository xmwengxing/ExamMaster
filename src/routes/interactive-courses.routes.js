import express from 'express';
import * as ctrl from '../controllers/interactive-courses.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 学员端：列出课程组及其已上架章节
router.get('/public', auth, ctrl.listPublicData);

// 管理员：课程组 CRUD
router.get('/groups', auth, adminAuth, ctrl.listGroups);
router.post('/groups', auth, adminAuth, ctrl.createGroup);
router.put('/groups/:id', auth, adminAuth, ctrl.updateGroup);
router.delete('/groups/:id', auth, adminAuth, ctrl.deleteGroup);

// 管理员：章节 CRUD（需指定 group_id）
router.get('/chapters', auth, adminAuth, ctrl.listChapters);
router.post('/chapters', auth, adminAuth, ctrl.createChapter);
router.put('/chapters/:id', auth, adminAuth, ctrl.updateChapter);
router.delete('/chapters/:id', auth, adminAuth, ctrl.deleteChapter);

export default router;
