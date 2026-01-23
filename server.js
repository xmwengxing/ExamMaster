
import { validateFillInBlankAnswers } from './utils/questionValidation.js';
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
// 导入 PostgreSQL 数据库连接池
import db from './db.js';

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'edumaster-secure-2025';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Safe parsers for question fields to handle legacy non-JSON values
const parseOptionsField = (val) => {
  if (!val) return [];
  try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch (e) {
    // support legacy pipe-separated options or single option string
    return typeof val === 'string' ? (val.includes('|') ? val.split('|') : [val]) : [];
  }
};

const parseAnswerField = (val) => {
  if (val === undefined || val === null) return '';
  try { return JSON.parse(val); } catch (e) { return val; }
};

// PostgreSQL 数据库已通过 db.js 模块初始化
// 数据库架构通过 postgres/init.sql 脚本创建
console.log('[Server] 使用 PostgreSQL 数据库连接池');
console.log('[Server] 连接池状态:', db.getPoolStatus());

// 鉴权中间件（带详细调试日志）
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  console.log(`[auth] ${req.method} ${req.originalUrl} - authorization header ${authHeader ? 'present' : 'missing'}`);
  if (!token) {
    console.warn('[auth] missing token - responding 401 Unauthorized');
    return res.status(401).send('Unauthorized');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[auth] token verified', { id: decoded.id, role: decoded.role });
    req.user = decoded;
    next();
  } catch (err) {
    console.warn('[auth] token verification failed -', err && err.message ? err.message : err);
    // Log a truncated token for debugging (避免在日志中打印完整 token)
    console.debug('[auth] token (truncated):', token && token.slice(0, 80));
    return res.status(403).send('Forbidden');
  }
};

// --- API 路由 ---

// 健康检查端点（用于 Docker 健康检查）
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await db.execute('SELECT 1');
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('[Health Check] 数据库连接失败:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 1. 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password, role } = req.body;
    
    // 查询用户
    const user = await db.getOne(
      'SELECT * FROM users WHERE phone = $1 AND role = $2',
      [phone, role]
    );
    
    if (user && bcrypt.compareSync(password, user.password)) {
      // 使用ISO格式的时间戳
      const nowISO = new Date().toISOString();
      const now = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });
      
      let loginHistory = [];
      try {
        loginHistory = user.login_history ? user.login_history : [];
      } catch (e) {
        loginHistory = [];
      }
      
      // 添加新的登录记录（保留最近100条）
      loginHistory.push(now);
      if (loginHistory.length > 100) {
        loginHistory = loginHistory.slice(-100);
      }
      
      // 更新数据库（包括 lastActivity）
      await db.execute(
        'UPDATE users SET last_login = $1, login_history = $2, last_activity = $3 WHERE id = $4',
        [now, JSON.stringify(loginHistory), nowISO, user.id]
      );
      
      // 插入登录日志到 login_logs 表（使用ISO格式便于统计）
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      await db.execute(
        'INSERT INTO login_logs (id, user_id, phone, role, time, ip) VALUES ($1, $2, $3, $4, $5, $6)',
        [logId, user.id, phone, role, nowISO, ip]
      );
      
      console.log('[Login] Login log recorded:', { userId: user.id, phone, role });
      
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safeUser } = user;
      
      // 返回更新后的用户信息
      res.json({ 
        token, 
        user: { 
          ...safeUser, 
          lastLogin: now,
          loginHistory: loginHistory 
        } 
      });
    } else {
      res.status(401).send('账号或密码错误');
    }
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).send('登录失败');
  }
});

// 2. 用户资料
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await db.getOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('Not found');
    }
  } catch (error) {
    console.error('[Profile] Error:', error);
    res.status(500).send('获取用户资料失败');
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => k !== 'id');
    const setClause = fields.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = fields.map(k => {
      return typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : req.body[k];
    });
    
    await db.execute(
      `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1}`,
      [...values, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).send(error.message);
  }
});

// Change user password (for students and admins)
app.post('/api/user/change-password', auth, async (req, res) => {
  console.log('[change-password] POST /api/user/change-password', { user: req.user && { id: req.user.id, role: req.user.role } });
  
  try {
    const { old, newP } = req.body;
    
    if (!old || !newP) {
      console.warn('[change-password] Missing old or new password');
      return res.status(400).json({ error: '请提供旧密码和新密码' });
    }
    
    if (newP.length < 4) {
      console.warn('[change-password] New password too short');
      return res.status(400).json({ error: '新密码长度至少为4位' });
    }
    
    // 获取当前用户信息
    const user = await db.getOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (!user) {
      console.warn('[change-password] User not found:', req.user.id);
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证旧密码
    if (!bcrypt.compareSync(old, user.password)) {
      console.warn('[change-password] Old password incorrect');
      return res.status(401).json({ error: '旧密码不正确' });
    }
    
    // 加密新密码
    const newHash = bcrypt.hashSync(newP, 10);
    
    // 更新密码
    await db.execute('UPDATE users SET password = $1 WHERE id = $2', [newHash, req.user.id]);
    
    console.log('[change-password] Password changed successfully for user:', req.user.id);
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('[change-password] Error:', error);
    res.status(500).send(error.message);
  }
});

// Heartbeat endpoint - updates lastActivity to track online status
app.post('/api/user/heartbeat', auth, async (req, res) => {
  try {
    const lastActivity = new Date().toISOString();
    await db.execute('UPDATE users SET last_activity = $1 WHERE id = $2', [lastActivity, req.user.id]);
    res.json({ success: true, lastActivity });
  } catch (error) {
    console.error('[Heartbeat] Failed to update lastActivity:', error);
    res.status(500).send(error.message);
  }
});

// Reset user learning data (keep profile info)
app.post('/api/user/reset', auth, async (req, res) => {
  const userId = req.user.id;
  console.log('[Reset] User data reset requested:', { userId, role: req.user.role });
  
  try {
    // 使用事务确保数据一致性
    await db.transaction(async (client) => {
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
        'discussion_likes',    // 讨论点赞（可选，看是否要保留）
        'comments'             // 评论（可选，看是否要保留）
      ];
      
      // 删除所有表中的用户数据
      for (const table of tables) {
        const sql = `DELETE FROM ${table} WHERE user_id = $1`;
        await client.query(sql, [userId]);
        console.log(`[Reset] Cleared ${table} for user ${userId}`);
      }
      
      // 重置用户统计数据（保留个人资料）
      await client.query(
        'UPDATE users SET accuracy = 0, mistake_count = 0, daily_goal = 20 WHERE id = $1',
        [userId]
      );
      
      console.log('[Reset] Successfully reset all data for user:', userId);
    });
    
    res.json({ 
      success: true, 
      message: '学习数据已成功重置',
      clearedTables: 10
    });
  } catch (error) {
    console.error('[Reset] Error:', error);
    res.status(500).json({ error: '重置失败: ' + error.message });
  }
});

// 3. 题库与题目
app.get('/api/banks', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM banks');
    const banks = (rows || []).map(bank => ({
      ...bank,
      score_config: bank.score_config ? bank.score_config : { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 }
    }));
    res.json(banks);
  } catch (error) {
    console.error('[Banks] Error:', error);
    res.status(500).send('获取题库失败');
  }
});

app.get('/api/questions', auth, async (req, res) => {
  try {
    const { bankId } = req.query;
    let rows;
    
    if (bankId) {
      // 按 sortOrder 排序，如果 sortOrder 相同则按 id 排序
      rows = await db.getMany(
        'SELECT * FROM questions WHERE bank_id = $1 ORDER BY sort_order ASC, id ASC',
        [bankId]
      );
    } else {
      // 返回所有题目，按 bankId 和 sortOrder 排序
      rows = await db.getMany(
        'SELECT * FROM questions ORDER BY bank_id ASC, sort_order ASC, id ASC'
      );
    }
    
    res.json((rows || []).map(r => ({
      ...r,
      options: parseOptionsField(r.options),
      answer: parseAnswerField(r.answer),
      blanks: r.blanks || null,
      tags: r.tags || null,
      aiGradingEnabled: r.ai_grading_enabled || false
    })));
  } catch (error) {
    console.error('[Questions] Error:', error);
    res.status(500).json({ error: '查询题目失败: ' + error.message });
  }
});

// --- Banks CRUD (admin) ---
app.post('/api/banks', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const b = req.body;
    const id = b.id || `bank-${Date.now()}`;
    
    await db.execute(
      `INSERT INTO banks (id, name, category, level, description, question_count, score_config, usage_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        b.name || '',
        b.category || '',
        b.level || '',
        b.description || '',
        b.questionCount || 0,
        JSON.stringify(b.scoreConfig || {}),
        b.usageCount || 0
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Banks] Create error:', error);
    res.status(500).send(error.message);
  }
});

app.put('/api/banks/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const fields = Object.keys(req.body);
    const setClause = fields.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = fields.map(k => typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : req.body[k]);
    
    await db.execute(
      `UPDATE banks SET ${setClause} WHERE id = $${fields.length + 1}`,
      [...values, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Banks] Update error:', error);
    res.status(500).send(error.message);
  }
});

app.delete('/api/banks/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    // PostgreSQL 的外键约束会自动删除关联的题目（ON DELETE CASCADE）
    await db.execute('DELETE FROM banks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('[Banks] Delete error:', error);
    res.status(500).send(error.message);
  }
});

// --- Questions CRUD (admin) ---
app.post('/api/questions', auth, async (req, res) => {
  const q = req.body;
  console.log('[questions] POST /api/questions', { user: req.user && { id: req.user.id, role: req.user.role }, bankId: q?.bankId, type: q?.type, contentPreview: String(q?.content || '').slice(0, 64) });
  if (!req.user || req.user.role !== 'ADMIN') {
    console.warn('[questions] Forbidden', req.user);
    return res.status(403).send('Forbidden');
  }
  
  // Validate fill-in-blank questions
  if (q.type === 'FILL_IN_BLANK') {
    if (!q.blanks || !Array.isArray(q.blanks) || q.blanks.length === 0) {
      return res.status(400).json({ error: '填空题必须配置空白项' });
    }
    // Validate blank configuration
    for (const blank of q.blanks) {
      if (!blank.id || !blank.acceptedAnswers || blank.acceptedAnswers.length === 0) {
        return res.status(400).json({ error: '填空项配置不完整' });
      }
    }
  }
  
  // Validate short answer questions
  if (q.type === 'SHORT_ANSWER') {
    if (!q.referenceAnswer || String(q.referenceAnswer).trim() === '') {
      return res.status(400).json({ error: '简答题必须提供参考答案' });
    }
  }
  
  const id = q.id || `q-${Date.now()}`;
  
  try {
    // 使用事务确保数据一致性
    await db.transaction(async (client) => {
      // 插入题目（使用 PostgreSQL 语法和字段名）
      await client.query(
        `INSERT INTO questions (
          id, bank_id, type, content, options, answer, explanation, 
          blanks, reference_answer, ai_grading_enabled, tags, chapter
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          q.bankId || '',
          q.type || 'SINGLE',
          q.content || '',
          q.options || [],
          q.answer || '',
          q.explanation || '',
          q.blanks || null,
          q.referenceAnswer || null,
          q.aiGradingEnabled || false,
          q.tags || null,
          q.chapter || null
        ]
      );
      
      // 更新题库题目数量
      if (q.bankId) {
        await client.query(
          'UPDATE banks SET question_count = COALESCE(question_count, 0) + 1 WHERE id = $1',
          [q.bankId]
        );
      }
      
      // 更新标签使用次数
      if (q.tags && Array.isArray(q.tags)) {
        for (const tagId of q.tags) {
          await client.query(
            'UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1',
            [tagId]
          );
          await client.query(
            'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, tagId]
          );
        }
      }
    });
    
    const created = {
      id,
      bankId: q.bankId || '',
      type: q.type || 'SINGLE',
      content: q.content || '',
      options: q.options || [],
      answer: q.answer || '',
      explanation: q.explanation || '',
      blanks: q.blanks || null,
      referenceAnswer: q.referenceAnswer || null,
      aiGradingEnabled: q.aiGradingEnabled || false,
      tags: q.tags || null
    };
    
    console.log('[questions] Question created successfully:', id);
    res.json({ success: true, id, question: created });
  } catch (error) {
    console.error('[questions] Insert error:', error);
    res.status(500).send(error.message);
  }
});

// Import multiple questions into a bank
app.post('/api/banks/:id/import', auth, async (req, res) => {
  console.log('[import] POST /api/banks/:id/import', { 
    params: req.params, 
    bodySummary: Array.isArray(req.body?.questions) ? req.body.questions.length : undefined, 
    user: req.user && { id: req.user.id, role: req.user.role } 
  });
  
  if (!req.user || req.user.role !== 'ADMIN') {
    console.warn('[import] forbidden for user', req.user);
    return res.status(403).send('Forbidden');
  }
  
  const bankId = req.params.id;
  const { questions } = req.body || {};
  
  if (!Array.isArray(questions) || questions.length === 0) {
    console.log('[import] No questions to import');
    return res.json({ success: true, inserted: 0 });
  }
  
  console.log('[import] Importing', questions.length, 'questions to bank', bankId);
  
  try {
    let inserted = 0;
    let skipped = 0;
    const errors = [];
    
    // 使用事务批量导入
    await db.transaction(async (client) => {
      // 获取当前题库中最大的 sort_order 值
      const maxOrderResult = await client.query(
        'SELECT MAX(sort_order) as max_order FROM questions WHERE bank_id = $1',
        [bankId]
      );
      
      // 从最大值+1开始，如果没有题目则从1开始
      let startOrder = (maxOrderResult.rows[0]?.max_order !== null) 
        ? maxOrderResult.rows[0].max_order + 1 
        : 1;
      
      // 批量插入题目
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const rowNum = i + 2; // CSV行号（+1标题行+1从1开始）
        
        try {
          // 生成唯一ID：使用时间戳+随机数+索引，确保唯一性
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
          const id = q.id || `q-${timestamp}-${random}-${i}`;
          
          const sortOrder = startOrder + i; // 按导入顺序设置排序值
          
          // 插入题目（使用 PostgreSQL 字段名）
          await client.query(
            `INSERT INTO questions (
              id, bank_id, type, content, options, answer, explanation,
              blanks, reference_answer, ai_grading_enabled, tags, chapter, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              id,
              bankId,
              q.type || 'SINGLE',
              q.content || '',
              q.options || [],
              q.answer || '',
              q.explanation || '',
              q.blanks || null,
              q.referenceAnswer || null,
              q.aiGradingEnabled || false,
              q.tags || null,
              q.chapter || null,
              sortOrder
            ]
          );
          
          inserted++;
        } catch (err) {
          skipped++;
          const errorMsg = err.message || String(err);
          console.error(`[import] Error at row ${rowNum}:`, errorMsg);
          
          // 特殊处理错误类型
          if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
            errors.push(`第${rowNum}行：题目ID重复（请检查是否重复导入）`);
          } else if (errorMsg.includes('null value') || errorMsg.includes('NOT NULL')) {
            errors.push(`第${rowNum}行：必填字段为空`);
          } else {
            errors.push(`第${rowNum}行：${errorMsg}`);
          }
        }
      }
      
      // 更新题库题目数量
      if (inserted > 0) {
        await client.query(
          'UPDATE banks SET question_count = COALESCE(question_count, 0) + $1 WHERE id = $2',
          [inserted, bankId]
        );
      }
    });
    
    console.log(`[import] Transaction committed: ${inserted} inserted, ${skipped} skipped`);
    
    // 返回结果
    res.json({ 
      success: true, 
      inserted,
      skipped,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[import] Import failed:', error);
    res.status(500).json({ 
      error: error.message,
      inserted: 0,
      skipped: questions.length
    });
  }
});

app.put('/api/questions/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const body = req.body;
  
  // 验证内容大小（防止过大的 base64 图片导致问题）
  const contentSize = JSON.stringify(body).length;
  if (contentSize > 10 * 1024 * 1024) { // 10MB 限制
    return res.status(413).json({ error: '题目内容过大，请压缩图片后重试（单个题目不超过10MB）' });
  }
  
  // Validate fill-in-blank questions
  if (body.type === 'FILL_IN_BLANK' && body.blanks) {
    if (!Array.isArray(body.blanks) || body.blanks.length === 0) {
      return res.status(400).json({ error: '填空题必须配置空白项' });
    }
  }
  
  try {
    // 使用事务确保数据一致性
    await db.transaction(async (client) => {
      // 获取旧标签
      const oldRow = await client.query(
        'SELECT tags FROM questions WHERE id = $1',
        [req.params.id]
      );
      
      const oldTags = oldRow.rows[0]?.tags || [];
      const newTags = body.tags || [];
      
      // 计算标签变化
      const removedTags = oldTags.filter(t => !newTags.includes(t));
      const addedTags = newTags.filter(t => !oldTags.includes(t));
      
      // 构建更新语句（转换字段名为 snake_case）
      const fieldMap = {
        'bankId': 'bank_id',
        'aiGradingEnabled': 'ai_grading_enabled',
        'referenceAnswer': 'reference_answer',
        'sortOrder': 'sort_order'
      };
      
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of Object.keys(body)) {
        const dbKey = fieldMap[key] || key;
        fields.push(`${dbKey} = $${paramIndex++}`);
        values.push(body[key]);
      }
      
      if (fields.length > 0) {
        values.push(req.params.id);
        await client.query(
          `UPDATE questions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
      
      // 更新标签关联
      for (const tagId of removedTags) {
        await client.query(
          'UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = $1',
          [tagId]
        );
        await client.query(
          'DELETE FROM question_tags WHERE question_id = $1 AND tag_id = $2',
          [req.params.id, tagId]
        );
      }
      
      for (const tagId of addedTags) {
        await client.query(
          'UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1',
          [tagId]
        );
        await client.query(
          'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, tagId]
        );
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[更新题目] 数据库更新失败:', error);
    res.status(500).json({ error: '更新题目失败: ' + error.message });
  }
});

app.delete('/api/questions/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const qId = req.params.id;
    
    // 使用事务确保数据一致性
    await db.transaction(async (client) => {
      // 获取题目信息
      const row = await client.query('SELECT bank_id FROM questions WHERE id = $1', [qId]);
      const bankId = row.rows[0]?.bank_id;
      
      // 删除题目（外键约束会自动删除关联的 question_tags）
      await client.query('DELETE FROM questions WHERE id = $1', [qId]);
      
      // 更新题库题目数量
      if (bankId) {
        await client.query(
          'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - 1, 0) WHERE id = $1',
          [bankId]
        );
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[删除题目] 错误:', error);
    res.status(500).send(error.message);
  }
});

app.post('/api/questions/batch-delete', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true });
    
    // 使用事务批量删除
    await db.transaction(async (client) => {
      // 统计每个题库的题目数量
      const countResult = await client.query(
        'SELECT bank_id, COUNT(*) as c FROM questions WHERE id = ANY($1) GROUP BY bank_id',
        [ids]
      );
      
      // 批量删除题目
      await client.query('DELETE FROM questions WHERE id = ANY($1)', [ids]);
      
      // 更新每个题库的题目数量
      for (const row of countResult.rows) {
        if (row.bank_id) {
          await client.query(
            'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - $1, 0) WHERE id = $2',
            [row.c, row.bank_id]
          );
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[批量删除题目] 错误:', error);
    res.status(500).send(error.message);
  }
});

// --- Admin: Students management ---
app.post('/api/admin/students', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const s = req.body;
    const id = s.id || `student-${Date.now()}`;
    
    // 默认密码逻辑：如果没有提供密码，使用手机号后6位；如果手机号不足6位，使用123456
    let password = s.password;
    if (!password) {
      const phone = s.phone || '';
      password = phone.length >= 6 ? phone.slice(-6) : '123456';
    }
    
    const hash = bcrypt.hashSync(password, 10);
    console.log('[add-student] Adding student:', { phone: s.phone, passwordUsed: password === '123456' ? '123456 (fallback)' : 'phone last 6 digits' });
    
    await db.execute(
      'INSERT INTO users (id, phone, password, role, nickname, real_name, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, s.phone || `phone-${Date.now()}`, hash, 'STUDENT', s.nickname || '', s.realName || '', s.avatar || '']
    );
    
    console.log('[add-student] Student added successfully:', id);
    res.json({ success: true, id });
  } catch (error) {
    console.error('[add-student] Error:', error);
    res.status(500).send(error.message);
  }
});

app.get('/api/admin/students', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany("SELECT * FROM users WHERE role = 'STUDENT'");
    
    const normalizeArrayField = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          const p = JSON.parse(v);
          if (Array.isArray(p)) return p;
          if (typeof p === 'string') {
            try {
              const q = JSON.parse(p);
              if (Array.isArray(q)) return q;
            } catch (e) {}
          }
        } catch (e) {}
        const match = v.match(/bank-[0-9]+/g);
        if (match) return match;
        return [];
      }
      return [];
    };

    // Calculate isOnline based on lastActivity (online if active within last 5 minutes)
    const now = Date.now();
    const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

    const out = (rows || []).map(r => {
      const lastActivity = r.last_activity ? new Date(r.last_activity).getTime() : 0;
      const isOnline = (now - lastActivity) < ONLINE_THRESHOLD;
      
      return {
        ...r,
        studentPerms: normalizeArrayField(r.student_perms),
        allowedBankIds: normalizeArrayField(r.allowed_bank_ids),
        loginHistory: normalizeArrayField(r.login_history),
        totalOnlineTime: r.total_online_time || 0,
        isOnline: isOnline,
        // 字段名转换以保持前端兼容
        realName: r.real_name,
        lastActivity: r.last_activity,
        lastLogin: r.last_login
      };
    });
    
    res.json(out);
  } catch (error) {
    console.error('[Students] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin-only maintenance: repair double-encoded student permission fields (idempotent)
app.post('/api/admin/repair-student-schema', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany("SELECT id, student_perms, allowed_bank_ids FROM users WHERE role = 'STUDENT'");
    
    let updated = 0;
    
    for (const row of rows) {
      const normalize = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') {
          try {
            let p = JSON.parse(v);
            if (typeof p === 'string') p = JSON.parse(p);
            if (Array.isArray(p)) return p;
          } catch (e) {}
        }
        return null;
      };
      
      const perms = normalize(row.student_perms);
      const banks = normalize(row.allowed_bank_ids);
      
      if (perms !== null || banks !== null) {
        await db.execute(
          'UPDATE users SET student_perms = $1, allowed_bank_ids = $2 WHERE id = $3',
          [perms || [], banks || [], row.id]
        );
        updated++;
      }
    }
    
    res.json({ success: true, updated });
  } catch (error) {
    console.error('[Repair Schema] Error:', error);
    res.status(500).send(error.message);
  }
});

app.get('/api/admin/admins', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany("SELECT * FROM users WHERE role = 'ADMIN'");
    
    // 解析permissions字段（PostgreSQL JSONB 自动解析，但需要处理 null）
    const admins = (rows || []).map(admin => {
      let permissions = admin.permissions;
      
      // 处理null或undefined
      if (!permissions) {
        permissions = [];
      }
      // 如果是字符串（不应该发生，但为了兼容性）
      else if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          console.error('[GET /api/admin/admins] Failed to parse permissions:', e);
          permissions = [];
        }
      }
      
      return {
        ...admin,
        permissions: Array.isArray(permissions) ? permissions : [],
        // 字段名转换
        realName: admin.real_name,
        lastLogin: admin.last_login,
        lastActivity: admin.last_activity
      };
    });
    
    res.json(admins);
  } catch (error) {
    console.error('[Admins] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create admin account
app.post('/api/admin/admins', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const a = req.body;
    const id = a.id || `admin-${Date.now()}`;
    const password = a.password || '123456';
    const hash = bcrypt.hashSync(password, 10);
    
    await db.execute(
      'INSERT INTO users (id, phone, password, role, nickname, real_name, avatar, permissions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        id, 
        a.phone || `admin-${Date.now()}`, 
        hash, 
        'ADMIN', 
        a.nickname || '', 
        a.realName || '', 
        a.avatar || '', 
        a.permissions || []
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Create Admin] Error:', error);
    res.status(500).send(error.message);
  }
});

// Update admin account
app.put('/api/admin/admins/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const body = req.body;
    
    // 如果修改密码，需要加密
    if (body.password) {
      body.password = bcrypt.hashSync(body.password, 10);
    }
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // 构建动态更新语句
    for (const key of Object.keys(body)) {
      // 转换字段名为 snake_case
      const dbKey = key === 'realName' ? 'real_name' : key;
      fields.push(`${dbKey} = $${paramIndex++}`);
      values.push(body[key]);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Update Admin] Error:', error);
    res.status(500).send(error.message);
  }
});

// Delete admin account
app.delete('/api/admin/admins/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const adminId = req.params.id;
    
    // 防止删除超级管理员
    if (adminId === 'admin-1') {
      return res.status(403).json({ error: '不能删除超级管理员账号' });
    }
    
    await db.execute("DELETE FROM users WHERE id = $1 AND role = 'ADMIN'", [adminId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Delete Admin] Error:', error);
    res.status(500).send(error.message);
  }
});

// Change admin password
app.post('/api/admin/change-password', auth, async (req, res) => {
  console.log('[change-password] POST /api/admin/change-password', { user: req.user && { id: req.user.id, role: req.user.role } });
  
  if (!req.user || req.user.role !== 'ADMIN') {
    console.warn('[change-password] Forbidden - user is not admin');
    return res.status(403).send('Forbidden');
  }
  
  try {
    const { old, newP } = req.body;
    
    if (!old || !newP) {
      console.warn('[change-password] Missing old or new password');
      return res.status(400).json({ error: '请提供旧密码和新密码' });
    }
    
    if (newP.length < 4) {
      console.warn('[change-password] New password too short');
      return res.status(400).json({ error: '新密码长度至少为4位' });
    }
    
    // 获取当前管理员信息
    const user = await db.getOne("SELECT * FROM users WHERE id = $1 AND role = 'ADMIN'", [req.user.id]);
    
    if (!user) {
      console.warn('[change-password] User not found:', req.user.id);
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证旧密码
    if (!bcrypt.compareSync(old, user.password)) {
      console.warn('[change-password] Old password incorrect');
      return res.status(401).json({ error: '旧密码不正确' });
    }
    
    // 加密新密码
    const newHash = bcrypt.hashSync(newP, 10);
    
    // 更新密码
    await db.execute('UPDATE users SET password = $1 WHERE id = $2', [newHash, req.user.id]);
    
    console.log('[change-password] Password changed successfully for user:', req.user.id);
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('[change-password] Error:', error);
    res.status(500).send(error.message);
  }
});

app.put('/api/admin/students/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const body = req.body;
    
    // Filter out computed/virtual fields that don't exist in database
    const { isOnline, ...updateData } = body;
    
    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    }
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // 构建动态更新语句，转换字段名为 snake_case
    for (const key of Object.keys(updateData)) {
      let dbKey = key;
      if (key === 'realName') dbKey = 'real_name';
      else if (key === 'studentPerms') dbKey = 'student_perms';
      else if (key === 'allowedBankIds') dbKey = 'allowed_bank_ids';
      else if (key === 'loginHistory') dbKey = 'login_history';
      else if (key === 'totalOnlineTime') dbKey = 'total_online_time';
      else if (key === 'lastActivity') dbKey = 'last_activity';
      else if (key === 'lastLogin') dbKey = 'last_login';
      
      fields.push(`${dbKey} = $${paramIndex++}`);
      values.push(updateData[key]);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Update Student] Error:', error);
    res.status(500).send(error.message);
  }
});

app.post('/api/admin/students/batch-delete', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true });
    
    // 使用 ANY 操作符进行批量删除
    await db.execute('DELETE FROM users WHERE id = ANY($1)', [ids]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Batch Delete Students] Error:', error);
    res.status(500).send(error.message);
  }
});

// Batch set permissions for students
app.post('/api/admin/students/batch-perms', auth, async (req, res) => {
  console.log('[batch-perms] POST /api/admin/students/batch-perms', { body: req.body, user: req.user && { id: req.user.id, role: req.user.role } });
  
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const data = req.body || {};
    const entries = Object.entries(data);
    console.log('[batch-perms] Updating', entries.length, 'students');
    
    // 使用事务批量更新
    await db.transaction(async (client) => {
      for (const [id, v] of entries) {
        const payload = v;
        console.log('[batch-perms] Updating student:', id, 'perms:', payload.studentPerms, 'bankIds:', payload.allowedBankIds);
        
        await client.query(
          'UPDATE users SET student_perms = $1, allowed_bank_ids = $2 WHERE id = $3',
          [payload.studentPerms || [], payload.allowedBankIds || [], id]
        );
      }
    });
    
    console.log('[batch-perms] All updates complete');
    res.json({ success: true });
  } catch (error) {
    console.error('[Batch Perms] Error:', error);
    res.status(500).send(error.message);
  }
});

// Update single student's perms
app.put('/api/admin/students/:id/perms', auth, async (req, res) => {
  console.log('[perms] PUT /api/admin/students/:id/perms', { params: req.params, body: req.body, user: req.user && { id: req.user.id, role: req.user.role } });
  
  if (!req.user || req.user.role !== 'ADMIN') {
    console.warn('[perms] forbidden', req.user);
    return res.status(403).send('Forbidden');
  }
  
  try {
    const id = req.params.id;
    const { studentPerms, allowedBankIds } = req.body || {};
    
    await db.execute(
      'UPDATE users SET student_perms = $1, allowed_bank_ids = $2 WHERE id = $3',
      [studentPerms || [], allowedBankIds || [], id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Update Perms] Error:', error);
    res.status(500).send(error.message);
  }
});

// 4. 练习记录
app.get('/api/practice', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM practice_records WHERE user_id = $1', [req.user.id]);
    // PostgreSQL JSONB 字段自动解析，无需手动 JSON.parse
    res.json(rows || []);
  } catch (error) {
    console.error('[Practice] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/practice', auth, async (req, res) => {
  try {
    const data = req.body;
    const sql = `INSERT INTO practice_records (
      id, user_id, bank_id, bank_name, type, question_type_filter, 
      mode, count, date, current_index, user_answers, is_custom
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
    
    await db.execute(sql, [
      data.id, 
      req.user.id, 
      data.bankId, 
      data.bankName, 
      data.type, 
      data.questionTypeFilter, 
      data.mode, 
      data.count, 
      data.date, 
      data.currentIndex, 
      data.userAnswers, // PostgreSQL JSONB 自动处理
      data.isCustom || false
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Practice] Create error:', error);
    res.status(500).send(error.message);
  }
});

app.put('/api/practice/:id', auth, async (req, res) => {
  try {
    const { currentIndex, userAnswers, date } = req.body;
    const updateDate = date || new Date().toLocaleString();
    
    console.log('[PUT /api/practice/:id] 更新练习记录:', {
      id: req.params.id,
      userId: req.user.id,
      currentIndex,
      answersCount: Object.keys(userAnswers || {}).length,
      date: updateDate
    });
    
    const result = await db.execute(
      `UPDATE practice_records 
       SET current_index = $1, user_answers = $2, date = $3 
       WHERE id = $4 AND user_id = $5`, 
      [currentIndex, userAnswers, updateDate, req.params.id, req.user.id]
    );
    
    console.log('[PUT /api/practice/:id] 更新成功, 影响行数:', result.rowCount);
    
    if (result.rowCount === 0) {
      console.warn('[PUT /api/practice/:id] 警告: 没有记录被更新，可能记录不存在或userId不匹配');
    }
    
    res.json({ success: true, changes: result.rowCount });
  } catch (error) {
    console.error('[PUT /api/practice/:id] 更新失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除练习记录
app.delete('/api/practice/:id', auth, async (req, res) => {
  try {
    const practiceId = req.params.id;
    const userId = req.user.id;
    
    // 验证记录所有权
    const row = await db.getOne(
      'SELECT * FROM practice_records WHERE id = $1 AND user_id = $2', 
      [practiceId, userId]
    );
    
    if (!row) {
      return res.status(404).json({ error: '练习记录不存在或无权限删除' });
    }
    
    // 删除记录
    await db.execute(
      'DELETE FROM practice_records WHERE id = $1 AND user_id = $2', 
      [practiceId, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Practice] Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Exam Management API ---
// Get all exams
app.get('/api/exams', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM exams');
    
    // PostgreSQL JSONB 字段自动解析，但需要处理布尔值
    const exams = (rows || []).map(exam => ({
      ...exam,
      selectedQuestionIds: exam.selected_question_ids || [],
      isVisible: exam.is_visible,
      singleCount: exam.single_count || 0,
      multipleCount: exam.multiple_count || 0,
      judgeCount: exam.judge_count || 0,
      fillBlankCount: exam.fill_blank_count || 0,
      shortAnswerCount: exam.short_answer_count || 0,
      // 移除下划线字段，保持前端兼容
      bankId: exam.bank_id,
      totalScore: exam.total_score,
      passScore: exam.pass_score,
      passScorePercent: exam.pass_score_percent,
      startTime: exam.start_time,
      endTime: exam.end_time
    }));
    
    res.json(exams);
  } catch (error) {
    console.error('[Exams] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new exam
app.post('/api/exams', auth, async (req, res) => {
  console.log('[POST /api/exams] Creating exam:', req.body);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  try {
    const exam = req.body;
    const id = exam.id || `exam-${Date.now()}`;
    
    await db.execute(
      `INSERT INTO exams (
        id, bank_id, title, duration, total_score, pass_score, pass_score_percent, 
        strategy, selected_question_ids, status, is_visible, start_time, end_time, 
        single_count, multiple_count, judge_count, fill_blank_count, short_answer_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        id,
        exam.bankId,
        exam.title,
        exam.duration,
        exam.totalScore,
        exam.passScore,
        exam.passScorePercent,
        exam.strategy,
        exam.selectedQuestionIds || [],
        exam.status || 'PENDING',
        exam.isVisible || false,
        exam.startTime || null,
        exam.endTime || null,
        exam.singleCount || 0,
        exam.multipleCount || 0,
        exam.judgeCount || 0,
        exam.fillBlankCount || 0,
        exam.shortAnswerCount || 0
      ]
    );
    
    console.log('[POST /api/exams] Exam created successfully:', id);
    res.json({ success: true, id });
  } catch (error) {
    console.error('[POST /api/exams] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update exam
app.put('/api/exams/:id', auth, async (req, res) => {
  console.log('[PUT /api/exams/:id] Updating exam:', req.params.id, req.body);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  try {
    const exam = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (exam.bankId !== undefined) { fields.push(`bank_id = $${paramIndex++}`); values.push(exam.bankId); }
    if (exam.title !== undefined) { fields.push(`title = $${paramIndex++}`); values.push(exam.title); }
    if (exam.duration !== undefined) { fields.push(`duration = $${paramIndex++}`); values.push(exam.duration); }
    if (exam.totalScore !== undefined) { fields.push(`total_score = $${paramIndex++}`); values.push(exam.totalScore); }
    if (exam.passScore !== undefined) { fields.push(`pass_score = $${paramIndex++}`); values.push(exam.passScore); }
    if (exam.passScorePercent !== undefined) { fields.push(`pass_score_percent = $${paramIndex++}`); values.push(exam.passScorePercent); }
    if (exam.strategy !== undefined) { fields.push(`strategy = $${paramIndex++}`); values.push(exam.strategy); }
    if (exam.selectedQuestionIds !== undefined) { fields.push(`selected_question_ids = $${paramIndex++}`); values.push(exam.selectedQuestionIds); }
    if (exam.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(exam.status); }
    if (exam.isVisible !== undefined) { fields.push(`is_visible = $${paramIndex++}`); values.push(exam.isVisible); }
    if (exam.startTime !== undefined) { fields.push(`start_time = $${paramIndex++}`); values.push(exam.startTime); }
    if (exam.endTime !== undefined) { fields.push(`end_time = $${paramIndex++}`); values.push(exam.endTime); }
    if (exam.singleCount !== undefined) { fields.push(`single_count = $${paramIndex++}`); values.push(exam.singleCount); }
    if (exam.multipleCount !== undefined) { fields.push(`multiple_count = $${paramIndex++}`); values.push(exam.multipleCount); }
    if (exam.judgeCount !== undefined) { fields.push(`judge_count = $${paramIndex++}`); values.push(exam.judgeCount); }
    if (exam.fillBlankCount !== undefined) { fields.push(`fill_blank_count = $${paramIndex++}`); values.push(exam.fillBlankCount); }
    if (exam.shortAnswerCount !== undefined) { fields.push(`short_answer_count = $${paramIndex++}`); values.push(exam.shortAnswerCount); }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE exams SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    console.log('[PUT /api/exams/:id] Exam updated successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/exams/:id] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete exam
app.delete('/api/exams/:id', auth, async (req, res) => {
  console.log('[DELETE /api/exams/:id] Deleting exam:', req.params.id);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  try {
    await db.execute('DELETE FROM exams WHERE id = $1', [req.params.id]);
    console.log('[DELETE /api/exams/:id] Exam deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/exams/:id] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle exam visibility
app.post('/api/exams/:id/toggle-visibility', auth, async (req, res) => {
  console.log('[POST /api/exams/:id/toggle-visibility] Toggling visibility:', req.params.id);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  try {
    const row = await db.getOne('SELECT is_visible FROM exams WHERE id = $1', [req.params.id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    const newVisibility = !row.is_visible;
    
    await db.execute('UPDATE exams SET is_visible = $1 WHERE id = $2', [newVisibility, req.params.id]);
    
    console.log('[POST /api/exams/:id/toggle-visibility] Visibility toggled successfully');
    res.json({ success: true, isVisible: newVisibility });
  } catch (error) {
    console.error('[POST /api/exams/:id/toggle-visibility] Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Exams history: read from exam_history table (for current user)
app.get('/api/exams/history', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM exam_history WHERE user_id = $1', [req.user.id]);
    
    // PostgreSQL JSONB 字段自动解析，但需要转换字段名以保持前端兼容
    const parsed = (rows || []).map(r => ({
      ...r,
      userId: r.user_id,
      examId: r.exam_id,
      examTitle: r.exam_title,
      totalScore: r.total_score,
      passScore: r.pass_score,
      timeUsed: r.time_used,
      submitTime: r.submit_time,
      bankId: r.bank_id,
      wrongQuestionIds: r.wrong_question_ids || [],
      userAnswers: r.user_answers || {},
      currentIndex: r.current_index,
      isFinished: r.is_finished,
      examConfig: r.exam_config,
      orderedQuestionIds: r.ordered_question_ids || []
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('[Exam History] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员获取所有考试历史记录
app.get('/api/admin/exam-history', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany('SELECT * FROM exam_history ORDER BY submit_time DESC');
    
    // PostgreSQL JSONB 字段自动解析，转换字段名以保持前端兼容
    const parsed = (rows || []).map(r => ({
      ...r,
      userId: r.user_id,
      examId: r.exam_id,
      examTitle: r.exam_title,
      totalScore: r.total_score,
      passScore: r.pass_score,
      timeUsed: r.time_used,
      submitTime: r.submit_time,
      bankId: r.bank_id,
      wrongQuestionIds: r.wrong_question_ids || [],
      userAnswers: r.user_answers || {},
      currentIndex: r.current_index,
      isFinished: r.is_finished,
      examConfig: r.exam_config,
      orderedQuestionIds: r.ordered_question_ids || []
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('[Admin Exam History] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update exam history record
app.post('/api/exams/history', auth, async (req, res) => {
  try {
    const record = req.body;
    const id = record.id || `exam-${Date.now()}`;
    
    // PostgreSQL 使用 ON CONFLICT 来处理"保存并退出"后"提交试卷"的场景
    await db.execute(
      `INSERT INTO exam_history (
        id, user_id, exam_id, exam_title, score, total_score, pass_score, 
        time_used, submit_time, bank_id, wrong_question_ids, user_answers, 
        passed, current_index, is_finished, exam_config, ordered_question_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        score = EXCLUDED.score,
        total_score = EXCLUDED.total_score,
        pass_score = EXCLUDED.pass_score,
        time_used = EXCLUDED.time_used,
        submit_time = EXCLUDED.submit_time,
        wrong_question_ids = EXCLUDED.wrong_question_ids,
        user_answers = EXCLUDED.user_answers,
        passed = EXCLUDED.passed,
        current_index = EXCLUDED.current_index,
        is_finished = EXCLUDED.is_finished,
        exam_config = EXCLUDED.exam_config,
        ordered_question_ids = EXCLUDED.ordered_question_ids`,
      [
        id,
        req.user.id,
        record.examId || '',
        record.examTitle || '',
        record.score || 0,
        record.totalScore || 0,
        record.passScore || 0,
        record.timeUsed || 0,
        record.submitTime || new Date().toLocaleString(),
        record.bankId || '',
        record.wrongQuestionIds || [],
        record.userAnswers || {},
        record.passed || false,
        record.currentIndex || 0,
        record.isFinished || false,
        record.examConfig || null,
        record.orderedQuestionIds || []
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Exam History] Create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update exam history record (for continuing unfinished exams)
app.put('/api/exams/history/:id', auth, async (req, res) => {
  try {
    const record = req.body;
    
    await db.execute(
      `UPDATE exam_history SET 
        score = $1, total_score = $2, pass_score = $3, time_used = $4, 
        submit_time = $5, wrong_question_ids = $6, user_answers = $7, 
        passed = $8, current_index = $9, is_finished = $10, exam_config = $11, 
        ordered_question_ids = $12
      WHERE id = $13 AND user_id = $14`,
      [
        record.score || 0,
        record.totalScore || 0,
        record.passScore || 0,
        record.timeUsed || 0,
        record.submitTime || new Date().toLocaleString(),
        record.wrongQuestionIds || [],
        record.userAnswers || {},
        record.passed || false,
        record.currentIndex || 0,
        record.isFinished || false,
        record.examConfig || null,
        record.orderedQuestionIds || [],
        req.params.id,
        req.user.id
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Exam History] Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete exam history record
app.delete('/api/exams/history/:id', auth, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM exam_history WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Exam History] Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: login logs & audit logs
app.get('/api/admin/login-logs', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany('SELECT * FROM login_logs ORDER BY time DESC');
    res.json(rows || []);
  } catch (error) {
    console.error('[登录日志] 查询失败:', error);
    res.status(500).json({ error: '查询登录日志失败: ' + error.message });
  }
});

app.get('/api/admin/audit-logs', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    res.json(rows || []);
  } catch (error) {
    console.error('[审计日志] 查询失败:', error);
    res.status(500).json({ error: '查询审计日志失败: ' + error.message });
  }
});

app.post('/api/admin/audit-logs', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const id = `audit-${Date.now()}`;
    const { action, target, timestamp, operatorId, operatorName } = req.body;
    
    await db.execute(
      'INSERT INTO audit_logs (id, operator_id, operator_name, action, target, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        id, 
        operatorId || req.user.id, 
        operatorName || req.user.realName || req.user.nickname, 
        action || '', 
        target || '', 
        timestamp || new Date().toLocaleString()
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Audit Log] Create error:', error);
    res.status(500).send(error.message);
  }
});

// Bank score update route
app.put('/api/banks/:id/score', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const bankId = req.params.id;
    const { scoreConfig } = req.body || {};
    
    // 验证 scoreConfig 格式
    if (!scoreConfig || typeof scoreConfig !== 'object') {
      return res.status(400).json({ error: '无效的分值配置' });
    }
    
    await db.execute('UPDATE banks SET score_config = $1 WHERE id = $2', [scoreConfig, bankId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Bank Score] Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: custom field schema management (stored in system_config.main.customFieldSchema)
app.post('/api/admin/config/custom-fields', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).send('Name required');
    
    const row = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
    const data = row ? row.data : {};
    
    data.customFieldSchema = data.customFieldSchema || [];
    if (!data.customFieldSchema.includes(name)) {
      data.customFieldSchema.push(name);
    }
    
    // PostgreSQL 使用 ON CONFLICT 实现 UPSERT
    await db.execute(
      "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
      [data]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Custom Fields] Add error:', error);
    res.status(500).send(error.message);
  }
});

app.delete('/api/admin/config/custom-fields/:name', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const name = req.params.name;
    
    const row = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
    const data = row ? row.data : {};
    
    data.customFieldSchema = (data.customFieldSchema || []).filter((n) => n !== name);
    
    // PostgreSQL 使用 ON CONFLICT 实现 UPSERT
    await db.execute(
      "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
      [data]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Custom Fields] Delete error:', error);
    res.status(500).send(error.message);
  }
});

// Practical tasks/records
app.get('/api/practical/tasks', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM practical_tasks ORDER BY created_at DESC');
    
    // PostgreSQL JSONB 自动解析，转换字段名
    const tasks = (rows || []).map(row => ({
      id: row.id,
      title: row.title,
      parts: row.parts || [],
      createdAt: row.created_at
    }));
    
    res.json(tasks);
  } catch (error) {
    console.error('[Practical Tasks] Get error:', error);
    res.status(500).send(error.message);
  }
});

app.post('/api/practical/tasks', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const task = req.body;
    const id = task.id || `pt-${Date.now()}`;
    
    await db.execute(
      'INSERT INTO practical_tasks (id, title, parts, created_at) VALUES ($1, $2, $3, $4)',
      [id, task.title || '', task.parts || [], task.createdAt || new Date().toLocaleString()]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Practical Tasks] Create error:', error);
    res.status(500).send(error.message);
  }
});

app.put('/api/practical/tasks/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const task = req.body;
    
    await db.execute(
      'UPDATE practical_tasks SET title = $1, parts = $2 WHERE id = $3',
      [task.title || '', task.parts || [], req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Practical Tasks] Update error:', error);
    res.status(500).send(error.message);
  }
});

app.delete('/api/practical/tasks/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    await db.execute('DELETE FROM practical_tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('[Practical Tasks] Delete error:', error);
    res.status(500).send(error.message);
  }
});

app.get('/api/practical/records', auth, async (req, res) => {
  try {
    let rows;
    
    if (!req.user || req.user.role !== 'ADMIN') {
      // 学员只能看到自己的记录
      rows = await db.getMany(
        'SELECT * FROM practical_records WHERE user_id = $1 ORDER BY submitted_at DESC',
        [req.user.id]
      );
    } else {
      // 管理员可以看到所有记录
      rows = await db.getMany('SELECT * FROM practical_records ORDER BY submitted_at DESC');
    }
    
    // PostgreSQL JSONB 自动解析，转换字段名
    const records = (rows || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      answers: row.answers || {},
      submittedAt: row.submitted_at
    }));
    
    res.json(records);
  } catch (error) {
    console.error('[Practical Records] Get error:', error);
    res.status(500).send(error.message);
  }
});

app.post('/api/practical/records', auth, async (req, res) => {
  try {
    const record = req.body;
    const id = record.id || `ptr-${Date.now()}`;
    
    await db.execute(
      'INSERT INTO practical_records (id, user_id, task_id, answers, submitted_at) VALUES ($1, $2, $3, $4, $5)',
      [
        id, 
        record.userId || req.user.id, 
        record.taskId || '', 
        record.answers || {}, 
        record.submittedAt || new Date().toLocaleString()
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('[Practical Records] Create error:', error);
    res.status(500).send(error.message);
  }
});

app.delete('/api/practical/records/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.execute(
      'DELETE FROM practical_records WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).send('记录不存在或无权删除');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Practical Records] Delete error:', error);
    res.status(500).send(error.message);
  }
});

// SRS records (use srs_records table)
app.get('/api/srs/records', auth, async (req, res) => {
  try {
    const rows = await db.getMany(
      'SELECT * FROM srs_records WHERE user_id = $1',
      [req.user.id]
    );
    res.json(rows || []);
  } catch (error) {
    console.error('[SRS Records] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SRS update - handle mastery level updates
app.post('/api/srs/update', auth, async (req, res) => {
  const { questionId, level } = req.body || {};
  if (!questionId || !level) {
    return res.status(400).json({ error: 'questionId and level are required' });
  }
  
  try {
    // Calculate next review date based on level
    const now = new Date();
    let intervalDays = 1;
    let easeFactor = 2.5;
    let repetitions = 0;
    
    // Get existing record if any
    const existing = await db.getOne(
      'SELECT * FROM srs_records WHERE user_id = $1 AND question_id = $2',
      [req.user.id, questionId]
    );
    
    if (existing) {
      repetitions = existing.repetitions || 0;
      easeFactor = existing.ease_factor || 2.5;
    }
    
    // Update based on level
    if (level === 'HARD') {
      // "很难/重来"：保持在今天的复习列表中，不移除
      intervalDays = 0; // 设置为 0 天，表示今天仍需复习
      repetitions = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (level === 'GOOD') {
      repetitions += 1;
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round((existing?.interval || 6) * easeFactor);
      }
    } else if (level === 'EASY') {
      repetitions += 1;
      easeFactor = Math.min(2.5, easeFactor + 0.15);
      intervalDays = Math.round((existing?.interval || 1) * easeFactor * 1.3);
    }
    
    // 计算下次复习日期
    const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];
    
    const id = existing?.id || `srs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // 使用 UPSERT 语法
    await db.execute(
      `INSERT INTO srs_records 
       (id, user_id, question_id, interval, ease_factor, repetitions, next_review_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, question_id) DO UPDATE SET
         interval = EXCLUDED.interval,
         ease_factor = EXCLUDED.ease_factor,
         repetitions = EXCLUDED.repetitions,
         next_review_date = EXCLUDED.next_review_date,
         status = EXCLUDED.status`,
      [id, req.user.id, questionId, intervalDays, easeFactor, repetitions, nextReviewDateStr, 'active']
    );
    
    res.json({ 
      success: true, 
      record: { 
        id, 
        userId: req.user.id, 
        questionId, 
        interval: intervalDays, 
        easeFactor, 
        repetitions, 
        nextReviewDate: nextReviewDateStr, 
        status: 'active' 
      } 
    });
  } catch (error) {
    console.error('[SRS] Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mistakes: return joined questions for user's mistakes
app.get('/api/mistakes', auth, async (req, res) => {
  try {
    const rows = await db.getMany(
      `SELECT q.* FROM questions q 
       JOIN mistakes m ON q.id = m.question_id 
       WHERE m.user_id = $1`,
      [req.user.id]
    );
    
    res.json((rows || []).map(r => ({ 
      ...r, 
      options: parseOptionsField(r.options), 
      answer: parseAnswerField(r.answer) 
    })));
  } catch (error) {
    console.error('[Mistakes] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mistakes', auth, async (req, res) => {
  const { questionId } = req.body || {};
  if (!questionId) return res.status(400).send('questionId required');
  
  try {
    // 检查是否已存在
    const row = await db.getOne(
      'SELECT * FROM mistakes WHERE user_id = $1 AND question_id = $2',
      [req.user.id, questionId]
    );
    
    if (row) {
      // 已存在，不做任何操作
      res.json({ success: true, added: false });
    } else {
      // 插入新记录
      await db.execute(
        'INSERT INTO mistakes (user_id, question_id) VALUES ($1, $2)',
        [req.user.id, questionId]
      );
      res.json({ success: true, added: true });
    }
  } catch (error) {
    console.error('[Mistakes] Add error:', error);
    res.status(500).send(error.message);
  }
});

// 5. 笔记与收藏

// 笔记：保存/删除
app.post('/api/notes', auth, async (req, res) => {
  const { questionId, content } = req.body || {};
  if (!questionId) return res.status(400).send('questionId required');
  const now = new Date().toLocaleString();

  try {
    // 内容为空则删除（等价于清空笔记）
    if (!content || String(content).trim() === '') {
      await db.execute(
        'DELETE FROM notes WHERE user_id = $1 AND question_id = $2',
        [req.user.id, questionId]
      );
      res.json({ success: true, deleted: true });
    } else {
      // 使用 UPSERT 语法
      await db.execute(
        `INSERT INTO notes (user_id, question_id, content, updated_at) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, question_id) DO UPDATE SET
           content = EXCLUDED.content,
           updated_at = EXCLUDED.updated_at`,
        [req.user.id, questionId, content, now]
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.error('[Notes] Save error:', error);
    res.status(500).send(error.message);
  }
});

// 笔记：查询单题
app.get('/api/notes/:qId', auth, async (req, res) => {
  try {
    const row = await db.getOne(
      'SELECT * FROM notes WHERE user_id = $1 AND question_id = $2',
      [req.user.id, req.params.qId]
    );
    res.json(row || null);
  } catch (error) {
    console.error('[Notes] Get error:', error);
    res.status(500).send(error.message);
  }
});

// 错题与收藏
app.get('/api/favorites', auth, async (req, res) => {
  try {
    const rows = await db.getMany(
      `SELECT q.* FROM questions q 
       JOIN favorites f ON q.id = f.question_id 
       WHERE f.user_id = $1`,
      [req.user.id]
    );
    
    res.json(rows.map(r => ({ 
      ...r, 
      options: parseOptionsField(r.options), 
      answer: parseAnswerField(r.answer) 
    })));
  } catch (error) {
    console.error('[Favorites] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/favorites/:qId', auth, async (req, res) => {
  try {
    // 检查是否已收藏
    const row = await db.getOne(
      'SELECT * FROM favorites WHERE user_id = $1 AND question_id = $2',
      [req.user.id, req.params.qId]
    );
    
    if (row) {
      // 已收藏，则取消收藏
      await db.execute(
        'DELETE FROM favorites WHERE user_id = $1 AND question_id = $2',
        [req.user.id, req.params.qId]
      );
    } else {
      // 未收藏，则添加收藏
      await db.execute(
        'INSERT INTO favorites (user_id, question_id) VALUES ($1, $2)',
        [req.user.id, req.params.qId]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Favorites] Toggle error:', error);
    res.status(500).send(error.message);
  }
});

// 6. AI 讲评（使用 DeepSeek API）
app.post('/api/ai/generate', auth, async (req, res) => {
  const { prompt } = req.body;
  try {
    // 获取有效的 API Key（优先使用学员的，否则使用管理员的）
    let apiKey = null;
    
    // 获取学员的 API Key
    const userResult = await db.getOne(
      'SELECT deepseek_api_key FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult && userResult.deepseek_api_key) {
      apiKey = userResult.deepseek_api_key;
    } else {
      // 获取管理员的全局 API Key（从 system_config_kv 表）
      const configResult = await db.getOne(
        "SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'"
      );
      
      if (configResult && configResult.value) {
        apiKey = configResult.value;
      }
    }
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: '未配置 DeepSeek API Key',
        message: '请在系统设置中配置 API Key 后再使用 AI 功能'
      });
    }
    
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业的教育助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DeepSeek API 调用失败');
    }
    
    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    
    res.json({ text });
  } catch (err) {
    console.error('[AI Generate Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 保存AI解析内容
app.post('/api/ai/analysis', auth, async (req, res) => {
  const { questionId, content } = req.body;
  
  if (!questionId || !content) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    const now = new Date().toISOString();
    
    // 使用 UPSERT 语法
    await db.execute(
      `INSERT INTO ai_analysis (user_id, question_id, content, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, question_id) DO UPDATE SET
         content = EXCLUDED.content,
         updated_at = EXCLUDED.updated_at`,
      [req.user.id, questionId, content, now, now]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[AI Analysis] Save error:', error);
    res.status(500).json({ error: error.message });
  }
});
// 获取AI解析内容
app.get('/api/ai/analysis/:questionId', auth, async (req, res) => {
  try {
    const result = await db.getOne(
      'SELECT * FROM ai_analysis WHERE user_id = $1 AND question_id = $2',
      [req.user.id, req.params.questionId]
    );
    
    res.json(result || null);
  } catch (error) {
    console.error('[Get AI Analysis Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员获取所有AI解析记录（分页、搜索、筛选）
app.get('/api/admin/ai-analysis', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  try {
    const { page = 1, pageSize = 30, search = '', type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // 构建查询条件
    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (q.content LIKE $${paramIndex} OR u.nickname LIKE $${paramIndex + 1} OR u.real_name LIKE $${paramIndex + 2})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }
    
    if (type && type !== 'ALL') {
      whereClause += ` AND q.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    // 获取总数
    const countResult = await db.getOne(
      `SELECT COUNT(*) as total 
       FROM ai_analysis a
       JOIN questions q ON a.question_id = q.id
       JOIN users u ON a.user_id = u.id
       WHERE ${whereClause}`,
      params
    );
    
    // 获取分页数据
    params.push(parseInt(pageSize), offset);
    const records = await db.getMany(
      `SELECT 
         a.user_id as "userId",
         a.question_id as "questionId",
         a.content,
         a.created_at as "createdAt",
         a.updated_at as "updatedAt",
         u.nickname as "userName",
         u.real_name as "userRealName",
         q.type as "questionType",
         q.content as "questionContent",
         q.bank_id as "bankId"
       FROM ai_analysis a
       JOIN questions q ON a.question_id = q.id
       JOIN users u ON a.user_id = u.id
       WHERE ${whereClause}
       ORDER BY a.updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    res.json({
      records: records || [],
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / parseInt(pageSize))
    });
  } catch (error) {
    console.error('[Get Admin AI Analysis Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. 每日进度统计
app.get('/api/user/progress', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM daily_progress WHERE user_id = $1', [req.user.id]);
    res.json(rows || []);
  } catch (error) {
    console.error('[Progress] Error:', error);
    res.status(500).send('获取进度失败');
  }
});

// 管理员获取所有学员的每日进度（用于统计）
app.get('/api/admin/all-progress', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const rows = await db.getMany('SELECT * FROM daily_progress ORDER BY date DESC');
    res.json(rows || []);
  } catch (error) {
    console.error('[Admin Progress] Error:', error);
    res.status(500).send('获取进度失败');
  }
});

app.post('/api/user/progress/increment', auth, async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const id = `${req.user.id}_${date}`;
    
    const row = await db.getOne('SELECT * FROM daily_progress WHERE id = $1', [id]);
    
    if (row) {
      await db.execute('UPDATE daily_progress SET count = count + 1 WHERE id = $1', [id]);
    } else {
      await db.execute(
        'INSERT INTO daily_progress (id, user_id, date, count) VALUES ($1, $2, $3, 1)',
        [id, req.user.id, date]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Progress Increment] Error:', error);
    res.status(500).send('更新进度失败');
  }
});

// 8. 系统配置
app.get('/api/config', async (req, res) => {
  try {
    // 获取主配置
    const mainConfigRow = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
    const mainConfig = mainConfigRow ? mainConfigRow.data : {};
    
    // 获取 deepseekApiKey（从 system_config_kv 表）
    const deepseekKeyRow = await db.getOne("SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'");
    const deepseekKey = deepseekKeyRow ? deepseekKeyRow.value : null;
    
    // 合并配置
    const config = {
      ...mainConfig,
      deepseekApiKey: deepseekKey
    };
    
    res.json(config);
  } catch (error) {
    console.error('[Config API Error]', error);
    res.json(null);
  }
});

// PUT 更新系统配置（需要管理员权限）
app.put('/api/config', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const configData = req.body || {};
    
    // 提取 deepseekApiKey
    const deepseekApiKey = configData.deepseekApiKey;
    
    // 从主配置中移除 deepseekApiKey（它将单独存储）
    const mainConfigData = { ...configData };
    delete mainConfigData.deepseekApiKey;
    
    // 保存主配置到 system_config 表（使用 UPSERT）
    await db.execute(
      "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
      [mainConfigData]
    );
    
    // 保存 deepseekApiKey 到 system_config_kv 表
    if (deepseekApiKey !== undefined) {
      await db.execute(
        "INSERT INTO system_config_kv (key, value) VALUES ('deepseekApiKey', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [deepseekApiKey || '']
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Update Config Error]', error);
    res.status(500).send(error.message);
  }
});
// ========== 新增API端点 - 标签系统 ==========

// 获取所有标签
app.get('/api/tags', auth, async (req, res) => {
  try {
    const rows = await db.getMany('SELECT * FROM tags ORDER BY usage_count DESC');
    
    // 转换字段名
    const tags = (rows || []).map(tag => ({
      ...tag,
      usageCount: tag.usage_count,
      createdAt: tag.created_at
    }));
    
    res.json({ tags });
  } catch (error) {
    console.error('[Tags] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建标签
app.post('/api/tags', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { name, color } = req.body;
    
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: '标签名称不能为空' });
    }
    
    const id = `tag-${Date.now()}`;
    const now = new Date().toISOString();
    
    await db.execute(
      'INSERT INTO tags (id, name, color, created_at, usage_count) VALUES ($1, $2, $3, $4, 0)',
      [id, name.trim(), color || null, now]
    );
    
    res.json({ 
      success: true, 
      id, 
      tag: { id, name: name.trim(), color, createdAt: now, usageCount: 0 } 
    });
  } catch (error) {
    console.error('[Tags] Create error:', error);
    
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({ error: '标签名称已存在' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// 更新标签
app.put('/api/tags/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { name, color } = req.body;
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      if (String(name).trim() === '') {
        return res.status(400).json({ error: '标签名称不能为空' });
      }
      fields.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    
    if (color !== undefined) {
      fields.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    values.push(req.params.id);
    
    const result = await db.execute(
      `UPDATE tags SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Tags] Update error:', error);
    
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({ error: '标签名称已存在' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// 删除标签
app.delete('/api/tags/:id', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    // 检查标签是否正在使用
    const row = await db.getOne(
      'SELECT COUNT(*) as count FROM question_tags WHERE tag_id = $1',
      [req.params.id]
    );
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: '标签正在使用中，请先解除所有题目的关联',
        usageCount: row.count 
      });
    }
    
    const result = await db.execute('DELETE FROM tags WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Tags] Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 合并标签
app.post('/api/tags/merge', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  try {
    const { sourceTagId, targetTagId } = req.body;
    
    if (!sourceTagId || !targetTagId) {
      return res.status(400).json({ error: '缺少源标签或目标标签ID' });
    }
    
    if (sourceTagId === targetTagId) {
      return res.status(400).json({ error: '源标签和目标标签不能相同' });
    }
    
    // 获取两个标签的信息
    const tags = await db.getMany(
      'SELECT * FROM tags WHERE id = ANY($1)',
      [[sourceTagId, targetTagId]]
    );
    
    if (tags.length !== 2) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    const sourceTag = tags.find(t => t.id === sourceTagId);
    const targetTag = tags.find(t => t.id === targetTagId);
    
    // 使用事务处理合并操作
    await db.transaction(async (client) => {
      // 更新所有使用源标签的题目关联到目标标签（使用 ON CONFLICT 避免重复）
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
    
    res.json({ success: true, mergedCount: sourceTag.usage_count });
  } catch (error) {
    console.error('[Tags] Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 按标签筛选题目
app.get('/api/questions/by-tags', auth, async (req, res) => {
  const { tagIds } = req.query;
  
  if (!tagIds) {
    return res.status(400).json({ error: '缺少tagIds参数' });
  }
  
  const tagIdArray = tagIds.split(',').filter(id => id.trim());
  if (tagIdArray.length === 0) {
    return res.json([]);
  }
  
  try {
    // 使用 PostgreSQL 的 ANY 语法
    const sql = `
      SELECT DISTINCT q.* 
      FROM questions q
      JOIN question_tags qt ON q.id = qt.question_id
      WHERE qt.tag_id = ANY($1)
    `;
    
    const rows = await db.getMany(sql, [tagIdArray]);
    
    const questions = rows.map(r => ({
      ...r,
      options: parseOptionsField(r.options),
      answer: parseAnswerField(r.answer),
      blanks: r.blanks ? JSON.parse(r.blanks) : null,
      tags: r.tags ? JSON.parse(r.tags) : null,
      aiGradingEnabled: r.ai_grading_enabled === true
    }));
    
    res.json(questions);
  } catch (err) {
    console.error('[Get Questions By Tags Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 批量为题目添加标签
app.post('/api/questions/batch-tag', auth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { questionIds, tagIds } = req.body;
  
  if (!Array.isArray(questionIds) || !Array.isArray(tagIds)) {
    return res.status(400).json({ error: '参数格式错误' });
  }
  
  if (questionIds.length === 0 || tagIds.length === 0) {
    return res.json({ success: true, added: 0 });
  }
  
  try {
    let added = 0;
    
    await db.transaction(async (client) => {
      for (const questionId of questionIds) {
        for (const tagId of tagIds) {
          // 使用 ON CONFLICT DO NOTHING 实现 INSERT OR IGNORE
          const result = await client.query(
            `INSERT INTO question_tags (question_id, tag_id) 
             VALUES ($1, $2) 
             ON CONFLICT (question_id, tag_id) DO NOTHING`,
            [questionId, tagId]
          );
          
          if (result.rowCount > 0) {
            added++;
            // 更新标签使用次数
            await client.query(
              "UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1",
              [tagId]
            );
          }
        }
      }
    });
    
    res.json({ success: true, added });
  } catch (err) {
    console.error('[Batch Tag Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== 填空题评分API ==========

app.post('/api/questions/grade-fill-blank', auth, async (req, res) => {
  const { questionId, userAnswers } = req.body;
  
  if (!questionId || !userAnswers) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    // 获取题目信息
    const question = await db.getOne("SELECT * FROM questions WHERE id = $1", [questionId]);
    
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    if (question.type !== 'FILL_IN_BLANK') {
      return res.status(400).json({ error: '该题目不是填空题' });
    }
    
    // 解析填空配置
    let blanks;
    try {
      blanks = question.blanks ? JSON.parse(question.blanks) : null;
    } catch (e) {
      return res.status(500).json({ error: '填空题配置解析失败' });
    }
    
    if (!blanks || !Array.isArray(blanks) || blanks.length === 0) {
      return res.status(500).json({ error: '填空题配置无效' });
    }
    
    // 使用验证函数计算得分
    const result = validateFillInBlankAnswers(blanks, userAnswers, 100);
    
    res.json({
      success: true,
      correct: result.correct,
      total: result.total,
      score: result.score,
      percentage: Math.round((result.correct / result.total) * 100),
      details: result.details,
      isAllCorrect: result.correct === result.total
    });
  } catch (err) {
    console.error('[Grade Fill Blank Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== AI评分API ==========

app.post('/api/ai/grade-answer', auth, async (req, res) => {
  const { questionId, userAnswer, referenceAnswer } = req.body;
  
  if (!userAnswer || !referenceAnswer) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 限制答案长度
  if (userAnswer.length > 5000) {
    return res.status(400).json({ error: '答案长度超过限制（最多5000字符）' });
  }
  
  try {
    // 获取API Key
    let apiKey = null;
    
    const userResult = await db.getOne(
      "SELECT deepseek_api_key FROM users WHERE id = $1", 
      [req.user.id]
    );
    
    if (userResult && userResult.deepseek_api_key) {
      apiKey = userResult.deepseek_api_key;
    } else {
      const configResult = await db.getOne(
        "SELECT value FROM system_config_kv WHERE key = $1", 
        ['deepseekApiKey']
      );
      
      if (configResult && configResult.value) {
        apiKey = configResult.value;
      }
    }
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: '未配置 DeepSeek API Key',
        message: '请在系统设置中配置 API Key 后再使用 AI 评分功能'
      });
    }
    
    // 构建评分提示词
    const prompt = `你是一位专业的教师，请评估学生的简答题答案。

参考答案：
${referenceAnswer}

学生答案：
${userAnswer}

请按以下格式返回评分结果（JSON格式）：
{
  "score": 85,
  "feedback": "答案整体正确，要点完整...",
  "suggestions": ["建议1", "建议2"]
}

评分标准：
- 90-100分：答案完整准确，表述清晰
- 80-89分：答案基本正确，有小瑕疵
- 70-79分：答案部分正确，遗漏要点
- 60-69分：答案不够完整，理解有偏差
- 60分以下：答案错误或严重偏离主题`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DeepSeek API 调用失败');
    }
    
    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    
    // 尝试解析JSON结果
    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch (e) {
      // 如果不是JSON格式，返回原始文本
      res.json({
        score: 0,
        feedback: text,
        suggestions: []
      });
    }
  } catch (err) {
    console.error('[AI Grade Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== 讨论系统API ==========

// 获取讨论列表
app.get('/api/discussions', auth, async (req, res) => {
  const { page = 1, limit = 20, questionId, sortBy = 'latest' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    // 学员只能看到未隐藏的讨论
    if (req.user.role !== 'ADMIN') {
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
    
    res.json({
      discussions,
      total: countRow.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[Get Discussions Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 创建讨论
app.post('/api/discussions', auth, async (req, res) => {
  const { title, content, questionId } = req.body;
  
  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: '标题不能为空' });
  }
  
  if (!content || String(content).trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }
  
  try {
    const id = `disc-${Date.now()}`;
    const now = new Date().toISOString();
    
    // 获取用户信息
    const user = await db.getOne(
      "SELECT nickname, real_name FROM users WHERE id = $1", 
      [req.user.id]
    );
    
    const authorName = user.nickname || user.real_name || '匿名用户';
    
    await db.execute(
      `INSERT INTO discussions (
        id, title, content, author_id, author_name, question_id,
        created_at, updated_at, last_activity_at, view_count, like_count, 
        comment_count, is_pinned, is_hidden
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, false, false)`,
      [id, title.trim(), content.trim(), req.user.id, authorName, questionId || null, now, now, now]
    );
    
    res.json({
      success: true,
      id,
      discussion: {
        id,
        title: title.trim(),
        content: content.trim(),
        authorId: req.user.id,
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
    });
  } catch (err) {
    console.error('[Create Discussion Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取讨论详情
app.get('/api/discussions/:id', auth, async (req, res) => {
  try {
    const row = await db.getOne("SELECT * FROM discussions WHERE id = $1", [req.params.id]);
    
    if (!row) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    // 学员不能查看隐藏的讨论
    if (req.user.role !== 'ADMIN' && row.is_hidden === true) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    // 增加浏览次数
    await db.execute(
      "UPDATE discussions SET view_count = view_count + 1 WHERE id = $1", 
      [req.params.id]
    );
    
    const discussion = {
      ...row,
      isPinned: row.is_pinned === true,
      isHidden: row.is_hidden === true
    };
    
    res.json({ discussion });
  } catch (err) {
    console.error('[Get Discussion Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 更新讨论
app.put('/api/discussions/:id', auth, async (req, res) => {
  const { title, content } = req.body;
  
  try {
    // 检查权限
    const row = await db.getOne(
      "SELECT author_id FROM discussions WHERE id = $1", 
      [req.params.id]
    );
    
    if (!row) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    // 只有作者或管理员可以编辑
    if (row.author_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '无权限编辑此讨论' });
    }
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      if (String(title).trim() === '') {
        return res.status(400).json({ error: '标题不能为空' });
      }
      fields.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    
    if (content !== undefined) {
      if (String(content).trim() === '') {
        return res.status(400).json({ error: '内容不能为空' });
      }
      fields.push(`content = $${paramIndex++}`);
      values.push(content.trim());
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE discussions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Update Discussion Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 删除讨论（管理员）
app.delete('/api/discussions/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以删除讨论' });
  }
  
  try {
    // 删除讨论会级联删除评论和点赞（通过外键约束）
    const result = await db.execute(
      "DELETE FROM discussions WHERE id = $1", 
      [req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Delete Discussion Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 切换讨论可见性（管理员）
app.post('/api/discussions/:id/toggle-visibility', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以操作' });
  }
  
  try {
    const row = await db.getOne(
      "SELECT is_hidden FROM discussions WHERE id = $1", 
      [req.params.id]
    );
    
    if (!row) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    const newVisibility = !row.is_hidden;
    
    await db.execute(
      "UPDATE discussions SET is_hidden = $1 WHERE id = $2",
      [newVisibility, req.params.id]
    );
    
    res.json({ success: true, isHidden: newVisibility });
  } catch (err) {
    console.error('[Toggle Discussion Visibility Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 切换讨论置顶（管理员）
app.post('/api/discussions/:id/toggle-pin', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以操作' });
  }
  
  try {
    const row = await db.getOne(
      "SELECT is_pinned FROM discussions WHERE id = $1", 
      [req.params.id]
    );
    
    if (!row) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    const newPinStatus = !row.is_pinned;
    
    await db.execute(
      "UPDATE discussions SET is_pinned = $1 WHERE id = $2",
      [newPinStatus, req.params.id]
    );
    
    res.json({ success: true, isPinned: newPinStatus });
  } catch (err) {
    console.error('[Toggle Discussion Pin Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取题目相关讨论
app.get('/api/questions/:id/discussions', auth, async (req, res) => {
  try {
    let whereClause = 'WHERE question_id = $1';
    
    // 学员只能看到未隐藏的讨论
    if (req.user.role !== 'ADMIN') {
      whereClause += ' AND is_hidden = false';
    }
    
    const rows = await db.getMany(
      `SELECT * FROM discussions ${whereClause} ORDER BY is_pinned DESC, last_activity_at DESC`,
      [req.params.id]
    );
    
    const discussions = rows.map(d => ({
      ...d,
      isPinned: d.is_pinned === true,
      isHidden: d.is_hidden === true
    }));
    
    res.json(discussions);
  } catch (err) {
    console.error('[Get Question Discussions Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== 评论系统API ==========

// 获取讨论的评论
app.get('/api/discussions/:id/comments', auth, async (req, res) => {
  try {
    const rows = await db.getMany(
      "SELECT * FROM comments WHERE discussion_id = $1 AND is_deleted = false ORDER BY created_at ASC",
      [req.params.id]
    );
    
    const comments = rows.map(c => ({
      ...c,
      isDeleted: c.is_deleted === true
    }));
    
    res.json(comments);
  } catch (err) {
    console.error('[Get Comments Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 发表评论
app.post('/api/discussions/:id/comments', auth, async (req, res) => {
  const { content, parentId } = req.body;
  
  if (!content || String(content).trim() === '') {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  try {
    // 检查讨论是否存在
    const discussion = await db.getOne(
      "SELECT * FROM discussions WHERE id = $1", 
      [req.params.id]
    );
    
    if (!discussion) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    // 学员不能在隐藏的讨论中评论
    if (req.user.role !== 'ADMIN' && discussion.is_hidden === true) {
      return res.status(403).json({ error: '无法在此讨论中评论' });
    }
    
    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parent = await db.getOne(
        "SELECT * FROM comments WHERE id = $1 AND discussion_id = $2", 
        [parentId, req.params.id]
      );
      
      if (!parent) {
        return res.status(404).json({ error: '父评论不存在' });
      }
    }
    
    const id = `comment-${Date.now()}`;
    const now = new Date().toISOString();
    
    // 获取用户信息
    const user = await db.getOne(
      "SELECT nickname, real_name FROM users WHERE id = $1", 
      [req.user.id]
    );
    
    const authorName = user.nickname || user.real_name || '匿名用户';
    
    await db.execute(
      `INSERT INTO comments (
        id, discussion_id, parent_id, author_id, author_name, 
        content, created_at, like_count, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, false)`,
      [id, req.params.id, parentId || null, req.user.id, authorName, content.trim(), now]
    );
    
    // 更新讨论的评论数和最后活跃时间
    await db.execute(
      "UPDATE discussions SET comment_count = comment_count + 1, last_activity_at = $1 WHERE id = $2",
      [now, req.params.id]
    );
    
    res.json({
      success: true,
      id,
      comment: {
        id,
        discussionId: req.params.id,
        parentId: parentId || null,
        authorId: req.user.id,
        authorName,
        content: content.trim(),
        createdAt: now,
        likeCount: 0,
        isDeleted: false
      }
    });
  } catch (err) {
    console.error('[Create Comment Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 删除评论
app.delete('/api/comments/:id', auth, async (req, res) => {
  try {
    // 获取评论信息
    const comment = await db.getOne(
      "SELECT * FROM comments WHERE id = $1", 
      [req.params.id]
    );
    
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }
    
    // 只有作者或管理员可以删除
    if (comment.author_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '无权限删除此评论' });
    }
    
    // 递归删除子评论
    async function deleteCommentAndChildren(commentId) {
      // 查找所有子评论
      const children = await db.getMany(
        "SELECT id FROM comments WHERE parent_id = $1", 
        [commentId]
      );
      
      // 递归删除子评论
      for (const child of children) {
        await deleteCommentAndChildren(child.id);
      }
      
      // 删除当前评论
      await db.execute("DELETE FROM comments WHERE id = $1", [commentId]);
    }
    
    await deleteCommentAndChildren(req.params.id);
    
    // 更新讨论的评论数
    await db.execute(
      `UPDATE discussions 
       SET comment_count = (SELECT COUNT(*) FROM comments WHERE discussion_id = $1) 
       WHERE id = $1`,
      [comment.discussion_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Delete Comment Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== 点赞系统API ==========

// 点赞讨论
app.post('/api/discussions/:id/like', auth, async (req, res) => {
  const userId = req.user.id;
  const discussionId = req.params.id;
  
  try {
    // 检查是否已点赞
    const like = await db.getOne(
      "SELECT * FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2",
      [userId, discussionId]
    );
    
    if (like) {
      // 已点赞，取消点赞
      await db.execute(
        "DELETE FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2",
        [userId, discussionId]
      );
      
      // 减少点赞数
      await db.execute(
        "UPDATE discussions SET like_count = GREATEST(0, like_count - 1) WHERE id = $1", 
        [discussionId]
      );
      
      res.json({ success: true, liked: false });
    } else {
      // 未点赞，添加点赞
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO discussion_likes (user_id, discussion_id, comment_id, created_at) VALUES ($1, $2, NULL, $3)",
        [userId, discussionId, now]
      );
      
      // 增加点赞数
      await db.execute(
        "UPDATE discussions SET like_count = like_count + 1 WHERE id = $1", 
        [discussionId]
      );
      
      res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error('[Like Discussion Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 点赞评论
app.post('/api/comments/:id/like', auth, async (req, res) => {
  const userId = req.user.id;
  const commentId = req.params.id;
  
  try {
    // 检查评论是否存在
    const comment = await db.getOne("SELECT * FROM comments WHERE id = $1", [commentId]);
    
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
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
      
      res.json({ success: true, liked: false });
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
      
      res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error('[Like Comment Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 404 错误处理中间件 - 确保返回 JSON 而不是 HTML
app.use((req, res, next) => {
  res.status(404).json({ 
    error: '请求的资源不存在', 
    code: 'NOT_FOUND',
    details: { 
      method: req.method, 
      path: req.path 
    }
  });
});

// 500 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    error: '服务器内部错误', 
    code: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
