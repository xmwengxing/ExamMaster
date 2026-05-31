// 验证 PostgreSQL 数据库架构脚本
// 用于测试 init.sql 是否能够正确创建所有表和索引

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库连接配置
const _dbPassword = process.env.DB_PASSWORD;
if (!_dbPassword) {
  console.error('FATAL: DB_PASSWORD environment variable is not set.');
  process.exit(1);
}
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'edumaster_user',
  password: _dbPassword,
});

// 期望的表列表
const EXPECTED_TABLES = [
  'users',
  'banks',
  'questions',
  'practice_records',
  'exams',
  'exam_history',
  'mistakes',
  'favorites',
  'notes',
  'srs_records',
  'daily_progress',
  'system_config',
  'system_config_kv',
  'login_logs',
  'audit_logs',
  'practical_tasks',
  'practical_records',
  'tags',
  'question_tags',
  'discussions',
  'comments',
  'discussion_likes',
  'ai_analysis'
];

// 验证表是否存在
async function verifyTables() {
  console.log('\n📋 验证表结构...\n');
  
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  const existingTables = result.rows.map(row => row.table_name);
  
  console.log(`✅ 找到 ${existingTables.length} 个表：`);
  existingTables.forEach(table => {
    const expected = EXPECTED_TABLES.includes(table);
    console.log(`  ${expected ? '✓' : '?'} ${table}`);
  });
  
  // 检查缺失的表
  const missingTables = EXPECTED_TABLES.filter(table => !existingTables.includes(table));
  if (missingTables.length > 0) {
    console.log(`\n❌ 缺失的表 (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`  - ${table}`));
    return false;
  }
  
  console.log('\n✅ 所有表都已创建！');
  return true;
}

// 验证索引
async function verifyIndexes() {
  console.log('\n📊 验证索引...\n');
  
  const result = await pool.query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  
  console.log(`✅ 找到 ${result.rows.length} 个索引：`);
  
  // 按表分组显示
  const indexesByTable = {};
  result.rows.forEach(row => {
    if (!indexesByTable[row.tablename]) {
      indexesByTable[row.tablename] = [];
    }
    indexesByTable[row.tablename].push(row.indexname);
  });
  
  Object.entries(indexesByTable).forEach(([table, indexes]) => {
    console.log(`  ${table}: ${indexes.length} 个索引`);
  });
  
  return true;
}

// 验证外键约束
async function verifyForeignKeys() {
  console.log('\n🔗 验证外键约束...\n');
  
  const result = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  
  console.log(`✅ 找到 ${result.rows.length} 个外键约束：`);
  
  result.rows.forEach(row => {
    console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
  });
  
  return true;
}

// 验证 JSONB 字段
async function verifyJsonbFields() {
  console.log('\n📦 验证 JSONB 字段...\n');
  
  const result = await pool.query(`
    SELECT 
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'jsonb'
    ORDER BY table_name, column_name
  `);
  
  console.log(`✅ 找到 ${result.rows.length} 个 JSONB 字段：`);
  
  result.rows.forEach(row => {
    console.log(`  ${row.table_name}.${row.column_name}`);
  });
  
  return true;
}

// 验证默认管理员账号
async function verifyAdminUser() {
  console.log('\n👤 验证默认管理员账号...\n');
  
  const result = await pool.query(`
    SELECT id, phone, role, nickname, real_name
    FROM users
    WHERE phone = 'admin'
  `);
  
  if (result.rows.length === 0) {
    console.log('❌ 未找到默认管理员账号');
    return false;
  }
  
  const admin = result.rows[0];
  console.log('✅ 找到默认管理员账号：');
  console.log(`  ID: ${admin.id}`);
  console.log(`  手机号: ${admin.phone}`);
  console.log(`  角色: ${admin.role}`);
  console.log(`  昵称: ${admin.nickname}`);
  console.log(`  真实姓名: ${admin.real_name}`);
  
  return true;
}

// 主验证流程
async function main() {
  console.log('🚀 开始验证 PostgreSQL 数据库架构...');
  console.log('='.repeat(60));
  
  try {
    // 测试数据库连接
    console.log('\n🔌 测试数据库连接...');
    await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功！');
    
    // 执行各项验证
    const tablesOk = await verifyTables();
    const indexesOk = await verifyIndexes();
    const foreignKeysOk = await verifyForeignKeys();
    const jsonbOk = await verifyJsonbFields();
    const adminOk = await verifyAdminUser();
    
    console.log('\n' + '='.repeat(60));
    
    if (tablesOk && indexesOk && foreignKeysOk && jsonbOk && adminOk) {
      console.log('\n✅ 所有验证通过！数据库架构正确！');
      process.exit(0);
    } else {
      console.log('\n❌ 部分验证失败，请检查数据库架构');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 验证过程中发生错误:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 执行验证
main();
