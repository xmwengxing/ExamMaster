/**
 * 修复error_logs表的id列类型
 * 从INTEGER改为VARCHAR(100)以支持UUID
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'edumaster_user',
  password: process.env.DB_PASSWORD || 'Tkl@s,dla=~7Jsa.40a1ebEp9V)OS1>B'
});

async function fixErrorLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 开始修复error_logs表结构...\n');
    
    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '../postgres/migrations/009_fix_error_logs_id_type.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // 执行迁移
    await client.query(migrationSQL);
    
    console.log('\n✅ error_logs表结构修复成功!');
    
    // 验证结果
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'error_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 当前表结构:');
    console.table(result.rows);
    
    // 检查记录数
    const countResult = await client.query('SELECT COUNT(*) as count FROM error_logs');
    console.log(`\n📊 当前记录数: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行修复
fixErrorLogsTable();
