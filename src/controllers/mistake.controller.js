// 错题控制器
// 处理错题相关的 HTTP 请求

import * as mistakeService from '../services/mistake.service.js';
import logger from '../../utils/logger.js';

/**
 * GET /api/mistakes
 * 获取当前用户的错题列表
 */
export async function getMistakes(req, res, next) {
  try {
    logger.debug('[Mistakes] 获取错题列表:', { userId: req.user.id });
    
    const mistakes = await mistakeService.getUserMistakes(req.db, req.user.id);
    
    logger.info('[Mistakes] 错题列表获取成功:', {
      userId: req.user.id,
      count: mistakes.length
    });
    
    res.json(mistakes);
  } catch (error) {
    logger.error('[Mistakes] 获取错题列表失败:', {
      userId: req.user.id,
      error: error.message
    });
    next(error);
  }
}

/**
 * POST /api/mistakes
 * 添加错题到错题集
 */
export async function addMistake(req, res, next) {
  try {
    const { questionId } = req.body || {};
    
    if (!questionId) {
      logger.warn('[Mistakes] 添加错题失败：缺少题目ID', { userId: req.user.id });
      return res.status(400).json({ error: '题目ID不能为空' });
    }
    
    logger.debug('[Mistakes] 添加错题请求:', {
      userId: req.user.id,
      questionId
    });
    
    const result = await mistakeService.addMistake(req.db, req.user.id, questionId);
    
    logger.info('[Mistakes] 错题添加结果:', {
      userId: req.user.id,
      questionId,
      added: result.added
    });
    
    res.json(result);
  } catch (error) {
    logger.error('[Mistakes] 添加错题失败:', {
      userId: req.user.id,
      questionId: req.body?.questionId,
      error: error.message
    });
    next(error);
  }
}
