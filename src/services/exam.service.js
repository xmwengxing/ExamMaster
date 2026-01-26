// 考试服务层
// 处理考试管理和考试历史记录的 CRUD 操作

/**
 * 获取考试列表（支持分页）
 * @param {Object} db - 数据库实例
 * @param {Object} options - 查询选项 { page, pageSize }
 * @returns {Promise<Object|Array>} 考试列表或分页结果
 */
export async function getExams(db, options = {}) {
  const { page, pageSize } = options;
  
  // 如果提供了分页参数，使用分页查询
  if (page && pageSize) {
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;
    
    const result = await db.paginate('exams', {
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy: 'created_at DESC'
    });
    
    return {
      data: result.data.map(formatExam),
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    };
  }
  
  // 不使用分页，返回所有数据（保持向后兼容）
  const rows = await db.getMany('SELECT * FROM exams');
  return (rows || []).map(formatExam);
}

/**
 * 根据 ID 获取考试
 * @param {Object} db - 数据库实例
 * @param {string} examId - 考试 ID
 * @returns {Promise<Object|null>} 考试对象
 */
export async function getExamById(db, examId) {
  const exam = await db.getOne('SELECT * FROM exams WHERE id = $1', [examId]);
  
  if (!exam) {
    return null;
  }
  
  return formatExam(exam);
}

/**
 * 创建考试（管理员）
 * @param {Object} db - 数据库实例
 * @param {Object} examData - 考试数据
 * @returns {Promise<string>} 创建的考试 ID
 */
export async function createExam(db, examData) {
  const id = examData.id || `exam-${Date.now()}`;
  
  const sql = `INSERT INTO exams (
    id, bank_id, title, duration, total_score, pass_score, pass_score_percent, 
    strategy, selected_question_ids, status, is_visible, start_time, end_time, 
    single_count, multiple_count, judge_count, fill_blank_count, short_answer_count
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;
  
  await db.execute(sql, [
    id,
    examData.bankId,
    examData.title,
    examData.duration,
    examData.totalScore,
    examData.passScore,
    examData.passScorePercent,
    examData.strategy,
    examData.selectedQuestionIds || [],
    examData.status || 'PENDING',
    examData.isVisible || false,
    examData.startTime || null,
    examData.endTime || null,
    examData.singleCount || 0,
    examData.multipleCount || 0,
    examData.judgeCount || 0,
    examData.fillBlankCount || 0,
    examData.shortAnswerCount || 0
  ]);
  
  return id;
}

/**
 * 更新考试（管理员）
 * @param {Object} db - 数据库实例
 * @param {string} examId - 考试 ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<void>}
 */
export async function updateExam(db, examId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  // 构建动态 SQL
  if (updates.bankId !== undefined) { 
    fields.push(`bank_id = $${paramIndex++}`); 
    values.push(updates.bankId); 
  }
  if (updates.title !== undefined) { 
    fields.push(`title = $${paramIndex++}`); 
    values.push(updates.title); 
  }
  if (updates.duration !== undefined) { 
    fields.push(`duration = $${paramIndex++}`); 
    values.push(updates.duration); 
  }
  if (updates.totalScore !== undefined) { 
    fields.push(`total_score = $${paramIndex++}`); 
    values.push(updates.totalScore); 
  }
  if (updates.passScore !== undefined) { 
    fields.push(`pass_score = $${paramIndex++}`); 
    values.push(updates.passScore); 
  }
  if (updates.passScorePercent !== undefined) { 
    fields.push(`pass_score_percent = $${paramIndex++}`); 
    values.push(updates.passScorePercent); 
  }
  if (updates.strategy !== undefined) { 
    fields.push(`strategy = $${paramIndex++}`); 
    values.push(updates.strategy); 
  }
  if (updates.selectedQuestionIds !== undefined) { 
    fields.push(`selected_question_ids = $${paramIndex++}`); 
    values.push(updates.selectedQuestionIds); 
  }
  if (updates.status !== undefined) { 
    fields.push(`status = $${paramIndex++}`); 
    values.push(updates.status); 
  }
  if (updates.isVisible !== undefined) { 
    fields.push(`is_visible = $${paramIndex++}`); 
    values.push(updates.isVisible); 
  }
  if (updates.startTime !== undefined) { 
    fields.push(`start_time = $${paramIndex++}`); 
    values.push(updates.startTime); 
  }
  if (updates.endTime !== undefined) { 
    fields.push(`end_time = $${paramIndex++}`); 
    values.push(updates.endTime); 
  }
  if (updates.singleCount !== undefined) { 
    fields.push(`single_count = $${paramIndex++}`); 
    values.push(updates.singleCount); 
  }
  if (updates.multipleCount !== undefined) { 
    fields.push(`multiple_count = $${paramIndex++}`); 
    values.push(updates.multipleCount); 
  }
  if (updates.judgeCount !== undefined) { 
    fields.push(`judge_count = $${paramIndex++}`); 
    values.push(updates.judgeCount); 
  }
  if (updates.fillBlankCount !== undefined) { 
    fields.push(`fill_blank_count = $${paramIndex++}`); 
    values.push(updates.fillBlankCount); 
  }
  if (updates.shortAnswerCount !== undefined) { 
    fields.push(`short_answer_count = $${paramIndex++}`); 
    values.push(updates.shortAnswerCount); 
  }
  
  if (fields.length === 0) {
    return; // 没有字段需要更新
  }
  
  values.push(examId);
  
  await db.execute(
    `UPDATE exams SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

/**
 * 删除考试（管理员）
 * @param {Object} db - 数据库实例
 * @param {string} examId - 考试 ID
 * @returns {Promise<void>}
 */
export async function deleteExam(db, examId) {
  await db.execute('DELETE FROM exams WHERE id = $1', [examId]);
}

/**
 * 切换考试可见性（管理员）
 * @param {Object} db - 数据库实例
 * @param {string} examId - 考试 ID
 * @returns {Promise<boolean>} 新的可见性状态
 */
export async function toggleExamVisibility(db, examId) {
  const row = await db.getOne('SELECT is_visible FROM exams WHERE id = $1', [examId]);
  
  if (!row) {
    throw new Error('考试不存在');
  }
  
  const newVisibility = !row.is_visible;
  
  await db.execute('UPDATE exams SET is_visible = $1 WHERE id = $2', [newVisibility, examId]);
  
  return newVisibility;
}

/**
 * 获取用户的考试历史记录
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 考试历史记录列表
 */
export async function getExamHistory(db, userId) {
  const rows = await db.getMany('SELECT * FROM exam_history WHERE user_id = $1', [userId]);
  
  return (rows || []).map(formatExamHistory);
}

/**
 * 获取所有考试历史记录（管理员）
 * @param {Object} db - 数据库实例
 * @returns {Promise<Array>} 所有考试历史记录列表
 */
export async function getAllExamHistory(db) {
  const rows = await db.getMany('SELECT * FROM exam_history ORDER BY submit_time DESC');
  
  return (rows || []).map(formatExamHistory);
}

/**
 * 创建或更新考试历史记录
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @param {Object} recordData - 考试历史记录数据
 * @returns {Promise<string>} 记录 ID
 */
export async function createOrUpdateExamHistory(db, userId, recordData) {
  const id = recordData.id || `exam-${Date.now()}`;
  
  const sql = `INSERT INTO exam_history (
    id, user_id, exam_id, exam_title, score, total_score, pass_score, 
    time_used, submit_time, bank_id, wrong_question_ids, user_answers, 
    passed, current_index, is_finished, exam_config, ordered_question_ids
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, $16::jsonb, $17::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    score = EXCLUDED.score,
    total_score = EXCLUDED.total_score,
    pass_score = EXCLUDED.pass_score,
    time_used = EXCLUDED.time_used,
    submit_time = EXCLUDED.submit_time,
    wrong_question_ids = EXCLUDED.wrong_question_ids,
    user_answers = EXCLUDED.user_answers,
    passed = EXCLUDED.passed,
    current_index = EXCLUDED.current_index,
    is_finished = EXCLUDED.is_finished,
    exam_config = EXCLUDED.exam_config,
    ordered_question_ids = EXCLUDED.ordered_question_ids`;
  
  await db.execute(sql, [
    id,
    userId,
    recordData.examId || null,  // 随机模拟试卷没有 examId，使用 NULL
    recordData.examTitle || '',
    recordData.score || 0,
    recordData.totalScore || 0,
    recordData.passScore || 0,
    recordData.timeUsed || 0,
    recordData.submitTime || new Date().toLocaleString(),
    recordData.bankId || '',
    JSON.stringify(recordData.wrongQuestionIds || []),
    JSON.stringify(recordData.userAnswers || {}),
    recordData.passed || false,
    recordData.currentIndex || 0,
    recordData.isFinished || false,
    recordData.examConfig ? JSON.stringify(recordData.examConfig) : null,
    JSON.stringify(recordData.orderedQuestionIds || [])
  ]);
  
  return id;
}

/**
 * 更新考试历史记录（用于继续未完成的考试）
 * @param {Object} db - 数据库实例
 * @param {string} recordId - 记录 ID
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<void>}
 */
export async function updateExamHistory(db, recordId, userId, updates) {
  const sql = `UPDATE exam_history SET 
    score = $1, total_score = $2, pass_score = $3, time_used = $4, 
    submit_time = $5, wrong_question_ids = $6::jsonb, user_answers = $7::jsonb, 
    passed = $8, current_index = $9, is_finished = $10, exam_config = $11::jsonb, 
    ordered_question_ids = $12::jsonb
  WHERE id = $13 AND user_id = $14`;
  
  await db.execute(sql, [
    updates.score || 0,
    updates.totalScore || 0,
    updates.passScore || 0,
    updates.timeUsed || 0,
    updates.submitTime || new Date().toLocaleString(),
    JSON.stringify(updates.wrongQuestionIds || []),
    JSON.stringify(updates.userAnswers || {}),
    updates.passed || false,
    updates.currentIndex || 0,
    updates.isFinished || false,
    updates.examConfig ? JSON.stringify(updates.examConfig) : null,
    JSON.stringify(updates.orderedQuestionIds || []),
    recordId,
    userId
  ]);
}

/**
 * 删除考试历史记录
 * @param {Object} db - 数据库实例
 * @param {string} recordId - 记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteExamHistory(db, recordId, userId) {
  await db.execute(
    'DELETE FROM exam_history WHERE id = $1 AND user_id = $2',
    [recordId, userId]
  );
}

/**
 * 格式化考试对象（转换为 camelCase）
 * @param {Object} exam - 数据库查询的考试对象
 * @returns {Object} 格式化后的考试对象
 */
function formatExam(exam) {
  return {
    id: exam.id,
    bankId: exam.bank_id,
    title: exam.title,
    duration: exam.duration,
    totalScore: exam.total_score,
    passScore: exam.pass_score,
    passScorePercent: exam.pass_score_percent,
    strategy: exam.strategy,
    selectedQuestionIds: exam.selected_question_ids || [],
    status: exam.status,
    isVisible: exam.is_visible,
    startTime: exam.start_time,
    endTime: exam.end_time,
    singleCount: exam.single_count || 0,
    multipleCount: exam.multiple_count || 0,
    judgeCount: exam.judge_count || 0,
    fillBlankCount: exam.fill_blank_count || 0,
    shortAnswerCount: exam.short_answer_count || 0
  };
}

/**
 * 格式化考试历史记录对象（转换为 camelCase）
 * @param {Object} record - 数据库查询的考试历史记录对象
 * @returns {Object} 格式化后的考试历史记录对象
 */
function formatExamHistory(record) {
  return {
    id: record.id,
    userId: record.user_id,
    examId: record.exam_id,
    examTitle: record.exam_title,
    score: record.score,
    totalScore: record.total_score,
    passScore: record.pass_score,
    timeUsed: record.time_used,
    submitTime: record.submit_time,
    bankId: record.bank_id,
    wrongQuestionIds: record.wrong_question_ids || [],
    userAnswers: record.user_answers || {},
    passed: record.passed,
    currentIndex: record.current_index,
    isFinished: record.is_finished,
    examConfig: record.exam_config,
    orderedQuestionIds: record.ordered_question_ids || []
  };
}
