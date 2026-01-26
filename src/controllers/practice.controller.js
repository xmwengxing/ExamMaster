// 练习控制器
// 处理练习相关的 HTTP 请求

import * as practiceService from '../services/practice.service.js';
import * as srsService from '../services/srs.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取用户的练习记录列表
 */
export async function getPracticeRecords(req, res, next) {
  try {
    const records = await practiceService.getPracticeRecords(req.db, req.user.id);
    res.json(records);
  } catch (error) {
    logger.error('[Practice] 获取练习记录失败:', error);
    next(error);
  }
}

/**
 * 根据 ID 获取练习记录
 */
export async function getPracticeRecordById(req, res, next) {
  try {
    const record = await practiceService.getPracticeRecordById(
      req.db,
      req.params.id,
      req.user.id
    );
    
    if (!record) {
      return res.status(404).json({ error: '练习记录不存在' });
    }
    
    res.json(record);
  } catch (error) {
    logger.error('[Practice] 获取练习记录失败:', error);
    next(error);
  }
}

/**
 * 创建练习记录
 */
export async function createPracticeRecord(req, res, next) {
  try {
    const practiceData = {
      id: req.body.id,
      bankId: req.body.bankId,
      bankName: req.body.bankName,
      type: req.body.type,
      questionTypeFilter: req.body.questionTypeFilter,
      mode: req.body.mode,
      count: req.body.count,
      date: req.body.date,
      currentIndex: req.body.currentIndex || 0,
      userAnswers: req.body.userAnswers || {},
      isCustom: req.body.isCustom || false
    };
    
    const practiceId = await practiceService.createPracticeRecord(
      req.db,
      req.user.id,
      practiceData
    );
    
    logger.info('[Practice] 练习记录创建成功:', { practiceId, userId: req.user.id });
    res.json({ success: true, id: practiceId });
  } catch (error) {
    logger.error('[Practice] 创建练习记录失败:', error);
    next(error);
  }
}

/**
 * 更新练习记录
 */
export async function updatePracticeRecord(req, res, next) {
  try {
    const updates = {
      currentIndex: req.body.currentIndex,
      userAnswers: req.body.userAnswers,
      date: req.body.date
    };
    
    const rowCount = await practiceService.updatePracticeRecord(
      req.db,
      req.params.id,
      req.user.id,
      updates
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: '练习记录不存在或无权限' });
    }
    
    logger.info('[Practice] 练习记录更新成功:', { practiceId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Practice] 更新练习记录失败:', error);
    next(error);
  }
}

/**
 * 删除练习记录
 */
export async function deletePracticeRecord(req, res, next) {
  try {
    const success = await practiceService.deletePracticeRecord(
      req.db,
      req.params.id,
      req.user.id
    );
    
    if (!success) {
      return res.status(404).json({ error: '练习记录不存在或无权限' });
    }
    
    logger.info('[Practice] 练习记录删除成功:', { practiceId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Practice] 删除练习记录失败:', error);
    next(error);
  }
}

/**
 * 获取用户的 SRS 记录列表
 */
export async function getSRSRecords(req, res, next) {
  try {
    const records = await srsService.getSRSRecords(req.db, req.user.id);
    res.json(records);
  } catch (error) {
    logger.error('[SRS] 获取 SRS 记录失败:', error);
    next(error);
  }
}

/**
 * 更新 SRS 记录
 */
export async function updateSRSRecord(req, res, next) {
  try {
    const { questionId, level } = req.body;
    
    if (!questionId || !level) {
      return res.status(400).json({ error: 'questionId 和 level 是必需的' });
    }
    
    const record = await srsService.updateSRSRecord(
      req.db,
      req.user.id,
      questionId,
      level
    );
    
    logger.info('[SRS] SRS 记录更新成功:', { userId: req.user.id, questionId, level });
    res.json(record);
  } catch (error) {
    logger.error('[SRS] 更新 SRS 记录失败:', error);
    next(error);
  }
}
