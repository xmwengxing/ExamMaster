
import { validateFillInBlankAnswers } from './utils/questionValidation.js';
import 'dotenv/config';
import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

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

// 初始化数据库
const db = new sqlite3.Database('./edumaster.db');

db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, phone TEXT UNIQUE, password TEXT, role TEXT, 
    realName TEXT, nickname TEXT, avatar TEXT, idCard TEXT, school TEXT, 
    educationType TEXT, educationLevel TEXT, major TEXT, company TEXT, 
    customFields TEXT, studentPerms TEXT, allowedBankIds TEXT, accuracy REAL, 
    mistakeCount INTEGER, dailyGoal INTEGER, lastLogin TEXT, permissions TEXT
  )`);

  // 题库表
  db.run(`CREATE TABLE IF NOT EXISTS banks (
    id TEXT PRIMARY KEY, name TEXT, category TEXT, level TEXT, 
    description TEXT, questionCount INTEGER, scoreConfig TEXT, usageCount INTEGER
  )`);

  // 题目表
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY, bankId TEXT, type TEXT, content TEXT, 
    options TEXT, answer TEXT, explanation TEXT
  )`);

  // 练习记录表
  db.run(`CREATE TABLE IF NOT EXISTS practice_records (
    id TEXT PRIMARY KEY, userId TEXT, bankId TEXT, bankName TEXT, type TEXT, 
    questionTypeFilter TEXT, mode TEXT, count INTEGER, date TEXT, 
    currentIndex INTEGER, userAnswers TEXT, isCustom INTEGER
  )`);

  // 考试表
  db.run(`CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY, bankId TEXT, title TEXT, duration INTEGER, 
    totalScore REAL, passScore REAL, passScorePercent REAL, strategy TEXT, 
    selectedQuestionIds TEXT, status TEXT, isVisible INTEGER, 
    startTime TEXT, endTime TEXT, singleCount INTEGER, multipleCount INTEGER, judgeCount INTEGER
  )`);

  // 考试历史
  db.run(`CREATE TABLE IF NOT EXISTS exam_history (
    id TEXT PRIMARY KEY, userId TEXT, examId TEXT, examTitle TEXT, score REAL, 
    totalScore REAL, passScore REAL, timeUsed INTEGER, submitTime TEXT, 
    bankId TEXT, wrongQuestionIds TEXT, userAnswers TEXT, passed INTEGER, 
    currentIndex INTEGER, isFinished INTEGER, examConfig TEXT, orderedQuestionIds TEXT
  )`);

  // 错题、收藏、SRS、笔记
  db.run(`CREATE TABLE IF NOT EXISTS mistakes (userId TEXT, questionId TEXT, PRIMARY KEY(userId, questionId))`);
  db.run(`CREATE TABLE IF NOT EXISTS favorites (userId TEXT, questionId TEXT, PRIMARY KEY(userId, questionId))`);
  db.run(`CREATE TABLE IF NOT EXISTS notes (userId TEXT, questionId TEXT, content TEXT, updatedAt TEXT, PRIMARY KEY(userId, questionId))`);
  db.run(`CREATE TABLE IF NOT EXISTS srs_records (
    id TEXT PRIMARY KEY, userId TEXT, questionId TEXT, interval INTEGER, 
    easeFactor REAL, repetitions INTEGER, nextReviewDate TEXT, status TEXT
  )`);
  
  // 每日进度
  db.run(`CREATE TABLE IF NOT EXISTS daily_progress (id TEXT PRIMARY KEY, userId TEXT, date TEXT, count INTEGER)`);

  // 系统配置
  db.run(`CREATE TABLE IF NOT EXISTS system_config (id TEXT PRIMARY KEY, data TEXT)`);

  // 登录日志与审计日志
  db.run(`CREATE TABLE IF NOT EXISTS login_logs (id TEXT PRIMARY KEY, userId TEXT, phone TEXT, role TEXT, time TEXT, ip TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, 
    operatorId TEXT, 
    operatorName TEXT, 
    action TEXT, 
    target TEXT, 
    timestamp TEXT
  )`);

  // 实操题和实操记录
  db.run(`CREATE TABLE IF NOT EXISTS practical_tasks (
    id TEXT PRIMARY KEY, 
    title TEXT, 
    parts TEXT, 
    createdAt TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS practical_records (
    id TEXT PRIMARY KEY, 
    userId TEXT, 
    taskId TEXT, 
    answers TEXT, 
    submittedAt TEXT
  )`);

  // 初始管理账号
  db.get("SELECT id FROM users WHERE phone = 'admin'", (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync('admin', 10);
      db.run("INSERT INTO users (id, phone, password, role, nickname, realName, avatar) VALUES (?,?,?,?,?,?,?)",
        ['admin-1', 'admin', hash, 'ADMIN', '超级管理员', '系统管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin']);
    }
  });
  
  // 添加 deepseekApiKey 字段（如果不存在）
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (!err && columns) {
      const hasDeepseekApiKey = columns.some(col => col.name === 'deepseekApiKey');
      if (!hasDeepseekApiKey) {
        db.run("ALTER TABLE users ADD COLUMN deepseekApiKey TEXT", (err) => {
          if (err) console.log('[DB] deepseekApiKey column may already exist');
        });
      }
      
      // 添加 loginHistory 字段（JSON 数组存储登录时间）
      const hasLoginHistory = columns.some(col => col.name === 'loginHistory');
      if (!hasLoginHistory) {
        db.run("ALTER TABLE users ADD COLUMN loginHistory TEXT", (err) => {
          if (err) console.log('[DB] loginHistory column may already exist');
        });
      }
      
      // 添加 totalOnlineTime 字段（秒数）
      const hasTotalOnlineTime = columns.some(col => col.name === 'totalOnlineTime');
      if (!hasTotalOnlineTime) {
        db.run("ALTER TABLE users ADD COLUMN totalOnlineTime INTEGER DEFAULT 0", (err) => {
          if (err) console.log('[DB] totalOnlineTime column may already exist');
        });
      }
      
      // 添加 className 字段（班级）
      const hasClassName = columns.some(col => col.name === 'className');
      if (!hasClassName) {
        db.run("ALTER TABLE users ADD COLUMN className TEXT", (err) => {
          if (err) console.log('[DB] className column may already exist');
        });
      }
      
      // 添加 lastActivity 字段（最后活跃时间，用于判断在线状态）
      const hasLastActivity = columns.some(col => col.name === 'lastActivity');
      if (!hasLastActivity) {
        db.run("ALTER TABLE users ADD COLUMN lastActivity TEXT", (err) => {
          if (err) console.log('[DB] lastActivity column may already exist');
        });
      }
      
      // 添加 gender 字段（性别）
      const hasGender = columns.some(col => col.name === 'gender');
      if (!hasGender) {
        db.run("ALTER TABLE users ADD COLUMN gender TEXT", (err) => {
          if (err) console.log('[DB] gender column may already exist');
        });
      }
    }
  });
  
  // 创建 system_config 表用于存储键值对配置（如果使用旧的单行配置表）
  db.run(`CREATE TABLE IF NOT EXISTS system_config_kv (
    key TEXT PRIMARY KEY,
    value TEXT
  )`, (err) => {
    if (err) console.log('[DB] system_config_kv table creation skipped');
  });

  // ========== 新功能扩展：题型、标签、讨论系统 ==========
  
  // 扩展 questions 表以支持新题型
  db.all("PRAGMA table_info(questions)", (err, columns) => {
    if (!err && columns) {
      // 添加 blanks 字段（填空题配置）
      const hasBlanks = columns.some(col => col.name === 'blanks');
      if (!hasBlanks) {
        db.run("ALTER TABLE questions ADD COLUMN blanks TEXT", (err) => {
          if (err) console.log('[DB] blanks column may already exist');
          else console.log('[DB] Added blanks column to questions table');
        });
      }
      
      // 添加 referenceAnswer 字段（简答题参考答案）
      const hasReferenceAnswer = columns.some(col => col.name === 'referenceAnswer');
      if (!hasReferenceAnswer) {
        db.run("ALTER TABLE questions ADD COLUMN referenceAnswer TEXT", (err) => {
          if (err) console.log('[DB] referenceAnswer column may already exist');
          else console.log('[DB] Added referenceAnswer column to questions table');
        });
      }
      
      // 添加 aiGradingEnabled 字段（是否启用AI评分）
      const hasAiGradingEnabled = columns.some(col => col.name === 'aiGradingEnabled');
      if (!hasAiGradingEnabled) {
        db.run("ALTER TABLE questions ADD COLUMN aiGradingEnabled INTEGER DEFAULT 0", (err) => {
          if (err) console.log('[DB] aiGradingEnabled column may already exist');
          else console.log('[DB] Added aiGradingEnabled column to questions table');
        });
      }
      
      // 添加 tags 字段（题目标签，JSON数组）
      const hasTags = columns.some(col => col.name === 'tags');
      if (!hasTags) {
        db.run("ALTER TABLE questions ADD COLUMN tags TEXT", (err) => {
          if (err) console.log('[DB] tags column may already exist');
          else console.log('[DB] Added tags column to questions table');
        });
      }
    }
  });

  // 扩展 exams 表以支持新题型
  db.all("PRAGMA table_info(exams)", (err, columns) => {
    if (!err && columns) {
      // 添加 fillBlankCount 字段（填空题数量）
      const hasFillBlankCount = columns.some(col => col.name === 'fillBlankCount');
      if (!hasFillBlankCount) {
        db.run("ALTER TABLE exams ADD COLUMN fillBlankCount INTEGER DEFAULT 0", (err) => {
          if (err) console.log('[DB] fillBlankCount column may already exist');
          else console.log('[DB] Added fillBlankCount column to exams table');
        });
      }
      
      // 添加 shortAnswerCount 字段（简答题数量）
      const hasShortAnswerCount = columns.some(col => col.name === 'shortAnswerCount');
      if (!hasShortAnswerCount) {
        db.run("ALTER TABLE exams ADD COLUMN shortAnswerCount INTEGER DEFAULT 0", (err) => {
          if (err) console.log('[DB] shortAnswerCount column may already exist');
          else console.log('[DB] Added shortAnswerCount column to exams table');
        });
      }
    }
  });

  // 标签表
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    createdAt TEXT NOT NULL,
    usageCount INTEGER DEFAULT 0
  )`, (err) => {
    if (err) console.log('[DB] tags table may already exist');
    else console.log('[DB] Created tags table');
  });

  // 题目-标签关联表
  db.run(`CREATE TABLE IF NOT EXISTS question_tags (
    questionId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (questionId, tagId),
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log('[DB] question_tags table may already exist');
    else console.log('[DB] Created question_tags table');
  });

  // 讨论表
  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    questionId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastActivityAt TEXT NOT NULL,
    viewCount INTEGER DEFAULT 0,
    likeCount INTEGER DEFAULT 0,
    commentCount INTEGER DEFAULT 0,
    isPinned INTEGER DEFAULT 0,
    isHidden INTEGER DEFAULT 0,
    FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE SET NULL
  )`, (err) => {
    if (err) console.log('[DB] discussions table may already exist');
    else console.log('[DB] Created discussions table');
  });

  // 评论表
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    discussionId TEXT NOT NULL,
    parentId TEXT,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    likeCount INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    FOREIGN KEY (discussionId) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log('[DB] comments table may already exist');
    else console.log('[DB] Created comments table');
  });

  // 点赞表
  db.run(`CREATE TABLE IF NOT EXISTS discussion_likes (
    userId TEXT NOT NULL,
    discussionId TEXT,
    commentId TEXT,
    createdAt TEXT NOT NULL,
    PRIMARY KEY (userId, discussionId, commentId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (discussionId) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log('[DB] discussion_likes table may already exist');
    else console.log('[DB] Created discussion_likes table');
  });

  // AI解析记录表
  db.run(`CREATE TABLE IF NOT EXISTS ai_analysis (
    userId TEXT NOT NULL,
    questionId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, questionId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log('[DB] ai_analysis table may already exist');
    else console.log('[DB] Created ai_analysis table');
  });

  // 创建索引以提升查询性能
  db.run("CREATE INDEX IF NOT EXISTS idx_discussions_questionId ON discussions(questionId)", (err) => {
    if (!err) console.log('[DB] Created index idx_discussions_questionId');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_discussions_authorId ON discussions(authorId)", (err) => {
    if (!err) console.log('[DB] Created index idx_discussions_authorId');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_discussions_lastActivityAt ON discussions(lastActivityAt DESC)", (err) => {
    if (!err) console.log('[DB] Created index idx_discussions_lastActivityAt');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_comments_discussionId ON comments(discussionId)", (err) => {
    if (!err) console.log('[DB] Created index idx_comments_discussionId');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_comments_parentId ON comments(parentId)", (err) => {
    if (!err) console.log('[DB] Created index idx_comments_parentId');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_question_tags_questionId ON question_tags(questionId)", (err) => {
    if (!err) console.log('[DB] Created index idx_question_tags_questionId');
  });
  
  db.run("CREATE INDEX IF NOT EXISTS idx_question_tags_tagId ON question_tags(tagId)", (err) => {
    if (!err) console.log('[DB] Created index idx_question_tags_tagId');
  });

  console.log('[DB] Database schema migration completed');
});

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

// 1. 登录
app.post('/api/auth/login', (req, res) => {
  const { phone, password, role } = req.body;
  db.get("SELECT * FROM users WHERE phone = ? AND role = ?", [phone, role], (err, user) => {
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
        loginHistory = user.loginHistory ? JSON.parse(user.loginHistory) : [];
      } catch (e) {
        loginHistory = [];
      }
      
      // 添加新的登录记录（保留最近100条）
      loginHistory.push(now);
      if (loginHistory.length > 100) {
        loginHistory = loginHistory.slice(-100);
      }
      
      // 更新数据库（包括 lastActivity）
      db.run(
        "UPDATE users SET lastLogin = ?, loginHistory = ?, lastActivity = ? WHERE id = ?",
        [now, JSON.stringify(loginHistory), nowISO, user.id],
        (updateErr) => {
          if (updateErr) console.error('[Login] Failed to update login history:', updateErr);
        }
      );
      
      // 插入登录日志到 login_logs 表（使用ISO格式便于统计）
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      db.run(
        "INSERT INTO login_logs (id, userId, phone, role, time, ip) VALUES (?, ?, ?, ?, ?, ?)",
        [logId, user.id, phone, role, nowISO, ip],
        (logErr) => {
          if (logErr) console.error('[Login] Failed to insert login log:', logErr);
          else console.log('[Login] Login log recorded:', { userId: user.id, phone, role });
        }
      );
      
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password, ...safeUser } = user;
      
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
  });
});

// 2. 用户资料
app.get('/api/user/profile', auth, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, row) => {
    if (row) res.json(row);
    else res.status(404).send('Not found');
  });
});

app.put('/api/user/profile', auth, (req, res) => {
  const fields = Object.keys(req.body).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
  const values = Object.keys(req.body).filter(k => k !== 'id').map(k => {
    return typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : req.body[k];
  });
  db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values, req.user.id], (err) => {
    if (err) res.status(500).send(err.message);
    else res.json({ success: true });
  });
});

// Heartbeat endpoint - updates lastActivity to track online status
app.post('/api/user/heartbeat', auth, (req, res) => {
  const lastActivity = new Date().toISOString();
  db.run("UPDATE users SET lastActivity = ? WHERE id = ?", [lastActivity, req.user.id], (err) => {
    if (err) {
      console.error('[Heartbeat] Failed to update lastActivity:', err);
      return res.status(500).send(err.message);
    }
    res.json({ success: true, lastActivity });
  });
});

// Reset user learning data (keep profile info)
app.post('/api/user/reset', auth, (req, res) => {
  const userId = req.user.id;
  console.log('[Reset] User data reset requested:', { userId, role: req.user.role });
  
  // 使用事务确保数据一致性
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
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
    
    let completed = 0;
    let hasError = false;
    
    tables.forEach(table => {
      const sql = `DELETE FROM ${table} WHERE userId = ?`;
      db.run(sql, [userId], (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error(`[Reset] Error deleting from ${table}:`, err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: `Failed to reset ${table}` });
        }
        
        completed++;
        console.log(`[Reset] Cleared ${table} for user ${userId}`);
        
        if (completed === tables.length && !hasError) {
          // 重置用户统计数据（保留个人资料）
          db.run(
            "UPDATE users SET accuracy = 0, mistakeCount = 0, dailyGoal = 20 WHERE id = ?",
            [userId],
            (err) => {
              if (err) {
                console.error('[Reset] Error updating user stats:', err);
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Failed to reset user stats' });
              }
              
              db.run("COMMIT", (err) => {
                if (err) {
                  console.error('[Reset] Error committing transaction:', err);
                  return res.status(500).json({ error: 'Failed to commit reset' });
                }
                
                console.log('[Reset] Successfully reset all data for user:', userId);
                res.json({ 
                  success: true, 
                  message: '学习数据已成功重置',
                  clearedTables: tables.length
                });
              });
            }
          );
        }
      });
    });
  });
});

// 3. 题库与题目
app.get('/api/banks', auth, (req, res) => {
  db.all("SELECT * FROM banks", [], (err, rows) => {
    const banks = (rows || []).map(bank => ({
      ...bank,
      scoreConfig: bank.scoreConfig ? (() => {
        try {
          return JSON.parse(bank.scoreConfig);
        } catch (e) {
          return { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 };
        }
      })() : { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 }
    }));
    res.json(banks);
  });
});

app.get('/api/questions', auth, (req, res) => {
  const { bankId } = req.query;
  if (bankId) {
    db.all("SELECT * FROM questions WHERE bankId = ?", [bankId], (err, rows) => {
      res.json((rows || []).map(r => ({
        ...r,
        options: parseOptionsField(r.options),
        answer: parseAnswerField(r.answer),
        blanks: r.blanks ? JSON.parse(r.blanks) : null,
        tags: r.tags ? JSON.parse(r.tags) : null,
        aiGradingEnabled: r.aiGradingEnabled === 1
      })));
    });
  } else {
    // Return all questions when no bankId provided
    db.all("SELECT * FROM questions", [], (err, rows) => {
      res.json((rows || []).map(r => ({
        ...r,
        options: parseOptionsField(r.options),
        answer: parseAnswerField(r.answer),
        blanks: r.blanks ? JSON.parse(r.blanks) : null,
        tags: r.tags ? JSON.parse(r.tags) : null,
        aiGradingEnabled: r.aiGradingEnabled === 1
      })));
    });
  }
});

// --- Banks CRUD (admin) ---
app.post('/api/banks', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const b = req.body;
  const id = b.id || `bank-${Date.now()}`;
  db.run("INSERT INTO banks (id, name, category, level, description, questionCount, scoreConfig, usageCount) VALUES (?,?,?,?,?,?,?,?)",
    [id, b.name || '', b.category || '', b.level || '', b.description || '', b.questionCount || 0, JSON.stringify(b.scoreConfig || {}), b.usageCount || 0], (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    });
});

app.put('/api/banks/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const fields = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(req.body).map(k => typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : req.body[k]);
  db.run(`UPDATE banks SET ${fields} WHERE id = ?`, [...values, req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

app.delete('/api/banks/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.run("DELETE FROM banks WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    db.run("DELETE FROM questions WHERE bankId = ?", [req.params.id], () => {
      res.json({ success: true });
    });
  });
});

// --- Questions CRUD (admin) ---
app.post('/api/questions', auth, (req, res) => {
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
  
  // Build SQL with new fields
  const sql = `INSERT INTO questions (
    id, bankId, type, content, options, answer, explanation, 
    blanks, referenceAnswer, aiGradingEnabled, tags
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
  
  const params = [
    id,
    q.bankId || '',
    q.type || 'SINGLE',
    q.content || '',
    JSON.stringify(q.options || []),
    JSON.stringify(q.answer || ''),
    q.explanation || '',
    q.blanks ? JSON.stringify(q.blanks) : null,
    q.referenceAnswer || null,
    q.aiGradingEnabled ? 1 : 0,
    q.tags ? JSON.stringify(q.tags) : null
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('[questions] Insert error:', err);
      return res.status(500).send(err.message);
    }
    
    // Update bank's questionCount if bankId present
    if (q.bankId) {
      db.run("UPDATE banks SET questionCount = COALESCE(questionCount, 0) + 1 WHERE id = ?", [q.bankId]);
    }
    
    // Update tag usage counts
    if (q.tags && Array.isArray(q.tags)) {
      for (const tagId of q.tags) {
        db.run("UPDATE tags SET usageCount = usageCount + 1 WHERE id = ?", [tagId]);
        db.run("INSERT INTO question_tags (questionId, tagId) VALUES (?, ?)", [id, tagId]);
      }
    }
    
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
  });
});

// Import multiple questions into a bank
app.post('/api/banks/:id/import', auth, (req, res) => {
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
  
  let inserted = 0;
  let skipped = 0;
  const errors = [];
  
  // 使用事务提高性能
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('[import] Error starting transaction:', err);
      return res.status(500).json({ error: err.message });
    }
    
    let stmt;
    try {
      stmt = db.prepare(`
        INSERT INTO questions (
          id, bankId, type, content, options, answer, explanation,
          blanks, referenceAnswer, aiGradingEnabled, tags
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `);
    } catch (prepareErr) {
      console.error('[import] Error preparing statement:', prepareErr);
      db.run('ROLLBACK', () => {
        return res.status(500).json({ 
          error: prepareErr.message,
          inserted: 0,
          skipped: questions.length,
          errors: [`准备语句失败：${prepareErr.message}`]
        });
      });
      return;
    }
    
    // 同步处理每个题目
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNum = i + 2; // CSV行号（+1标题行+1从1开始）
      
      try {
        // 生成唯一ID：使用时间戳+随机数+索引，确保唯一性
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const id = q.id || `q-${timestamp}-${random}-${i}`;
        
        const type = q.type || 'SINGLE';
        const content = q.content || '';
        const options = JSON.stringify(q.options || []);
        const answer = JSON.stringify(q.answer || '');
        const explanation = q.explanation || '';
        const blanks = q.blanks ? JSON.stringify(q.blanks) : null;
        const referenceAnswer = q.referenceAnswer || null;
        const aiGradingEnabled = q.aiGradingEnabled ? 1 : 0;
        const tags = q.tags ? JSON.stringify(q.tags) : null;
        
        // 执行插入（注意：stmt.run在事务中是同步的，不返回result）
        stmt.run(
          id, bankId, type, content, options, answer, explanation,
          blanks, referenceAnswer, aiGradingEnabled, tags
        );
        
        // 如果没有抛出异常，说明插入成功
        inserted++;
      } catch (err) {
        skipped++;
        const errorMsg = err.message || String(err);
        console.error(`[import] Error at row ${rowNum}:`, errorMsg);
        
        // 特殊处理ID重复错误
        if (errorMsg.includes('UNIQUE constraint') && errorMsg.includes('questions.id')) {
          errors.push(`第${rowNum}行：题目ID重复（请检查是否重复导入）`);
        } else if (errorMsg.includes('NOT NULL constraint')) {
          errors.push(`第${rowNum}行：必填字段为空`);
        } else {
          errors.push(`第${rowNum}行：${errorMsg}`);
        }
      }
    }
    
    stmt.finalize((finalizeErr) => {
      if (finalizeErr) {
        console.error('[import] Error finalizing statement:', finalizeErr);
        db.run('ROLLBACK', () => {
          return res.status(500).json({ 
            error: finalizeErr.message,
            inserted: 0,
            skipped: questions.length,
            errors: [`数据库错误：${finalizeErr.message}`]
          });
        });
        return;
      }
      
      // 提交事务
      db.run('COMMIT', (commitErr) => {
        if (commitErr) {
          console.error('[import] Error committing transaction:', commitErr);
          db.run('ROLLBACK', () => {
            return res.status(500).json({ 
              error: commitErr.message,
              inserted: 0,
              skipped: questions.length,
              errors: [`提交失败：${commitErr.message}`]
            });
          });
          return;
        }
        
        console.log(`[import] Transaction committed: ${inserted} inserted, ${skipped} skipped`);
        
        // 更新题库题目数量
        if (inserted > 0) {
          db.run(
            "UPDATE banks SET questionCount = COALESCE(questionCount, 0) + ? WHERE id = ?", 
            [inserted, bankId], 
            (updateErr) => {
              if (updateErr) {
                console.error('[import] Error updating bank count:', updateErr);
              }
              
              // 返回结果
              res.json({ 
                success: true, 
                inserted,
                skipped,
                total: questions.length,
                errors: errors.length > 0 ? errors : undefined
              });
            }
          );
        } else {
          res.json({ 
            success: true, 
            inserted: 0,
            skipped,
            total: questions.length,
            errors: errors.length > 0 ? errors : undefined
          });
        }
      });
    });
  });
});

app.put('/api/questions/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const body = req.body;
  
  // Validate fill-in-blank questions
  if (body.type === 'FILL_IN_BLANK' && body.blanks) {
    if (!Array.isArray(body.blanks) || body.blanks.length === 0) {
      return res.status(400).json({ error: '填空题必须配置空白项' });
    }
  }
  
  // Get old tags to update usage counts
  db.get("SELECT tags FROM questions WHERE id = ?", [req.params.id], (err, oldRow) => {
    const oldTags = oldRow && oldRow.tags ? JSON.parse(oldRow.tags) : [];
    const newTags = body.tags || [];
    
    // Calculate tag changes
    const removedTags = oldTags.filter(t => !newTags.includes(t));
    const addedTags = newTags.filter(t => !oldTags.includes(t));
    
    const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
    const values = Object.keys(body).map(k => {
      if (k === 'options' || k === 'answer' || k === 'blanks' || k === 'tags' || typeof body[k] === 'object') {
        return JSON.stringify(body[k]);
      }
      if (k === 'aiGradingEnabled') {
        return body[k] ? 1 : 0;
      }
      return body[k];
    });
    
    db.run(`UPDATE questions SET ${fields} WHERE id = ?`, [...values, req.params.id], (err) => {
      if (err) return res.status(500).send(err.message);
      
      // Update tag associations
      for (const tagId of removedTags) {
        db.run("UPDATE tags SET usageCount = MAX(0, usageCount - 1) WHERE id = ?", [tagId]);
        db.run("DELETE FROM question_tags WHERE questionId = ? AND tagId = ?", [req.params.id, tagId]);
      }
      
      for (const tagId of addedTags) {
        db.run("UPDATE tags SET usageCount = usageCount + 1 WHERE id = ?", [tagId]);
        db.run("INSERT OR IGNORE INTO question_tags (questionId, tagId) VALUES (?, ?)", [req.params.id, tagId]);
      }
      
      res.json({ success: true });
    });
  });
});

app.delete('/api/questions/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const qId = req.params.id;
  db.get("SELECT * FROM questions WHERE id = ?", [qId], (err, row) => {
    if (err) return res.status(500).send(err.message);
    const bankId = row ? row.bankId : null;
    db.run("DELETE FROM questions WHERE id = ?", [qId], (err2) => {
      if (err2) return res.status(500).send(err2.message);
      if (bankId) {
        db.run("UPDATE banks SET questionCount = MAX(COALESCE(questionCount,0) - 1, 0) WHERE id = ?", [bankId]);
      }
      res.json({ success: true });
    });
  });
});

app.post('/api/questions/batch-delete', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true });
  const placeholders = ids.map(() => '?').join(',');
  // First, compute counts per bank
  db.all(`SELECT bankId, COUNT(*) as c FROM questions WHERE id IN (${placeholders}) GROUP BY bankId`, ids, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    db.run(`DELETE FROM questions WHERE id IN (${placeholders})`, ids, (err2) => {
      if (err2) return res.status(500).send(err2.message);
      // Adjust questionCount per bank
      (rows || []).forEach(r => {
        if (r.bankId) db.run("UPDATE banks SET questionCount = MAX(COALESCE(questionCount,0) - ?, 0) WHERE id = ?", [r.c, r.bankId]);
      });
      res.json({ success: true });
    });
  });
});

// --- Admin: Students management ---
app.post('/api/admin/students', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const s = req.body;
  const id = s.id || `student-${Date.now()}`;
  const password = s.password || '123456';
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (id, phone, password, role, nickname, realName, avatar) VALUES (?,?,?,?,?,?,?)",
    [id, s.phone || `phone-${Date.now()}`, hash, 'STUDENT', s.nickname || '', s.realName || '', s.avatar || ''], (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    });
});

app.get('/api/admin/students', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM users WHERE role = 'STUDENT'", [], (err, rows) => {
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
      const lastActivity = r.lastActivity ? new Date(r.lastActivity).getTime() : 0;
      const isOnline = (now - lastActivity) < ONLINE_THRESHOLD;
      
      return {
        ...r,
        studentPerms: normalizeArrayField(r.studentPerms),
        allowedBankIds: normalizeArrayField(r.allowedBankIds),
        loginHistory: normalizeArrayField(r.loginHistory),
        totalOnlineTime: r.totalOnlineTime || 0,
        isOnline: isOnline
      };
    });
    res.json(out);
  });
});

// Admin-only maintenance: repair double-encoded student permission fields (idempotent)
app.post('/api/admin/repair-student-schema', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT id, studentPerms, allowedBankIds FROM users WHERE role = 'STUDENT'", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    let updated = 0;
    rows.forEach(row => {
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
      const perms = normalize(row.studentPerms);
      const banks = normalize(row.allowedBankIds);
      if (perms !== null || banks !== null) {
        db.run("UPDATE users SET studentPerms = ?, allowedBankIds = ? WHERE id = ?", [JSON.stringify(perms || []), JSON.stringify(banks || []), row.id]);
        updated++;
      }
    });
    res.json({ success: true, updated });
  });
});

app.get('/api/admin/admins', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM users WHERE role = 'ADMIN'", [], (err, rows) => {
    // 解析permissions字段（可能是JSON字符串、null或undefined）
    const admins = (rows || []).map(admin => {
      let permissions = admin.permissions;
      
      // 处理null或undefined
      if (!permissions) {
        permissions = [];
      }
      // 处理JSON字符串
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
        permissions: Array.isArray(permissions) ? permissions : []
      };
    });
    res.json(admins);
  });
});

// Create admin account
app.post('/api/admin/admins', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const a = req.body;
  const id = a.id || `admin-${Date.now()}`;
  const password = a.password || '123456';
  const hash = bcrypt.hashSync(password, 10);
  
  db.run(
    "INSERT INTO users (id, phone, password, role, nickname, realName, avatar, permissions) VALUES (?,?,?,?,?,?,?,?)",
    [
      id, 
      a.phone || `admin-${Date.now()}`, 
      hash, 
      'ADMIN', 
      a.nickname || '', 
      a.realName || '', 
      a.avatar || '', 
      JSON.stringify(a.permissions || [])
    ], 
    (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    }
  );
});

// Update admin account
app.put('/api/admin/admins/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const body = req.body;
  
  // 如果修改密码，需要加密
  if (body.password) {
    body.password = bcrypt.hashSync(body.password, 10);
  }
  
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(body).map(k => {
    if (k === 'permissions' || typeof body[k] === 'object') {
      return JSON.stringify(body[k]);
    }
    return body[k];
  });
  
  db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values, req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

// Delete admin account
app.delete('/api/admin/admins/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const adminId = req.params.id;
  
  // 防止删除超级管理员
  if (adminId === 'admin-1') {
    return res.status(403).json({ error: '不能删除超级管理员账号' });
  }
  
  db.run("DELETE FROM users WHERE id = ? AND role = 'ADMIN'", [adminId], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

app.put('/api/admin/students/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const body = req.body;
  
  // Filter out computed/virtual fields that don't exist in database
  const { isOnline, ...updateData } = body;
  
  if (updateData.password) updateData.password = bcrypt.hashSync(updateData.password, 10);
  const fields = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(updateData).map(k => typeof updateData[k] === 'object' ? JSON.stringify(updateData[k]) : updateData[k]);
  db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values, req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

app.post('/api/admin/students/batch-delete', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true });
  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM users WHERE id IN (${placeholders})`, ids, (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

// Batch set permissions for students
app.post('/api/admin/students/batch-perms', auth, (req, res) => {
  console.log('[batch-perms] POST /api/admin/students/batch-perms', { body: req.body, user: req.user && { id: req.user.id, role: req.user.role } });
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const data = req.body || {};
  const entries = Object.entries(data);
  console.log('[batch-perms] Updating', entries.length, 'students');
  db.serialize(() => {
    for (const [id, v] of entries) {
      const payload = v;
      console.log('[batch-perms] Updating student:', id, 'perms:', payload.studentPerms, 'bankIds:', payload.allowedBankIds);
      db.run("UPDATE users SET studentPerms = ?, allowedBankIds = ? WHERE id = ?", [JSON.stringify(payload.studentPerms || []), JSON.stringify(payload.allowedBankIds || []), id]);
    }
    console.log('[batch-perms] All updates complete');
    res.json({ success: true });
  });
});

// Update single student's perms
app.put('/api/admin/students/:id/perms', auth, (req, res) => {
  console.log('[perms] PUT /api/admin/students/:id/perms', { params: req.params, body: req.body, user: req.user && { id: req.user.id, role: req.user.role } });
  if (!req.user || req.user.role !== 'ADMIN') {
    console.warn('[perms] forbidden', req.user);
    return res.status(403).send('Forbidden');
  }
  const id = req.params.id;
  const { studentPerms, allowedBankIds } = req.body || {};
  db.run("UPDATE users SET studentPerms = ?, allowedBankIds = ? WHERE id = ?", [JSON.stringify(studentPerms || []), JSON.stringify(allowedBankIds || []), id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

// 4. 练习记录
app.get('/api/practice', auth, (req, res) => {
  db.all("SELECT * FROM practice_records WHERE userId = ?", [req.user.id], (err, rows) => res.json(rows || []));
});

app.post('/api/practice', auth, (req, res) => {
  const data = req.body;
  const sql = `INSERT INTO practice_records (id, userId, bankId, bankName, type, questionTypeFilter, mode, count, date, currentIndex, userAnswers, isCustom) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  db.run(sql, [data.id, req.user.id, data.bankId, data.bankName, data.type, data.questionTypeFilter, data.mode, data.count, data.date, data.currentIndex, JSON.stringify(data.userAnswers), data.isCustom ? 1 : 0], (err) => {
    if (err) res.status(500).send(err.message);
    else res.json({ success: true });
  });
});

app.put('/api/practice/:id', auth, (req, res) => {
  const { currentIndex, userAnswers, date } = req.body;
  const updateDate = date || new Date().toLocaleString();
  
  console.log('[PUT /api/practice/:id] 更新练习记录:', {
    id: req.params.id,
    userId: req.user.id,
    currentIndex,
    answersCount: Object.keys(userAnswers || {}).length,
    date: updateDate
  });
  
  db.run(
    `UPDATE practice_records SET currentIndex = ?, userAnswers = ?, date = ? WHERE id = ? AND userId = ?`, 
    [currentIndex, JSON.stringify(userAnswers), updateDate, req.params.id, req.user.id], 
    function(err) {
      if (err) {
        console.error('[PUT /api/practice/:id] 更新失败:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      console.log('[PUT /api/practice/:id] 更新成功, 影响行数:', this.changes);
      
      if (this.changes === 0) {
        console.warn('[PUT /api/practice/:id] 警告: 没有记录被更新，可能记录不存在或userId不匹配');
      }
      
      res.json({ success: true, changes: this.changes });
    }
  );
});

// 删除练习记录
app.delete('/api/practice/:id', auth, (req, res) => {
  const practiceId = req.params.id;
  const userId = req.user.id;
  
  // 验证记录所有权
  db.get(
    "SELECT * FROM practice_records WHERE id = ? AND userId = ?", 
    [practiceId, userId], 
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '练习记录不存在或无权限删除' });
      
      // 删除记录
      db.run(
        "DELETE FROM practice_records WHERE id = ? AND userId = ?", 
        [practiceId, userId], 
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    }
  );
});

// --- Exam Management API ---
// Get all exams
app.get('/api/exams', auth, (req, res) => {
  db.all("SELECT * FROM exams", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // 解析JSON字段
    const exams = (rows || []).map(exam => ({
      ...exam,
      selectedQuestionIds: exam.selectedQuestionIds ? JSON.parse(exam.selectedQuestionIds) : [],
      isVisible: exam.isVisible === 1,
      singleCount: exam.singleCount || 0,
      multipleCount: exam.multipleCount || 0,
      judgeCount: exam.judgeCount || 0
    }));
    
    res.json(exams);
  });
});

// Create new exam
app.post('/api/exams', auth, (req, res) => {
  console.log('[POST /api/exams] Creating exam:', req.body);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  const exam = req.body;
  const id = exam.id || `exam-${Date.now()}`;
  
  db.run(
    `INSERT INTO exams (
      id, bankId, title, duration, totalScore, passScore, passScorePercent, 
      strategy, selectedQuestionIds, status, isVisible, startTime, endTime, 
      singleCount, multipleCount, judgeCount, fillBlankCount, shortAnswerCount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      exam.bankId,
      exam.title,
      exam.duration,
      exam.totalScore,
      exam.passScore,
      exam.passScorePercent,
      exam.strategy,
      JSON.stringify(exam.selectedQuestionIds || []),
      exam.status || 'PENDING',
      exam.isVisible ? 1 : 0,
      exam.startTime || null,
      exam.endTime || null,
      exam.singleCount || 0,
      exam.multipleCount || 0,
      exam.judgeCount || 0,
      exam.fillBlankCount || 0,
      exam.shortAnswerCount || 0
    ],
    (err) => {
      if (err) {
        console.error('[POST /api/exams] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('[POST /api/exams] Exam created successfully:', id);
      res.json({ success: true, id });
    }
  );
});

// Update exam
app.put('/api/exams/:id', auth, (req, res) => {
  console.log('[PUT /api/exams/:id] Updating exam:', req.params.id, req.body);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  const exam = req.body;
  const fields = [];
  const values = [];
  
  if (exam.bankId !== undefined) { fields.push('bankId = ?'); values.push(exam.bankId); }
  if (exam.title !== undefined) { fields.push('title = ?'); values.push(exam.title); }
  if (exam.duration !== undefined) { fields.push('duration = ?'); values.push(exam.duration); }
  if (exam.totalScore !== undefined) { fields.push('totalScore = ?'); values.push(exam.totalScore); }
  if (exam.passScore !== undefined) { fields.push('passScore = ?'); values.push(exam.passScore); }
  if (exam.passScorePercent !== undefined) { fields.push('passScorePercent = ?'); values.push(exam.passScorePercent); }
  if (exam.strategy !== undefined) { fields.push('strategy = ?'); values.push(exam.strategy); }
  if (exam.selectedQuestionIds !== undefined) { fields.push('selectedQuestionIds = ?'); values.push(JSON.stringify(exam.selectedQuestionIds)); }
  if (exam.status !== undefined) { fields.push('status = ?'); values.push(exam.status); }
  if (exam.isVisible !== undefined) { fields.push('isVisible = ?'); values.push(exam.isVisible ? 1 : 0); }
  if (exam.startTime !== undefined) { fields.push('startTime = ?'); values.push(exam.startTime); }
  if (exam.endTime !== undefined) { fields.push('endTime = ?'); values.push(exam.endTime); }
  if (exam.singleCount !== undefined) { fields.push('singleCount = ?'); values.push(exam.singleCount); }
  if (exam.multipleCount !== undefined) { fields.push('multipleCount = ?'); values.push(exam.multipleCount); }
  if (exam.judgeCount !== undefined) { fields.push('judgeCount = ?'); values.push(exam.judgeCount); }
  if (exam.fillBlankCount !== undefined) { fields.push('fillBlankCount = ?'); values.push(exam.fillBlankCount); }
  if (exam.shortAnswerCount !== undefined) { fields.push('shortAnswerCount = ?'); values.push(exam.shortAnswerCount); }
  
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(req.params.id);
  
  db.run(
    `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        console.error('[PUT /api/exams/:id] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('[PUT /api/exams/:id] Exam updated successfully');
      res.json({ success: true });
    }
  );
});

// Delete exam
app.delete('/api/exams/:id', auth, (req, res) => {
  console.log('[DELETE /api/exams/:id] Deleting exam:', req.params.id);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  db.run('DELETE FROM exams WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('[DELETE /api/exams/:id] Error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DELETE /api/exams/:id] Exam deleted successfully');
    res.json({ success: true });
  });
});

// Toggle exam visibility
app.post('/api/exams/:id/toggle-visibility', auth, (req, res) => {
  console.log('[POST /api/exams/:id/toggle-visibility] Toggling visibility:', req.params.id);
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).send('Forbidden');
  }
  
  db.get('SELECT isVisible FROM exams WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('[POST /api/exams/:id/toggle-visibility] Error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    const newVisibility = row.isVisible === 1 ? 0 : 1;
    
    db.run('UPDATE exams SET isVisible = ? WHERE id = ?', [newVisibility, req.params.id], (err) => {
      if (err) {
        console.error('[POST /api/exams/:id/toggle-visibility] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('[POST /api/exams/:id/toggle-visibility] Visibility toggled successfully');
      res.json({ success: true, isVisible: newVisibility === 1 });
    });
  });
});


// Exams history: read from exam_history table (for current user)
app.get('/api/exams/history', auth, (req, res) => {
  db.all("SELECT * FROM exam_history WHERE userId = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // 解析 JSON 字段
    const parsed = (rows || []).map(r => ({
      ...r,
      wrongQuestionIds: r.wrongQuestionIds ? JSON.parse(r.wrongQuestionIds) : [],
      userAnswers: r.userAnswers ? JSON.parse(r.userAnswers) : {},
      examConfig: r.examConfig ? JSON.parse(r.examConfig) : null,
      orderedQuestionIds: r.orderedQuestionIds ? JSON.parse(r.orderedQuestionIds) : []
    }));
    res.json(parsed);
  });
});

// 管理员获取所有考试历史记录
app.get('/api/admin/exam-history', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM exam_history ORDER BY submitTime DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // 解析 JSON 字段
    const parsed = (rows || []).map(r => ({
      ...r,
      wrongQuestionIds: r.wrongQuestionIds ? JSON.parse(r.wrongQuestionIds) : [],
      userAnswers: r.userAnswers ? JSON.parse(r.userAnswers) : {},
      examConfig: r.examConfig ? JSON.parse(r.examConfig) : null,
      orderedQuestionIds: r.orderedQuestionIds ? JSON.parse(r.orderedQuestionIds) : []
    }));
    res.json(parsed);
  });
});

// Create or update exam history record
app.post('/api/exams/history', auth, (req, res) => {
  const record = req.body;
  const id = record.id || `exam-${Date.now()}`;
  
  // 使用 INSERT OR REPLACE 来处理"保存并退出"后"提交试卷"的场景
  db.run(
    `INSERT OR REPLACE INTO exam_history (
      id, userId, examId, examTitle, score, totalScore, passScore, 
      timeUsed, submitTime, bankId, wrongQuestionIds, userAnswers, 
      passed, currentIndex, isFinished, examConfig, orderedQuestionIds
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      JSON.stringify(record.wrongQuestionIds || []),
      JSON.stringify(record.userAnswers || {}),
      record.passed ? 1 : 0,
      record.currentIndex || 0,
      record.isFinished ? 1 : 0,
      JSON.stringify(record.examConfig || null),
      JSON.stringify(record.orderedQuestionIds || [])
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    }
  );
});

// Update exam history record (for continuing unfinished exams)
app.put('/api/exams/history/:id', auth, (req, res) => {
  const record = req.body;
  
  db.run(
    `UPDATE exam_history SET 
      score = ?, totalScore = ?, passScore = ?, timeUsed = ?, 
      submitTime = ?, wrongQuestionIds = ?, userAnswers = ?, 
      passed = ?, currentIndex = ?, isFinished = ?, examConfig = ?, 
      orderedQuestionIds = ?
    WHERE id = ? AND userId = ?`,
    [
      record.score || 0,
      record.totalScore || 0,
      record.passScore || 0,
      record.timeUsed || 0,
      record.submitTime || new Date().toLocaleString(),
      JSON.stringify(record.wrongQuestionIds || []),
      JSON.stringify(record.userAnswers || {}),
      record.passed ? 1 : 0,
      record.currentIndex || 0,
      record.isFinished ? 1 : 0,
      JSON.stringify(record.examConfig || null),
      JSON.stringify(record.orderedQuestionIds || []),
      req.params.id,
      req.user.id
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Delete exam history record
app.delete('/api/exams/history/:id', auth, (req, res) => {
  db.run(
    "DELETE FROM exam_history WHERE id = ? AND userId = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Admin: login logs & audit logs
app.get('/api/admin/login-logs', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM login_logs", [], (err, rows) => res.json(rows || []));
});

app.get('/api/admin/audit-logs', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM audit_logs", [], (err, rows) => res.json(rows || []));
});

app.post('/api/admin/audit-logs', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const id = `audit-${Date.now()}`;
  const { action, target, timestamp, operatorId, operatorName } = req.body;
  db.run(
    "INSERT INTO audit_logs (id, operatorId, operatorName, action, target, timestamp) VALUES (?,?,?,?,?,?)", 
    [id, operatorId || req.user.id, operatorName || req.user.realName || req.user.nickname, action || '', target || '', timestamp || new Date().toLocaleString()], 
    (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    }
  );
});

// Bank score update route
app.put('/api/banks/:id/score', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const bankId = req.params.id;
  const { scoreConfig } = req.body || {};
  
  // 验证 scoreConfig 格式
  if (!scoreConfig || typeof scoreConfig !== 'object') {
    return res.status(400).json({ error: '无效的分值配置' });
  }
  
  db.run("UPDATE banks SET scoreConfig = ? WHERE id = ?", [JSON.stringify(scoreConfig), bankId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Admin: custom field schema management (stored in system_config.main.customFieldSchema)
app.post('/api/admin/config/custom-fields', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { name } = req.body || {};
  if (!name) return res.status(400).send('Name required');
  db.get("SELECT data FROM system_config WHERE id = 'main'", (err, row) => {
    const data = row ? JSON.parse(row.data) : {};
    data.customFieldSchema = data.customFieldSchema || [];
    if (!data.customFieldSchema.includes(name)) data.customFieldSchema.push(name);
    db.run("INSERT OR REPLACE INTO system_config (id, data) VALUES ('main', ?)", [JSON.stringify(data)], (e) => {
      if (e) return res.status(500).send(e.message);
      res.json({ success: true });
    });
  });
});

app.delete('/api/admin/config/custom-fields/:name', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const name = req.params.name;
  db.get("SELECT data FROM system_config WHERE id = 'main'", (err, row) => {
    const data = row ? JSON.parse(row.data) : {};
    data.customFieldSchema = (data.customFieldSchema || []).filter((n) => n !== name);
    db.run("INSERT OR REPLACE INTO system_config (id, data) VALUES ('main', ?)", [JSON.stringify(data)], (e) => {
      if (e) return res.status(500).send(e.message);
      res.json({ success: true });
    });
  });
});

// Practical tasks/records
app.get('/api/practical/tasks', auth, (req, res) => {
  db.all("SELECT * FROM practical_tasks ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const tasks = (rows || []).map(row => ({
      id: row.id,
      title: row.title,
      parts: JSON.parse(row.parts || '[]'),
      createdAt: row.createdAt
    }));
    res.json(tasks);
  });
});

app.post('/api/practical/tasks', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const task = req.body;
  const id = task.id || `pt-${Date.now()}`;
  db.run("INSERT INTO practical_tasks (id, title, parts, createdAt) VALUES (?,?,?,?)",
    [id, task.title || '', JSON.stringify(task.parts || []), task.createdAt || new Date().toLocaleString()], (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    });
});

app.put('/api/practical/tasks/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const task = req.body;
  db.run("UPDATE practical_tasks SET title = ?, parts = ? WHERE id = ?",
    [task.title || '', JSON.stringify(task.parts || []), req.params.id], (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true });
    });
});

app.delete('/api/practical/tasks/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.run("DELETE FROM practical_tasks WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

app.get('/api/practical/records', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    // 学员只能看到自己的记录
    db.all("SELECT * FROM practical_records WHERE userId = ? ORDER BY submittedAt DESC", [req.user.id], (err, rows) => {
      if (err) return res.status(500).send(err.message);
      const records = (rows || []).map(row => ({
        id: row.id,
        userId: row.userId,
        taskId: row.taskId,
        answers: JSON.parse(row.answers || '{}'),
        submittedAt: row.submittedAt
      }));
      res.json(records);
    });
  } else {
    // 管理员可以看到所有记录
    db.all("SELECT * FROM practical_records ORDER BY submittedAt DESC", [], (err, rows) => {
      if (err) return res.status(500).send(err.message);
      const records = (rows || []).map(row => ({
        id: row.id,
        userId: row.userId,
        taskId: row.taskId,
        answers: JSON.parse(row.answers || '{}'),
        submittedAt: row.submittedAt
      }));
      res.json(records);
    });
  }
});

app.post('/api/practical/records', auth, (req, res) => {
  const record = req.body;
  const id = record.id || `ptr-${Date.now()}`;
  db.run("INSERT INTO practical_records (id, userId, taskId, answers, submittedAt) VALUES (?,?,?,?,?)",
    [id, record.userId || req.user.id, record.taskId || '', JSON.stringify(record.answers || {}), record.submittedAt || new Date().toLocaleString()], (err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id });
    });
});

app.delete('/api/practical/records/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM practical_records WHERE id = ? AND userId = ?", [id, req.user.id], function(err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send('记录不存在或无权删除');
    res.json({ success: true });
  });
});

// SRS records (use srs_records table)
app.get('/api/srs/records', auth, (req, res) => {
  db.all("SELECT * FROM srs_records WHERE userId = ?", [req.user.id], (err, rows) => res.json(rows || []));
});

// SRS update - handle mastery level updates
app.post('/api/srs/update', auth, (req, res) => {
  const { questionId, level } = req.body || {};
  if (!questionId || !level) {
    return res.status(400).json({ error: 'questionId and level are required' });
  }
  
  // Calculate next review date based on level
  const now = new Date();
  let intervalDays = 1;
  let easeFactor = 2.5;
  let repetitions = 0;
  
  // Get existing record if any
  db.get(
    "SELECT * FROM srs_records WHERE userId = ? AND questionId = ?",
    [req.user.id, questionId],
    (err, existing) => {
      if (existing) {
        repetitions = existing.repetitions || 0;
        easeFactor = existing.easeFactor || 2.5;
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
      // 如果 intervalDays 为 0，nextReviewDate 就是今天
      const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];
      
      const id = existing?.id || `srs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      db.run(
        `INSERT OR REPLACE INTO srs_records 
         (id, userId, questionId, interval, easeFactor, repetitions, nextReviewDate, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, questionId, intervalDays, easeFactor, repetitions, nextReviewDateStr, 'active'],
        (err) => {
          if (err) {
            console.error('[SRS] Update error:', err);
            return res.status(500).json({ error: err.message });
          }
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
        }
      );
    }
  );
});

// Mistakes: return joined questions for user's mistakes
app.get('/api/mistakes', auth, (req, res) => {
  db.all(`SELECT q.* FROM questions q JOIN mistakes m ON q.id = m.questionId WHERE m.userId = ?`, [req.user.id], (err, rows) => {
    res.json((rows || []).map(r => ({ ...r, options: parseOptionsField(r.options), answer: parseAnswerField(r.answer) })));
  });
});

app.post('/api/mistakes', auth, (req, res) => {
  const { questionId } = req.body || {};
  if (!questionId) return res.status(400).send('questionId required');
  db.get("SELECT * FROM mistakes WHERE userId = ? AND questionId = ?", [req.user.id, questionId], (err, row) => {
    if (row) {
      // 已存在，不做任何操作（或者可以返回成功）
      res.json({ success: true, added: false });
    } else {
      db.run("INSERT INTO mistakes (userId, questionId) VALUES (?, ?)", [req.user.id, questionId], (err2) => {
        if (err2) return res.status(500).send(err2.message);
        res.json({ success: true, added: true });
      });
    }
  });
});

// 5. 笔记与收藏

// 笔记：保存/删除
app.post('/api/notes', auth, (req, res) => {
  const { questionId, content } = req.body || {};
  if (!questionId) return res.status(400).send('questionId required');
  const now = new Date().toLocaleString();

  // 内容为空则删除（等价于清空笔记）
  if (!content || String(content).trim() === '') {
    db.run(
      "DELETE FROM notes WHERE userId = ? AND questionId = ?",
      [req.user.id, questionId],
      (err) => {
        if (err) return res.status(500).send(err.message);
        res.json({ success: true, deleted: true });
      }
    );
  } else {
    db.run(
      "INSERT OR REPLACE INTO notes (userId, questionId, content, updatedAt) VALUES (?,?,?,?)",
      [req.user.id, questionId, content, now],
      (err) => {
        if (err) return res.status(500).send(err.message);
        res.json({ success: true });
      }
    );
  }
});

// 笔记：查询单题
app.get('/api/notes/:qId', auth, (req, res) => {
  db.get(
    "SELECT * FROM notes WHERE userId = ? AND questionId = ?",
    [req.user.id, req.params.qId],
    (err, row) => {
      if (err) return res.status(500).send(err.message);
      res.json(row || null);
    }
  );
});

// 错题与收藏
app.get('/api/favorites', auth, (req, res) => {
  db.all(`SELECT q.* FROM questions q JOIN favorites f ON q.id = f.questionId WHERE f.userId = ?`, [req.user.id], (err, rows) => {
    res.json(rows.map(r => ({ ...r, options: parseOptionsField(r.options), answer: parseAnswerField(r.answer) })));
  });
});

app.post('/api/favorites/:qId', auth, (req, res) => {
  db.get("SELECT * FROM favorites WHERE userId = ? AND questionId = ?", [req.user.id, req.params.qId], (err, row) => {
    if (row) db.run("DELETE FROM favorites WHERE userId = ? AND questionId = ?", [req.user.id, req.params.qId]);
    else db.run("INSERT INTO favorites (userId, questionId) VALUES (?, ?)", [req.user.id, req.params.qId]);
    res.json({ success: true });
  });
});

// 6. AI 讲评（使用 DeepSeek API）
app.post('/api/ai/generate', auth, async (req, res) => {
  const { prompt } = req.body;
  try {
    // 获取有效的 API Key（优先使用学员的，否则使用管理员的）
    let apiKey = null;
    
    // 获取学员的 API Key
    const userResult = await new Promise((resolve, reject) => {
      db.get("SELECT deepseekApiKey FROM users WHERE id = ?", [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (userResult && userResult.deepseekApiKey) {
      apiKey = userResult.deepseekApiKey;
    } else {
      // 获取管理员的全局 API Key（从 system_config_kv 表）
      const configResult = await new Promise((resolve, reject) => {
        db.get("SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
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
    
    // 检查是否已存在该用户对该题目的解析
    const existing = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM ai_analysis WHERE userId = ? AND questionId = ?",
        [req.user.id, questionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existing) {
      // 更新现有记录
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE ai_analysis SET content = ?, updatedAt = ? WHERE userId = ? AND questionId = ?",
          [content, now, req.user.id, questionId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // 插入新记录
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO ai_analysis (userId, questionId, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
          [req.user.id, questionId, content, now, now],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Save AI Analysis Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取AI解析内容
app.get('/api/ai/analysis/:questionId', auth, async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM ai_analysis WHERE userId = ? AND questionId = ?",
        [req.user.id, req.params.questionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.json(result || null);
  } catch (err) {
    console.error('[Get AI Analysis Error]', err);
    res.status(500).json({ error: err.message });
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
    
    if (search) {
      whereClause += ' AND (q.content LIKE ? OR u.nickname LIKE ? OR u.realName LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (type && type !== 'ALL') {
      whereClause += ' AND q.type = ?';
      params.push(type);
    }
    
    // 获取总数
    const countResult = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as total 
         FROM ai_analysis a
         JOIN questions q ON a.questionId = q.id
         JOIN users u ON a.userId = u.id
         WHERE ${whereClause}`,
        params,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    // 获取分页数据
    const records = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           a.userId,
           a.questionId,
           a.content,
           a.createdAt,
           a.updatedAt,
           u.nickname as userName,
           u.realName as userRealName,
           q.type as questionType,
           q.content as questionContent,
           q.bankId
         FROM ai_analysis a
         JOIN questions q ON a.questionId = q.id
         JOIN users u ON a.userId = u.id
         WHERE ${whereClause}
         ORDER BY a.updatedAt DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
    
    res.json({
      records,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / parseInt(pageSize))
    });
  } catch (err) {
    console.error('[Get Admin AI Analysis Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. 每日进度统计
app.get('/api/user/progress', auth, (req, res) => {
  db.all("SELECT * FROM daily_progress WHERE userId = ?", [req.user.id], (err, rows) => res.json(rows || []));
});

// 管理员获取所有学员的每日进度（用于统计）
app.get('/api/admin/all-progress', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  db.all("SELECT * FROM daily_progress ORDER BY date DESC", (err, rows) => res.json(rows || []));
});

app.post('/api/user/progress/increment', auth, (req, res) => {
  const date = new Date().toISOString().split('T')[0];
  const id = `${req.user.id}_${date}`;
  db.get("SELECT * FROM daily_progress WHERE id = ?", [id], (err, row) => {
    if (row) db.run("UPDATE daily_progress SET count = count + 1 WHERE id = ?", [id]);
    else db.run("INSERT INTO daily_progress (id, userId, date, count) VALUES (?, ?, ?, 1)", [id, req.user.id, date]);
    res.json({ success: true });
  });
});

// 8. 系统配置
app.get('/api/config', async (req, res) => {
  try {
    // 获取主配置
    const mainConfig = await new Promise((resolve, reject) => {
      db.get("SELECT data FROM system_config WHERE id = 'main'", (err, row) => {
        if (err) reject(err);
        else resolve(row ? JSON.parse(row.data) : {});
      });
    });
    
    // 获取 deepseekApiKey（从 system_config_kv 表）
    const deepseekKey = await new Promise((resolve, reject) => {
      db.get("SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'", (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.value : null);
      });
    });
    
    // 合并配置
    const config = {
      ...mainConfig,
      deepseekApiKey: deepseekKey
    };
    
    res.json(config);
  } catch (err) {
    console.error('[Config API Error]', err);
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
    
    // 保存主配置到 system_config 表
    const data = JSON.stringify(mainConfigData);
    await new Promise((resolve, reject) => {
      db.run("INSERT OR REPLACE INTO system_config (id, data) VALUES ('main', ?)", [data], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 保存 deepseekApiKey 到 system_config_kv 表
    if (deepseekApiKey !== undefined) {
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT OR REPLACE INTO system_config_kv (key, value) VALUES ('deepseekApiKey', ?)",
          [deepseekApiKey || ''],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Update Config Error]', err);
    res.status(500).send(err.message);
  }
});
// ========== 新增API端点 - 标签系统 ==========

// 获取所有标签
app.get('/api/tags', auth, (req, res) => {
  db.all("SELECT * FROM tags ORDER BY usageCount DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ tags: rows || [] });
  });
});

// 创建标签
app.post('/api/tags', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { name, color } = req.body;
  
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: '标签名称不能为空' });
  }
  
  const id = `tag-${Date.now()}`;
  const now = new Date().toISOString();
  
  db.run(
    "INSERT INTO tags (id, name, color, createdAt, usageCount) VALUES (?, ?, ?, ?, 0)",
    [id, name.trim(), color || null, now],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: '标签名称已存在' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id, tag: { id, name: name.trim(), color, createdAt: now, usageCount: 0 } });
    }
  );
});

// 更新标签
app.put('/api/tags/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { name, color } = req.body;
  
  const fields = [];
  const values = [];
  
  if (name !== undefined) {
    if (String(name).trim() === '') {
      return res.status(400).json({ error: '标签名称不能为空' });
    }
    fields.push('name = ?');
    values.push(name.trim());
  }
  
  if (color !== undefined) {
    fields.push('color = ?');
    values.push(color);
  }
  
  if (fields.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }
  
  values.push(req.params.id);
  
  db.run(
    `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: '标签名称已存在' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '标签不存在' });
      }
      res.json({ success: true });
    }
  );
});

// 删除标签
app.delete('/api/tags/:id', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  
  // 检查标签是否正在使用
  db.get(
    "SELECT COUNT(*) as count FROM question_tags WHERE tagId = ?",
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (row.count > 0) {
        return res.status(400).json({ 
          error: '标签正在使用中，请先解除所有题目的关联',
          usageCount: row.count 
        });
      }
      
      db.run("DELETE FROM tags WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
          return res.status(404).json({ error: '标签不存在' });
        }
        res.json({ success: true });
      });
    }
  );
});

// 合并标签
app.post('/api/tags/merge', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { sourceTagId, targetTagId } = req.body;
  
  if (!sourceTagId || !targetTagId) {
    return res.status(400).json({ error: '缺少源标签或目标标签ID' });
  }
  
  if (sourceTagId === targetTagId) {
    return res.status(400).json({ error: '源标签和目标标签不能相同' });
  }
  
  // 获取两个标签的信息
  db.all(
    "SELECT * FROM tags WHERE id IN (?, ?)",
    [sourceTagId, targetTagId],
    (err, tags) => {
      if (err) return res.status(500).json({ error: err.message });
      if (tags.length !== 2) {
        return res.status(404).json({ error: '标签不存在' });
      }
      
      const sourceTag = tags.find(t => t.id === sourceTagId);
      const targetTag = tags.find(t => t.id === targetTagId);
      
      // 更新所有使用源标签的题目关联到目标标签
      db.run(
        "UPDATE OR IGNORE question_tags SET tagId = ? WHERE tagId = ?",
        [targetTagId, sourceTagId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          // 删除可能的重复关联
          db.run(
            "DELETE FROM question_tags WHERE tagId = ?",
            [sourceTagId],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
              
              // 更新目标标签的使用次数
              const newUsageCount = sourceTag.usageCount + targetTag.usageCount;
              db.run(
                "UPDATE tags SET usageCount = ? WHERE id = ?",
                [newUsageCount, targetTagId],
                (err) => {
                  if (err) return res.status(500).json({ error: err.message });
                  
                  // 删除源标签
                  db.run("DELETE FROM tags WHERE id = ?", [sourceTagId], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, mergedCount: sourceTag.usageCount });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// 按标签筛选题目
app.get('/api/questions/by-tags', auth, (req, res) => {
  const { tagIds } = req.query;
  
  if (!tagIds) {
    return res.status(400).json({ error: '缺少tagIds参数' });
  }
  
  const tagIdArray = tagIds.split(',').filter(id => id.trim());
  if (tagIdArray.length === 0) {
    return res.json([]);
  }
  
  const placeholders = tagIdArray.map(() => '?').join(',');
  const sql = `
    SELECT DISTINCT q.* 
    FROM questions q
    JOIN question_tags qt ON q.id = qt.questionId
    WHERE qt.tagId IN (${placeholders})
  `;
  
  db.all(sql, tagIdArray, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const questions = (rows || []).map(r => ({
      ...r,
      options: parseOptionsField(r.options),
      answer: parseAnswerField(r.answer),
      blanks: r.blanks ? JSON.parse(r.blanks) : null,
      tags: r.tags ? JSON.parse(r.tags) : null,
      aiGradingEnabled: r.aiGradingEnabled === 1
    }));
    
    res.json(questions);
  });
});

// 批量为题目添加标签
app.post('/api/questions/batch-tag', auth, (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).send('Forbidden');
  const { questionIds, tagIds } = req.body;
  
  if (!Array.isArray(questionIds) || !Array.isArray(tagIds)) {
    return res.status(400).json({ error: '参数格式错误' });
  }
  
  if (questionIds.length === 0 || tagIds.length === 0) {
    return res.json({ success: true, added: 0 });
  }
  
  let added = 0;
  db.serialize(() => {
    for (const questionId of questionIds) {
      for (const tagId of tagIds) {
        db.run(
          "INSERT OR IGNORE INTO question_tags (questionId, tagId) VALUES (?, ?)",
          [questionId, tagId],
          function(err) {
            if (!err && this.changes > 0) {
              added++;
              // 更新标签使用次数
              db.run("UPDATE tags SET usageCount = usageCount + 1 WHERE id = ?", [tagId]);
            }
          }
        );
      }
    }
  });
  
  // 等待所有操作完成
  setTimeout(() => {
    res.json({ success: true, added });
  }, 100);
});

// ========== 填空题评分API ==========

app.post('/api/questions/grade-fill-blank', auth, (req, res) => {
  const { questionId, userAnswers } = req.body;
  
  if (!questionId || !userAnswers) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 获取题目信息
  db.get("SELECT * FROM questions WHERE id = ?", [questionId], (err, question) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
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
  });
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
    
    const userResult = await new Promise((resolve, reject) => {
      db.get("SELECT deepseekApiKey FROM users WHERE id = ?", [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (userResult && userResult.deepseekApiKey) {
      apiKey = userResult.deepseekApiKey;
    } else {
      const configResult = await new Promise((resolve, reject) => {
        db.get("SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
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
app.get('/api/discussions', auth, (req, res) => {
  const { page = 1, limit = 20, questionId, sortBy = 'latest' } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let params = [];
  
  // 学员只能看到未隐藏的讨论
  if (req.user.role !== 'ADMIN') {
    whereClause = 'WHERE isHidden = 0';
  }
  
  // 按题目筛选
  if (questionId) {
    whereClause += (whereClause ? ' AND' : 'WHERE') + ' questionId = ?';
    params.push(questionId);
  }
  
  // 排序
  let orderBy = 'ORDER BY isPinned DESC, ';
  switch (sortBy) {
    case 'popular':
      orderBy += 'likeCount DESC';
      break;
    case 'mostCommented':
      orderBy += 'commentCount DESC';
      break;
    case 'latest':
    default:
      orderBy += 'lastActivityAt DESC';
  }
  
  // 获取总数
  db.get(
    `SELECT COUNT(*) as total FROM discussions ${whereClause}`,
    params,
    (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // 获取讨论列表
      db.all(
        `SELECT * FROM discussions ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const discussions = (rows || []).map(d => ({
            ...d,
            isPinned: d.isPinned === 1,
            isHidden: d.isHidden === 1
          }));
          
          res.json({
            discussions,
            total: countRow.total,
            page: parseInt(page),
            limit: parseInt(limit)
          });
        }
      );
    }
  );
});

// 创建讨论
app.post('/api/discussions', auth, (req, res) => {
  const { title, content, questionId } = req.body;
  
  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: '标题不能为空' });
  }
  
  if (!content || String(content).trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }
  
  const id = `disc-${Date.now()}`;
  const now = new Date().toISOString();
  
  // 获取用户信息
  db.get("SELECT nickname, realName FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const authorName = user.nickname || user.realName || '匿名用户';
    
    db.run(
      `INSERT INTO discussions (
        id, title, content, authorId, authorName, questionId,
        createdAt, updatedAt, lastActivityAt, viewCount, likeCount, 
        commentCount, isPinned, isHidden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)`,
      [id, title.trim(), content.trim(), req.user.id, authorName, questionId || null, now, now, now],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
      }
    );
  });
});

// 获取讨论详情
app.get('/api/discussions/:id', auth, (req, res) => {
  db.get("SELECT * FROM discussions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '讨论不存在' });
    
    // 学员不能查看隐藏的讨论
    if (req.user.role !== 'ADMIN' && row.isHidden === 1) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    
    // 增加浏览次数
    db.run("UPDATE discussions SET viewCount = viewCount + 1 WHERE id = ?", [req.params.id]);
    
    const discussion = {
      ...row,
      isPinned: row.isPinned === 1,
      isHidden: row.isHidden === 1
    };
    
    res.json({ discussion });
  });
});

// 更新讨论
app.put('/api/discussions/:id', auth, (req, res) => {
  const { title, content } = req.body;
  
  // 检查权限
  db.get("SELECT authorId FROM discussions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '讨论不存在' });
    
    // 只有作者或管理员可以编辑
    if (row.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '无权限编辑此讨论' });
    }
    
    const fields = [];
    const values = [];
    
    if (title !== undefined) {
      if (String(title).trim() === '') {
        return res.status(400).json({ error: '标题不能为空' });
      }
      fields.push('title = ?');
      values.push(title.trim());
    }
    
    if (content !== undefined) {
      if (String(content).trim() === '') {
        return res.status(400).json({ error: '内容不能为空' });
      }
      fields.push('content = ?');
      values.push(content.trim());
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);
    
    db.run(
      `UPDATE discussions SET ${fields.join(', ')} WHERE id = ?`,
      values,
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });
});

// 删除讨论（管理员）
app.delete('/api/discussions/:id', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以删除讨论' });
  }
  
  // 删除讨论会级联删除评论和点赞（通过外键约束）
  db.run("DELETE FROM discussions WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: '讨论不存在' });
    }
    res.json({ success: true });
  });
});

// 切换讨论可见性（管理员）
app.post('/api/discussions/:id/toggle-visibility', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以操作' });
  }
  
  db.get("SELECT isHidden FROM discussions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '讨论不存在' });
    
    const newVisibility = row.isHidden === 1 ? 0 : 1;
    
    db.run(
      "UPDATE discussions SET isHidden = ? WHERE id = ?",
      [newVisibility, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, isHidden: newVisibility === 1 });
      }
    );
  });
});

// 切换讨论置顶（管理员）
app.post('/api/discussions/:id/toggle-pin', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '只有管理员可以操作' });
  }
  
  db.get("SELECT isPinned FROM discussions WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '讨论不存在' });
    
    const newPinStatus = row.isPinned === 1 ? 0 : 1;
    
    db.run(
      "UPDATE discussions SET isPinned = ? WHERE id = ?",
      [newPinStatus, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, isPinned: newPinStatus === 1 });
      }
    );
  });
});

// 获取题目相关讨论
app.get('/api/questions/:id/discussions', auth, (req, res) => {
  let whereClause = 'WHERE questionId = ?';
  
  // 学员只能看到未隐藏的讨论
  if (req.user.role !== 'ADMIN') {
    whereClause += ' AND isHidden = 0';
  }
  
  db.all(
    `SELECT * FROM discussions ${whereClause} ORDER BY isPinned DESC, lastActivityAt DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const discussions = (rows || []).map(d => ({
        ...d,
        isPinned: d.isPinned === 1,
        isHidden: d.isHidden === 1
      }));
      
      res.json(discussions);
    }
  );
});

// ========== 评论系统API ==========

// 获取讨论的评论
app.get('/api/discussions/:id/comments', auth, (req, res) => {
  db.all(
    "SELECT * FROM comments WHERE discussionId = ? AND isDeleted = 0 ORDER BY createdAt ASC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const comments = (rows || []).map(c => ({
        ...c,
        isDeleted: c.isDeleted === 1
      }));
      
      res.json(comments);
    }
  );
});

// 发表评论
app.post('/api/discussions/:id/comments', auth, (req, res) => {
  const { content, parentId } = req.body;
  
  if (!content || String(content).trim() === '') {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  // 检查讨论是否存在
  db.get("SELECT * FROM discussions WHERE id = ?", [req.params.id], (err, discussion) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!discussion) return res.status(404).json({ error: '讨论不存在' });
    
    // 学员不能在隐藏的讨论中评论
    if (req.user.role !== 'ADMIN' && discussion.isHidden === 1) {
      return res.status(403).json({ error: '无法在此讨论中评论' });
    }
    
    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      db.get("SELECT * FROM comments WHERE id = ? AND discussionId = ?", [parentId, req.params.id], (err, parent) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!parent) return res.status(404).json({ error: '父评论不存在' });
        
        createComment();
      });
    } else {
      createComment();
    }
    
    function createComment() {
      const id = `comment-${Date.now()}`;
      const now = new Date().toISOString();
      
      // 获取用户信息
      db.get("SELECT nickname, realName FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const authorName = user.nickname || user.realName || '匿名用户';
        
        db.run(
          `INSERT INTO comments (
            id, discussionId, parentId, authorId, authorName, 
            content, createdAt, likeCount, isDeleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
          [id, req.params.id, parentId || null, req.user.id, authorName, content.trim(), now],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // 更新讨论的评论数和最后活跃时间
            db.run(
              "UPDATE discussions SET commentCount = commentCount + 1, lastActivityAt = ? WHERE id = ?",
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
          }
        );
      });
    }
  });
});

// 删除评论
app.delete('/api/comments/:id', auth, (req, res) => {
  // 获取评论信息
  db.get("SELECT * FROM comments WHERE id = ?", [req.params.id], (err, comment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!comment) return res.status(404).json({ error: '评论不存在' });
    
    // 只有作者或管理员可以删除
    if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '无权限删除此评论' });
    }
    
    // 递归删除子评论
    function deleteCommentAndChildren(commentId, callback) {
      // 查找所有子评论
      db.all("SELECT id FROM comments WHERE parentId = ?", [commentId], (err, children) => {
        if (err) return callback(err);
        
        // 递归删除子评论
        let remaining = children.length;
        if (remaining === 0) {
          // 没有子评论，直接删除
          db.run("DELETE FROM comments WHERE id = ?", [commentId], callback);
        } else {
          children.forEach(child => {
            deleteCommentAndChildren(child.id, (err) => {
              if (err) return callback(err);
              remaining--;
              if (remaining === 0) {
                db.run("DELETE FROM comments WHERE id = ?", [commentId], callback);
              }
            });
          });
        }
      });
    }
    
    deleteCommentAndChildren(req.params.id, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // 更新讨论的评论数
      db.run(
        "UPDATE discussions SET commentCount = (SELECT COUNT(*) FROM comments WHERE discussionId = ?) WHERE id = ?",
        [comment.discussionId, comment.discussionId]
      );
      
      res.json({ success: true });
    });
  });
});

// ========== 点赞系统API ==========

// 点赞讨论
app.post('/api/discussions/:id/like', auth, (req, res) => {
  const userId = req.user.id;
  const discussionId = req.params.id;
  
  // 检查是否已点赞
  db.get(
    "SELECT * FROM discussion_likes WHERE userId = ? AND discussionId = ? AND commentId IS NULL",
    [userId, discussionId],
    (err, like) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (like) {
        // 已点赞，取消点赞
        db.run(
          "DELETE FROM discussion_likes WHERE userId = ? AND discussionId = ? AND commentId IS NULL",
          [userId, discussionId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // 减少点赞数
            db.run("UPDATE discussions SET likeCount = MAX(0, likeCount - 1) WHERE id = ?", [discussionId]);
            
            res.json({ success: true, liked: false });
          }
        );
      } else {
        // 未点赞，添加点赞
        const now = new Date().toISOString();
        db.run(
          "INSERT INTO discussion_likes (userId, discussionId, commentId, createdAt) VALUES (?, ?, NULL, ?)",
          [userId, discussionId, now],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // 增加点赞数
            db.run("UPDATE discussions SET likeCount = likeCount + 1 WHERE id = ?", [discussionId]);
            
            res.json({ success: true, liked: true });
          }
        );
      }
    }
  );
});

// 点赞评论
app.post('/api/comments/:id/like', auth, (req, res) => {
  const userId = req.user.id;
  const commentId = req.params.id;
  
  // 检查评论是否存在
  db.get("SELECT * FROM comments WHERE id = ?", [commentId], (err, comment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!comment) return res.status(404).json({ error: '评论不存在' });
    
    // 检查是否已点赞
    db.get(
      "SELECT * FROM discussion_likes WHERE userId = ? AND commentId = ? AND discussionId IS NULL",
      [userId, commentId],
      (err, like) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (like) {
          // 已点赞，取消点赞
          db.run(
            "DELETE FROM discussion_likes WHERE userId = ? AND commentId = ? AND discussionId IS NULL",
            [userId, commentId],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
              
              // 减少点赞数
              db.run("UPDATE comments SET likeCount = MAX(0, likeCount - 1) WHERE id = ?", [commentId]);
              
              res.json({ success: true, liked: false });
            }
          );
        } else {
          // 未点赞，添加点赞
          const now = new Date().toISOString();
          db.run(
            "INSERT INTO discussion_likes (userId, discussionId, commentId, createdAt) VALUES (?, NULL, ?, ?)",
            [userId, commentId, now],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
              
              // 增加点赞数
              db.run("UPDATE comments SET likeCount = likeCount + 1 WHERE id = ?", [commentId]);
              
              res.json({ success: true, liked: true });
            }
          );
        }
      }
    );
  });
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
