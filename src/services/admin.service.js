/**
 * 管理员模块服务层
 * 处理管理员相关的业务逻辑
 */

import db from '../../db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 获取学生列表（支持分页）
 * @param {Object} options - 查询选项 { page, pageSize }
 * @returns {Promise<Object>} 分页结果 { data, pagination }
 */
export async function getStudents(options = {}) {
  const { page, pageSize } = options;

  // Build base query parts
  const selectClause = `SELECT id, phone, nickname, real_name, gender, id_card, school,
            education_type, education_level, major, company, class_name,
            student_perms, allowed_bank_ids, custom_fields, avatar,
            last_login, last_activity, total_online_time, login_history, group_id
     FROM users WHERE role = 'STUDENT'`;

  const mapRow = (student) => ({
    id: student.id,
    phone: student.phone,
    nickname: student.nickname,
    realName: student.real_name,
    gender: student.gender,
    idCard: student.id_card,
    school: student.school,
    educationType: student.education_type,
    educationLevel: student.education_level,
    major: student.major,
    company: student.company,
    className: student.class_name,
    groupId: student.group_id || null,
    studentPerms: Array.isArray(student.student_perms) ? student.student_perms : [],
    allowedBankIds: Array.isArray(student.allowed_bank_ids) ? student.allowed_bank_ids : [],
    customFields: student.custom_fields || {},
    avatar: student.avatar,
    lastLogin: student.last_login,
    lastActivity: student.last_activity,
    totalOnlineTime: student.total_online_time || 0,
    loginHistory: Array.isArray(student.login_history) ? student.login_history.slice(0, 10) : [],
    role: 'STUDENT'
  });

  if (page && pageSize) {
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 20;

    const result = await db.paginate('users', {
      page: pageNum,
      pageSize: pageSizeNum,
      where: "role = 'STUDENT'",
      orderBy: 'id ASC'
    });

    return {
      data: result.data.map(mapRow),
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    };
  }

  // 无分页参数：返回前 20 条（默认兜底）
  const rows = await db.getMany(selectClause + ' ORDER BY id LIMIT 20');
  return (rows || []).map(mapRow);
}

/**
 * 创建学员账号
 * @param {Object} dbConn - 数据库连接
 * @param {Object} studentData - 学员数据
 * @returns {Promise<Object>} { success: boolean, id: string }
 */
export async function createStudent(dbConn, studentData) {
  const { 
    phone, password, nickname, realName, 
    gender, idCard, school, educationType, educationLevel, major, company, className,
    studentPerms, allowedBankIds, customFields, avatar
  } = studentData;
  
  // 检查手机号是否已存在
  const existing = await dbConn.query(
    'SELECT id FROM users WHERE phone = $1',
    [phone]
  );
  
  if (existing.rows && existing.rows.length > 0) {
    throw new Error('手机号已存在');
  }
  
  // 生成学员ID
  const id = `student-${Date.now()}`;
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(password || phone.slice(-6), 10);
  
  // 确保权限字段是数组
  const permsArray = Array.isArray(studentPerms) ? studentPerms : ['BANK', 'VIDEO', 'EXAM'];
  const bankIdsArray = Array.isArray(allowedBankIds) ? allowedBankIds : [];
  const customFieldsObj = customFields || {};
  
  // 插入学员记录
  await dbConn.query(
    `INSERT INTO users (
      id, phone, password, nickname, real_name, role,
      gender, id_card, school, education_type, education_level, major, company, class_name,
      student_perms, allowed_bank_ids, custom_fields, avatar
    ) VALUES ($1, $2, $3, $4, $5, 'STUDENT', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      id, phone, hashedPassword, nickname || '', realName || '',
      gender || null, idCard || null, school || null, educationType || null, 
      educationLevel || null, major || null, company || null, className || null,
      JSON.stringify(permsArray), JSON.stringify(bankIdsArray), JSON.stringify(customFieldsObj),
      avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`
    ]
  );
  
  console.log(`[Admin] Created student: ${id} (${phone})`);
  
  return { success: true, id };
}

/**
 * 更新学员信息
 * @param {Object} dbConn - 数据库连接
 * @param {string} studentId - 学员ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} { success: boolean }
 */
export async function updateStudent(dbConn, studentId, updates) {
  const { 
    nickname, realName, phone, password, 
    gender, idCard, school, educationType, educationLevel, major, company, className,
    studentPerms, allowedBankIds, customFields
  } = updates;
  
  // 检查学员是否存在
  const existing = await dbConn.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'STUDENT'",
    [studentId]
  );
  
  if (!existing.rows || existing.rows.length === 0) {
    throw new Error('学员不存在');
  }
  
  // 如果更新手机号，检查是否与其他用户冲突
  if (phone) {
    const phoneCheck = await dbConn.query(
      'SELECT id FROM users WHERE phone = $1 AND id != $2',
      [phone, studentId]
    );
    
    if (phoneCheck.rows && phoneCheck.rows.length > 0) {
      throw new Error('手机号已被其他用户使用');
    }
  }
  
  // 构建更新语句
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  if (nickname !== undefined) {
    updateFields.push('nickname = $' + paramIndex++);
    values.push(nickname);
  }
  
  if (realName !== undefined) {
    updateFields.push('real_name = $' + paramIndex++);
    values.push(realName);
  }
  
  if (phone !== undefined) {
    updateFields.push('phone = $' + paramIndex++);
    values.push(phone);
  }
  
  if (password !== undefined && password !== '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.push('password = $' + paramIndex++);
    values.push(hashedPassword);
  }
  
  if (gender !== undefined) {
    updateFields.push('gender = $' + paramIndex++);
    values.push(gender);
  }
  
  if (idCard !== undefined) {
    updateFields.push('id_card = $' + paramIndex++);
    values.push(idCard);
  }
  
  if (school !== undefined) {
    updateFields.push('school = $' + paramIndex++);
    values.push(school);
  }
  
  if (educationType !== undefined) {
    updateFields.push('education_type = $' + paramIndex++);
    values.push(educationType);
  }
  
  if (educationLevel !== undefined) {
    updateFields.push('education_level = $' + paramIndex++);
    values.push(educationLevel);
  }
  
  if (major !== undefined) {
    updateFields.push('major = $' + paramIndex++);
    values.push(major);
  }
  
  if (company !== undefined) {
    updateFields.push('company = $' + paramIndex++);
    values.push(company);
  }
  
  if (className !== undefined) {
    updateFields.push('class_name = $' + paramIndex++);
    values.push(className);
  }
  
  if (studentPerms !== undefined) {
    const permsArray = Array.isArray(studentPerms) ? studentPerms : [];
    updateFields.push('student_perms = $' + paramIndex++);
    values.push(JSON.stringify(permsArray));
  }
  
  if (allowedBankIds !== undefined) {
    const bankIdsArray = Array.isArray(allowedBankIds) ? allowedBankIds : [];
    updateFields.push('allowed_bank_ids = $' + paramIndex++);
    values.push(JSON.stringify(bankIdsArray));
  }
  
  if (customFields !== undefined) {
    updateFields.push('custom_fields = $' + paramIndex++);
    values.push(JSON.stringify(customFields || {}));
  }
  
  if (updateFields.length === 0) {
    return { success: true }; // 没有需要更新的字段
  }
  
  values.push(studentId);
  
  await dbConn.query(
    'UPDATE users SET ' + updateFields.join(', ') + ' WHERE id = $' + paramIndex,
    values
  );
  
  console.log(`[Admin] Updated student: ${studentId}`);
  
  return { success: true };
}

/**
 * 删除学员账号
 * @param {Object} dbConn - 数据库连接
 * @param {string} studentId - 学员ID
 * @returns {Promise<Object>} { success: boolean }
 */
export async function deleteStudent(dbConn, studentId) {
  // 检查学员是否存在
  const existing = await dbConn.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'STUDENT'",
    [studentId]
  );
  
  if (!existing.rows || existing.rows.length === 0) {
    throw new Error('学员不存在');
  }
  
  // 删除学员
  await dbConn.query(
    "DELETE FROM users WHERE id = $1 AND role = 'STUDENT'",
    [studentId]
  );
  
  console.log(`[Admin] Deleted student: ${studentId}`);
  
  return { success: true };
}

/**
 * 批量删除学员账号
 * @param {Object} dbConn - 数据库连接
 * @param {Array<string>} studentIds - 学员ID列表
 * @returns {Promise<Object>} { success: boolean, deleted: number }
 */
export async function batchDeleteStudents(dbConn, studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error('学员ID列表不能为空');
  }
  
  // 构建 IN 查询的占位符
  const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(', ');
  
  // 删除学员
  const result = await dbConn.query(
    `DELETE FROM users WHERE id IN (${placeholders}) AND role = 'STUDENT'`,
    studentIds
  );
  
  const deletedCount = result.rowCount || 0;
  
  console.log(`[Admin] Batch deleted ${deletedCount} students`);
  
  return { success: true, deleted: deletedCount };
}

/**
 * 获取所有管理员
 * @returns {Promise<Array>} 管理员列表
 */
export async function getAdmins() {
  const rows = await db.getMany(
    "SELECT id, phone, nickname, real_name, permissions FROM users WHERE role = 'ADMIN' ORDER BY id"
  );
  
  return (rows || []).map(admin => {
    // 解析 permissions 字段（可能是 JSON 字符串或已解析的数组）
    let permissions = [];
    if (admin.permissions) {
      if (typeof admin.permissions === 'string') {
        try {
          permissions = JSON.parse(admin.permissions);
        } catch (e) {
          console.error(`[Admin] Failed to parse permissions for admin ${admin.id}:`, e);
          permissions = [];
        }
      } else if (Array.isArray(admin.permissions)) {
        permissions = admin.permissions;
      }
    }
    
    return {
      id: admin.id,
      phone: admin.phone,
      nickname: admin.nickname,
      realName: admin.real_name,  // 字段名转换
      permissions: permissions
    };
  });
}

/**
 * 获取登录日志
 * @param {Object} dbConn - 数据库连接
 * @param {Object} options - 查询选项
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
 * @returns {Promise<Object>} 创建结果
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
    success: true,
    id,
    operatorId,
    operatorName,
    action,
    target,
    timestamp
  };
}

/**
 * 获取所有管理员列表（用于 API 返回）
 * @param {Object} dbConn - 数据库连接
 * @returns {Promise<Array>} 管理员列表
 */
export async function getAllAdmins(dbConn) {
  const rows = await dbConn.query(
    "SELECT id, phone, nickname, real_name, permissions FROM users WHERE role = 'ADMIN' ORDER BY id"
  );
  
  return (rows.rows || []).map(admin => {
    // 解析 permissions 字段（可能是 JSON 字符串或已解析的数组）
    let permissions = [];
    if (admin.permissions) {
      if (typeof admin.permissions === 'string') {
        try {
          permissions = JSON.parse(admin.permissions);
        } catch (e) {
          console.error(`[Admin] Failed to parse permissions for admin ${admin.id}:`, e);
          permissions = [];
        }
      } else if (Array.isArray(admin.permissions)) {
        permissions = admin.permissions;
      }
    }
    
    return {
      id: admin.id,
      phone: admin.phone,
      nickname: admin.nickname,
      realName: admin.real_name,
      permissions: permissions
    };
  });
}

/**
 * 创建管理员账号
 * @param {Object} dbConn - 数据库连接
 * @param {Object} adminData - 管理员数据 { phone, password, nickname, realName, permissions }
 * @returns {Promise<Object>} { success: boolean, id: string }
 */
export async function createAdmin(dbConn, adminData) {
  const { phone, password, nickname, realName, permissions } = adminData;
  
  // 检查手机号是否已存在
  const existing = await dbConn.query(
    'SELECT id FROM users WHERE phone = $1',
    [phone]
  );
  
  if (existing.rows && existing.rows.length > 0) {
    throw new Error('手机号已存在');
  }
  
  // 生成管理员ID
  const id = `admin-${Date.now()}`;
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 确保 permissions 是数组
  const permsArray = Array.isArray(permissions) ? permissions : [];
  
  // 插入管理员记录
  await dbConn.query(
    `INSERT INTO users (id, phone, password, nickname, real_name, role, permissions) 
     VALUES ($1, $2, $3, $4, $5, 'ADMIN', $6)`,
    [id, phone, hashedPassword, nickname || '', realName || '', JSON.stringify(permsArray)]
  );
  
  console.log(`[Admin] Created admin: ${id} (${phone}) with permissions:`, permsArray);
  
  return { success: true, id };
}

/**
 * 更新管理员信息
 * @param {Object} dbConn - 数据库连接
 * @param {string} adminId - 管理员ID
 * @param {Object} updates - 更新数据 { nickname?, realName?, phone? }
 * @returns {Promise<Object>} { success: boolean }
 */
export async function updateAdmin(dbConn, adminId, updates) {
  const { nickname, realName, phone, password, permissions } = updates;
  
  // 检查管理员是否存在
  const existing = await dbConn.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'ADMIN'",
    [adminId]
  );
  
  if (!existing.rows || existing.rows.length === 0) {
    throw new Error('管理员不存在');
  }
  
  // 如果更新手机号，检查是否与其他用户冲突
  if (phone) {
    const phoneCheck = await dbConn.query(
      'SELECT id FROM users WHERE phone = $1 AND id != $2',
      [phone, adminId]
    );
    
    if (phoneCheck.rows && phoneCheck.rows.length > 0) {
      throw new Error('手机号已被其他用户使用');
    }
  }
  
  // 构建更新语句
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  if (nickname !== undefined) {
    updateFields.push('nickname = $' + paramIndex++);
    values.push(nickname);
  }
  
  if (realName !== undefined) {
    updateFields.push('real_name = $' + paramIndex++);
    values.push(realName);
  }
  
  if (phone !== undefined) {
    updateFields.push('phone = $' + paramIndex++);
    values.push(phone);
  }
  
  if (password !== undefined && password !== '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.push('password = $' + paramIndex++);
    values.push(hashedPassword);
  }
  
  if (permissions !== undefined) {
    const permsArray = Array.isArray(permissions) ? permissions : [];
    updateFields.push('permissions = $' + paramIndex++);
    values.push(JSON.stringify(permsArray));
  }
  
  if (updateFields.length === 0) {
    return { success: true }; // 没有需要更新的字段
  }
  
  values.push(adminId);
  
  await dbConn.query(
    'UPDATE users SET ' + updateFields.join(', ') + ' WHERE id = $' + paramIndex,
    values
  );
  
  console.log(`[Admin] Updated admin: ${adminId}`, permissions ? `with permissions: ${JSON.stringify(permissions)}` : '');
  
  return { success: true };
}

/**
 * 删除管理员账号
 * @param {Object} dbConn - 数据库连接
 * @param {string} adminId - 管理员ID
 * @returns {Promise<Object>} { success: boolean }
 */
export async function deleteAdmin(dbConn, adminId) {
  // 检查管理员是否存在
  const existing = await dbConn.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'ADMIN'",
    [adminId]
  );
  
  if (!existing.rows || existing.rows.length === 0) {
    throw new Error('管理员不存在');
  }
  
  // 删除管理员
  await dbConn.query(
    "DELETE FROM users WHERE id = $1 AND role = 'ADMIN'",
    [adminId]
  );
  
  console.log(`[Admin] Deleted admin: ${adminId}`);
  
  return { success: true };
}

/**
 * 修改管理员密码
 * @param {Object} dbConn - 数据库连接
 * @param {string} adminId - 管理员ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} { success: boolean }
 */
export async function changeAdminPassword(dbConn, adminId, oldPassword, newPassword) {
  // 获取管理员信息
  const result = await dbConn.query(
    "SELECT id, password FROM users WHERE id = $1 AND role = 'ADMIN'",
    [adminId]
  );
  
  if (!result.rows || result.rows.length === 0) {
    throw new Error('管理员不存在');
  }
  
  const admin = result.rows[0];
  
  // 验证旧密码
  const isValidPassword = await bcrypt.compare(oldPassword, admin.password);
  
  if (!isValidPassword) {
    throw new Error('旧密码错误');
  }
  
  // 加密新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // 更新密码
  await dbConn.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedPassword, adminId]
  );
  
  console.log(`[Admin] Changed password for admin: ${adminId}`);
  
  return { success: true };
}

/**
 * 获取所有考试历史（支持分页）
 * @param {Object} dbConn - 数据库连接
 * @param {Object} options - 查询选项 { page, pageSize }
 * @returns {Promise<Object>} 分页结果
 */
export async function getAllExamHistory(dbConn, options = {}) {
  const { page, pageSize } = options;

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 20;

  const countResult = await dbConn.query(
    'SELECT COUNT(*) as total FROM exam_history'
  );
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / pageSizeNum);
  const offset = (pageNum - 1) * pageSizeNum;

  const rows = await dbConn.query(`
    SELECT 
      eh.id,
      eh.user_id,
      eh.bank_id,
      eh.exam_title,
      eh.score,
      eh.total_score,
      eh.pass_score,
      eh.time_used,
      eh.submit_time,
      eh.passed,
      u.phone,
      u.nickname,
      u.real_name
    FROM exam_history eh
    LEFT JOIN users u ON eh.user_id = u.id
    ORDER BY eh.submit_time DESC
    LIMIT $1 OFFSET $2
  `, [pageSizeNum, offset]);

  return {
    data: (rows.rows || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      bankId: row.bank_id,
      examTitle: row.exam_title,
      score: row.score,
      totalScore: row.total_score,
      passScore: row.pass_score,
      timeUsed: row.time_used,
      submitTime: row.submit_time,
      passed: row.passed,
      user: {
        phone: row.phone,
        nickname: row.nickname,
        realName: row.real_name
      }
    })),
    pagination: { total, page: pageNum, pageSize: pageSizeNum, totalPages }
  };
}

/**
 * 获取所有学员进度（支持分页）
 * @param {Object} dbConn - 数据库连接
 * @param {Object} options - 查询选项 { page, pageSize }
 * @returns {Promise<Object>} 分页结果
 */
export async function getAllProgress(dbConn, options = {}) {
  const { page, pageSize } = options;

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 20;

  const countResult = await dbConn.query(
    'SELECT COUNT(*) as total FROM daily_progress'
  );
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / pageSizeNum);
  const offset = (pageNum - 1) * pageSizeNum;

  const rows = await dbConn.query(`
    SELECT 
      dp.id,
      dp.user_id,
      dp.date,
      dp.count,
      u.phone,
      u.nickname,
      u.real_name
    FROM daily_progress dp
    LEFT JOIN users u ON dp.user_id = u.id
    ORDER BY dp.date DESC, dp.user_id
    LIMIT $1 OFFSET $2
  `, [pageSizeNum, offset]);

  return {
    data: (rows.rows || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      count: row.count,
      user: {
        phone: row.phone,
        nickname: row.nickname,
        realName: row.real_name
      }
    })),
    pagination: { total, page: pageNum, pageSize: pageSizeNum, totalPages }
  };
}

/**
 * 修复学生权限字段（幂等操作）
 * @param {Object} dbConn - 数据库连接
 * @returns {Promise<Object>} { success: boolean, fixed: number }
 */
export async function repairStudentSchema(dbConn) {
  // 查找需要修复的记录（双重编码的 JSON 字符串）
  const needsRepair = await dbConn.query(`
    SELECT id, student_perms, allowed_bank_ids 
    FROM users 
    WHERE role = 'STUDENT' 
    AND (
      student_perms::text LIKE '"%' 
      OR allowed_bank_ids::text LIKE '"%'
    )
  `);
  
  let fixedCount = 0;
  
  for (const row of needsRepair.rows || []) {
    let studentPerms = row.student_perms;
    let allowedBankIds = row.allowed_bank_ids;
    let needsUpdate = false;
    
    // 修复 student_perms
    if (typeof studentPerms === 'string' && studentPerms.startsWith('"')) {
      try {
        studentPerms = JSON.parse(studentPerms);
        needsUpdate = true;
      } catch (e) {
        console.error(`[Admin] Failed to parse student_perms for user ${row.id}`);
      }
    }
    
    // 修复 allowed_bank_ids
    if (typeof allowedBankIds === 'string' && allowedBankIds.startsWith('"')) {
      try {
        allowedBankIds = JSON.parse(allowedBankIds);
        needsUpdate = true;
      } catch (e) {
        console.error(`[Admin] Failed to parse allowed_bank_ids for user ${row.id}`);
      }
    }
    
    if (needsUpdate) {
      await dbConn.query(
        'UPDATE users SET student_perms = $1, allowed_bank_ids = $2 WHERE id = $3',
        [JSON.stringify(studentPerms), JSON.stringify(allowedBankIds), row.id]
      );
      fixedCount++;
    }
  }
  
  console.log(`[Admin] Repaired ${fixedCount} student records`);
  
  return { success: true, fixed: fixedCount };
}







/**
 * 批量设置学员权限
 * @param {Object} dbConn - 数据库连接
 * @param {Object} data - 学员权限数据 { studentId: { studentPerms, allowedBankIds } }
 * @returns {Promise<Object>} { success: boolean }
 */
export async function batchSetStudentPerms(dbConn, data) {
  const entries = Object.entries(data);
  console.log('[Admin] Batch updating', entries.length, 'students');
  
  // 使用事务批量更新
  await dbConn.transaction(async (client) => {
    for (const [id, payload] of entries) {
      console.log('[Admin] Updating student:', id, 'perms:', payload.studentPerms, 'bankIds:', payload.allowedBankIds);
      
      // 将数组转换为 JSON 字符串（JSONB 字段需要）
      const studentPerms = JSON.stringify(payload.studentPerms || []);
      const allowedBankIds = JSON.stringify(payload.allowedBankIds || []);
      
      await client.query(
        'UPDATE users SET student_perms = $1, allowed_bank_ids = $2 WHERE id = $3',
        [studentPerms, allowedBankIds, id]
      );
    }
  });
  
  console.log('[Admin] Batch update complete');
  return { success: true };
}

/**
 * 获取学员近30天的练习统计
 * @param {string} userId - 学员ID
 * @returns {Promise<Array>} 每日练习统计列表
 */
export async function getStudentPracticeStats(userId) {
  // 计算30天前的日期
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  // 查询近30天的练习记录（仅统计顺序练习和自定义练习）
  const records = await db.getMany(
    `SELECT 
      date,
      mode,
      user_answers,
      count
     FROM practice_records 
     WHERE user_id = $1 
       AND date >= $2
       AND mode IN ('SEQUENTIAL', 'MEMORY', 'MISTAKE')
     ORDER BY date DESC`,
    [userId, startDate]
  );
  
  // 按日期分组统计做题数量
  const statsByDate = {};
  
  records.forEach(record => {
    const date = record.date;
    if (!statsByDate[date]) {
      statsByDate[date] = {
        date,
        count: 0,
        modes: {}
      };
    }
    
    // 统计该记录的做题数量（user_answers 中的键数量）
    let answeredCount = 0;
    if (record.user_answers && typeof record.user_answers === 'object') {
      answeredCount = Object.keys(record.user_answers).length;
    }
    
    statsByDate[date].count += answeredCount;
    
    // 按模式统计
    const mode = record.mode || 'SEQUENTIAL';
    if (!statsByDate[date].modes[mode]) {
      statsByDate[date].modes[mode] = 0;
    }
    statsByDate[date].modes[mode] += answeredCount;
  });
  
  // 生成完整的30天数据（包括没有练习的日期）
  const result = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    result.push({
      date: dateStr,
      displayDate: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      count: statsByDate[dateStr]?.count || 0,
      modes: statsByDate[dateStr]?.modes || {}
    });
  }
  
  // 按日期正序排列
  return result.reverse();
}
