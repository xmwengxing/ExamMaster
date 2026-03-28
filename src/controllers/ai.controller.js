/**
 * AI 模块控制器
 * 处理 AI 相关的 HTTP 请求
 */

import * as aiService from '../services/ai.service.js';

/**
 * 生成 AI 内容
 */
export async function generateContent(req, res) {
  try {
    const { prompt } = req.body;
    const result = await aiService.generateContent(prompt, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[AI Generate Error]', error);
    const status = error.message.includes('未配置') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 保存 AI 解析
 */
export async function saveAnalysis(req, res) {
  try {
    const { questionId, content } = req.body;
    const result = await aiService.saveAnalysis(req.user.id, questionId, content);
    res.json(result);
  } catch (error) {
    console.error('[AI Analysis] Save error:', error);
    const status = error.message.includes('缺少') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * 获取 AI 解析
 */
export async function getAnalysis(req, res) {
  try {
    const result = await aiService.getAnalysis(req.user.id, req.params.questionId);
    res.json(result || null);
  } catch (error) {
    console.error('[Get AI Analysis Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取所有 AI 解析记录（管理员）
 */
export async function getAllAnalysis(req, res) {
  try {
    const { page = 1, pageSize = 30, search = '', type = '' } = req.query;
    const result = await aiService.getAllAnalysis({ page, pageSize, search, type });
    res.json(result);
  } catch (error) {
    console.error('[Get Admin AI Analysis Error]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * AI 评分简答题
 */
export async function gradeAnswer(req, res) {
  try {
    const result = await aiService.gradeAnswer(req.body, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[AI Grade Error]', error);
    const status = error.message.includes('缺少') || error.message.includes('超过限制') || error.message.includes('未配置') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
}
