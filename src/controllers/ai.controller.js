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
    const { page = 1, pageSize = 30, search = '', type = '', bankId = '' } = req.query;
    const result = await aiService.getAllAnalysis({ page, pageSize, search, type, bankId });
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

/**
 * 测试 AI 连接
 */
export async function testConnection(req, res) {
  try {
    const { provider, baseUrl, modelId, apiKey, maxContext, maxTokens } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: '请先填写 API Key' });
    }
    
    // Build test endpoint based on provider
    let testUrl = baseUrl;
    let headers = {};
    
    switch (provider) {
      case 'deepseek':
        testUrl = (baseUrl || 'https://api.deepseek.com') + '/v1/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'openai':
        testUrl = (baseUrl || 'https://api.openai.com/v1') + '/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'gemini':
        testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        break;
      case 'moonshotai':
        testUrl = (baseUrl || 'https://api.moonshot.cn/v1') + '/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'longcat':
        // LongCat doesn't have /models, use chat completions instead
        testUrl = (baseUrl || 'https://api.longcat.chat/openai') + '/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        break;
      case 'openrouter':
        testUrl = (baseUrl || 'https://openrouter.ai/api/v1') + '/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'xiaomimimo':
        testUrl = (baseUrl || 'https://platform.xiaomimimo.com/v1') + '/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      default:
        // For OpenAI-compatible APIs, try /v1/models
        testUrl = (baseUrl || 'https://api.example.com/v1') + '/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    try {
      // For providers using chat completions endpoint, send a minimal POST
      const isChatEndpoint = testUrl.includes('/chat/completions');
      const response = await fetch(testUrl, {
        method: isChatEndpoint ? 'POST' : 'GET',
        headers,
        body: isChatEndpoint ? JSON.stringify({ model: modelId || 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }) : undefined,
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        res.json({ ok: true, message: '连接成功，API 可正常访问' });
      } else if (response.status === 401 || response.status === 403) {
        res.json({ ok: false, message: 'API Key 无效或权限不足' });
      } else {
        const body = await response.text().catch(() => '');
        const short = body.length > 80 ? body.slice(0,80) + '...' : body;
        res.json({ ok: false, message: `服务器返回 ${response.status}${short ? ': ' + short : ''}` });
      }
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        res.json({ ok: false, message: '连接超时（超过30秒）' });
      } else {
        res.json({ ok: false, message: e.message || '网络连接失败' });
      }
    }
  } catch (error) {
    console.error('[AI Test Connection Error]', error);
    res.status(500).json({ error: error.message });
  }
}
