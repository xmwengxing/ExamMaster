/**
 * 笔记服务
 * 处理题目笔记相关的业务逻辑
 */

/**
 * 保存或更新题目笔记
 * 使用 UPSERT 语法（ON CONFLICT）
 * 如果内容为空，则删除笔记
 * @param {Object} db - 数据库连接对象
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @param {string} content - 笔记内容
 * @returns {Promise<Object>} 操作结果 { success: boolean }
 */
export async function saveNote(db, userId, questionId, content) {
  // 如果内容为空，删除笔记
  if (!content || content.trim() === '') {
    await db.execute(
      'DELETE FROM notes WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );
    return { success: true, deleted: true };
  }
  
  // 使用 UPSERT 语法插入或更新笔记
  const query = `
    INSERT INTO notes (user_id, question_id, content)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET content = $3, updated_at = CURRENT_TIMESTAMP
  `;
  
  await db.execute(query, [userId, questionId, content]);
  return { success: true, deleted: false };
}

/**
 * 获取题目笔记
 * @param {Object} db - 数据库连接对象
 * @param {string} userId - 用户ID
 * @param {string} questionId - 题目ID
 * @returns {Promise<Object|null>} 笔记对象或 null
 */
export async function getNote(db, userId, questionId) {
  const note = await db.getOne(
    'SELECT * FROM notes WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  
  if (!note) {
    return null;
  }
  
  return {
    userId: note.user_id,
    questionId: note.question_id,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at
  };
}
