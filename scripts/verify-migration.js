/**
 * 验证迁移结果脚本
 * 
 * 功能：
 * - 检查记录数是否一致
 * - 检查外键完整性
 * - 检查 JSON 字段有效性
 * - 检查数据类型转换
 */

import sqlite3 from 'sqlite3';
import { pool } from '../db.js';

const SQLITE_DB_PATH = './edumaster.db';

// 需要验证的表
const TABLES_TO_VERIFY = [
  'users',
  'banks',
  'questions',
  'exams',
  'exam_history',
  'practice_records',
  'mistakes',
  'favorites',
  'discussions',
  'comments'
];

/**
 * 打开 SQLite 数据库
 */
function openSQLiteDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(new Error(`无法打开 SQLite 数据库: ${err.message}`));
      } else {
        resolve(db);
      }
    });
  });
}

/**
 * 获取 SQLite 表记录数
 */
function getSQLiteCount(db, tableName) {
  return new Promise((resolve, reject) => {
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
}

/**
 * 获取 PostgreSQL 表记录数
 */
async function getPostgreSQLCount(tableName) {
  const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count);
}

/**
 * 验证记录数
 */
async function verifyRecordCounts(db) {
  console.log('\n' + '='.repeat(60));
  console.log('验证记录数');
  console.log('='.repeat(60));
  
  const results = [];
  let allMatch = true;
  
  for (const tableName of TABLES_TO_VERIFY) {
    try {
      const sqliteCount = await getSQLiteCount(db, tableName);
      const pgCount = await getPostgreSQLCount(tableName);
      const match = sqliteCount === pgCount;
      
      results.push({
        table: tableName,
        sqlite: sqliteCount,
        postgresql: pgCount,
        match
      });
      
      if (match) {
        console.log(`✓ ${tableName.padEnd(20)} SQLite: ${sqliteCount.toString().padStart(6)}, PostgreSQL: ${pgCount.toString().padStart(6)}`);
      } else {
        console.log(`✗ ${tableName.padEnd(20)} SQLite: ${sqliteCount.toString().padStart(6)}, PostgreSQL: ${pgCount.toString().padStart(6)} (不一致)`);
        allMatch = false;
      }
    } catch (error) {
      console.error(`✗ ${tableName}: 验证失败 - ${error.message}`);
      allMatch = false;
    }
  }
  
  return { results, allMatch };
}

/**
 * 验证外键完整性
 */
async function verifyForeignKeys() {
  console.log('\n' + '='.repeat(60));
  console.log('验证外键完整性');
  console.log('='.repeat(60));
  
  const checks = [
    {
      name: 'questions.bank_id → banks.id',
      query: `
        SELECT COUNT(*) as count
        FROM questions q
        LEFT JOIN banks b ON q.bank_id = b.id
        WHERE b.id IS NULL
      `
    },
    {
      name: 'exam_history.user_id → users.id',
      query: `
        SELECT COUNT(*) as count
        FROM exam_history eh
        LEFT JOIN users u ON eh.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'exam_history.exam_id → exams.id',
      query: `
        SELECT COUNT(*) as count
        FROM exam_history eh
        LEFT JOIN exams e ON eh.exam_id = e.id
        WHERE e.id IS NULL
      `
    },
    {
      name: 'mistakes.user_id → users.id',
      query: `
        SELECT COUNT(*) as count
        FROM mistakes m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'mistakes.question_id → questions.id',
      query: `
        SELECT COUNT(*) as count
        FROM mistakes m
        LEFT JOIN questions q ON m.question_id = q.id
        WHERE q.id IS NULL
      `
    }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    try {
      const result = await pool.query(check.query);
      const orphanedCount = parseInt(result.rows[0].count);
      
      if (orphanedCount === 0) {
        console.log(`✓ ${check.name}: 无孤立记录`);
      } else {
        console.log(`✗ ${check.name}: 发现 ${orphanedCount} 条孤立记录`);
        allValid = false;
      }
    } catch (error) {
      console.error(`✗ ${check.name}: 检查失败 - ${error.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * 验证 JSON 字段
 */
async function verifyJSONFields() {
  console.log('\n' + '='.repeat(60));
  console.log('验证 JSON 字段');
  console.log('='.repeat(60));
  
  const checks = [
    {
      table: 'questions',
      field: 'options',
      query: `
        SELECT COUNT(*) as count
        FROM questions
        WHERE options IS NOT NULL
        AND jsonb_typeof(options) != 'array'
      `
    },
    {
      table: 'questions',
      field: 'answer',
      query: `
        SELECT COUNT(*) as count
        FROM questions
        WHERE answer IS NOT NULL
        AND jsonb_typeof(answer) NOT IN ('string', 'array', 'object')
      `
    },
    {
      table: 'users',
      field: 'custom_fields',
      query: `
        SELECT COUNT(*) as count
        FROM users
        WHERE custom_fields IS NOT NULL
        AND jsonb_typeof(custom_fields) != 'object'
      `
    }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    try {
      const result = await pool.query(check.query);
      const invalidCount = parseInt(result.rows[0].count);
      
      if (invalidCount === 0) {
        console.log(`✓ ${check.table}.${check.field}: 所有 JSON 字段有效`);
      } else {
        console.log(`✗ ${check.table}.${check.field}: 发现 ${invalidCount} 条无效 JSON`);
        allValid = false;
      }
    } catch (error) {
      console.error(`✗ ${check.table}.${check.field}: 检查失败 - ${error.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * 验证数据类型
 */
async function verifyDataTypes() {
  console.log('\n' + '='.repeat(60));
  console.log('验证数据类型');
  console.log('='.repeat(60));
  
  const checks = [
    {
      name: '布尔字段类型',
      query: `
        SELECT 
          COUNT(*) as count,
          COUNT(CASE WHEN is_visible IS NOT NULL AND pg_typeof(is_visible)::text != 'boolean' THEN 1 END) as invalid
        FROM exams
      `
    },
    {
      name: '日期时间字段类型',
      query: `
        SELECT 
          COUNT(*) as count,
          COUNT(CASE WHEN created_at IS NOT NULL AND pg_typeof(created_at)::text != 'timestamp without time zone' THEN 1 END) as invalid
        FROM users
      `
    },
    {
      name: 'JSONB 字段类型',
      query: `
        SELECT 
          COUNT(*) as count,
          COUNT(CASE WHEN options IS NOT NULL AND pg_typeof(options)::text != 'jsonb' THEN 1 END) as invalid
        FROM questions
      `
    }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    try {
      const result = await pool.query(check.query);
      const total = parseInt(result.rows[0].count);
      const invalid = parseInt(result.rows[0].invalid);
      
      if (invalid === 0) {
        console.log(`✓ ${check.name}: 所有字段类型正确 (${total} 条记录)`);
      } else {
        console.log(`✗ ${check.name}: 发现 ${invalid}/${total} 条类型错误`);
        allValid = false;
      }
    } catch (error) {
      console.error(`✗ ${check.name}: 检查失败 - ${error.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * 主验证函数
 */
async function verify() {
  console.log('='.repeat(60));
  console.log('数据迁移验证工具');
  console.log('='.repeat(60));
  
  let sqliteDb;
  
  try {
    // 连接数据库
    console.log('\n连接数据库...');
    sqliteDb = await openSQLiteDB();
    console.log('✓ SQLite 连接成功');
    
    await pool.query('SELECT 1');
    console.log('✓ PostgreSQL 连接成功');
    
    // 执行验证
    const countResult = await verifyRecordCounts(sqliteDb);
    const fkResult = await verifyForeignKeys();
    const jsonResult = await verifyJSONFields();
    const typeResult = await verifyDataTypes();
    
    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('验证总结');
    console.log('='.repeat(60));
    
    const allPassed = countResult.allMatch && fkResult && jsonResult && typeResult;
    
    if (allPassed) {
      console.log('✓ 所有验证通过！数据迁移成功');
      console.log('\n迁移数据完整且正确，可以安全使用 PostgreSQL 数据库');
    } else {
      console.log('✗ 部分验证失败，请检查上述错误');
      console.log('\n建议：');
      if (!countResult.allMatch) {
        console.log('  - 记录数不一致：重新运行迁移脚本');
      }
      if (!fkResult) {
        console.log('  - 外键完整性问题：检查数据依赖关系');
      }
      if (!jsonResult) {
        console.log('  - JSON 字段问题：检查数据清洗逻辑');
      }
      if (!typeResult) {
        console.log('  - 数据类型问题：检查类型转换逻辑');
      }
    }
    
    console.log('='.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n✗ 验证失败:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    await pool.end();
  }
}

// 运行验证
verify();
