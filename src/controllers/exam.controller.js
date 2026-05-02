// 考试控制器
// 处理考试相关的 HTTP 请求

import * as examService from '../services/exam.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取考试列表（支持分页）
 */
export async function getExams(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await examService.getExams(req.db, { page, pageSize });
    res.json(result);
  } catch (error) {
    logger.error('[Exams] 获取考试列表失败:', error);
    next(error);
  }
}

/**
 * 根据 ID 获取考试
 */
export async function getExamById(req, res, next) {
  try {
    const exam = await examService.getExamById(req.db, req.params.id);
    
    if (!exam) {
      return res.status(404).json({ error: '考试不存在' });
    }
    
    res.json(exam);
  } catch (error) {
    logger.error('[Exams] 获取考试失败:', error);
    next(error);
  }
}

/**
 * 创建考试（管理员）
 */
export async function createExam(req, res, next) {
  try {
    const examData = {
      id: req.body.id,
      bankId: req.body.bankId,
      title: req.body.title,
      duration: req.body.duration,
      totalScore: req.body.totalScore,
      passScore: req.body.passScore,
      passScorePercent: req.body.passScorePercent,
      strategy: req.body.strategy,
      selectedQuestionIds: req.body.selectedQuestionIds || [],
      status: req.body.status || 'PENDING',
      isVisible: req.body.isVisible || false,
      startTime: req.body.startTime || null,
      endTime: req.body.endTime || null,
      singleCount: req.body.singleCount || 0,
      multipleCount: req.body.multipleCount || 0,
      judgeCount: req.body.judgeCount || 0,
      fillBlankCount: req.body.fillBlankCount || 0,
      shortAnswerCount: req.body.shortAnswerCount || 0
    };
    
    const examId = await examService.createExam(req.db, examData);
    
    logger.info('[Exams] 考试创建成功:', { examId, title: examData.title });
    res.json({ success: true, id: examId });
  } catch (error) {
    logger.error('[Exams] 创建考试失败:', error);
    next(error);
  }
}

/**
 * 更新考试（管理员）
 */
export async function updateExam(req, res, next) {
  try {
    const updates = {};
    
    // 只更新提供的字段
    if (req.body.bankId !== undefined) updates.bankId = req.body.bankId;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.duration !== undefined) updates.duration = req.body.duration;
    if (req.body.totalScore !== undefined) updates.totalScore = req.body.totalScore;
    if (req.body.passScore !== undefined) updates.passScore = req.body.passScore;
    if (req.body.passScorePercent !== undefined) updates.passScorePercent = req.body.passScorePercent;
    if (req.body.strategy !== undefined) updates.strategy = req.body.strategy;
    if (req.body.selectedQuestionIds !== undefined) updates.selectedQuestionIds = req.body.selectedQuestionIds;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.isVisible !== undefined) updates.isVisible = req.body.isVisible;
    if (req.body.startTime !== undefined) updates.startTime = req.body.startTime;
    if (req.body.endTime !== undefined) updates.endTime = req.body.endTime;
    if (req.body.singleCount !== undefined) updates.singleCount = req.body.singleCount;
    if (req.body.multipleCount !== undefined) updates.multipleCount = req.body.multipleCount;
    if (req.body.judgeCount !== undefined) updates.judgeCount = req.body.judgeCount;
    if (req.body.fillBlankCount !== undefined) updates.fillBlankCount = req.body.fillBlankCount;
    if (req.body.shortAnswerCount !== undefined) updates.shortAnswerCount = req.body.shortAnswerCount;
    
    await examService.updateExam(req.db, req.params.id, updates);
    
    logger.info('[Exams] 考试更新成功:', { examId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Exams] 更新考试失败:', error);
    next(error);
  }
}

/**
 * 删除考试（管理员）
 */
export async function deleteExam(req, res, next) {
  try {
    await examService.deleteExam(req.db, req.params.id);
    
    logger.info('[Exams] 考试删除成功:', { examId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Exams] 删除考试失败:', error);
    next(error);
  }
}

/**
 * 切换考试可见性（管理员）
 */
export async function toggleExamVisibility(req, res, next) {
  try {
    const isVisible = await examService.toggleExamVisibility(req.db, req.params.id);
    
    logger.info('[Exams] 考试可见性切换成功:', { examId: req.params.id, isVisible });
    res.json({ success: true, isVisible });
  } catch (error) {
    logger.error('[Exams] 切换考试可见性失败:', error);
    next(error);
  }
}

/**
 * 获取用户的考试历史记录
 */
export async function getExamHistory(req, res, next) {
  try {
    const history = await examService.getExamHistory(req.db, req.user.id);
    res.json(history);
  } catch (error) {
    logger.error('[Exam History] 获取考试历史失败:', error);
    next(error);
  }
}

/**
 * 获取所有考试历史记录（管理员）
 */
export async function getAllExamHistory(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const history = await examService.getAllExamHistory(req.db, { page, pageSize });
    res.json(history);
  } catch (error) {
    logger.error('[Exam History] 获取所有考试历史失败:', error);
    next(error);
  }
}

/**
 * 创建或更新考试历史记录
 */
export async function createOrUpdateExamHistory(req, res, next) {
  try {
    const recordData = {
      id: req.body.id,
      examId: req.body.examId,
      examTitle: req.body.examTitle,
      score: req.body.score,
      totalScore: req.body.totalScore,
      passScore: req.body.passScore,
      timeUsed: req.body.timeUsed,
      submitTime: req.body.submitTime,
      bankId: req.body.bankId,
      wrongQuestionIds: req.body.wrongQuestionIds || [],
      userAnswers: req.body.userAnswers || {},
      passed: req.body.passed || false,
      currentIndex: req.body.currentIndex || 0,
      isFinished: req.body.isFinished || false,
      examConfig: req.body.examConfig,
      orderedQuestionIds: req.body.orderedQuestionIds || []
    };
    
    const recordId = await examService.createOrUpdateExamHistory(
      req.db,
      req.user.id,
      recordData
    );
    
    logger.info('[Exam History] 考试历史记录保存成功:', { recordId, userId: req.user.id });
    res.json({ success: true, id: recordId });
  } catch (error) {
    logger.error('[Exam History] 保存考试历史失败:', error);
    next(error);
  }
}

/**
 * 更新考试历史记录
 */
export async function updateExamHistory(req, res, next) {
  try {
    const updates = {
      score: req.body.score,
      totalScore: req.body.totalScore,
      passScore: req.body.passScore,
      timeUsed: req.body.timeUsed,
      submitTime: req.body.submitTime,
      wrongQuestionIds: req.body.wrongQuestionIds || [],
      userAnswers: req.body.userAnswers || {},
      passed: req.body.passed || false,
      currentIndex: req.body.currentIndex || 0,
      isFinished: req.body.isFinished || false,
      examConfig: req.body.examConfig,
      orderedQuestionIds: req.body.orderedQuestionIds || []
    };
    
    await examService.updateExamHistory(
      req.db,
      req.params.id,
      req.user.id,
      updates
    );
    
    logger.info('[Exam History] 考试历史记录更新成功:', { recordId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Exam History] 更新考试历史失败:', error);
    next(error);
  }
}

/**
 * 删除考试历史记录
 */
export async function deleteExamHistory(req, res, next) {
  try {
    await examService.deleteExamHistory(req.db, req.params.id, req.user.id);
    
    logger.info('[Exam History] 考试历史记录删除成功:', { recordId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Exam History] 删除考试历史失败:', error);
    next(error);
  }
}
