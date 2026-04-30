#!/usr/bin/env node
/**
 * ExamMaster CLI - 命令入口
 * 用法: node scripts/cli.js <command> [options]
 *
 * 可用命令:
 *   setup          交互式项目初始化
 *   admin:reset    重置管理员密码
 *   db:migrate     执行数据库迁移
 *   db:seed        导入示例数据
 *   docker:up      启动 Docker 服务
 *   docker:down    停止 Docker 服务
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}\n`);
  return execSync(cmd, { cwd: rootDir, stdio: 'inherit', ...options });
}

const command = process.argv[2];

switch (command) {
  case 'setup':
    console.log('\n🔧 ExamMaster 初始化向导\n');
    if (!existsSync(join(rootDir, '.env'))) {
      const crypto = await import('crypto');
      const jwtSecret = crypto.randomBytes(32).toString('hex');
      const dbPassword = crypto.randomBytes(16).toString('hex');

      run(`cp .env.example .env`);
      console.log('✅ .env 文件已创建');
      console.log(`   JWT_SECRET: ${jwtSecret}`);
      console.log(`   DB_PASSWORD: ${dbPassword}`);
      console.log('   请编辑 .env 文件替换这些占位密钥');
    } else {
      console.log('⚠️  .env 文件已存在，跳过创建');
    }

    console.log('\n📦 安装依赖...');
    run('npm install');

    console.log('\n🐳 启动 Docker 服务...');
    try {
      run('docker compose up -d');
      console.log('✅ Docker 服务已启动');
      console.log('   前端: http://localhost:8080');
      console.log('   API:  http://localhost:3080');
    } catch (e) {
      console.log('ℹ️  如果 Docker 未安装，请手动启动 PostgreSQL 并配置 .env 中的数据库连接');
    }

    console.log('\n📊 导入示例数据...');
    try {
      run('node scripts/cli.js db:seed');
    } catch (e) {
      console.log('⚠️  示例数据导入失败（数据库可能尚未就绪）');
    }

    console.log('\n🎉 初始化完成！');
    console.log('   默认管理员: admin / admin');
    console.log('   运行 npm run dev 启动开发模式');
    break;

  case 'admin:reset': {
    console.log('\n🔑 重置管理员密码\n');
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    const newPassword = await ask('请输入新密码: ');
    rl.close();

    if (!newPassword || newPassword.length < 4) {
      console.log('❌ 密码长度至少 4 位');
      process.exit(1);
    }

    const bcryptjs = await import('bcryptjs');
    const hash = await bcryptjs.default.hash(newPassword, 10);

    const { default: pg } = await import('pg');
    const { Pool } = pg;
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'examaster',
      user: process.env.DB_USER || 'examaster_user',
      password: process.env.DB_PASSWORD
    });

    try {
      await pool.query("UPDATE users SET password = $1 WHERE phone = 'admin' AND role = 'ADMIN'", [hash]);
      console.log('✅ 管理员密码已更新');
    } catch (e) {
      console.error('❌ 更新失败:', e.message);
    } finally {
      await pool.end();
    }
    break;
  }

  case 'db:migrate': {
    const migrationsDir = join(rootDir, 'postgres', 'migrations');
    const files = (await import('fs')).readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'examaster';
    const dbUser = process.env.DB_USER || 'examaster_user';

    for (const file of files) {
      console.log(`执行迁移: ${file}`);
      run(`docker compose exec -T postgres psql -U ${dbUser} -d ${dbName} < ${join(migrationsDir, file)}`, { stdio: 'pipe' });
    }
    console.log('✅ 所有迁移完成');
    break;
  }

  case 'db:seed':
    console.log('\n📊 导入示例数据...');
    run(`docker compose exec -T postgres psql -U ${process.env.DB_USER || 'examaster_user'} -d ${process.env.DB_NAME || 'examaster'} < scripts/seed.sql`);
    console.log('✅ 示例数据导入完成');
    break;

  case 'docker:up':
    run('docker compose up -d');
    console.log('✅ 服务已启动: http://localhost:8080');
    break;

  case 'docker:down':
    run('docker compose down');
    console.log('✅ 服务已停止');
    break;

  default:
    console.log(`
ExamMaster CLI - 可用命令:

  node scripts/cli.js setup        交互式项目初始化
  node scripts/cli.js admin:reset  重置管理员密码
  node scripts/cli.js db:migrate   执行数据库迁移
  node scripts/cli.js db:seed      导入示例数据
  node scripts/cli.js docker:up    启动 Docker 服务
  node scripts/cli.js docker:down  停止 Docker 服务
`);
    break;
}
