#!/usr/bin/env node

/**
 * Nginx 配置同步脚本
 * 用于在部署前检查本地和服务器的 Nginx 配置差异
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
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    step: `${colors.cyan}▶${colors.reset}`
  }[type];
  
  console.log(`${prefix} ${message}`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          Nginx 配置同步检查工具                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. 从服务器下载当前配置
    log('从服务器下载当前 Nginx 配置...', 'step');
    
    const tempDir = path.join(process.cwd(), 'temp-nginx-backup');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const serverNginxPath = `${SERVER_CONFIG.user}@${SERVER_CONFIG.host}:${SERVER_CONFIG.path}/nginx/nginx.conf`;
    const localBackupPath = path.join(tempDir, 'nginx.conf.server');

    try {
      execSync(`scp ${serverNginxPath} "${localBackupPath}"`, { stdio: 'inherit' });
      log('服务器配置下载成功', 'success');
    } catch (error) {
      log('无法连接到服务器或配置文件不存在', 'error');
      log('这可能是首次部署，将使用本地配置', 'warning');
      
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
      
      console.log('\n建议：');
      console.log('  1. 如果是首次部署，可以直接使用本地配置');
      console.log('  2. 如果服务器已有配置，请检查 SSH 连接');
      return;
    }

    // 2. 比较配置文件
    log('比较本地和服务器配置...', 'step');
    
    const localConfigPath = path.join(process.cwd(), 'nginx', 'nginx.conf');
    const localConfig = fs.readFileSync(localConfigPath, 'utf-8');
    const serverConfig = fs.readFileSync(localBackupPath, 'utf-8');

    if (localConfig === serverConfig) {
      log('✓ 配置文件完全一致，可以安全部署', 'success');
    } else {
      log('⚠ 配置文件存在差异！', 'warning');
      console.log('\n差异说明：');
      console.log('  - 本地配置: nginx/nginx.conf');
      console.log(`  - 服务器配置备份: ${localBackupPath}`);
      console.log('\n建议操作：');
      console.log('  1. 使用文本编辑器对比两个文件');
      console.log('  2. 确认差异是否重要（如域名、SSL 证书路径等）');
      console.log('  3. 如果服务器配置有重要修改，请更新本地配置');
      console.log('  4. 如果本地配置是最新的，可以继续部署（会覆盖服务器配置）');
    }

    // 3. 检查 SSL 证书
    log('检查 SSL 证书...', 'step');
    
    try {
      const sslCheckCmd = `ssh ${SERVER_CONFIG.user}@${SERVER_CONFIG.host} "ls -la ${SERVER_CONFIG.path}/nginx/ssl/"`;
      const sslFiles = execSync(sslCheckCmd, { encoding: 'utf-8' });
      
      if (sslFiles.includes('cert.pem') && sslFiles.includes('key.pem')) {
        log('✓ 服务器上存在 SSL 证书', 'success');
        log('注意：部署时不会覆盖 SSL 证书文件（已在打包脚本中排除）', 'info');
      } else {
        log('⚠ 服务器上未找到 SSL 证书', 'warning');
        log('如果需要 HTTPS，请在部署后配置 SSL 证书', 'info');
      }
    } catch (error) {
      log('无法检查 SSL 证书（可能是首次部署）', 'warning');
    }

    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}  检查完成${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);

    console.log('下一步：');
    console.log('  1. 如果配置一致或差异可接受，运行部署脚本：');
    console.log('     Windows: deploy-to-server.bat');
    console.log('     Linux/Mac: node scripts/pack-and-upload.js');
    console.log('  2. 如果需要更新本地配置，请先修改 nginx/nginx.conf');
    console.log(`  3. 服务器配置备份保存在: ${localBackupPath}\n`);

  } catch (error) {
    log(`发生错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 执行主函数
main();
