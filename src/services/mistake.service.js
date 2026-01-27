// 错题服务层
// 处理错题的查询和添加操作

import { parseOptionsField, parseAnswerField } from '../utils/parsers.js';

/**
 * 获取用户的错题列表
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 错题列表（包含完整题目信息）
 */
export async function getUserMistakes(db, userId) {
  // 使用 JOIN 查询获取完整题目信息
  const rows = await db.getMany(
    `SELECT q.* FROM questions q 
     JOIN mistakes m ON q.id = m.question_id 
     WHERE m.user_id = $1
     ORDER BY q.bank_id ASC, q.sort_order ASC, q.id ASC`,
    [userId]
  );
  
  // 转换为 camelCase 格式并解析字段
  return (rows || []).map(formatQuestion);
}

/**
 * 添加错题
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @returns {Promise<Object>} { success: boolean, added: boolean }
 */
export async function addMistake(db, userId, questionId) {
  if (!questionId) {
    throw new Error('题目ID不能为空');
  }
  
  // 检查是否已存在
  const existing = await db.getOne(
    'SELECT * FROM mistakes WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  
  if (existing) {
    // 已存在，不做任何操作（幂等性）
    return { success: true, added: false };
  }
  
  // 插入新记录
  await db.execute(
    'INSERT INTO mistakes (user_id, question_id) VALUES ($1, $2)',
    [userId, questionId]
  );
  
  return { success: true, added: true };
}

/**
 * 格式化题目对象（转换为 camelCase）
 * @param {Object} question - 数据库查询的题目对象
 * @returns {Object} 格式化后的题目对象
 */
function formatQuestion(question) {
  return {
    id: question.id,
    bankId: question.bank_id,
    type: question.type,
    content: question.content,
    options: parseOptionsField(question.options),
    answer: parseAnswerField(question.answer),
    explanation: question.explanation,
    chapter: question.chapter,
    blanks: question.blanks || null,
    referenceAnswer: question.reference_answer,
    aiGradingEnabled: question.ai_grading_enabled || false,
    tags: question.tags || null,
    sortOrder: question.sort_order,
    createdAt: question.created_at,
    updatedAt: question.updated_at
  };
}
