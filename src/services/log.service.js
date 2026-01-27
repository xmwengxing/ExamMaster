/**
 * 日志管理服务
 * 提供登录日志和审计日志的查询和创建功能
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 获取登录日志
 * @param {Object} dbConn - 数据库连接
 * @param {Object} options - 查询选项
 * @param {number} options.limit - 返回记录数限制
 * @param {number} options.offset - 偏移量
 * @returns {Promise<Array>} 登录日志列表
 */
export async function getLoginLogs(dbConn, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  const rows = await dbConn.query(`
    SELECT 
      ll.id,
      ll.user_id,
      ll.phone,
      ll.role,
      ll.time,
      ll.ip,
      ll.created_at
    FROM login_logs ll
    ORDER BY ll.time DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  return (rows.rows || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    role: row.role,
    time: row.time,
    ip: row.ip,
    createdAt: row.created_at
  }));
}

/**
 * 获取审计日志
 * @param {Object} dbConn - 数据库连接
 * @param {Object} options - 查询选项
 * @param {number} options.limit - 返回记录数限制
 * @param {number} options.offset - 偏移量
 * @param {string} options.action - 操作类型过滤
 * @param {string} options.operatorId - 操作者ID过滤
 * @returns {Promise<Array>} 审计日志列表
 */
export async function getAuditLogs(dbConn, options = {}) {
  const { limit = 100, offset = 0, action, operatorId } = options;
  
  let query = `
    SELECT 
      al.id,
      al.operator_id,
      al.operator_name,
      al.action,
      al.target,
      al.timestamp,
      al.created_at
    FROM audit_logs al
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (action) {
    query += ` AND al.action = $${paramIndex}`;
    params.push(action);
    paramIndex++;
  }
  
  if (operatorId) {
    query += ` AND al.operator_id = $${paramIndex}`;
    params.push(operatorId);
    paramIndex++;
  }
  
  query += ` ORDER BY al.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const rows = await dbConn.query(query, params);
  
  return (rows.rows || []).map(row => ({
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    action: row.action,
    target: row.target,
    timestamp: row.timestamp,
    createdAt: row.created_at
  }));
}

/**
 * 创建审计日志
 * @param {Object} dbConn - 数据库连接
 * @param {Object} logData - 日志数据
 * @param {string} logData.operatorId - 操作者ID
 * @param {string} logData.operatorName - 操作者名称
 * @param {string} logData.action - 操作类型
 * @param {string} logData.target - 操作目标
 * @returns {Promise<Object>} 创建的日志记录
 */
export async function createAuditLog(dbConn, logData) {
  const { operatorId, operatorName, action, target } = logData;
  
  // 验证必填字段
  if (!action) {
    throw new Error('操作类型不能为空');
  }
  
  const id = uuidv4();
  const timestamp = new Date();
  
  await dbConn.execute(
    `INSERT INTO audit_logs (id, operator_id, operator_name, action, target, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, operatorId || null, operatorName || null, action, target || null, timestamp]
  );
  
  console.log(`[Audit] Created audit log: ${action} by ${operatorName || operatorId || 'system'}`);
  
  return {
    id,
    operatorId,
    operatorName,
    action,
    target,
    timestamp
  };
}
