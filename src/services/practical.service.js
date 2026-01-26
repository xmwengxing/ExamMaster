/**
 * 实操模块服务层
 * 处理实操任务和记录的业务逻辑
 */

import db from '../../db.js';

/**
 * 获取所有实操任务
 * @returns {Promise<Array>} 实操任务列表
 */
export async function getPracticalTasks() {
  const rows = await db.getMany('SELECT * FROM practical_tasks ORDER BY created_at DESC');
  
  // 转换字段名为驼峰命名
  return (rows || []).map(row => ({
    id: row.id,
    title: row.title,
    parts: row.parts || [],
    createdAt: row.created_at
  }));
}

/**
 * 创建实操任务（管理员）
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.title - 任务标题
 * @param {Array} taskData.parts - 任务部分列表
 * @param {string} [taskData.id] - 任务ID（可选）
 * @param {string} [taskData.createdAt] - 创建时间（可选）
 * @returns {Promise<Object>} 创建结果
 */
export async function createPracticalTask(taskData) {
  const id = taskData.id || `pt-${Date.now()}`;
  const createdAt = taskData.createdAt || new Date().toLocaleString();
  
  await db.execute(
    'INSERT INTO practical_tasks (id, title, parts, created_at) VALUES ($1, $2, $3::jsonb, $4)',
    [id, taskData.title || '', JSON.stringify(taskData.parts || []), createdAt]
  );
  
  return { success: true, id };
}

/**
 * 更新实操任务（管理员）
 * @param {string} taskId - 任务ID
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.title - 任务标题
 * @param {Array} taskData.parts - 任务部分列表
 * @returns {Promise<Object>} 更新结果
 */
export async function updatePracticalTask(taskId, taskData) {
  await db.execute(
    'UPDATE practical_tasks SET title = $1, parts = $2::jsonb WHERE id = $3',
    [taskData.title || '', JSON.stringify(taskData.parts || []), taskId]
  );
  
  return { success: true };
}

/**
 * 删除实操任务（管理员）
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deletePracticalTask(taskId) {
  await db.execute('DELETE FROM practical_tasks WHERE id = $1', [taskId]);
  return { success: true };
}

/**
 * 获取实操记录
 * @param {string} userId - 用户ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Array>} 实操记录列表
 */
export async function getPracticalRecords(userId, isAdmin = false) {
  let rows;
  
  if (isAdmin) {
    // 管理员可以看到所有记录
    rows = await db.getMany('SELECT * FROM practical_records ORDER BY submitted_at DESC');
  } else {
    // 学员只能看到自己的记录
    rows = await db.getMany(
      'SELECT * FROM practical_records WHERE user_id = $1 ORDER BY submitted_at DESC',
      [userId]
    );
  }
  
  // 转换字段名为驼峰命名
  return (rows || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    answers: row.answers || {},
    submittedAt: row.submitted_at
  }));
}

/**
 * 创建实操记录
 * @param {Object} recordData - 记录数据
 * @param {string} recordData.userId - 用户ID
 * @param {string} recordData.taskId - 任务ID
 * @param {Object} recordData.answers - 答案对象
 * @param {string} [recordData.id] - 记录ID（可选）
 * @param {string} [recordData.submittedAt] - 提交时间（可选）
 * @returns {Promise<Object>} 创建结果
 */
export async function createPracticalRecord(recordData) {
  const id = recordData.id || `ptr-${Date.now()}`;
  const submittedAt = recordData.submittedAt || new Date().toLocaleString();
  
  await db.execute(
    'INSERT INTO practical_records (id, user_id, task_id, answers, submitted_at) VALUES ($1, $2, $3, $4::jsonb, $5)',
    [
      id,
      recordData.userId,
      recordData.taskId || '',
      JSON.stringify(recordData.answers || {}),
      submittedAt
    ]
  );
  
  return { success: true, id };
}

/**
 * 删除实操记录
 * @param {string} recordId - 记录ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deletePracticalRecord(recordId, userId) {
  const result = await db.execute(
    'DELETE FROM practical_records WHERE id = $1 AND user_id = $2',
    [recordId, userId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('记录不存在或无权删除');
  }
  
  return { success: true };
}
