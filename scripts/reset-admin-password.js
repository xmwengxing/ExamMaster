#!/usr/bin/env node

/**
 * 重置管理员密码脚本
 * 将管理员密码重置为 admin
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'edumaster_user',
  password: process.env.DB_PASSWORD
});

async function resetAdminPassword() {
  console.log('正在重置管理员密码...');
  
  try {
    // 生成新密码的哈希
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新管理员密码
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE phone = 'admin' AND role = 'ADMIN' RETURNING id, phone, role",
      [hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log('✓ 管理员密码重置成功！');
      console.log('═══════════════════════════════════════');
      console.log('  账号: admin');
      console.log('  密码: admin');
      console.log('  ⚠️  请立即登录并修改密码！');
      console.log('═══════════════════════════════════════');
      
      // 验证密码
      const verifyResult = await pool.query(
        "SELECT password FROM users WHERE phone = 'admin' AND role = 'ADMIN'"
      );
      
      if (verifyResult.rows.length > 0) {
        const passwordMatch = await bcrypt.compare(newPassword, verifyResult.rows[0].password);
        if (passwordMatch) {
          console.log('✓ 密码验证成功');
        } else {
          console.log('✗ 密码验证失败');
        }
      }
    } else {
      console.log('✗ 未找到管理员账号');
    }
  } catch (error) {
    console.error('✗ 重置密码失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
