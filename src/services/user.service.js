// 用户服务层
// 处理用户资料、进度统计等业务逻辑

import bcrypt from 'bcryptjs';
import { getEffectiveBankIds } from './groups.service.js';

/**
 * 获取用户资料
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户资料对象（camelCase格式）
 */
async function getUserProfile(db, userId) {
  const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (!user) {
    return null;
  }
  
  // 学员：合并直接权限 + 分组权限；管理员：只用直接权限
  const allowedBankIds = user.role === 'STUDENT'
    ? await getEffectiveBankIds(db, userId)
    : (user.allowed_bank_ids || []);

  // 转换为 camelCase 格式，不返回密码
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    nickname: user.nickname,
    avatar: user.avatar,
    gender: user.gender,
    school: user.school,
    major: user.major,
    company: user.company,
    accuracy: user.accuracy,
    // camelCase 字段
    realName: user.real_name,
    idCard: user.id_card,
    educationType: user.education_type,
    educationLevel: user.education_level,
    className: user.class_name,
    studentPerms: user.student_perms || [],
    allowedBankIds,
    permissions: user.permissions || [],  // 添加管理员权限字段
    lastLogin: user.last_login,
    lastActivity: user.last_activity,
    loginHistory: user.login_history || [],
    deepseekApiKey: user.deepseek_api_key,
    totalOnlineTime: user.total_online_time || 0,
    customFields: user.custom_fields || {},
    mistakeCount: user.mistake_count || 0,
    dailyGoal: user.daily_goal || 20
  };
}

/**
 * 更新用户资料
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @param {Object} updates - 要更新的字段（camelCase 或 snake_case 格式）
 * @returns {Promise<void>}
 */
async function updateUserProfile(db, userId, updates) {
  // camelCase 到 snake_case 的映射
  const fieldMapping = {
    realName: 'real_name',
    idCard: 'id_card',
    educationType: 'education_type',
    educationLevel: 'education_level',
    className: 'class_name',
    studentPerms: 'student_perms',
    allowedBankIds: 'allowed_bank_ids',
    lastLogin: 'last_login',
    lastActivity: 'last_activity',
    loginHistory: 'login_history',
    deepseekApiKey: 'deepseek_api_key',
    totalOnlineTime: 'total_online_time',
    customFields: 'custom_fields',
    mistakeCount: 'mistake_count',
    dailyGoal: 'daily_goal'
  };

  // 转换字段名并过滤掉 id
  const dbFields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (key === 'id') return;

    let value = updates[key];

    // 过滤掉字符串 "null" 和 "undefined"，将它们转换为真正的 null
    if (value === 'null' || value === 'undefined' || value === '') {
      value = null;
    }

    // 转换为数据库字段名
    const dbField = fieldMapping[key] || key;
    dbFields.push(dbField);

    // 处理值：对象类型转为 JSON 字符串
    if (value !== null && typeof value === 'object') {
      value = JSON.stringify(value);
    }

    values.push(value);
  });

  if (dbFields.length === 0) {
    return;
  }

  // 修复：使用 $1, $2, $3... 格式的占位符
  const setClause = dbFields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  await db.execute(
    `UPDATE users SET ${setClause} WHERE id = $${dbFields.length + 1}`,
    [...values, userId]
  );
}


/**
 * 修改用户密码
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
async function changePassword(db, userId, oldPassword, newPassword) {
  // 验证输入
  if (!oldPassword || !newPassword) {
    return { success: false, error: '请提供旧密码和新密码' };
  }
  
  if (newPassword.length < 4) {
    return { success: false, error: '新密码长度至少为4位' };
  }
  
  // 获取用户信息
  const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  
  // 验证旧密码
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid) {
    return { success: false, error: '旧密码不正确' };
  }
  
  // 加密新密码
  const newHash = await bcrypt.hash(newPassword, 10);
  
  // 更新密码
  await db.execute('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
  
  return { success: true };
}

/**
 * 更新用户最后活动时间
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Promise<string>} 更新后的时间戳
 */
async function updateLastActivity(db, userId) {
  const lastActivity = new Date().toISOString();
  await db.execute('UPDATE users SET last_activity = $1 WHERE id = $2', [lastActivity, userId]);
  return lastActivity;
}

/**
 * 重置用户学习数据（保留个人资料）
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} { success: boolean, clearedTables: number }
 */
async function resetUserData(db, userId) {
  return await db.transaction(async (client) => {
    // 清理所有学习相关数据
    const tables = [
      'practice_records',    // 练习记录
      'exam_history',        // 考试历史
      'mistakes',            // 错题
      'favorites',           // 收藏
      'notes',               // 笔记
      'srs_records',         // SRS 智能复习记录
      'daily_progress',      // 每日进度
      'practical_records',   // 实操记录
      'discussion_likes',    // 讨论点赞
      'comments'             // 评论
    ];
    
    // 删除所有表中的用户数据
    for (const table of tables) {
      const sql = `DELETE FROM ${table} WHERE user_id = $1`;
      await client.query(sql, [userId]);
    }
    
    // 重置用户统计数据（保留个人资料）
    await client.query(
      'UPDATE users SET accuracy = 0, mistake_count = 0, daily_goal = 20 WHERE id = $1',
      [userId]
    );
    
    return { success: true, clearedTables: tables.length };
  });
}

/**
 * 获取用户每日进度
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} 进度记录数组
 */
async function getUserProgress(db, userId) {
  const rows = await db.getMany('SELECT * FROM daily_progress WHERE user_id = $1', [userId]);
  return rows || [];
}

/**
 * 增加用户每日进度计数
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Promise<void>}
 */
async function incrementDailyProgress(db, userId) {
  const date = new Date().toISOString().split('T')[0];
  const id = `${userId}_${date}`;
  
  const row = await db.getOne('SELECT * FROM daily_progress WHERE id = $1', [id]);
  
  if (row) {
    await db.execute('UPDATE daily_progress SET count = count + 1 WHERE id = $1', [id]);
  } else {
    await db.execute(
      'INSERT INTO daily_progress (id, user_id, date, count) VALUES ($1, $2, $3, 1)',
      [id, userId, date]
    );
  }
}

/**
 * 获取所有用户的每日进度（管理员功能）
 * @param {Object} db - 数据库实例
 * @returns {Promise<Array>} 所有进度记录数组
 */
async function getAllUsersProgress(db) {
  const rows = await db.getMany('SELECT * FROM daily_progress ORDER BY date DESC');
  return rows || [];
}

export {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateLastActivity,
  resetUserData,
  getUserProgress,
  incrementDailyProgress,
  getAllUsersProgress
};
