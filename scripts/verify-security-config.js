#!/usr/bin/env node

/**
 * 安全配置验证工具
 * 用于验证系统的安全配置是否符合要求
 * 
 * 使用方法：
 * node scripts/verify-security-config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPassed(message) {
  log(`✅ ${message}`, 'green');
}

function checkFailed(message) {
  log(`❌ ${message}`, 'red');
}

function checkWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 检查项
const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

console.log('='.repeat(60));
log('EduMaster 安全配置验证工具', 'blue');
console.log('='.repeat(60));
console.log();

// 1. 检查 .env 文件
log('1. 检查环境变量配置', 'blue');
console.log('-'.repeat(60));

const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  checkFailed('.env 文件不存在');
  checkWarning('请复制 .env.example 为 .env 并配置相应的值');
  checks.failed++;
} else {
  checkPassed('.env 文件存在');
  checks.passed++;
  
  // 检查 .env 文件权限（仅 Unix 系统）
  if (process.platform !== 'win32') {
    const stats = fs.statSync(envPath);
    const mode = (stats.mode & parseInt('777', 8)).toString(8);
    
    if (mode === '600') {
      checkPassed('.env 文件权限正确 (600)');
      checks.passed++;
    } else {
      checkFailed(`.env 文件权限不正确 (${mode})，应该是 600`);
      checkWarning('运行: chmod 600 .env');
      checks.failed++;
    }
  }
  
  // 读取 .env 文件内容
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    // 移除首尾空格
    const trimmedLine = line.trim();
    
    // 跳过空行和注释行
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    // 匹配 KEY=VALUE 格式（支持特殊字符）
    const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  
  // 检查数据库密码
  if (envVars.DB_PASSWORD) {
    const password = envVars.DB_PASSWORD;
    
    if (password === 'your_strong_database_password_here_change_in_production') {
      checkFailed('数据库密码使用默认值，必须修改');
      checks.failed++;
    } else if (password.length < 16) {
      checkFailed(`数据库密码长度不足 (${password.length} < 16)`);
      checks.failed++;
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
      
      if (hasUppercase && hasLowercase && hasNumbers && hasSpecial) {
        checkPassed('数据库密码强度符合要求');
        checks.passed++;
      } else {
        checkFailed('数据库密码强度不足');
        if (!hasUppercase) checkWarning('  - 缺少大写字母');
        if (!hasLowercase) checkWarning('  - 缺少小写字母');
        if (!hasNumbers) checkWarning('  - 缺少数字');
        if (!hasSpecial) checkWarning('  - 缺少特殊字符');
        checks.failed++;
      }
    }
  } else {
    checkFailed('未配置数据库密码 (DB_PASSWORD)');
    checks.failed++;
  }
  
  // 检查 JWT 密钥
  if (envVars.JWT_SECRET) {
    const secret = envVars.JWT_SECRET;
    
    if (secret === 'your-secret-key-here-change-this-in-production' || 
        secret === 'edumaster-secure-2025') {
      checkFailed('JWT 密钥使用默认值，必须修改');
      checks.failed++;
    } else if (secret.length < 32) {
      checkWarning(`JWT 密钥长度较短 (${secret.length} < 32)，建议使用更长的密钥`);
      checks.warnings++;
    } else {
      checkPassed('JWT 密钥配置正确');
      checks.passed++;
    }
  } else {
    checkFailed('未配置 JWT 密钥 (JWT_SECRET)');
    checks.failed++;
  }
  
  // 检查 CORS 配置
  if (envVars.ALLOWED_ORIGINS) {
    const origins = envVars.ALLOWED_ORIGINS;
    
    if (origins === '*') {
      checkFailed('CORS 配置使用通配符 *，存在安全风险');
      checks.failed++;
    } else if (origins.includes('localhost') && envVars.NODE_ENV === 'production') {
      checkWarning('生产环境的 CORS 配置包含 localhost');
      checks.warnings++;
    } else {
      checkPassed('CORS 配置正确');
      checks.passed++;
      
      // 检查是否使用 HTTPS
      const originList = origins.split(',').map(o => o.trim());
      const hasHttp = originList.some(o => o.startsWith('http://') && !o.includes('localhost'));
      
      if (hasHttp && envVars.NODE_ENV === 'production') {
        checkWarning('生产环境的 CORS 配置包含 HTTP 域名，建议使用 HTTPS');
        checks.warnings++;
      }
    }
  } else {
    checkWarning('未配置 ALLOWED_ORIGINS，将使用默认值');
    checks.warnings++;
  }
}

console.log();

// 2. 检查 .gitignore
log('2. 检查 .gitignore 配置', 'blue');
console.log('-'.repeat(60));

const gitignorePath = path.join(rootDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  checkWarning('.gitignore 文件不存在');
  checks.warnings++;
} else {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  
  if (gitignoreContent.includes('.env')) {
    checkPassed('.env 文件已添加到 .gitignore');
    checks.passed++;
  } else {
    checkFailed('.env 文件未添加到 .gitignore');
    checkWarning('请在 .gitignore 中添加: .env');
    checks.failed++;
  }
}

console.log();

// 3. 检查 PostgreSQL 配置文件
log('3. 检查 PostgreSQL 安全配置', 'blue');
console.log('-'.repeat(60));

const pgHbaPath = path.join(rootDir, 'postgres', 'pg_hba.conf');
if (!fs.existsSync(pgHbaPath)) {
  checkWarning('pg_hba.conf 文件不存在');
  checks.warnings++;
} else {
  checkPassed('pg_hba.conf 文件存在');
  checks.passed++;
  
  const pgHbaContent = fs.readFileSync(pgHbaPath, 'utf-8');
  
  // 检查是否使用 scram-sha-256
  if (pgHbaContent.includes('scram-sha-256')) {
    checkPassed('使用 scram-sha-256 加密认证');
    checks.passed++;
  } else {
    checkWarning('未使用 scram-sha-256 加密认证');
    checks.warnings++;
  }
  
  // 检查是否有不安全的配置
  if (pgHbaContent.includes('trust')) {
    checkWarning('pg_hba.conf 包含 trust 认证方法（不安全）');
    checks.warnings++;
  }
  
  if (pgHbaContent.includes('0.0.0.0/0') && !pgHbaContent.includes('# host')) {
    checkFailed('pg_hba.conf 允许所有 IP 访问（严重安全风险）');
    checks.failed++;
  }
}

const postgresqlConfPath = path.join(rootDir, 'postgres', 'postgresql.conf');
if (!fs.existsSync(postgresqlConfPath)) {
  checkWarning('postgresql.conf 文件不存在');
  checks.warnings++;
} else {
  checkPassed('postgresql.conf 文件存在');
  checks.passed++;
}

console.log();

// 4. 检查 Docker 配置
log('4. 检查 Docker 安全配置', 'blue');
console.log('-'.repeat(60));

const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
if (!fs.existsSync(dockerComposePath)) {
  checkWarning('docker-compose.yml 文件不存在');
  checks.warnings++;
} else {
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');
  
  // 检查 PostgreSQL 端口是否暴露
  if (dockerComposeContent.includes('5432:5432') && 
      !dockerComposeContent.includes('# ports:')) {
    checkWarning('PostgreSQL 端口暴露到主机，建议仅在 Docker 内部网络访问');
    checks.warnings++;
  } else {
    checkPassed('PostgreSQL 端口未暴露到主机');
    checks.passed++;
  }
  
  // 检查是否使用了安全配置文件
  if (dockerComposeContent.includes('pg_hba.conf') && 
      dockerComposeContent.includes('postgresql.conf')) {
    checkPassed('Docker 配置使用了 PostgreSQL 安全配置文件');
    checks.passed++;
  } else {
    checkWarning('Docker 配置未使用 PostgreSQL 安全配置文件');
    checks.warnings++;
  }
}

console.log();

// 5. 检查 CORS 配置
log('5. 检查 CORS 代码配置', 'blue');
console.log('-'.repeat(60));

const serverPath = path.join(rootDir, 'server.js');
if (!fs.existsSync(serverPath)) {
  checkWarning('server.js 文件不存在');
  checks.warnings++;
} else {
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  
  // 检查是否使用了安全的 CORS 配置
  if (serverContent.includes('app.use(cors())') && 
      !serverContent.includes('corsOptions')) {
    checkFailed('CORS 配置不安全，允许所有来源');
    checks.failed++;
  } else if (serverContent.includes('corsOptions')) {
    checkPassed('使用了安全的 CORS 配置');
    checks.passed++;
  } else {
    checkWarning('无法确定 CORS 配置');
    checks.warnings++;
  }
}

console.log();

// 总结
console.log('='.repeat(60));
log('验证结果总结', 'blue');
console.log('='.repeat(60));

log(`✅ 通过: ${checks.passed}`, 'green');
log(`❌ 失败: ${checks.failed}`, 'red');
log(`⚠️  警告: ${checks.warnings}`, 'yellow');

console.log();

if (checks.failed > 0) {
  log('❌ 安全配置验证失败，请修复上述问题后再部署到生产环境', 'red');
  process.exit(1);
} else if (checks.warnings > 0) {
  log('⚠️  安全配置验证通过，但存在一些警告，建议修复后再部署', 'yellow');
  process.exit(0);
} else {
  log('✅ 安全配置验证通过，可以部署到生产环境', 'green');
  process.exit(0);
}
