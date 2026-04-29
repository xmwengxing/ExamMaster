/**
 * 分组管理路由
 */

import express from 'express';
import * as groupsController from '../controllers/groups.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, adminAuth, groupsController.listGroups);
router.post('/', auth, adminAuth, groupsController.createGroup);
router.get('/:id', auth, adminAuth, groupsController.getGroup);
router.put('/:id', auth, adminAuth, groupsController.updateGroup);
router.delete('/:id', auth, adminAuth, groupsController.deleteGroup);
router.put('/:id/permissions', auth, adminAuth, groupsController.updateGroupPermissions);
router.get('/:id/students', auth, adminAuth, groupsController.getGroupStudents);
router.post('/:id/students', auth, adminAuth, groupsController.addStudentsToGroup);

export default router;
