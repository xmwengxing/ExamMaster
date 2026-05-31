/**
 * 讨论模块服务层
 * 处理讨论、评论和点赞的业务逻辑
 */

import db from '../../db.js';

/**
 * 获取讨论列表（支持分页、筛选和排序）
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @param {string} [options.questionId] - 题目ID（可选）
 * @param {string} [options.sortBy] - 排序方式（latest/popular/mostCommented）
 * @param {boolean} options.isAdmin - 是否为管理员
 * @returns {Promise<Object>} 讨论列表和分页信息
 */
export async function getDiscussions(options) {
  const { page = 1, limit = 20, questionId, sortBy = 'latest', isAdmin = false } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let params = [];
  let paramIndex = 1;
  
  // 学员只能看到未隐藏的讨论
  if (!isAdmin) {
    whereClause = 'WHERE is_hidden = false';
  }
  
  // 按题目筛选
  if (questionId) {
    whereClause += (whereClause ? ' AND' : 'WHERE') + ` question_id = $${paramIndex}`;
    params.push(questionId);
    paramIndex++;
  }
  
  // 排序
  let orderBy = 'ORDER BY is_pinned DESC, ';
  switch (sortBy) {
    case 'popular':
      orderBy += 'like_count DESC';
      break;
    case 'mostCommented':
      orderBy += 'comment_count DESC';
      break;
    case 'latest':
    default:
      orderBy += 'last_activity_at DESC';
  }
  
  // 获取总数
  const countRow = await db.getOne(
    `SELECT COUNT(*) as total FROM discussions ${whereClause}`,
    params
  );
  
  // 获取讨论列表
  const rows = await db.getMany(
    `SELECT * FROM discussions ${whereClause} ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, parseInt(limit), offset]
  );
  
  const discussions = rows.map(d => ({
    ...d,
    isPinned: d.is_pinned === true,
    isHidden: d.is_hidden === true
  }));
  
  return {
    discussions,
    total: countRow.total,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}

/**
 * 获取讨论详情
 * @param {string} discussionId - 讨论ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Object>} 讨论详情
 */
export async function getDiscussionById(discussionId, isAdmin = false) {
  const row = await db.getOne("SELECT * FROM discussions WHERE id = $1", [discussionId]);
  
  if (!row) {
    throw new Error('讨论不存在');
  }
  
  // 学员不能查看隐藏的讨论
  if (!isAdmin && row.is_hidden === true) {
    throw new Error('讨论不存在');
  }
  
  // 增加浏览次数
  await db.execute(
    "UPDATE discussions SET view_count = view_count + 1 WHERE id = $1",
    [discussionId]
  );
  
  return {
    ...row,
    isPinned: row.is_pinned === true,
    isHidden: row.is_hidden === true
  };
}

/**
 * 创建讨论
 * @param {Object} discussionData - 讨论数据
 * @param {string} discussionData.title - 标题
 * @param {string} discussionData.content - 内容
 * @param {string} [discussionData.questionId] - 题目ID（可选）
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 创建结果
 */
export async function createDiscussion(discussionData, userId) {
  const { title, content, questionId } = discussionData;
  
  if (!title || String(title).trim() === '') {
    throw new Error('标题不能为空');
  }
  
  if (!content || String(content).trim() === '') {
    throw new Error('内容不能为空');
  }
  
  const id = `disc-${Date.now()}`;
  const now = new Date().toISOString();
  
  // 获取用户信息
  const user = await db.getOne(
    "SELECT nickname, real_name FROM users WHERE id = $1",
    [userId]
  );
  
  const authorName = user.nickname || user.real_name || '匿名用户';
  
  await db.execute(
    `INSERT INTO discussions (
      id, title, content, author_id, author_name, question_id,
      created_at, updated_at, last_activity_at, view_count, like_count,
      comment_count, is_pinned, is_hidden
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, false, false)`,
    [id, title.trim(), content.trim(), userId, authorName, questionId || null, now, now, now]
  );
  
  return {
    success: true,
    id,
    discussion: {
      id,
      title: title.trim(),
      content: content.trim(),
      authorId: userId,
      authorName,
      questionId: questionId || null,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPinned: false,
      isHidden: false
    }
  };
}

/**
 * 更新讨论
 * @param {string} discussionId - 讨论ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.title] - 标题
 * @param {string} [updateData.content] - 内容
 * @param {string} userId - 用户ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Object>} 更新结果
 */
export async function updateDiscussion(discussionId, updateData, userId, isAdmin = false) {
  const { title, content } = updateData;
  
  // 检查权限
  const row = await db.getOne(
    "SELECT author_id FROM discussions WHERE id = $1",
    [discussionId]
  );
  
  if (!row) {
    throw new Error('讨论不存在');
  }
  
  // 只有作者或管理员可以编辑
  if (row.author_id !== userId && !isAdmin) {
    throw new Error('无权限编辑此讨论');
  }
  
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  if (title !== undefined) {
    if (String(title).trim() === '') {
      throw new Error('标题不能为空');
    }
    fields.push(`title = $${paramIndex++}`);
    values.push(title.trim());
  }
  
  if (content !== undefined) {
    if (String(content).trim() === '') {
      throw new Error('内容不能为空');
    }
    fields.push(`content = $${paramIndex++}`);
    values.push(content.trim());
  }
  
  if (fields.length === 0) {
    throw new Error('没有要更新的字段');
  }
  
  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(discussionId);
  
  await db.execute(
    `UPDATE discussions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
  
  return { success: true };
}

/**
 * 删除讨论（管理员）
 * @param {string} discussionId - 讨论ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteDiscussion(discussionId) {
  const result = await db.execute(
    "DELETE FROM discussions WHERE id = $1",
    [discussionId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('讨论不存在');
  }
  
  return { success: true };
}

/**
 * 切换讨论可见性（管理员）
 * @param {string} discussionId - 讨论ID
 * @returns {Promise<Object>} 切换结果
 */
export async function toggleDiscussionVisibility(discussionId) {
  const row = await db.getOne(
    "SELECT is_hidden FROM discussions WHERE id = $1",
    [discussionId]
  );
  
  if (!row) {
    throw new Error('讨论不存在');
  }
  
  const newVisibility = !row.is_hidden;
  
  await db.execute(
    "UPDATE discussions SET is_hidden = $1 WHERE id = $2",
    [newVisibility, discussionId]
  );
  
  return { success: true, isHidden: newVisibility };
}

/**
 * 切换讨论置顶（管理员）
 * @param {string} discussionId - 讨论ID
 * @returns {Promise<Object>} 切换结果
 */
export async function toggleDiscussionPin(discussionId) {
  const row = await db.getOne(
    "SELECT is_pinned FROM discussions WHERE id = $1",
    [discussionId]
  );
  
  if (!row) {
    throw new Error('讨论不存在');
  }
  
  const newPinStatus = !row.is_pinned;
  
  await db.execute(
    "UPDATE discussions SET is_pinned = $1 WHERE id = $2",
    [newPinStatus, discussionId]
  );
  
  return { success: true, isPinned: newPinStatus };
}

/**
 * 获取题目相关讨论
 * @param {string} questionId - 题目ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Array>} 讨论列表
 */
export async function getQuestionDiscussions(questionId, isAdmin = false) {
  let whereClause = 'WHERE question_id = $1';
  
  // 学员只能看到未隐藏的讨论
  if (!isAdmin) {
    whereClause += ' AND is_hidden = false';
  }
  
  const rows = await db.getMany(
    `SELECT * FROM discussions ${whereClause} ORDER BY is_pinned DESC, last_activity_at DESC`,
    [questionId]
  );
  
  return rows.map(d => ({
    ...d,
    isPinned: d.is_pinned === true,
    isHidden: d.is_hidden === true
  }));
}

/**
 * 获取讨论的评论
 * @param {string} discussionId - 讨论ID
 * @returns {Promise<Array>} 评论列表
 */
export async function getComments(discussionId) {
  const rows = await db.getMany(
    "SELECT * FROM comments WHERE discussion_id = $1 AND is_deleted = false ORDER BY created_at ASC",
    [discussionId]
  );
  
  return rows.map(c => ({
    ...c,
    isDeleted: c.is_deleted === true
  }));
}

/**
 * 创建评论
 * @param {string} discussionId - 讨论ID
 * @param {Object} commentData - 评论数据
 * @param {string} commentData.content - 评论内容
 * @param {string} [commentData.parentId] - 父评论ID（可选）
 * @param {string} userId - 用户ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Object>} 创建结果
 */
export async function createComment(discussionId, commentData, userId, isAdmin = false) {
  const { content, parentId } = commentData;
  
  if (!content || String(content).trim() === '') {
    throw new Error('评论内容不能为空');
  }
  
  // 检查讨论是否存在
  const discussion = await db.getOne(
    "SELECT * FROM discussions WHERE id = $1",
    [discussionId]
  );
  
  if (!discussion) {
    throw new Error('讨论不存在');
  }
  
  // 学员不能在隐藏的讨论中评论
  if (!isAdmin && discussion.is_hidden === true) {
    throw new Error('无法在此讨论中评论');
  }
  
  // 如果是回复评论，检查父评论是否存在
  if (parentId) {
    const parent = await db.getOne(
      "SELECT * FROM comments WHERE id = $1 AND discussion_id = $2",
      [parentId, discussionId]
    );
    
    if (!parent) {
      throw new Error('父评论不存在');
    }
  }
  
  const id = `comment-${Date.now()}`;
  const now = new Date().toISOString();
  
  // 获取用户信息
  const user = await db.getOne(
    "SELECT nickname, real_name FROM users WHERE id = $1",
    [userId]
  );
  
  const authorName = user.nickname || user.real_name || '匿名用户';
  
  await db.execute(
    `INSERT INTO comments (
      id, discussion_id, parent_id, author_id, author_name,
      content, created_at, like_count, is_deleted
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, false)`,
    [id, discussionId, parentId || null, userId, authorName, content.trim(), now]
  );
  
  // 更新讨论的评论数和最后活跃时间
  await db.execute(
    "UPDATE discussions SET comment_count = comment_count + 1, last_activity_at = $1 WHERE id = $2",
    [now, discussionId]
  );
  
  return {
    success: true,
    id,
    comment: {
      id,
      discussionId,
      parentId: parentId || null,
      authorId: userId,
      authorName,
      content: content.trim(),
      createdAt: now,
      likeCount: 0,
      isDeleted: false
    }
  };
}

/**
 * 删除评论（递归删除子评论）
 * @param {string} commentId - 评论ID
 * @param {string} userId - 用户ID
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteComment(commentId, userId, isAdmin = false) {
  // 获取评论信息
  const comment = await db.getOne(
    "SELECT * FROM comments WHERE id = $1",
    [commentId]
  );
  
  if (!comment) {
    throw new Error('评论不存在');
  }
  
  // 只有作者或管理员可以删除
  if (comment.author_id !== userId && !isAdmin) {
    throw new Error('无权限删除此评论');
  }
  
  // 递归删除子评论
  const MAX_DEPTH = 100;
  async function deleteCommentAndChildren(cId, depth = 0) {
    if (depth > MAX_DEPTH) {
      throw new Error(`Comment deletion exceeded max depth ${MAX_DEPTH}`);
    }
    const children = await db.getMany(
      "SELECT id FROM comments WHERE parent_id = $1",
      [cId]
    );
    
    for (const child of children) {
      await deleteCommentAndChildren(child.id, depth + 1);
    }
    
    await db.execute("DELETE FROM comments WHERE id = $1", [cId]);
  }
  
  await deleteCommentAndChildren(commentId);
  
  // 更新讨论的评论数
  await db.execute(
    `UPDATE discussions
     SET comment_count = (SELECT COUNT(*) FROM comments WHERE discussion_id = $1)
     WHERE id = $1`,
    [comment.discussion_id]
  );
  
  return { success: true };
}

/**
 * 切换讨论点赞
 * @param {string} discussionId - 讨论ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 点赞结果
 */
export async function toggleDiscussionLike(discussionId, userId) {
  // 检查是否已点赞
  const like = await db.getOne(
    "SELECT * FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2",
    [userId, discussionId]
  );
  
  if (like) {
    // 已点赞，取消点赞
    await db.execute(
      "DELETE FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2 AND comment_id IS NULL",
      [userId, discussionId]
    );
    
    // 减少点赞数（使用条件更新防止负数）
    await db.execute(
      "UPDATE discussions SET like_count = GREATEST(0, like_count - 1) WHERE id = $1",
      [discussionId]
    );
    
    return { success: true, liked: false };
  } else {
    // 未点赞，添加点赞（使用ON CONFLICT防止竞态重复）
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO discussion_likes (user_id, discussion_id, comment_id, created_at) 
       VALUES ($1, $2, NULL, $3)
       ON CONFLICT (user_id, discussion_id, comment_id) DO NOTHING`,
      [userId, discussionId, now]
    );
    
    // 增加点赞数
    await db.execute(
      "UPDATE discussions SET like_count = like_count + 1 WHERE id = $1",
      [discussionId]
    );
    
    return { success: true, liked: true };
  }
}

/**
 * 切换评论点赞
 * @param {string} commentId - 评论ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 点赞结果
 */
export async function toggleCommentLike(commentId, userId) {
  // 检查评论是否存在
  const comment = await db.getOne("SELECT * FROM comments WHERE id = $1", [commentId]);
  
  if (!comment) {
    throw new Error('评论不存在');
  }
  
  // 检查是否已点赞
  const like = await db.getOne(
    "SELECT * FROM discussion_likes WHERE user_id = $1 AND comment_id = $2",
    [userId, commentId]
  );
  
  if (like) {
    // 已点赞，取消点赞
    await db.execute(
      "DELETE FROM discussion_likes WHERE user_id = $1 AND comment_id = $2",
      [userId, commentId]
    );
    
    // 减少点赞数
    await db.execute(
      "UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = $1",
      [commentId]
    );
    
    return { success: true, liked: false };
  } else {
    // 未点赞，添加点赞
    const now = new Date().toISOString();
    await db.execute(
      "INSERT INTO discussion_likes (user_id, discussion_id, comment_id, created_at) VALUES ($1, NULL, $2, $3)",
      [userId, commentId, now]
    );
    
    // 增加点赞数
    await db.execute(
      "UPDATE comments SET like_count = like_count + 1 WHERE id = $1",
      [commentId]
    );
    
    return { success: true, liked: true };
  }
}
