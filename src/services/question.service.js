// 题目服务层
// 处理题目的 CRUD 操作、批量导入、批量删除和填空题评分

import { parseOptionsField, parseAnswerField } from '../utils/parsers.js';
import { validateFillInBlankAnswers } from '../utils/validators.js';

/**
 * 获取题目列表
 * @param {Object} db - 数据库实例
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 题目列表
 */
export async function getQuestions(db, options = {}) {
  const { bankId, search } = options;
  
  let rows;
  let params: any[] = [];
  let conditions: string[] = [];
  let paramIdx = 1;
  
  if (bankId) {
    conditions.push(`bank_id = $${paramIdx++}`);
    params.push(bankId);
  }
  
  if (search) {
    conditions.push(`content ILIKE $${paramIdx++}`);
    params.push(`%${search}%`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = bankId ? 'ORDER BY sort_order ASC, id ASC' : 'ORDER BY bank_id ASC, sort_order ASC, id ASC';
  
  rows = await db.getMany(
    `SELECT * FROM questions ${whereClause} ${orderClause} LIMIT 50`,
    params
  );
  
  return (rows || []).map(formatQuestion);
}

/**
 * 获取题目列表（分页）
 * @param {Object} db - 数据库实例
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getQuestionsPaginated(db, options = {}) {
  const { bankId, page = 1, pageSize = 50 } = options;
  
  let where = '';
  let params = [];
  
  if (bankId) {
    where = 'bank_id = $1';
    params = [bankId];
  }
  
  const result = await db.paginate('questions', {
    page,
    pageSize,
    where,
    params,
    orderBy: bankId ? 'sort_order ASC, id ASC' : 'bank_id ASC, sort_order ASC, id ASC'
  });
  
  // 处理返回数据（转换为 camelCase）
  const processedData = result.data.map(formatQuestion);
  
  return {
    data: processedData,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages
    }
  };
}

/**
 * 只获取题目 ID 列表（用于优化）
 * @param {Object} db - 数据库实例
 * @param {Object} options - 查询选项
 * @returns {Promise<Array<string>>} 题目 ID 列表
 */
export async function getQuestionIds(db, options = {}) {
  const { bankId } = options;
  
  let rows;
  
  if (bankId) {
    rows = await db.getMany(
      'SELECT id FROM questions WHERE bank_id = $1 ORDER BY sort_order ASC, id ASC',
      [bankId]
    );
  } else {
    rows = await db.getMany(
      'SELECT id FROM questions ORDER BY bank_id ASC, sort_order ASC, id ASC'
    );
  }
  
  return (rows || []).map(row => row.id);
}

/**
 * 根据 ID 获取题目
 * @param {Object} db - 数据库实例
 * @param {string} questionId - 题目 ID
 * @returns {Promise<Object|null>} 题目对象
 */
export async function getQuestionById(db, questionId) {
  const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [questionId]);
  
  if (!question) {
    return null;
  }
  
  return formatQuestion(question);
}

/**
 * 创建题目
 * @param {Object} db - 数据库实例
 * @param {Object} questionData - 题目数据
 * @returns {Promise<Object>} 创建的题目对象
 */
export async function createQuestion(db, questionData) {
  // 验证填空题
  if (questionData.type === 'FILL_IN_BLANK') {
    if (!questionData.blanks || !Array.isArray(questionData.blanks) || questionData.blanks.length === 0) {
      throw new Error('填空题必须配置空白项');
    }
    for (const blank of questionData.blanks) {
      if (!blank.id || !blank.acceptedAnswers || blank.acceptedAnswers.length === 0) {
        throw new Error('填空项配置不完整');
      }
    }
  }
  
  // 验证简答题
  if (questionData.type === 'SHORT_ANSWER') {
    if (!questionData.referenceAnswer || String(questionData.referenceAnswer).trim() === '') {
      throw new Error('简答题必须提供参考答案');
    }
  }
  
  const id = questionData.id || `q-${Date.now()}`;
  
  // 处理数组和对象字段，确保正确的JSON格式
  const processField = (field) => {
    if (field === null || field === undefined) {
      return null;
    }
    if (Array.isArray(field)) {
      return field.length > 0 ? JSON.stringify(field) : null;
    }
    if (typeof field === 'object') {
      return JSON.stringify(field);
    }
    // 对于字符串和其他基本类型，也需要JSON序列化以符合jsonb格式
    return JSON.stringify(field);
  };
  
  // 使用事务确保数据一致性
  await db.transaction(async (client) => {
    // 插入题目
    await client.query(
      `INSERT INTO questions (
        id, bank_id, type, content, options, answer, explanation, 
        blanks, reference_answer, ai_grading_enabled, tags, chapter
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, $10, $11::jsonb, $12)`,
      [
        id,
        questionData.bankId || '',
        questionData.type || 'SINGLE',
        questionData.content || '',
        processField(questionData.options),
        processField(questionData.answer), // answer也需要处理为JSON
        questionData.explanation || '',
        processField(questionData.blanks),
        questionData.referenceAnswer || null,
        questionData.aiGradingEnabled || false,
        processField(questionData.tags),
        questionData.chapter || null
      ]
    );
    
    // 更新题库题目数量
    if (questionData.bankId) {
      await client.query(
        'UPDATE banks SET question_count = COALESCE(question_count, 0) + 1 WHERE id = $1',
        [questionData.bankId]
      );
    }
    
    // 更新标签使用次数
    if (questionData.tags && Array.isArray(questionData.tags)) {
      for (const tagId of questionData.tags) {
        await client.query(
          'UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1',
          [tagId]
        );
        await client.query(
          'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
      }
    }
  });
  
  return {
    id,
    bankId: questionData.bankId || '',
    type: questionData.type || 'SINGLE',
    content: questionData.content || '',
    options: questionData.options || [],
    answer: questionData.answer || '',
    explanation: questionData.explanation || '',
    blanks: questionData.blanks || null,
    referenceAnswer: questionData.referenceAnswer || null,
    aiGradingEnabled: questionData.aiGradingEnabled || false,
    tags: questionData.tags || null
  };
}

/**
 * 更新题目
 * @param {Object} db - 数据库实例
 * @param {string} questionId - 题目 ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<void>}
 */
export async function updateQuestion(db, questionId, updates) {
  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return;
  }

  // 处理数组和对象字段，确保正确的JSON格式
  const processField = (field, value) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? JSON.stringify(value) : null;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    // 对于字符串和其他基本类型，也需要JSON序列化以符合jsonb格式
    return JSON.stringify(value);
  };

  // 需要JSONB类型转换的字段
  const jsonbFields = ['options', 'blanks', 'tags', 'answer'];

  // 构建SET子句，为JSONB字段添加类型转换
  const setClause = fields.map((k, i) => {
    const placeholder = `$${i + 1}`;
    if (jsonbFields.includes(k)) {
      return `${k} = ${placeholder}::jsonb`;
    }
    return `${k} = ${placeholder}`;
  }).join(', ');

  // 处理值：只对JSONB字段进行JSON序列化
  const values = fields.map(k => {
    if (jsonbFields.includes(k)) {
      return processField(k, updates[k]);
    }
    return updates[k]; // 非JSONB字段直接返回原值
  });

  await db.execute(
    `UPDATE questions SET ${setClause} WHERE id = $${fields.length + 1}`,
    [...values, questionId]
  );
}


/**
 * 删除题目
 * @param {Object} db - 数据库实例
 * @param {string} questionId - 题目 ID
 * @returns {Promise<void>}
 */
export async function deleteQuestion(db, questionId) {
  // 使用事务确保数据一致性
  await db.transaction(async (client) => {
    // 获取题目信息
    const question = await client.query(
      'SELECT bank_id FROM questions WHERE id = $1',
      [questionId]
    );
    
    if (question.rows.length > 0) {
      const bankId = question.rows[0].bank_id;
      
      // 删除题目
      await client.query('DELETE FROM questions WHERE id = $1', [questionId]);
      
      // 更新题库题目数量
      if (bankId) {
        await client.query(
          'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - 1, 0) WHERE id = $1',
          [bankId]
        );
      }
    }
  });
}

/**
 * 批量删除题目
 * @param {Object} db - 数据库实例
 * @param {Array<string>} questionIds - 题目 ID 数组
 * @returns {Promise<number>} 删除的题目数量
 */
export async function batchDeleteQuestions(db, questionIds) {
  if (!questionIds || questionIds.length === 0) {
    return 0;
  }
  
  let deletedCount = 0;
  
  await db.transaction(async (client) => {
    // 获取所有题目的题库 ID
    const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(', ');
    const questions = await client.query(
      `SELECT bank_id FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );
    
    // 统计每个题库的题目数量
    const bankCounts = {};
    questions.rows.forEach(row => {
      if (row.bank_id) {
        bankCounts[row.bank_id] = (bankCounts[row.bank_id] || 0) + 1;
      }
    });
    
    // 删除题目
    const result = await client.query(
      `DELETE FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );
    
    deletedCount = result.rowCount || 0;
    
    // 更新题库题目数量
    for (const [bankId, count] of Object.entries(bankCounts)) {
      await client.query(
        'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - $1, 0) WHERE id = $2',
        [count, bankId]
      );
    }
  });
  
  return deletedCount;
}

/**
 * 批量导入题目
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @param {Array<Object>} questions - 题目数组
 * @returns {Promise<Object>} 导入结果
 */
export async function batchImportQuestions(db, bankId, questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { inserted: 0, skipped: 0, errors: [], questionIds: [] };
  }
  
  let inserted = 0;
  let skipped = 0;
  const errors = [];
  const questionIds = []; // 记录成功导入的题目ID
  
  await db.transaction(async (client) => {
    // 获取当前题库中最大的 sort_order 值
    const maxOrderResult = await client.query(
      'SELECT MAX(sort_order) as max_order FROM questions WHERE bank_id = $1',
      [bankId]
    );
    
    let startOrder = (maxOrderResult.rows[0]?.max_order !== null) 
      ? maxOrderResult.rows[0].max_order + 1 
      : 1;
    
    // 批量插入
    const BATCH_SIZE = 100;
    
    for (let batchStart = 0; batchStart < questions.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, questions.length);
      const batch = questions.slice(batchStart, batchEnd);
      
      const placeholders = [];
      const values = [];
      let paramIndex = 1;
      
      for (let i = 0; i < batch.length; i++) {
        const q = batch[i];
        const rowNum = batchStart + i + 2;
        
        try {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
          const id = q.id || `q-${timestamp}-${random}-${batchStart + i}`;
          const sortOrder = startOrder + batchStart + i;
          
          placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          
          values.push(
            id,
            bankId,
            q.type || 'SINGLE',
            q.content || '',
            JSON.stringify(q.options || []),
            JSON.stringify(q.answer || ''),
            q.explanation || '',
            q.blanks ? JSON.stringify(q.blanks) : null,
            q.referenceAnswer || null,
            q.aiGradingEnabled || false,
            q.tags ? JSON.stringify(q.tags) : null,
            q.chapter || null,
            sortOrder
          );
          
          questionIds.push(id); // 记录题目ID
          inserted++;
        } catch (err) {
          skipped++;
          errors.push(`第${rowNum}行：${err.message}`);
        }
      }
      
      if (placeholders.length > 0) {
        try {
          const sql = `INSERT INTO questions (
            id, bank_id, type, content, options, answer, explanation,
            blanks, reference_answer, ai_grading_enabled, tags, chapter, sort_order
          ) VALUES ${placeholders.join(', ')}`;
          
          await client.query(sql, values);
        } catch (err) {
          // 批量插入失败，回退到逐条插入
          for (let i = 0; i < batch.length; i++) {
            const q = batch[i];
            const rowNum = batchStart + i + 2;
            
            try {
              const timestamp = Date.now();
              const random = Math.floor(Math.random() * 1000000);
              const id = q.id || `q-${timestamp}-${random}-${batchStart + i}`;
              const sortOrder = startOrder + batchStart + i;
              
              await client.query(
                `INSERT INTO questions (
                  id, bank_id, type, content, options, answer, explanation,
                  blanks, reference_answer, ai_grading_enabled, tags, chapter, sort_order
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                  id,
                  bankId,
                  q.type || 'SINGLE',
                  q.content || '',
                  JSON.stringify(q.options || []),
                  JSON.stringify(q.answer || ''),
                  q.explanation || '',
                  q.blanks ? JSON.stringify(q.blanks) : null,
                  q.referenceAnswer || null,
                  q.aiGradingEnabled || false,
                  q.tags ? JSON.stringify(q.tags) : null,
                  q.chapter || null,
                  sortOrder
                ]
              );
              questionIds.push(id); // 记录题目ID
            } catch (rowErr) {
              inserted--;
              skipped++;
              errors.push(`第${rowNum}行：${rowErr.message}`);
            }
          }
        }
      }
    }
    
    // 更新题库题目数量
    if (inserted > 0) {
      await client.query(
        'UPDATE banks SET question_count = COALESCE(question_count, 0) + $1 WHERE id = $2',
        [inserted, bankId]
      );
    }
  });
  
  return { inserted, skipped, errors, questionIds };
}

/**
 * 填空题评分
 * @param {Object} db - 数据库实例
 * @param {string} questionId - 题目 ID
 * @param {Object} userAnswers - 用户答案
 * @returns {Promise<Object>} 评分结果
 */
export async function gradeFillInBlank(db, questionId, userAnswers) {
  if (!questionId || !userAnswers) {
    throw new Error('缺少必要参数');
  }
  
  // 获取题目信息
  const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [questionId]);
  
  if (!question) {
    throw new Error('题目不存在');
  }
  
  if (question.type !== 'FILL_IN_BLANK') {
    throw new Error('该题目不是填空题');
  }
  
  // 解析填空配置
  let blanks;
  try {
    blanks = question.blanks || null;
  } catch (e) {
    throw new Error('填空题配置解析失败');
  }
  
  if (!blanks || !Array.isArray(blanks) || blanks.length === 0) {
    throw new Error('填空题配置无效');
  }
  
  // 使用验证函数计算得分
  const result = validateFillInBlankAnswers(blanks, userAnswers, 100);
  
  return {
    correct: result.correct,
    total: result.total,
    score: result.score,
    percentage: Math.round((result.correct / result.total) * 100),
    details: result.details,
    isAllCorrect: result.correct === result.total
  };
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
