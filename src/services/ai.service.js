/**
 * AI 模块服务层
 * 处理 AI 生成、解析和评分的业务逻辑
 */

import db from '../../db.js';

/**
 * 获取 API Key（优先使用用户的，否则使用系统的）
 * @param {string} userId - 用户ID
 * @returns {Promise<string|null>} API Key
 */
async function getApiKey(userId) {
  // 获取用户的 API Key
  const userResult = await db.getOne(
    'SELECT deepseek_api_key FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult && userResult.deepseek_api_key) {
    return userResult.deepseek_api_key;
  }
  
  // 获取系统的全局 API Key
  const configResult = await db.getOne(
    "SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'"
  );
  
  return configResult?.value || null;
}

/**
 * 调用 DeepSeek API 生成内容
 * @param {string} prompt - 提示词
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 生成结果
 */
export async function generateContent(prompt, userId) {
  const apiKey = await getApiKey(userId);
  
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key');
  }
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位专业的教育助手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'DeepSeek API 调用失败');
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  
  return { text };
}

/**
 * 保存 AI 解析内容
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @param {string} content - 解析内容
 * @returns {Promise<Object>} 保存结果
 */
export async function saveAnalysis(userId, questionId, content) {
  if (!questionId || !content) {
    throw new Error('缺少必要参数');
  }
  
  const now = new Date().toISOString();
  
  await db.execute(
    `INSERT INTO ai_analysis (user_id, question_id, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, question_id) DO UPDATE SET
       content = EXCLUDED.content,
       updated_at = EXCLUDED.updated_at`,
    [userId, questionId, content, now, now]
  );
  
  return { success: true };
}

/**
 * 获取 AI 解析内容
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @returns {Promise<Object|null>} 解析内容
 */
export async function getAnalysis(userId, questionId) {
  const result = await db.getOne(
    'SELECT * FROM ai_analysis WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  
  return result || null;
}

/**
 * 获取所有 AI 解析记录（管理员）
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} [options.search] - 搜索关键词
 * @param {string} [options.type] - 题目类型
 * @returns {Promise<Object>} 解析记录列表和分页信息
 */
export async function getAllAnalysis(options) {
  const { page = 1, pageSize = 30, search = '', type = '' } = options;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  // 构建查询条件
  let whereClause = '1=1';
  const params = [];
  let paramIndex = 1;
  
  if (search) {
    whereClause += ` AND (q.content LIKE $${paramIndex} OR u.nickname LIKE $${paramIndex + 1} OR u.real_name LIKE $${paramIndex + 2})`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
    paramIndex += 3;
  }
  
  if (type && type !== 'ALL') {
    whereClause += ` AND q.type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }
  
  // 获取总数
  const countResult = await db.getOne(
    `SELECT COUNT(*) as total
     FROM ai_analysis a
     JOIN questions q ON a.question_id = q.id
     JOIN users u ON a.user_id = u.id
     WHERE ${whereClause}`,
    params
  );
  
  // 获取分页数据
  params.push(parseInt(pageSize), offset);
  const records = await db.getMany(
    `SELECT
       a.user_id as "userId",
       a.question_id as "questionId",
       a.content,
       a.created_at as "createdAt",
       a.updated_at as "updatedAt",
       u.nickname as "userName",
       u.real_name as "userRealName",
       q.type as "questionType",
       q.content as "questionContent",
       q.bank_id as "bankId"
     FROM ai_analysis a
     JOIN questions q ON a.question_id = q.id
     JOIN users u ON a.user_id = u.id
     WHERE ${whereClause}
     ORDER BY a.updated_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );
  
  return {
    records: records || [],
    total: countResult.total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(countResult.total / parseInt(pageSize))
  };
}

/**
 * AI 评分简答题
 * @param {Object} gradeData - 评分数据
 * @param {string} gradeData.questionId - 题目ID
 * @param {string} gradeData.userAnswer - 用户答案
 * @param {string} gradeData.referenceAnswer - 参考答案
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 评分结果
 */
export async function gradeAnswer(gradeData, userId) {
  const { questionId, userAnswer, referenceAnswer } = gradeData;
  
  if (!userAnswer || !referenceAnswer) {
    throw new Error('缺少必要参数');
  }
  
  // 限制答案长度
  if (userAnswer.length > 5000) {
    throw new Error('答案长度超过限制（最多5000字符）');
  }
  
  const apiKey = await getApiKey(userId);
  
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key');
  }
  
  // 构建评分提示词
  const prompt = `你是一位专业的教师，请评估学生的简答题答案。

参考答案：
${referenceAnswer}

学生答案：
${userAnswer}

请按以下格式返回评分结果（JSON格式）：
{
  "score": 85,
  "feedback": "答案整体正确，要点完整...",
  "suggestions": ["建议1", "建议2"]
}

评分标准：
- 90-100分：答案完整准确，表述清晰
- 80-89分：答案基本正确，有小瑕疵
- 70-79分：答案部分正确，遗漏要点
- 60-69分：答案不够完整，理解有偏差
- 60分以下：答案错误或严重偏离主题`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'DeepSeek API 调用失败');
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  
  // 尝试解析JSON结果
  try {
    return JSON.parse(text);
  } catch (e) {
    // 如果不是JSON格式，返回原始文本
    return {
      score: 0,
      feedback: text,
      suggestions: []
    };
  }
}
