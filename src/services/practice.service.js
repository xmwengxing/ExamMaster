// 练习服务层
// 处理练习记录的 CRUD 操作

/**
 * 获取用户的练习记录列表
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 练习记录列表
 */
export async function getPracticeRecords(db, userId) {
  const rows = await db.getMany(
    'SELECT * FROM practice_records WHERE user_id = $1',
    [userId]
  );
  
  // 转换字段名为 camelCase
  return (rows || []).map(formatPracticeRecord);
}

/**
 * 根据 ID 获取练习记录
 * @param {Object} db - 数据库实例
 * @param {string} practiceId - 练习记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object|null>} 练习记录对象
 */
export async function getPracticeRecordById(db, practiceId, userId) {
  const record = await db.getOne(
    'SELECT * FROM practice_records WHERE id = $1 AND user_id = $2',
    [practiceId, userId]
  );
  
  if (!record) {
    return null;
  }
  
  return formatPracticeRecord(record);
}

/**
 * 创建练习记录
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @param {Object} practiceData - 练习数据
 * @returns {Promise<string>} 创建的练习记录 ID
 */
export async function createPracticeRecord(db, userId, practiceData) {
  const id = practiceData.id || `practice-${Date.now()}`;
  
  const sql = `INSERT INTO practice_records (
    id, user_id, bank_id, bank_name, type, question_type_filter, 
    mode, count, date, current_index, user_answers, is_custom,
    custom_counts, selected_chapters, strategy
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13::jsonb, $14::jsonb, $15)`;
  
  await db.execute(sql, [
    id,
    userId,
    practiceData.bankId,
    practiceData.bankName,
    practiceData.type,
    practiceData.questionTypeFilter,
    practiceData.mode,
    practiceData.count,
    practiceData.date,
    practiceData.currentIndex || 0,
    JSON.stringify(practiceData.userAnswers || {}),
    practiceData.isCustom || false,
    practiceData.customCounts ? JSON.stringify(practiceData.customCounts) : null,
    practiceData.selectedChapters ? JSON.stringify(practiceData.selectedChapters) : null,
    practiceData.strategy || null
  ]);
  
  return id;
}

/**
 * 更新练习记录
 * @param {Object} db - 数据库实例
 * @param {string} practiceId - 练习记录 ID
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<number>} 影响的行数
 */
export async function updatePracticeRecord(db, practiceId, userId, updates) {
  const { currentIndex, userAnswers, date } = updates;
  const updateDate = date || new Date().toLocaleString();
  
  const result = await db.execute(
    `UPDATE practice_records 
     SET current_index = $1, user_answers = $2::jsonb, date = $3 
     WHERE id = $4 AND user_id = $5`,
    [currentIndex, JSON.stringify(userAnswers || {}), updateDate, practiceId, userId]
  );
  
  return result.rowCount || 0;
}

/**
 * 删除练习记录
 * @param {Object} db - 数据库实例
 * @param {string} practiceId - 练习记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deletePracticeRecord(db, practiceId, userId) {
  // 验证记录所有权
  const record = await db.getOne(
    'SELECT * FROM practice_records WHERE id = $1 AND user_id = $2',
    [practiceId, userId]
  );
  
  if (!record) {
    return false;
  }
  
  // 删除记录
  await db.execute(
    'DELETE FROM practice_records WHERE id = $1 AND user_id = $2',
    [practiceId, userId]
  );
  
  return true;
}

/**
 * 格式化练习记录对象（转换为 camelCase）
 * @param {Object} record - 数据库查询的练习记录对象
 * @returns {Object} 格式化后的练习记录对象
 */
function formatPracticeRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    bankId: record.bank_id,
    bankName: record.bank_name,
    type: record.type,
    questionTypeFilter: record.question_type_filter,
    mode: record.mode,
    count: record.count,
    date: record.date,
    currentIndex: record.current_index,
    userAnswers: record.user_answers || {},
    isCustom: record.is_custom || false,
    customCounts: record.custom_counts,
    selectedChapters: record.selected_chapters,
    strategy: record.strategy
  };
}

