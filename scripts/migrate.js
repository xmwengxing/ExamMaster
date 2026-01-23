/**
 * PostgreSQL 数据迁移脚本
 * 
 * 功能：
 * - 从 SQLite 导出数据
 * - 数据清洗和转换
 * - 批量导入到 PostgreSQL
 * - 数据验证
 * - 错误处理和重试
 * - 生成迁移报告
 * 
 * 使用方法：
 *   node scripts/migrate.js
 */

import sqlite3 from 'sqlite3';
import { pool, transaction } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

// 配置
const SQLITE_DB_PATH = './edumaster.db';
const BATCH_SIZE = 100; // 批量插入大小
const MAX_RETRIES = 3;  // 最大重试次数

// 表迁移顺序（考虑外键依赖）
const TABLES = [
  'users',
  'banks',
  'questions',
  'exams',
  'exam_history',
  'practice_records',
  'mistakes',
  'favorites',
  'notes',
  'srs_records',
  'daily_progress',
  'tags',
  'question_tags',
  'discussions',
  'comments',
  'discussion_likes',
  'ai_analysis',
  'practical_tasks',
  'practical_records',
  'login_logs',
  'audit_logs',
  'system_config',
  'system_config_kv'
];

// JSON 字段映射（表名 -> 字段名数组）
const JSON_FIELDS = {
  users: ['custom_fields', 'student_perms', 'allowed_bank_ids', 'permissions', 'login_history'],
  banks: ['score_config'],
  questions: ['options', 'answer', 'blanks', 'tags'],
  practice_records: ['user_answers'],
  exams: ['selected_question_ids'],
  exam_history: ['wrong_question_ids', 'user_answers', 'exam_config', 'ordered_question_ids'],
  system_config: ['data'],
  practical_tasks: ['parts'],
  practical_records: ['answers']
};

// 布尔字段映射
const BOOLEAN_FIELDS = {
  questions: ['ai_grading_enabled'],
  exams: ['is_visible'],
  exam_history: ['passed', 'is_finished'],
  practice_records: ['is_custom'],
  discussions: ['is_pinned', 'is_hidden'],
  comments: ['is_deleted']
};

// 日期时间字段映射
const DATETIME_FIELDS = {
  users: ['last_login', 'last_activity', 'created_at', 'updated_at'],
  banks: ['created_at', 'updated_at'],
  questions: ['created_at', 'updated_at'],
  practice_records: ['created_at'],
  exams: ['start_time', 'end_time', 'created_at', 'updated_at'],
  exam_history: ['submit_time', 'created_at'],
  mistakes: ['created_at'],
  favorites: ['created_at'],
  notes: ['updated_at'],
  srs_records: ['created_at', 'updated_at'],
  daily_progress: ['created_at'],
  system_config: ['created_at', 'updated_at'],
  system_config_kv: ['created_at', 'updated_at'],
  login_logs: ['time', 'created_at'],
  audit_logs: ['timestamp', 'created_at'],
  practical_tasks: ['created_at'],
  practical_records: ['submitted_at', 'created_at'],
  tags: ['created_at'],
  question_tags: ['created_at'],
  discussions: ['created_at', 'updated_at', 'last_activity_at'],
  comments: ['created_at'],
  discussion_likes: ['created_at'],
  ai_analysis: ['created_at', 'updated_at']
};

/**
 * 打开 SQLite 数据库连接
 */
function openSQLiteDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(new Error(`无法打开 SQLite 数据库: ${err.message}`));
      } else {
        console.log(`✓ 已连接到 SQLite 数据库: ${SQLITE_DB_PATH}`);
        resolve(db);
      }
    });
  });
}

/**
 * 从 SQLite 导出表数据
 */
function exportTableFromSQLite(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        // 如果表不存在，返回空数组
        if (err.message.includes('no such table')) {
          console.log(`  ⚠ 表 ${tableName} 在 SQLite 中不存在，跳过`);
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * 将驼峰命名转换为蛇形命名
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 数据清洗函数
 */
function cleanRow(row, tableName) {
  const cleaned = {};
  const jsonFields = JSON_FIELDS[tableName] || [];
  const booleanFields = BOOLEAN_FIELDS[tableName] || [];
  const datetimeFields = DATETIME_FIELDS[tableName] || [];
  
  for (const [key, value] of Object.entries(row)) {
    // 将驼峰命名转换为蛇形命名
    const snakeKey = camelToSnake(key);
    
    // 处理 NULL 值
    if (value === null || value === undefined) {
      cleaned[snakeKey] = null;
      continue;
    }
    
    // 处理 JSON 字段
    if (jsonFields.includes(snakeKey)) {
      try {
        if (typeof value === 'string') {
          // 尝试解析 JSON 字符串
          const parsed = JSON.parse(value);
          cleaned[snakeKey] = parsed;
        } else {
          // 已经是对象，直接使用
          cleaned[snakeKey] = value;
        }
      } catch (e) {
        console.warn(`  ⚠ JSON 解析失败: ${tableName}.${snakeKey}, 值: ${value}`);
        cleaned[snakeKey] = null;
      }
    }
    // 处理布尔值
    else if (booleanFields.includes(snakeKey)) {
      if (typeof value === 'number') {
        cleaned[snakeKey] = value === 1;
      } else if (typeof value === 'boolean') {
        cleaned[snakeKey] = value;
      } else {
        cleaned[snakeKey] = Boolean(value);
      }
    }
    // 处理日期时间
    else if (datetimeFields.includes(snakeKey)) {
      if (value) {
        try {
          // 尝试解析日期
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            console.warn(`  ⚠ 日期解析失败: ${tableName}.${snakeKey}, 值: ${value}`);
            cleaned[snakeKey] = null;
          } else {
            cleaned[snakeKey] = date.toISOString();
          }
        } catch (e) {
          console.warn(`  ⚠ 日期转换失败: ${tableName}.${snakeKey}, 值: ${value}`);
          cleaned[snakeKey] = null;
        }
      } else {
        cleaned[snakeKey] = null;
      }
    }
    // 其他字段直接复制
    else {
      cleaned[snakeKey] = value;
    }
  }
  
  return cleaned;
}

/**
 * 批量导入数据到 PostgreSQL
 */
async function importTableToPostgreSQL(tableName, rows) {
  if (rows.length === 0) {
    return { inserted: 0, failed: 0 };
  }
  
  let inserted = 0;
  let failed = 0;
  
  // 分批处理
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    try {
      await transaction(async (client) => {
        for (const row of batch) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          const query = `
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          try {
            await client.query(query, values);
            inserted++;
          } catch (error) {
            console.error(`  ✗ 插入失败: ${tableName}`);
            console.error(`     错误: ${error.message}`);
            console.error(`     字段: ${columns.join(', ')}`);
            console.error(`     数据示例: ${JSON.stringify(row).substring(0, 200)}...`);
            failed++;
          }
        }
      });
      
      // 显示进度
      const progress = Math.min(i + BATCH_SIZE, rows.length);
      process.stdout.write(`\r  进度: ${progress}/${rows.length} (${Math.round(progress / rows.length * 100)}%)`);
      
    } catch (error) {
      console.error(`\n  ✗ 批次导入失败: ${error.message}`);
      failed += batch.length;
    }
  }
  
  console.log(''); // 换行
  return { inserted, failed };
}

/**
 * 迁移单个表（带重试机制）
 */
async function migrateTable(db, tableName, retries = MAX_RETRIES) {
  console.log(`\n开始迁移表: ${tableName}`);
  
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      // 1. 从 SQLite 导出数据
      console.log(`  1. 从 SQLite 导出数据...`);
      const rows = await exportTableFromSQLite(db, tableName);
      
      if (rows.length === 0) {
        console.log(`  ✓ 表 ${tableName} 无数据或不存在，跳过`);
        return { table: tableName, count: 0, inserted: 0, failed: 0, skipped: true };
      }
      
      console.log(`  ✓ 导出 ${rows.length} 条记录`);
      
      // 2. 数据清洗
      console.log(`  2. 清洗数据...`);
      const cleanedRows = rows.map(row => cleanRow(row, tableName));
      console.log(`  ✓ 数据清洗完成`);
      
      // 3. 导入到 PostgreSQL
      console.log(`  3. 导入到 PostgreSQL...`);
      const result = await importTableToPostgreSQL(tableName, cleanedRows);
      
      console.log(`  ✓ 表 ${tableName} 迁移完成: 插入 ${result.inserted} 条，失败 ${result.failed} 条`);
      
      return {
        table: tableName,
        count: rows.length,
        inserted: result.inserted,
        failed: result.failed,
        skipped: false
      };
      
    } catch (error) {
      attempt++;
      console.error(`  ✗ 迁移失败 (尝试 ${attempt}/${retries}): ${error.message}`);
      
      if (attempt >= retries) {
        console.error(`  ✗ 表 ${tableName} 迁移失败，已达到最大重试次数`);
        return {
          table: tableName,
          count: 0,
          inserted: 0,
          failed: 0,
          error: error.message,
          skipped: false
        };
      }
      
      // 等待后重试
      const waitTime = 1000 * attempt;
      console.log(`  ⏳ 等待 ${waitTime}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * 验证迁移结果
 */
async function validateMigration(db, results) {
  console.log('\n' + '='.repeat(60));
  console.log('开始验证迁移结果...');
  console.log('='.repeat(60));
  
  const validationResults = [];
  
  for (const result of results) {
    if (result.skipped) {
      continue;
    }
    
    const tableName = result.table;
    
    try {
      // 获取 SQLite 记录数
      const sqliteCount = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
          if (err) {
            if (err.message.includes('no such table')) {
              resolve(0);
            } else {
              reject(err);
            }
          } else {
            resolve(row.count);
          }
        });
      });
      
      // 获取 PostgreSQL 记录数
      const pgResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      const isValid = sqliteCount === pgCount;
      
      validationResults.push({
        table: tableName,
        sqliteCount,
        pgCount,
        valid: isValid
      });
      
      if (isValid) {
        console.log(`✓ ${tableName}: SQLite=${sqliteCount}, PostgreSQL=${pgCount}`);
      } else {
        console.log(`✗ ${tableName}: SQLite=${sqliteCount}, PostgreSQL=${pgCount} (不一致)`);
      }
      
    } catch (error) {
      console.error(`✗ ${tableName}: 验证失败 - ${error.message}`);
      validationResults.push({
        table: tableName,
        error: error.message,
        valid: false
      });
    }
  }
  
  return validationResults;
}

/**
 * 生成迁移报告
 */
async function generateReport(results, validationResults, startTime, endTime) {
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}秒`,
    summary: {
      totalTables: results.length,
      successTables: results.filter(r => !r.error && !r.skipped).length,
      failedTables: results.filter(r => r.error).length,
      skippedTables: results.filter(r => r.skipped).length,
      totalRecords: results.reduce((sum, r) => sum + r.count, 0),
      insertedRecords: results.reduce((sum, r) => sum + r.inserted, 0),
      failedRecords: results.reduce((sum, r) => sum + r.failed, 0)
    },
    tables: results,
    validation: validationResults
  };
  
  // 保存报告到文件
  const reportPath = path.join(process.cwd(), 'migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('\n' + '='.repeat(60));
  console.log('迁移报告');
  console.log('='.repeat(60));
  console.log(`总耗时: ${duration}秒`);
  console.log(`总表数: ${report.summary.totalTables}`);
  console.log(`成功: ${report.summary.successTables}`);
  console.log(`失败: ${report.summary.failedTables}`);
  console.log(`跳过: ${report.summary.skippedTables}`);
  console.log(`总记录数: ${report.summary.totalRecords}`);
  console.log(`插入记录: ${report.summary.insertedRecords}`);
  console.log(`失败记录: ${report.summary.failedRecords}`);
  console.log(`\n详细报告已保存到: ${reportPath}`);
  console.log('='.repeat(60));
  
  return report;
}

/**
 * 主迁移流程
 */
async function migrate() {
  console.log('='.repeat(60));
  console.log('PostgreSQL 数据迁移工具');
  console.log('='.repeat(60));
  console.log(`SQLite 数据库: ${SQLITE_DB_PATH}`);
  console.log(`PostgreSQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'edumaster'}`);
  console.log(`批量大小: ${BATCH_SIZE}`);
  console.log(`最大重试次数: ${MAX_RETRIES}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  let sqliteDb;
  
  try {
    // 1. 连接 SQLite 数据库
    sqliteDb = await openSQLiteDB();
    
    // 2. 测试 PostgreSQL 连接
    console.log('\n测试 PostgreSQL 连接...');
    await pool.query('SELECT 1');
    console.log('✓ PostgreSQL 连接成功');
    
    // 3. 迁移所有表
    console.log('\n开始迁移数据...');
    const results = [];
    
    for (const tableName of TABLES) {
      const result = await migrateTable(sqliteDb, tableName);
      results.push(result);
    }
    
    // 4. 验证迁移结果
    const validationResults = await validateMigration(sqliteDb, results);
    
    // 5. 生成报告
    const endTime = Date.now();
    const report = await generateReport(results, validationResults, startTime, endTime);
    
    // 6. 检查是否有失败
    const hasFailures = results.some(r => r.error) || 
                       validationResults.some(v => !v.valid);
    
    if (hasFailures) {
      console.log('\n⚠ 迁移完成，但存在错误或数据不一致，请检查报告');
      process.exit(1);
    } else {
      console.log('\n✓ 迁移成功完成！所有数据已验证');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n✗ 迁移失败:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) {
          console.error('关闭 SQLite 连接失败:', err);
        } else {
          console.log('✓ SQLite 连接已关闭');
        }
      });
    }
    
    await pool.end();
    console.log('✓ PostgreSQL 连接池已关闭');
  }
}

// 执行迁移
migrate();
