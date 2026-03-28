/**
 * 清空 PostgreSQL 数据库所有表数据
 * 
 * 警告：此脚本会删除所有数据，请谨慎使用！
 */

import { pool } from '../db.js';

// 需要清空的表（按依赖关系倒序）
const TABLES = [
  'audit_logs',
  'login_logs',
  'practical_records',
  'practical_tasks',
  'ai_analysis',
  'discussion_likes',
  'comments',
  'discussions',
  'question_tags',
  'tags',
  'daily_progress',
  'srs_records',
  'notes',
  'favorites',
  'mistakes',
  'practice_records',
  'exam_history',
  'exams',
  'questions',
  'banks',
  'users',
  'system_config_kv',
  'system_config'
];

async function clearAllTables() {
  console.log('='.repeat(60));
  console.log('清空 PostgreSQL 数据库');
  console.log('='.repeat(60));
  console.log('警告：此操作将删除所有数据！');
  console.log('='.repeat(60));
  
  try {
    // 清空所有表（使用 DELETE 而不是 TRUNCATE，避免外键问题）
    console.log('\n开始清空表...');
    for (const tableName of TABLES) {
      try {
        const result = await pool.query(`DELETE FROM ${tableName}`);
        console.log(`✓ ${tableName} 已清空 (删除 ${result.rowCount} 条记录)`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ⚠ 表 ${tableName} 不存在，跳过`);
        } else {
          console.error(`✗ ${tableName} 清空失败: ${error.message}`);
        }
      }
    }
    
    // 验证清空结果
    console.log('\n验证清空结果...');
    let totalRecords = 0;
    for (const tableName of TABLES) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        if (count > 0) {
          console.log(`⚠ ${tableName}: ${count} 条记录`);
        }
      } catch (error) {
        // 忽略不存在的表
      }
    }
    
    if (totalRecords === 0) {
      console.log('✓ 所有表已清空');
    } else {
      console.log(`⚠ 仍有 ${totalRecords} 条记录未清空`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('清空完成！');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ 清空失败:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 执行清空
clearAllTables();
