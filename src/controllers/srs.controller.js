/**
 * SRS 控制器
 * 处理 SRS（间隔重复系统）相关的 HTTP 请求
 */

import { getSRSRecords, updateSRSRecord } from '../services/srs.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取用户的 SRS 记录列表
 * GET /api/srs/records
 */
export async function getSRSRecordsController(req, res, next) {
  try {
    const userId = req.user.id;
    
    const records = await getSRSRecords(req.db, userId);
    
    logger.info('[SRS] SRS 记录列表获取成功', {
      userId,
      count: records.length
    });
    
    res.json(records);
  } catch (error) {
    logger.error('[SRS] 获取 SRS 记录列表失败', {
      userId: req.user?.id,
      error: error.message
    });
    next(error);
  }
}

/**
 * 更新 SRS 记录
 * POST /api/srs/records
 */
export async function updateSRSRecordController(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId, level } = req.body || {};
    
    if (!questionId) {
      logger.warn('[SRS] 更新 SRS 记录失败：缺少题目ID', { userId });
      return res.status(400).json({ error: '题目ID不能为空' });
    }
    
    if (!level) {
      logger.warn('[SRS] 更新 SRS 记录失败：缺少难度级别', { userId, questionId });
      return res.status(400).json({ error: '难度级别不能为空' });
    }
    
    if (!['HARD', 'GOOD', 'EASY'].includes(level)) {
      logger.warn('[SRS] 更新 SRS 记录失败：无效的难度级别', { userId, questionId, level });
      return res.status(400).json({ error: '难度级别必须是 HARD、GOOD 或 EASY' });
    }
    
    const record = await updateSRSRecord(req.db, userId, questionId, level);
    
    logger.info('[SRS] SRS 记录更新成功', {
      userId,
      questionId,
      level,
      interval: record.interval
    });
    
    res.json(record);
  } catch (error) {
    logger.error('[SRS] 更新 SRS 记录失败', {
      userId: req.user?.id,
      questionId: req.body?.questionId,
      level: req.body?.level,
      error: error.message
    });
    next(error);
  }
}
