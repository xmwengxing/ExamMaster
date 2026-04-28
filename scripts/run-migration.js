/**
 * 数据库迁移执行脚本
 * 用于执行指定的迁移文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 执行迁移文件
 * @param {string} migrationFile - 迁移文件名
 */
async function runMigration(migrationFile) {
  try {
    const migrationPath = path.join(__dirname, '..', 'postgres', 'migrations', migrationFile);
    
    // 检查文件是否存在
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`迁移文件不存在: ${migrationFile}`);
    }
    
    // 读取迁移文件内容
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    logger.info(`开始执行迁移: ${migrationFile}`);
    console.log(`\n执行迁移文件: ${migrationFile}\n`);
    
    // 使用事务执行迁移
    await db.transaction(async (client) => {
      // 直接执行整个 SQL 文件（PostgreSQL 支持多语句）
      await client.query(sql);
    });
    
    logger.info(`迁移执行成功: ${migrationFile}`);
    console.log(`\n✓ 迁移执行成功: ${migrationFile}\n`);
    
  } catch (error) {
    logger.error(`迁移执行失败: ${migrationFile}`, {
      error: error.message,
      stack: error.stack
    });
    console.error(`\n✗ 迁移执行失败: ${migrationFile}`);
    console.error(`错误信息: ${error.message}\n`);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  // 从命令行参数获取迁移文件名
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('使用方法: node scripts/run-migration.js <迁移文件名>');
    console.error('示例: node scripts/run-migration.js 002_create_registrations_table.sql');
    process.exit(1);
  }
  
  try {
    await runMigration(migrationFile);
    console.log('迁移完成!');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败!');
    process.exit(1);
  }
}

// 执行主函数
main();
