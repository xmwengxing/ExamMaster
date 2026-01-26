/**
 * 管理员模块服务层
 * 处理管理员相关的业务逻辑
 */

import db from '../../db.js';

/**
 * 获取所有学生
 * @returns {Promise<Array>} 学生列表
 */
export async function getStudents() {
  const rows = await db.getMany(
    "SELECT id, phone, nickname, real_name, student_perms, allowed_bank_ids FROM users WHERE role = 'STUDENT' ORDER BY id"
  );
  
  return (rows || []).map(student => ({
    ...student,
    studentPerms: student.student_perms || [],
    allowedBankIds: student.allowed_bank_ids || []
  }));
}

/**
 * 获取所有管理员
 * @returns {Promise<Array>} 管理员列表
 */
export async function getAdmins() {
  const rows = await db.getMany(
    "SELECT id, phone, nickname, real_name FROM users WHERE role = 'ADMIN' ORDER BY id"
  );
  
  return rows || [];
}

/**
 * 获取登录日志
 * @returns {Promise<Array>} 登录日志列表
 */
export async function getLoginLogs() {
  const rows = await db.getMany('SELECT * FROM login_logs ORDER BY time DESC LIMIT 1000');
  return rows || [];
}

/**
 * 获取审计日志
 * @returns {Promise<Array>} 审计日志列表
 */
export async function getAuditLogs() {
  const rows = await db.getMany('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000');
  return rows || [];
}

/**
 * 创建审计日志
 * @param {Object} logData - 日志数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createAuditLog(logData) {
  const { action, details, userId } = logData;
  const id = `audit-${Date.now()}`;
  const now = new Date().toISOString();
  
  await db.execute(
    'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES ($1, $2, $3, $4, $5)',
    [id, userId, action, details || '', now]
  );
  
  return { success: true, id };
}
