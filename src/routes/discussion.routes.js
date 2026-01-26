/**
 * 讨论模块路由
 */

import express from 'express';
import * as discussionController from '../controllers/discussion.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 讨论路由
router.get('/', auth, discussionController.getDiscussions);
router.post('/', auth, discussionController.createDiscussion);
router.get('/:id', auth, discussionController.getDiscussionById);
router.put('/:id', auth, discussionController.updateDiscussion);
router.delete('/:id', adminAuth, discussionController.deleteDiscussion);
router.post('/:id/toggle-visibility', adminAuth, discussionController.toggleDiscussionVisibility);
router.post('/:id/toggle-pin', adminAuth, discussionController.toggleDiscussionPin);
router.post('/:id/like', auth, discussionController.toggleDiscussionLike);

// 评论路由
router.get('/:id/comments', auth, discussionController.getComments);
router.post('/:id/comments', auth, discussionController.createComment);

export default router;

// 评论操作路由（需要单独导出，因为路径不同）
export const commentRouter = express.Router();
commentRouter.delete('/:id', auth, discussionController.deleteComment);
commentRouter.post('/:id/like', auth, discussionController.toggleCommentLike);

// 题目讨论路由（需要单独导出，因为路径不同）
export const questionDiscussionRouter = express.Router();
questionDiscussionRouter.get('/:id/discussions', auth, discussionController.getQuestionDiscussions);
