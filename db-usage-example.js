/**
 * 数据库连接池使用示例
 * 展示如何在实际应用中使用 db.js 模块
 */

import db from './db.js';

// ============================================================
// 示例 1: 用户管理
// ============================================================

/**
 * 创建新用户
 */
async function createUser(userData) {
  try {
    const result = await db.execute(
      `INSERT INTO users (id, phone, password, role, nickname, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userData.id, userData.phone, userData.password, userData.role, userData.nickname]
    );
    
    console.log('用户创建成功:', result.rows[0]);
    return { success: true, user: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') {
      return { success: false, error: '手机号已存在' };
    }
    throw error;
  }
}

/**
 * 根据手机号查询用户
 */
async function getUserByPhone(phone) {
  const user = await db.getOne(
    'SELECT * FROM users WHERE phone = $1',
    [phone]
  );
  return user;
}

/**
 * 更新用户信息
 */
async function updateUser(userId, updates) {
  const result = await db.execute(
    `UPDATE users 
     SET nickname = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [updates.nickname, userId]
  );
  
  return result.rows[0];
}

// ============================================================
// 示例 2: 题库和题目管理
// ============================================================

/**
 * 批量导入题目（使用事务）
 */
async function batchImportQuestions(bankId, questions) {
  try {
    const result = await db.transaction(async (client) => {
      let imported = 0;
      
      for (const question of questions) {
        await client.query(
          `INSERT INTO questions (id, bank_id, type, content, options, answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            question.id,
            bankId,
            question.type,
            question.content,
            JSON.stringify(question.options),
            JSON.stringify(question.answer),
            question.explanation
          ]
        );
        imported++;
      }
      
      // 更新题库题目数量
      await client.query(
        'UPDATE banks SET question_count = question_count + $1 WHERE id = $2',
        [imported, bankId]
      );
      
      return { imported, total: questions.length };
    });
    
    console.log(`批量导入完成: ${result.imported}/${result.total}`);
    return { success: true, ...result };
  } catch (error) {
    console.error('批量导入失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 分页查询题目
 */
async function getQuestionsPaginated(bankId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  // 获取总数
  const countResult = await db.getOne(
    'SELECT COUNT(*) as total FROM questions WHERE bank_id = $1',
    [bankId]
  );
  
  // 获取分页数据
  const questions = await db.getMany(
    `SELECT * FROM questions 
     WHERE bank_id = $1 
     ORDER BY sort_order, created_at 
     LIMIT $2 OFFSET $3`,
    [bankId, pageSize, offset]
  );
  
  return {
    data: questions,
    total: parseInt(countResult.total),
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  };
}

/**
 * 使用 JSONB 查询题目
 */
async function searchQuestionsByTag(bankId, tag) {
  // 查询 tags JSONB 数组中包含指定标签的题目
  const questions = await db.getMany(
    `SELECT * FROM questions 
     WHERE bank_id = $1 AND tags @> $2`,
    [bankId, JSON.stringify([tag])]
  );
  
  return questions;
}

// ============================================================
// 示例 3: 考试管理
// ============================================================

/**
 * 创建考试并生成考试历史记录（使用事务）
 */
async function startExam(userId, examId) {
  try {
    const result = await db.transaction(async (client) => {
      // 1. 获取考试信息
      const examResult = await client.query(
        'SELECT * FROM exams WHERE id = $1',
        [examId]
      );
      
      if (examResult.rows.length === 0) {
        throw new Error('考试不存在');
      }
      
      const exam = examResult.rows[0];
      
      // 2. 创建考试历史记录
      const historyId = `history-${Date.now()}-${userId}`;
      await client.query(
        `INSERT INTO exam_history (
          id, user_id, exam_id, exam_title, total_score, pass_score,
          bank_id, is_finished, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          historyId,
          userId,
          examId,
          exam.title,
          exam.total_score,
          exam.pass_score,
          exam.bank_id,
          false
        ]
      );
      
      // 3. 更新考试使用次数
      await client.query(
        'UPDATE banks SET usage_count = usage_count + 1 WHERE id = $1',
        [exam.bank_id]
      );
      
      return { historyId, exam };
    });
    
    console.log('考试开始成功:', result.historyId);
    return { success: true, ...result };
  } catch (error) {
    console.error('开始考试失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 提交考试答案
 */
async function submitExam(historyId, userAnswers, score) {
  const result = await db.execute(
    `UPDATE exam_history 
     SET user_answers = $1, score = $2, is_finished = true, 
         submit_time = CURRENT_TIMESTAMP, passed = (score >= pass_score)
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(userAnswers), score, historyId]
  );
  
  return result.rows[0];
}

// ============================================================
// 示例 4: 统计查询
// ============================================================

/**
 * 获取用户统计信息
 */
async function getUserStats(userId) {
  const stats = await db.getOne(
    `SELECT 
       u.id,
       u.nickname,
       u.accuracy,
       u.mistake_count,
       COUNT(DISTINCT eh.id) as exam_count,
       COUNT(DISTINCT pr.id) as practice_count,
       COUNT(DISTINCT m.question_id) as mistake_question_count,
       COUNT(DISTINCT f.question_id) as favorite_count
     FROM users u
     LEFT JOIN exam_history eh ON u.id = eh.user_id
     LEFT JOIN practice_records pr ON u.id = pr.user_id
     LEFT JOIN mistakes m ON u.id = m.user_id
     LEFT JOIN favorites f ON u.id = f.user_id
     WHERE u.id = $1
     GROUP BY u.id, u.nickname, u.accuracy, u.mistake_count`,
    [userId]
  );
  
  return stats;
}

/**
 * 获取题库统计信息
 */
async function getBankStats(bankId) {
  const stats = await db.getOne(
    `SELECT 
       b.id,
       b.name,
       b.question_count,
       b.usage_count,
       COUNT(DISTINCT e.id) as exam_count,
       COUNT(DISTINCT CASE WHEN q.type = 'SINGLE' THEN q.id END) as single_count,
       COUNT(DISTINCT CASE WHEN q.type = 'MULTIPLE' THEN q.id END) as multiple_count,
       COUNT(DISTINCT CASE WHEN q.type = 'JUDGE' THEN q.id END) as judge_count
     FROM banks b
     LEFT JOIN questions q ON b.id = q.bank_id
     LEFT JOIN exams e ON b.id = e.bank_id
     WHERE b.id = $1
     GROUP BY b.id, b.name, b.question_count, b.usage_count`,
    [bankId]
  );
  
  return stats;
}

// ============================================================
// 主函数 - 运行示例
// ============================================================

async function runExamples() {
  console.log('=== 数据库连接池使用示例 ===\n');
  
  try {
    // 检查连接池状态
    console.log('1. 连接池初始状态:', db.getPoolStatus());
    
    // 测试简单查询
    console.log('\n2. 测试数据库连接:');
    const dbInfo = await db.getOne('SELECT version() as version, current_database() as database');
    console.log('   数据库:', dbInfo.database);
    console.log('   版本:', dbInfo.version.split(',')[0]);
    
    // 检查表是否存在
    console.log('\n3. 检查数据库表:');
    const tables = await db.getMany(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    console.log(`   找到 ${tables.length} 个表:`, tables.map(t => t.table_name).join(', '));
    
    // 检查连接池状态
    console.log('\n4. 连接池当前状态:', db.getPoolStatus());
    
    console.log('\n=== 示例运行完成 ===');
    console.log('\n提示: 更多使用示例请参考 DB_MODULE_USAGE.md 文档');
    
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    // 关闭连接池
    await db.closePool();
  }
}

// 如果直接运行此文件，则执行示例
// 使用更可靠的方式检测是否为主模块
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('db-usage-example')) {
  runExamples();
}

// 导出函数供其他模块使用
export {
  createUser,
  getUserByPhone,
  updateUser,
  batchImportQuestions,
  getQuestionsPaginated,
  searchQuestionsByTag,
  startExam,
  submitExam,
  getUserStats,
  getBankStats
};
