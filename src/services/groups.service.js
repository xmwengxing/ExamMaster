// 学员分组服务层
// 处理分组的 CRUD 和权限管理

/**
 * 获取所有分组列表
 * @param {Object} db - 数据库实例
 * @returns {Promise<Array>}
 */
export async function listGroups(db) {
  const rows = await db.getMany(`
    SELECT g.*, 
      (SELECT COUNT(*) FROM users WHERE group_id = g.id) as member_count
    FROM user_groups g 
    ORDER BY g.sort_order ASC, g.created_at DESC
  `);
  return (rows || []).map(rowToGroup);
}

/**
 * 获取单个分组
 * @param {Object} db - 数据库实例
 * @param {string} id - 分组ID
 * @returns {Promise<Object|null>}
 */
export async function getGroup(db, id) {
  const row = await db.getOne(`
    SELECT g.*, 
      (SELECT COUNT(*) FROM users WHERE group_id = g.id) as member_count
    FROM user_groups g WHERE g.id = $1
  `, [id]);
  return row ? rowToGroup(row) : null;
}

/**
 * 创建分组
 * @param {Object} db
 * @param {Object} data - { name, description, permissions, sortOrder }
 * @returns {Promise<Object>}
 */
export async function createGroup(db, data) {
  const id = `group-${Date.now()}`;
  const permissions = data.permissions || getDefaultPermissions();
  const now = new Date().toISOString();
  
  await db.execute(
    `INSERT INTO user_groups (id, name, description, permissions, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, data.name, data.description || '', JSON.stringify(permissions), data.sortOrder || 0, now, now]
  );
  return getGroup(db, id);
}

/**
 * 更新分组
 * @param {Object} db
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
export async function updateGroup(db, id, data) {
  const now = new Date().toISOString();
  const sets = [];
  const params = [];
  let paramIndex = 1;

  if (data.name !== undefined) { sets.push(`name = $${paramIndex++}`); params.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${paramIndex++}`); params.push(data.description); }
  if (data.permissions !== undefined) { sets.push(`permissions = $${paramIndex++}`); params.push(JSON.stringify(data.permissions)); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${paramIndex++}`); params.push(data.sortOrder); }
  
  if (sets.length === 0) return getGroup(db, id);
  
  sets.push(`updated_at = $${paramIndex++}`);
  params.push(now);
  params.push(id);

  await db.execute(`UPDATE user_groups SET ${sets.join(', ')} WHERE id = $${paramIndex}`, params);
  return getGroup(db, id);
}

/**
 * 删除分组
 * @param {Object} db
 * @param {string} id
 */
export async function deleteGroup(db, id) {
  await db.execute('UPDATE users SET group_id = NULL WHERE group_id = $1', [id]);
  await db.execute('DELETE FROM user_groups WHERE id = $1', [id]);
  return { success: true };
}

/**
 * 更新分组权限
 * @param {Object} db
 * @param {string} id
 * @param {Object} permissions
 */
export async function updateGroupPermissions(db, id, permissions) {
  const now = new Date().toISOString();
  await db.execute(
    'UPDATE user_groups SET permissions = $1, updated_at = $2 WHERE id = $3',
    [JSON.stringify(permissions), now, id]
  );
  return getGroup(db, id);
}

/**
 * 获取分组下的学员列表
 * @param {Object} db
 * @param {string} groupId
 */
export async function getGroupStudents(db, groupId) {
  const rows = await db.getMany(
    `SELECT id, phone, real_name, nickname, avatar, class_name, company, gender, accuracy, mistake_count, last_login, is_online
     FROM users WHERE group_id = $1 AND role = 'STUDENT' ORDER BY real_name ASC`,
    [groupId]
  );
  return rows || [];
}

/**
 * 批量添加学员到分组
 * @param {Object} db
 * @param {string} groupId
 * @param {string[]} userIds
 */
export async function addStudentsToGroup(db, groupId, userIds) {
  if (!userIds || userIds.length === 0) return { success: true, count: 0 };
  
  const placeholders = userIds.map((_, i) => `$${i + 2}`);
  const result = await db.execute(
    `UPDATE users SET group_id = $1 WHERE id IN (${placeholders.join(',')}) AND role = 'STUDENT'`,
    [groupId, ...userIds]
  );
  return { success: true, count: result.rowCount };
}

/**
 * 设置单个学员的分组
 * @param {Object} db
 * @param {string} userId
 * @param {string|null} groupId
 */
export async function setStudentGroup(db, userId, groupId) {
  await db.execute(
    'UPDATE users SET group_id = $1 WHERE id = $2 AND role = \'STUDENT\'',
    [groupId, userId]
  );
  return { success: true };
}

function getDefaultPermissions() {
  return {
    banks: [],
    exams: [],
    vod_courses: { mode: 'all', categories: [], courses: [] },
    live_courses: { mode: 'all', categories: [], courses: [] }
  };
}

function rowToGroup(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || getDefaultPermissions()),
    sortOrder: row.sort_order,
    memberCount: parseInt(row.member_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
