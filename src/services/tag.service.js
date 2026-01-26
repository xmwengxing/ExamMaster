/**
 * 标签模块服务层
 * 处理标签的业务逻辑
 */

import db from '../../db.js';

/**
 * 获取所有标签
 * @returns {Promise<Array>} 标签列表
 */
export async function getTags() {
  const rows = await db.getMany('SELECT * FROM tags ORDER BY usage_count DESC');
  
  return (rows || []).map(tag => ({
    ...tag,
    usageCount: tag.usage_count,
    createdAt: tag.created_at
  }));
}

/**
 * 创建标签（管理员）
 * @param {Object} tagData - 标签数据
 * @param {string} tagData.name - 标签名称
 * @param {string} [tagData.color] - 标签颜色
 * @returns {Promise<Object>} 创建结果
 */
export async function createTag(tagData) {
  const { name, color } = tagData;
  
  if (!name || String(name).trim() === '') {
    throw new Error('标签名称不能为空');
  }
  
  const id = `tag-${Date.now()}`;
  const now = new Date().toISOString();
  
  try {
    await db.execute(
      'INSERT INTO tags (id, name, color, created_at, usage_count) VALUES ($1, $2, $3, $4, 0)',
      [id, name.trim(), color || null, now]
    );
    
    return {
      success: true,
      id,
      tag: { id, name: name.trim(), color, createdAt: now, usageCount: 0 }
    };
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('标签名称已存在');
    }
    throw error;
  }
}

/**
 * 更新标签（管理员）
 * @param {string} tagId - 标签ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.name] - 标签名称
 * @param {string} [updateData.color] - 标签颜色
 * @returns {Promise<Object>} 更新结果
 */
export async function updateTag(tagId, updateData) {
  const { name, color } = updateData;
  
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  if (name !== undefined) {
    if (String(name).trim() === '') {
      throw new Error('标签名称不能为空');
    }
    fields.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }
  
  if (color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(color);
  }
  
  if (fields.length === 0) {
    throw new Error('没有要更新的字段');
  }
  
  values.push(tagId);
  
  try {
    const result = await db.execute(
      `UPDATE tags SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    if (result.rowCount === 0) {
      throw new Error('标签不存在');
    }
    
    return { success: true };
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('标签名称已存在');
    }
    throw error;
  }
}

/**
 * 删除标签（管理员）
 * @param {string} tagId - 标签ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteTag(tagId) {
  // 检查标签是否正在使用
  const row = await db.getOne(
    'SELECT COUNT(*) as count FROM question_tags WHERE tag_id = $1',
    [tagId]
  );
  
  if (row.count > 0) {
    const error = new Error('标签正在使用中，请先解除所有题目的关联');
    error.usageCount = row.count;
    throw error;
  }
  
  const result = await db.execute('DELETE FROM tags WHERE id = $1', [tagId]);
  
  if (result.rowCount === 0) {
    throw new Error('标签不存在');
  }
  
  return { success: true };
}

/**
 * 合并标签（管理员）
 * @param {string} sourceTagId - 源标签ID
 * @param {string} targetTagId - 目标标签ID
 * @returns {Promise<Object>} 合并结果
 */
export async function mergeTags(sourceTagId, targetTagId) {
  if (!sourceTagId || !targetTagId) {
    throw new Error('缺少源标签或目标标签ID');
  }
  
  if (sourceTagId === targetTagId) {
    throw new Error('源标签和目标标签不能相同');
  }
  
  // 获取两个标签的信息
  const tags = await db.getMany(
    'SELECT * FROM tags WHERE id = ANY($1)',
    [[sourceTagId, targetTagId]]
  );
  
  if (tags.length !== 2) {
    throw new Error('标签不存在');
  }
  
  const sourceTag = tags.find(t => t.id === sourceTagId);
  const targetTag = tags.find(t => t.id === targetTagId);
  
  // 使用事务处理合并操作
  await db.transaction(async (client) => {
    // 更新所有使用源标签的题目关联到目标标签
    await client.query(
      'INSERT INTO question_tags (question_id, tag_id) SELECT question_id, $1 FROM question_tags WHERE tag_id = $2 ON CONFLICT DO NOTHING',
      [targetTagId, sourceTagId]
    );
    
    // 删除源标签的所有关联
    await client.query('DELETE FROM question_tags WHERE tag_id = $1', [sourceTagId]);
    
    // 更新目标标签的使用次数
    const newUsageCount = sourceTag.usage_count + targetTag.usage_count;
    await client.query(
      'UPDATE tags SET usage_count = $1 WHERE id = $2',
      [newUsageCount, targetTagId]
    );
    
    // 删除源标签
    await client.query('DELETE FROM tags WHERE id = $1', [sourceTagId]);
  });
  
  return { success: true, mergedCount: sourceTag.usage_count };
}
