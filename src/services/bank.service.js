// 题库服务层
// 处理题库的 CRUD 操作和分值配置

/**
 * 获取所有题库列表
 * @param {Object} db - 数据库实例
 * @returns {Promise<Array>} 题库列表（camelCase格式）
 */
export async function getAllBanks(db) {
  const rows = await db.getMany('SELECT * FROM banks');
  
  return (rows || []).map(bank => ({
    id: bank.id,
    name: bank.name,
    category: bank.category,
    level: bank.level,
    description: bank.description,
    questionCount: bank.question_count || 0,
    scoreConfig: bank.score_config || { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 },
    usageCount: bank.usage_count || 0,
    updatedAt: bank.updated_at // 添加更新时间戳
  }));
}

/**
 * 根据 ID 获取题库
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @returns {Promise<Object|null>} 题库对象（camelCase格式）
 */
export async function getBankById(db, bankId) {
  const bank = await db.getOne('SELECT * FROM banks WHERE id = $1', [bankId]);
  
  if (!bank) {
    return null;
  }
  
  return {
    id: bank.id,
    name: bank.name,
    category: bank.category,
    level: bank.level,
    description: bank.description,
    questionCount: bank.question_count || 0,
    scoreConfig: bank.score_config || { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 },
    usageCount: bank.usage_count || 0
  };
}

/**
 * 创建题库
 * @param {Object} db - 数据库实例
 * @param {Object} bankData - 题库数据
 * @returns {Promise<string>} 创建的题库 ID
 */
export async function createBank(db, bankData) {
  const id = bankData.id || `bank-${Date.now()}`;
  
  await db.execute(
    `INSERT INTO banks (id, name, category, level, description, question_count, score_config, usage_count) 
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      id,
      bankData.name || '',
      bankData.category || '',
      bankData.level || '',
      bankData.description || '',
      bankData.questionCount || 0,
      JSON.stringify(bankData.scoreConfig || {}),
      bankData.usageCount || 0
    ]
  );
  
  return id;
}

/**
 * 更新题库
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @param {Object} updates - 要更新的字段（snake_case格式）
 * @returns {Promise<void>}
 */
export async function updateBank(db, bankId, updates) {
  const fields = Object.keys(updates);
  
  if (fields.length === 0) {
    return;
  }
  
  const setClause = fields.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = fields.map(k => {
    return typeof updates[k] === 'object' ? JSON.stringify(updates[k]) : updates[k];
  });
  
  await db.execute(
    `UPDATE banks SET ${setClause} WHERE id = $${fields.length + 1}`,
    [...values, bankId]
  );
}

/**
 * 删除题库
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @returns {Promise<void>}
 */
export async function deleteBank(db, bankId) {
  // PostgreSQL 的外键约束会自动删除关联的题目（ON DELETE CASCADE）
  await db.execute('DELETE FROM banks WHERE id = $1', [bankId]);
}

/**
 * 更新题库分值配置
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @param {Object} scoreConfig - 分值配置对象
 * @returns {Promise<void>}
 */
export async function updateBankScoreConfig(db, bankId, scoreConfig) {
  // 验证 scoreConfig 格式
  if (!scoreConfig || typeof scoreConfig !== 'object') {
    throw new Error('无效的分值配置');
  }
  
  // JSONB字段需要显式转换为JSON字符串
  await db.execute(
    'UPDATE banks SET score_config = $1::jsonb WHERE id = $2',
    [JSON.stringify(scoreConfig), bankId]
  );
}

/**
 * 增加题库题目数量
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @param {number} count - 增加的数量（默认为 1）
 * @returns {Promise<void>}
 */
export async function incrementBankQuestionCount(db, bankId, count = 1) {
  await db.execute(
    'UPDATE banks SET question_count = COALESCE(question_count, 0) + $1 WHERE id = $2',
    [count, bankId]
  );
}

/**
 * 减少题库题目数量
 * @param {Object} db - 数据库实例
 * @param {string} bankId - 题库 ID
 * @param {number} count - 减少的数量（默认为 1）
 * @returns {Promise<void>}
 */
export async function decrementBankQuestionCount(db, bankId, count = 1) {
  await db.execute(
    'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - $1, 0) WHERE id = $2',
    [count, bankId]
  );
}
