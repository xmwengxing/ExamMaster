/**
 * 讨论模块控制器
 * 处理讨论相关的 HTTP 请求
 */

import * as discussionService from '../services/discussion.service.js';

/**
 * 获取讨论列表
 */
export async function getDiscussions(req, res) {
  try {
    const { page = 1, limit = 20, questionId, sortBy = 'latest' } = req.query;
    const isAdmin = req.user && req.user.role === 'ADMIN';
    
    const result = await discussionService.getDiscussions({
      page,
      limit,
      questionId,
      sortBy,
      isAdmin
    });
    
    res.json(result);
  } catch (error) {
    console.error('[Get Discussions Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取讨论详情
 */
export async function getDiscussionById(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const discussion = await discussionService.getDiscussionById(req.params.id, isAdmin);
    res.json({ discussion });
  } catch (error) {
    console.error('[Get Discussion Error]', error);
    const status = error.message === '讨论不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 创建讨论
 */
export async function createDiscussion(req, res) {
  try {
    const result = await discussionService.createDiscussion(req.body, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[Create Discussion Error]', error);
    const status = error.message.includes('不能为空') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 更新讨论
 */
export async function updateDiscussion(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const result = await discussionService.updateDiscussion(
      req.params.id,
      req.body,
      req.user.id,
      isAdmin
    );
    res.json(result);
  } catch (error) {
    console.error('[Update Discussion Error]', error);
    let status = 500;
    if (error.message === '讨论不存在') status = 404;
    else if (error.message.includes('无权限')) status = 403;
    else if (error.message.includes('不能为空') || error.message.includes('没有要更新')) status = 400;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 删除讨论（管理员）
 */
export async function deleteDiscussion(req, res) {
  try {
    const result = await discussionService.deleteDiscussion(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Delete Discussion Error]', error);
    const status = error.message === '讨论不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 切换讨论可见性（管理员）
 */
export async function toggleDiscussionVisibility(req, res) {
  try {
    const result = await discussionService.toggleDiscussionVisibility(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Toggle Discussion Visibility Error]', error);
    const status = error.message === '讨论不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 切换讨论置顶（管理员）
 */
export async function toggleDiscussionPin(req, res) {
  try {
    const result = await discussionService.toggleDiscussionPin(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Toggle Discussion Pin Error]', error);
    const status = error.message === '讨论不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 获取题目相关讨论
 */
export async function getQuestionDiscussions(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const discussions = await discussionService.getQuestionDiscussions(req.params.id, isAdmin);
    res.json(discussions);
  } catch (error) {
    console.error('[Get Question Discussions Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取讨论的评论
 */
export async function getComments(req, res) {
  try {
    const comments = await discussionService.getComments(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('[Get Comments Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 创建评论
 */
export async function createComment(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const result = await discussionService.createComment(
      req.params.id,
      req.body,
      req.user.id,
      isAdmin
    );
    res.json(result);
  } catch (error) {
    console.error('[Create Comment Error]', error);
    let status = 500;
    if (error.message.includes('不存在')) status = 404;
    else if (error.message.includes('不能为空') || error.message.includes('无法')) status = 400;
    else if (error.message.includes('无法在此讨论中评论')) status = 403;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 删除评论
 */
export async function deleteComment(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const result = await discussionService.deleteComment(req.params.id, req.user.id, isAdmin);
    res.json(result);
  } catch (error) {
    console.error('[Delete Comment Error]', error);
    let status = 500;
    if (error.message === '评论不存在') status = 404;
    else if (error.message.includes('无权限')) status = 403;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 切换讨论点赞
 */
export async function toggleDiscussionLike(req, res) {
  try {
    const result = await discussionService.toggleDiscussionLike(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[Like Discussion Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 切换评论点赞
 */
export async function toggleCommentLike(req, res) {
  try {
    const result = await discussionService.toggleCommentLike(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[Like Comment Error]', error);
    const status = error.message === '评论不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}
