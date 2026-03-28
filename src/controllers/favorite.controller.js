/**
 * 收藏控制器
 * 处理收藏相关的 HTTP 请求
 */

import { getUserFavorites, toggleFavorite } from '../services/favorite.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取用户的收藏题目列表
 * GET /api/favorites
 */
export async function getFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    
    const favorites = await getUserFavorites(req.db, userId);
    
    logger.info('[Favorites] 收藏列表获取成功', {
      userId,
      count: favorites.length
    });
    
    res.json(favorites);
  } catch (error) {
    logger.error('[Favorites] 获取收藏列表失败', {
      userId: req.user?.id,
      error: error.message
    });
    next(error);
  }
}

/**
 * 切换题目的收藏状态
 * POST /api/favorites/:qId
 */
export async function toggleFavoriteStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const questionId = req.params.qId;
    
    if (!questionId) {
      logger.warn('[Favorites] 切换收藏失败：缺少题目ID', { userId });
      return res.status(400).json({ error: '题目ID不能为空' });
    }
    
    const result = await toggleFavorite(req.db, userId, questionId);
    
    logger.info('[Favorites] 收藏状态切换成功', {
      userId,
      questionId,
      isFavorited: result.isFavorited
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('[Favorites] 切换收藏状态失败', {
      userId: req.user?.id,
      questionId: req.params?.qId,
      error: error.message
    });
    next(error);
  }
}
