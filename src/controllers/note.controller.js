/**
 * 笔记控制器
 * 处理笔记相关的 HTTP 请求
 */

import { saveNote, getNote } from '../services/note.service.js';
import logger from '../../utils/logger.js';

/**
 * 保存或更新题目笔记
 * POST /api/notes
 */
export async function saveNoteController(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId, content } = req.body || {};
    
    if (!questionId) {
      logger.warn('[Notes] 保存笔记失败：缺少题目ID', { userId });
      return res.status(400).json({ error: '题目ID不能为空' });
    }
    
    const result = await saveNote(req.db, userId, questionId, content);
    
    logger.info('[Notes] 笔记保存成功', {
      userId,
      questionId,
      deleted: result.deleted
    });
    
    res.json(result);
  } catch (error) {
    logger.error('[Notes] 保存笔记失败', {
      userId: req.user?.id,
      questionId: req.body?.questionId,
      error: error.message
    });
    next(error);
  }
}

/**
 * 获取题目笔记
 * GET /api/notes/:qId
 */
export async function getNoteController(req, res, next) {
  try {
    const userId = req.user.id;
    const questionId = req.params.qId;
    
    if (!questionId) {
      logger.warn('[Notes] 获取笔记失败：缺少题目ID', { userId });
      return res.status(400).json({ error: '题目ID不能为空' });
    }
    
    const note = await getNote(req.db, userId, questionId);
    
    if (!note) {
      logger.debug('[Notes] 笔记不存在', { userId, questionId });
      return res.json({ content: null });
    }
    
    logger.info('[Notes] 笔记获取成功', {
      userId,
      questionId
    });
    
    res.json(note);
  } catch (error) {
    logger.error('[Notes] 获取笔记失败', {
      userId: req.user?.id,
      questionId: req.params?.qId,
      error: error.message
    });
    next(error);
  }
}
