#!/usr/bin/env node

/**
 * 打包并上传到服务器脚本
 * 适用于无法访问 GitHub 的国内服务器环境
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 服务器配置
const SERVER_CONFIG = {
  host: '47.104.173.139',
  user: 'root',
  path: '/www/wwwroot/exammaster.zzzjl.com',
  port: 22
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    step: `${colors.cyan}▶${colors.reset}`
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, description, options = {}) {
  log(description, 'step');
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    log(`${description} - 完成`, 'success');
    return output;
  } catch (error) {
    log(`${description} - 失败: ${error.message}`, 'error');
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

async function createArchive() {
  return new Promise((resolve, reject) => {
    log('创建压缩包...', 'step');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = path.join(process.cwd(), `edumaster-deploy-${timestamp}.tar.gz`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 9 }
    });

    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      log(`压缩包创建完成: ${path.basename(outputPath)} (${sizeMB} MB)`, 'success');
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      log(`压缩失败: ${err.message}`, 'error');
      reject(err);
    });

    archive.pipe(output);

    // 需要打包的文件和目录
    const includes = [
      // 核心代码
      'server.js',
      'db.js',
      'package.json',
      'package-lock.json',
      
      // 配置文件
      'docker-compose.yml',
      'Dockerfile',
      '.dockerignore',
      'ecosystem.config.cjs',
      'Makefile',
      
      // 前端构建产物
      'dist',
      
      // 组件和页面
      'components',
      'pages',
      'utils',
      
      // 前端源码（如果需要）
      'App.tsx',
      'index.tsx',
      'index.html',
      'index.css',
      'constants.ts',
      'store.ts',
      'types.ts',
      'vite.config.ts',
      'tsconfig.json',
      
      // 脚本
      'scripts',
      '服务器脚本',
      
      // 测试
      'tests',
      
      // PostgreSQL 配置
      'postgres',
      
      // Nginx 配置
      'nginx',
      
      // GitHub Actions
      '.github',
      
      // 文档
      'README.md',
      '技术文档.md',
      'DEPLOYMENT_GUIDE.md',
      'QUICK_REFERENCE.md',
      '服务器部署同步指南.md',
      
      // 规范文档
      '.kiro'
    ];

    // 排除的文件和目录
    const excludes = [
      'node_modules',
      '.git',
      '.env',
      '.env.local',
      '.env.server',
      'logs',
      'backups',
      '备忘文件',
      '.vscode',
      '*.log',
      '*.db',
      '*.db.backup*',
      'edumaster-deploy-*.tar.gz',
      'nginx/ssl/*.pem',  // 排除 SSL 证书文件，避免覆盖服务器证书
      'nginx/ssl/*.key'   // 排除 SSL 私钥文件
    ];

    log('添加文件到压缩包...', 'info');
    
    includes.forEach(item => {
      const itemPath = path.join(process.cwd(), item);
      if (fs.existsSync(itemPath)) {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          archive.directory(itemPath, item);
          log(`  添加目录: ${item}`, 'info');
        } else {
          archive.file(itemPath, { name: item });
          log(`  添加文件: ${item}`, 'info');
        }
      } else {
        log(`  跳过不存在: ${item}`, 'warning');
      }
    });

    archive.finalize();
  });
}

function generateServerEnv() {
  log('生成服务器环境变量配置...', 'step');
  
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
  
  // 生成服务器环境变量
  const serverEnv = {
    ...envVars,
    NODE_ENV: 'production',
    DB_HOST: 'postgres',
    DB_PORT: '5432',
    PORT: '3001'
  };
  
  let envServerContent = '# EduMaster 生产环境配置\n';
  envServerContent += '# 生成时间: ' + new Date().toISOString() + '\n\n';
  
  envServerContent += 'NODE_ENV=production\n';
  envServerContent += 'PORT=3001\n\n';
  
  envServerContent += 'DB_HOST=postgres\n';
  envServerContent += 'DB_PORT=5432\n';
  envServerContent += `DB_NAME=${serverEnv.DB_NAME}\n`;
  envServerContent += `DB_USER=${serverEnv.DB_USER}\n`;
  
  const dbPassword = serverEnv.DB_PASSWORD;
  if (dbPassword && /[!@#$%^&*(){}[\]|\\;:'",<>?/`~]/.test(dbPassword)) {
    envServerContent += `DB_PASSWORD='${dbPassword}'\n\n`;
  } else {
    envServerContent += `DB_PASSWORD=${dbPassword}\n\n`;
  }
  
  envServerContent += `JWT_SECRET=${serverEnv.JWT_SECRET}\n`;
  envServerContent += `ALLOWED_ORIGINS=${serverEnv.ALLOWED_ORIGINS || 'https://exammaster.zzzjl.com'}\n\n`;
  envServerContent += `DEEPSEEK_API_KEY=${serverEnv.DEEPSEEK_API_KEY || ''}\n`;
  
  const envServerPath = path.join(process.cwd(), '.env.server');
  fs.writeFileSync(envServerPath, envServerContent);
  
  log('服务器环境变量已生成: .env.server', 'success');
  return envServerPath;
}

function displayUploadInstructions(archivePath, envPath) {
  const archiveName = path.basename(archivePath);
  
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  上传和部署指令（适用于生产环境）${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.yellow}步骤 1: 备份服务器数据${colors.reset}`);
  console.log(`  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}`);
  console.log(`  cd ${SERVER_CONFIG.path}`);
  console.log(`  ./服务器脚本/backup.sh`);
  console.log(`  exit\n`);
  
  console.log(`${colors.yellow}步骤 2: 上传压缩包到服务器${colors.reset}`);
  console.log(`  scp ${archiveName} ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}:/tmp/\n`);
  
  console.log(`${colors.yellow}步骤 3: 上传环境变量配置${colors.reset}`);
  console.log(`  scp .env.server ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}:/tmp/.env\n`);
  
  console.log(`${colors.yellow}步骤 4: 在服务器上解压和部署${colors.reset}`);
  console.log(`  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}`);
  console.log(`  cd ${SERVER_CONFIG.path}`);
  console.log(`  ${colors.cyan}# 停止容器（使用 docker 命令，不是 docker-compose）${colors.reset}`);
  console.log(`  docker stop edumaster_api edumaster_postgres`);
  console.log(`  ${colors.cyan}# 解压部署包${colors.reset}`);
  console.log(`  tar -xzf /tmp/${archiveName} -C ${SERVER_CONFIG.path}`);
  console.log(`  cp /tmp/.env ${SERVER_CONFIG.path}/.env`);
  console.log(`  chmod 600 .env`);
  console.log(`  ${colors.cyan}# 启动服务（使用 docker compose，新版 Docker Compose）${colors.reset}`);
  console.log(`  docker compose up -d --build`);
  console.log(`  ${colors.cyan}# 查看容器状态${colors.reset}`);
  console.log(`  docker ps\n`);
  
  console.log(`${colors.yellow}步骤 5: 检查管理员账号${colors.reset}`);
  console.log(`  ${colors.cyan}# 容器中没有 scripts/ 目录，需要先复制脚本${colors.reset}`);
  console.log(`  docker cp scripts/check-and-fix-admin.js edumaster_api:/app/`);
  console.log(`  docker exec edumaster_api node /app/check-and-fix-admin.js\n`);
  
  console.log(`${colors.yellow}步骤 6: 验证部署${colors.reset}`);
  console.log(`  docker logs -f edumaster_api`);
  console.log(`  ${colors.cyan}# 按 Ctrl+C 退出日志查看${colors.reset}`);
  console.log(`  curl https://exammaster.zzzjl.com/api/health`);
  console.log(`  exit\n`);
  
  console.log(`${colors.yellow}步骤 7: 清理临时文件${colors.reset}`);
  console.log(`  ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host} "rm /tmp/${archiveName} /tmp/.env"`);
  console.log(`  rm ${archiveName} .env.server\n`);
  
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.magenta}重要提示：${colors.reset}`);
  console.log(`  ${colors.yellow}1. 生产环境架构说明：${colors.reset}`);
  console.log(`     - Nginx 由宝塔面板管理（宿主机），不在 Docker 中`);
  console.log(`     - 仅运行 API 和 PostgreSQL 两个 Docker 容器`);
  console.log(`     - 使用 docker compose 命令（新版），不是 docker-compose`);
  console.log(`  ${colors.yellow}2. 容器文件结构：${colors.reset}`);
  console.log(`     - API 容器中没有 scripts/ 目录`);
  console.log(`     - 需要从宿主机复制脚本到容器`);
  console.log(`  ${colors.yellow}3. 部署注意事项：${colors.reset}`);
  console.log(`     - 确保已备份服务器数据`);
  console.log(`     - 首次部署需要等待 Docker 镜像构建`);
  console.log(`     - 部署后立即修改默认管理员密码`);
  console.log(`  ${colors.yellow}4. 文档参考：${colors.reset}`);
  console.log(`     - 服务器实际架构说明.md`);
  console.log(`     - 服务器部署同步指南.md\n`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          EduMaster 打包上传工具（国内版）                 ║
║          适用于无法访问 GitHub 的服务器                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. 检查前端构建
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      log('dist 目录不存在，需要先构建前端', 'warning');
      log('运行: npm run build', 'info');
      process.exit(1);
    }
    
    log('前端构建产物已存在', 'success');

    // 2. 生成服务器环境变量
    const envPath = generateServerEnv();
    if (!envPath) {
      log('生成环境变量失败', 'error');
      process.exit(1);
    }

    // 3. 创建压缩包
    const archivePath = await createArchive();

    // 4. 显示上传指令
    displayUploadInstructions(archivePath, envPath);

    log('\n打包完成！请按照上述步骤上传到服务器', 'success');

  } catch (error) {
    log(`发生错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 执行主函数
main();
