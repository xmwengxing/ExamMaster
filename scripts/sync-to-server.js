#!/usr/bin/env node

/**
 * 同步代码到服务器脚本
 * 用于将本地开发环境的代码和配置同步到生产服务器
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 服务器配置
const SERVER_CONFIG = {
  host: '47.104.173.139',
  user: 'root',
  path: '/www/wwwroot/exammaster.zzzjl.com'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    step: `${colors.cyan}▶${colors.reset}`
  }[type];
  
  console.log(`${prefix} ${message}`);
}

function execCommand(command, description) {
  log(description, 'step');
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`${description} - 完成`, 'success');
    return output;
  } catch (error) {
    log(`${description} - 失败: ${error.message}`, 'error');
    throw error;
  }
}

function readEnvFile() {
  log('读取本地环境变量...', 'step');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('.env 文件不存在', 'error');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      let value = valueParts.join('=').trim();
      
      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      envVars[key.trim()] = value;
    }
  });
  
  log(`读取到 ${Object.keys(envVars).length} 个环境变量`, 'success');
  return envVars;
}

function generateServerEnv(localEnv) {
  log('生成服务器环境变量配置...', 'step');
  
  // 服务器环境变量（修改 Docker 相关配置）
  const serverEnv = {
    ...localEnv,
    NODE_ENV: 'production',
    DB_HOST: 'postgres',  // Docker 容器名称
    DB_PORT: '5432',      // Docker 内部端口
    PORT: '3001'
  };
  
  // 生成 .env 文件内容
  let envContent = '# ============================================\n';
  envContent += '# EduMaster 刷题系统 - 生产环境变量配置\n';
  envContent += '# 自动生成于: ' + new Date().toISOString() + '\n';
  envContent += '# ============================================\n\n';
  
  envContent += '# -------------------- 应用配置 --------------------\n';
  envContent += `NODE_ENV=${serverEnv.NODE_ENV}\n`;
  envContent += `PORT=${serverEnv.PORT}\n\n`;
  
  envContent += '# -------------------- 数据库配置 --------------------\n';
  envContent += `DB_HOST=${serverEnv.DB_HOST}\n`;
  envContent += `DB_PORT=${serverEnv.DB_PORT}\n`;
  envContent += `DB_NAME=${serverEnv.DB_NAME}\n`;
  envContent += `DB_USER=${serverEnv.DB_USER}\n`;
  
  // 密码需要用引号括起来（如果包含特殊字符）
  const dbPassword = serverEnv.DB_PASSWORD;
  if (dbPassword && /[!@#$%^&*(){}[\]|\\;:'",<>?/`~]/.test(dbPassword)) {
    envContent += `DB_PASSWORD='${dbPassword}'\n\n`;
  } else {
    envContent += `DB_PASSWORD=${dbPassword}\n\n`;
  }
  
  envContent += '# -------------------- 安全配置 --------------------\n';
  envContent += `JWT_SECRET=${serverEnv.JWT_SECRET}\n`;
  envContent += `ALLOWED_ORIGINS=${serverEnv.ALLOWED_ORIGINS || 'https://exammaster.zzzjl.com'}\n\n`;
  
  envContent += '# -------------------- 第三方服务 --------------------\n';
  envContent += `DEEPSEEK_API_KEY=${serverEnv.DEEPSEEK_API_KEY || ''}\n`;
  
  log('服务器环境变量配置生成完成', 'success');
  return envContent;
}

function displayEnvSummary(localEnv) {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  环境变量配置摘要${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`  数据库名称: ${localEnv.DB_NAME}`);
  console.log(`  数据库用户: ${localEnv.DB_USER}`);
  console.log(`  数据库密码: ${localEnv.DB_PASSWORD ? '***已设置***' : '未设置'}`);
  console.log(`  JWT Secret: ${localEnv.JWT_SECRET ? '***已设置***' : '未设置'}`);
  console.log(`  允许来源: ${localEnv.ALLOWED_ORIGINS || '未设置'}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          EduMaster 代码同步到服务器工具                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. 读取本地环境变量
    const localEnv = readEnvFile();
    if (!localEnv) {
      log('无法读取本地环境变量，退出', 'error');
      process.exit(1);
    }

    // 2. 显示环境变量摘要
    displayEnvSummary(localEnv);

    // 3. 生成服务器环境变量
    const serverEnvContent = generateServerEnv(localEnv);
    
    // 4. 保存到临时文件
    const tempEnvPath = path.join(process.cwd(), '.env.server');
    fs.writeFileSync(tempEnvPath, serverEnvContent);
    log('服务器环境变量已保存到 .env.server', 'success');

    log('\n请按照以下步骤手动同步到服务器：', 'info');
    console.log(`
${colors.cyan}步骤 1: 备份服务器数据库${colors.reset}
  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}
  cd ${SERVER_CONFIG.path}
  ./服务器脚本/backup.sh

${colors.cyan}步骤 2: 推送代码到 GitHub${colors.reset}
  git add .
  git commit -m "更新配置和优化"
  git push origin main

${colors.cyan}步骤 3: 在服务器上拉取代码${colors.reset}
  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}
  cd ${SERVER_CONFIG.path}
  git pull origin main

${colors.cyan}步骤 4: 上传环境变量配置${colors.reset}
  scp .env.server ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}:${SERVER_CONFIG.path}/.env

${colors.cyan}步骤 5: 重启服务（使用 docker compose，不是 docker-compose）${colors.reset}
  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}
  cd ${SERVER_CONFIG.path}
  docker stop edumaster_api edumaster_postgres
  docker compose up -d --build

${colors.cyan}步骤 6: 检查和修复管理员账号${colors.reset}
  ${colors.yellow}# 容器中没有 scripts/ 目录，需要先复制脚本${colors.reset}
  docker cp scripts/check-and-fix-admin.js edumaster_api:/app/
  docker exec edumaster_api node /app/check-and-fix-admin.js

${colors.cyan}步骤 7: 验证服务${colors.reset}
  docker ps
  docker logs -f edumaster_api
  curl https://exammaster.zzzjl.com/api/health
    `);

    log('\n重要提示：', 'warning');
    log('1. 生产环境使用 docker compose 命令（新版），不是 docker-compose', 'warning');
    log('2. Nginx 由宝塔面板管理，不在 Docker 中', 'warning');
    log('3. 容器中没有 scripts/ 目录，需要从宿主机复制', 'warning');
    log('4. 确保 .env.server 文件不要提交到 Git', 'warning');
    log('5. 上传后请删除本地的 .env.server 文件', 'warning');
    log('6. 首次部署需要等待 Docker 镜像构建完成', 'warning');

  } catch (error) {
    log(`发生错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 执行主函数
main();
