// 题目控制器
// 处理题目相关的 HTTP 请求

import * as questionService from '../services/question.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取题目列表
 * 支持分页和按题库筛选
 */
export async function getQuestions(req, res, next) {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const { bankId, search, page, pageSize, idsOnly } = req.query;
    
    // 如果只请求 ID 列表（用于优化）
    if (idsOnly === 'true') {
      const ids = await questionService.getQuestionIds(req.db, { bankId });
      return res.json({ ids });
    }
    
    // 如果提供了分页参数，使用分页查询
    if (page && pageSize) {
      const result = await questionService.getQuestionsPaginated(req.db, {
        bankId,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      return res.json(result);
    }
    
    // 否则返回所有题目（向后兼容）
    const result = await questionService.getQuestions(req.db, { bankId, search });
    res.json(result);
  } catch (error) {
    logger.error('[Questions] 获取题目列表失败:', error);
    next(error);
  }
}

/**
 * 根据 ID 获取题目
 */
export async function getQuestionById(req, res, next) {
  try {
    const question = await questionService.getQuestionById(req.db, req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    res.json(question);
  } catch (error) {
    logger.error('[Questions] 获取题目失败:', error);
    next(error);
  }
}

/**
 * 创建题目（管理员）
 */
export async function createQuestion(req, res, next) {
  try {
    const q = req.body;
    
    logger.info('[Questions] 创建题目请求:', {
      user: req.user && { id: req.user.id, role: req.user.role },
      bankId: q?.bankId,
      type: q?.type,
      contentPreview: String(q?.content || '').slice(0, 64)
    });
    
    const questionData = {
      id: q.id,
      bankId: q.bankId,
      type: q.type,
      content: q.content,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      blanks: q.blanks,
      referenceAnswer: q.referenceAnswer,
      aiGradingEnabled: q.aiGradingEnabled,
      tags: q.tags,
      chapter: q.chapter
    };
    
    const result = await questionService.createQuestion(req.db, questionData);
    
    logger.info('[Questions] 题目创建成功:', { questionId: result.id });
    res.json({ success: true, id: result.id });
  } catch (error) {
    logger.error('[Questions] 创建题目失败:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 更新题目（管理员）
 */
export async function updateQuestion(req, res, next) {
  try {
    const body = req.body;
    const updates = {};
    
    // 只更新提供的字段
    if (body.type !== undefined) updates.type = body.type;
    if (body.content !== undefined) updates.content = body.content;
    if (body.options !== undefined) updates.options = body.options;
    if (body.answer !== undefined) updates.answer = body.answer;
    if (body.explanation !== undefined) updates.explanation = body.explanation;
    if (body.chapter !== undefined) updates.chapter = body.chapter;
    if (body.blanks !== undefined) updates.blanks = body.blanks;
    if (body.referenceAnswer !== undefined) updates.reference_answer = body.referenceAnswer;
    if (body.aiGradingEnabled !== undefined) updates.ai_grading_enabled = body.aiGradingEnabled;
    if (body.tags !== undefined) updates.tags = body.tags;
    
    await questionService.updateQuestion(req.db, req.params.id, updates);
    
    logger.info('[Questions] 题目更新成功:', { questionId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Questions] 更新题目失败:', error);
    next(error);
  }
}

/**
 * 删除题目（管理员）
 */
export async function deleteQuestion(req, res, next) {
  try {
    await questionService.deleteQuestion(req.db, req.params.id);
    
    logger.info('[Questions] 题目删除成功:', { questionId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Questions] 删除题目失败:', error);
    next(error);
  }
}

/**
 * 批量删除题目（管理员）
 */
export async function batchDeleteQuestions(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要删除的题目ID列表' });
    }
    
    const deletedCount = await questionService.batchDeleteQuestions(req.db, ids);
    
    logger.info('[Questions] 批量删除成功:', { count: deletedCount });
    res.json({ success: true, deletedCount });
  } catch (error) {
    logger.error('[Questions] 批量删除失败:', error);
    next(error);
  }
}

/**
 * 批量导入题目（管理员）
 */
export async function batchImportQuestions(req, res, next) {
  try {
    const bankId = req.params.id;
    const { questions } = req.body;
    
    logger.info('[Import] 批量导入请求:', {
      bankId,
      count: questions?.length || 0
    });
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: '请提供题目数组' });
    }
    
    const result = await questionService.batchImportQuestions(req.db, bankId, questions);
    
    logger.info('[Import] 导入完成:', result);
    res.json({
      success: true,
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors,
      questionIds: result.questionIds // 返回导入的题目ID列表，用于撤销功能
    });
  } catch (error) {
    logger.error('[Import] 导入失败:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 填空题评分
 */
export async function gradeFillInBlank(req, res, next) {
  try {
    const { questionId, userAnswers } = req.body;
    
    if (!questionId || !userAnswers) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const result = await questionService.gradeFillInBlank(req.db, questionId, userAnswers);
    
    res.json(result);
  } catch (error) {
    logger.error('[Grade] 填空题评分失败:', error);
    res.status(500).json({ error: error.message });
  }
}

