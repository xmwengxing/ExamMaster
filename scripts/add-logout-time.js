// 添加登出时间字段到 login_logs 表
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// 优先使用本地开发环境配置
dotenv.config({ path: '.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function addLogoutTimeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('开始添加 logout_time 字段...');
    
    // 检查字段是否已存在
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'login_logs' 
      AND column_name = 'logout_time'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✓ logout_time 字段已存在，无需添加');
      return;
    }
    
    // 添加 logout_time 字段
    await client.query(`
      ALTER TABLE login_logs 
      ADD COLUMN logout_time TIMESTAMP,
      ADD COLUMN session_duration INTEGER DEFAULT 0
    `);
    
    console.log('✓ 成功添加 logout_time 和 session_duration 字段');
    
    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_login_logs_logout_time 
      ON login_logs(logout_time)
    `);
    
    console.log('✓ 成功创建索引');
    console.log('✓ 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addLogoutTimeColumn().catch(console.error);
