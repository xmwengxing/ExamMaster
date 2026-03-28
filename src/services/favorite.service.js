/**
 * 收藏服务
 * 处理题目收藏相关的业务逻辑
 */

import { parseOptionsField, parseAnswerField } from '../utils/parsers.js';

/**
 * 格式化题目数据为 camelCase
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
    answer: parseAnswerField(question.answer, question.type),
    explanation: question.explanation,
    chapter: question.chapter,
    blanks: question.blanks,
    referenceAnswer: question.reference_answer,
    aiGradingEnabled: question.ai_grading_enabled,
    tags: question.tags,
    sortOrder: question.sort_order,
    createdAt: question.created_at,
    updatedAt: question.updated_at
  };
}

/**
 * 获取用户的收藏题目列表
 * @param {Object} db - 数据库连接对象
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 收藏的题目列表
 */
export async function getUserFavorites(db, userId) {
  const query = `
    SELECT q.*
    FROM favorites f
    JOIN questions q ON f.question_id = q.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;
  
  const questions = await db.getMany(query, [userId]);
  return questions.map(formatQuestion);
}

/**
 * 切换题目的收藏状态
 * 如果已收藏则取消收藏，如果未收藏则添加收藏
 * @param {Object} db - 数据库连接对象
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @returns {Promise<Object>} 操作结果 { isFavorited: boolean }
 */
export async function toggleFavorite(db, userId, questionId) {
  // 检查是否已收藏
  const existing = await db.getOne(
    'SELECT * FROM favorites WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  
  if (existing) {
    // 已收藏，执行取消收藏
    await db.execute(
      'DELETE FROM favorites WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );
    return { isFavorited: false };
  } else {
    // 未收藏，执行添加收藏
    await db.execute(
      'INSERT INTO favorites (user_id, question_id) VALUES ($1, $2)',
      [userId, questionId]
    );
    return { isFavorited: true };
  }
}
