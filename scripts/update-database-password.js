#!/usr/bin/env node

/**
 * 数据库密码更新工具
 * 
 * 功能：
 * 1. 生成新的安全密码（不包含 $ 符号）
 * 2. 更新本地 .env 文件
 * 3. 提供 PostgreSQL 密码更新 SQL 脚本
 * 4. 生成服务器部署指令
 * 
 * 使用方法：
 * node scripts/update-database-password.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成强密码（Docker 兼容版本）
 */
function generateStrongPassword(length = 32) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  // 移除 $ 和 ` 符号
  const special = '!@#%^&*()_+-=[]{}|;:,.<>?~';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // 确保至少包含每种类型的字符
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += special[crypto.randomInt(0, special.length)];
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // 打乱密码字符顺序
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
}

/**
 * 读取 .env 文件
 */
function readEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 错误: .env 文件不存在');
    process.exit(1);
  }
  return fs.readFileSync(envPath, 'utf-8');
}

/**
 * 更新 .env 文件中的密码
 */
function updateEnvFile(content, newPassword) {
  // 移除旧密码周围可能存在的引号
  const updated = content.replace(
    /^DB_PASSWORD=.*/m,
    `DB_PASSWORD=${newPassword}`
  );
  
  const envPath = path.join(__dirname, '..', '.env');
  const backupPath = path.join(__dirname, '..', `.env.backup.${Date.now()}`);
  
  // 备份原文件
  fs.writeFileSync(backupPath, content);
  console.log(`✅ 已备份原 .env 文件到: ${path.basename(backupPath)}`);
  
  // 写入新文件
  fs.writeFileSync(envPath, updated);
  console.log('✅ 已更新 .env 文件');
  
  return backupPath;
}

/**
 * 生成 PostgreSQL 密码更新脚本
 */
function generatePostgresScript(newPassword) {
  const scriptPath = path.join(__dirname, '..', 'update-db-password.sql');
  const script = `-- 更新 PostgreSQL 用户密码
-- 生成时间: ${new Date().toISOString()}
-- 
-- 使用方法:
-- 1. 在 PostgreSQL 容器中执行此脚本
-- 2. docker exec -i edumaster_postgres psql -U postgres -d edumaster < update-db-password.sql

-- 更新密码
ALTER USER edumaster_user WITH PASSWORD '${newPassword}';

-- 验证用户存在
SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename = 'edumaster_user';

-- 完成
\\echo '✅ 密码更新成功'
`;
  
  fs.writeFileSync(scriptPath, script);
  console.log(`✅ 已生成 PostgreSQL 更新脚本: ${path.basename(scriptPath)}`);
  
  return scriptPath;
}

/**
 * 生成部署指令文档
 */
function generateDeploymentInstructions(newPassword) {
  const docPath = path.join(__dirname, '..', '数据库密码更新指南.md');
  const doc = `# 数据库密码更新指南

**生成时间:** ${new Date().toLocaleString('zh-CN')}

## 新密码信息

\`\`\`
DB_PASSWORD=${newPassword}
\`\`\`

## 本地更新步骤

### 1. 停止本地服务（如果正在运行）

\`\`\`bash
docker compose down
\`\`\`

### 2. 清理旧的数据库数据（可选，如果需要全新开始）

\`\`\`bash
# Windows
rmdir /s /q postgres\\data

# Linux/Mac
rm -rf postgres/data
\`\`\`

### 3. 启动服务（会使用新密码初始化数据库）

\`\`\`bash
docker compose up -d
\`\`\`

### 4. 等待服务启动并验证

\`\`\`bash
# 等待 30 秒
timeout /t 30

# 检查容器状态
docker ps

# 测试 API 健康检查
curl http://localhost:3001/api/health
\`\`\`

## 服务器更新步骤

### 方案一：使用部署脚本（推荐）

\`\`\`bash
# 运行部署脚本，会自动上传新的 .env 文件
deploy-to-server-fixed.bat
\`\`\`

### 方案二：手动更新

#### 1. 连接到服务器

\`\`\`bash
ssh root@47.104.173.139
cd /www/wwwroot/exammaster.zzzjl.com
\`\`\`

#### 2. 备份当前 .env 文件

\`\`\`bash
cp .env .env.backup.\$(date +%Y%m%d)
\`\`\`

#### 3. 更新密码

\`\`\`bash
# 方法 1: 使用 sed 命令
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=${newPassword}/' .env

# 方法 2: 手动编辑
vi .env
# 找到 DB_PASSWORD 行，替换为新密码
\`\`\`

#### 4. 验证配置

\`\`\`bash
grep 'DB_PASSWORD' .env
\`\`\`

#### 5. 重启服务

\`\`\`bash
# 停止所有容器
docker compose down

# 删除旧的数据库数据（⚠️ 会清空所有数据！）
# 如果不需要保留数据，执行以下命令
# docker volume rm exammasterzzzjlcom_postgres_data

# 启动服务
docker compose up -d

# 等待服务启动
sleep 40

# 检查状态
docker ps
curl http://localhost:3001/api/health
\`\`\`

## 仅更新现有数据库密码（不清空数据）

如果需要保留现有数据，只更新密码：

### 本地操作

\`\`\`bash
# 1. 在 PostgreSQL 容器中更新密码
docker exec -i edumaster_postgres psql -U postgres -d edumaster < update-db-password.sql

# 2. 重启 API 容器使其使用新密码
docker compose restart api
\`\`\`

### 服务器操作

\`\`\`bash
# 1. 上传 SQL 脚本到服务器
scp update-db-password.sql root@47.104.173.139:/tmp/

# 2. 在服务器上执行
ssh root@47.104.173.139
cd /www/wwwroot/exammaster.zzzjl.com

# 3. 更新 .env 文件中的密码
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=${newPassword}/' .env

# 4. 在数据库中更新密码
docker exec -i edumaster_postgres psql -U postgres -d edumaster < /tmp/update-db-password.sql

# 5. 重启 API 容器
docker compose restart api

# 6. 验证
docker logs edumaster_api --tail=20
curl http://localhost:3001/api/health
\`\`\`

## 验证清单

- [ ] 本地 .env 文件已更新
- [ ] 本地服务可以正常启动
- [ ] 本地 API 健康检查通过
- [ ] 服务器 .env 文件已更新
- [ ] 服务器服务可以正常启动
- [ ] 服务器 API 健康检查通过
- [ ] 可以正常登录系统
- [ ] 数据库连接正常

## 回滚步骤

如果更新后出现问题，可以回滚到旧密码：

\`\`\`bash
# 恢复备份的 .env 文件
cp .env.backup.YYYYMMDD .env

# 重启服务
docker compose down
docker compose up -d
\`\`\`

## 注意事项

⚠️ **重要提示：**

1. 更新密码会导致服务短暂中断（约 1-2 分钟）
2. 如果清空数据库，所有数据将丢失（用户、题库、记录等）
3. 建议在低峰期进行密码更新
4. 更新前确保有完整的数据库备份
5. 新密码不包含 \`$\` 符号，可直接在 .env 中使用无需引号

## 故障排查

### 问题 1: API 容器 unhealthy

**症状:** \`docker ps\` 显示 API 容器状态为 unhealthy

**解决:**
\`\`\`bash
# 查看日志
docker logs edumaster_api --tail=50

# 检查环境变量
docker exec edumaster_api printenv | grep DB_

# 验证密码是否正确
grep 'DB_PASSWORD' .env
\`\`\`

### 问题 2: 密码认证失败

**症状:** 日志显示 "password authentication failed"

**解决:**
\`\`\`bash
# 确认 .env 文件中的密码没有引号
# 错误: DB_PASSWORD='password'
# 正确: DB_PASSWORD=password

# 重新部署
docker compose down
docker compose up -d
\`\`\`

### 问题 3: 数据库连接超时

**症状:** 日志显示 "connection timeout"

**解决:**
\`\`\`bash
# 检查 PostgreSQL 容器状态
docker logs edumaster_postgres --tail=30

# 确认网络连接
docker exec edumaster_api ping postgres -c 3
\`\`\`
`;
  
  fs.writeFileSync(docPath, doc);
  console.log(`✅ 已生成部署指令文档: ${path.basename(docPath)}`);
  
  return docPath;
}

// 主程序
console.log('='.repeat(70));
console.log('EduMaster 数据库密码更新工具');
console.log('='.repeat(70));
console.log();

// 生成新密码
console.log('🔐 正在生成新的安全密码...');
const newPassword = generateStrongPassword(32);
console.log();
console.log('✅ 新密码生成成功:');
console.log(`   ${newPassword}`);
console.log();
console.log('   特点:');
console.log('   - 长度: 32 字符');
console.log('   - 包含大小写字母、数字、特殊字符');
console.log('   - 不包含 $ 符号（Docker 兼容）');
console.log('   - 可直接在 .env 文件中使用，无需引号');
console.log();

// 读取并更新 .env 文件
console.log('📝 正在更新本地 .env 文件...');
const envContent = readEnvFile();
const backupPath = updateEnvFile(envContent, newPassword);
console.log();

// 生成 PostgreSQL 更新脚本
console.log('📄 正在生成 PostgreSQL 更新脚本...');
const sqlScriptPath = generatePostgresScript(newPassword);
console.log();

// 生成部署指令文档
console.log('📋 正在生成部署指令文档...');
const docPath = generateDeploymentInstructions(newPassword);
console.log();

// 完成
console.log('='.repeat(70));
console.log('✅ 密码更新准备完成！');
console.log('='.repeat(70));
console.log();
console.log('📌 下一步操作:');
console.log();
console.log('1. 查看详细指南:');
console.log(`   打开文件: ${path.basename(docPath)}`);
console.log();
console.log('2. 本地测试（推荐先在本地测试）:');
console.log('   docker compose down');
console.log('   docker compose up -d');
console.log('   curl http://localhost:3001/api/health');
console.log();
console.log('3. 部署到服务器:');
console.log('   deploy-to-server-fixed.bat');
console.log();
console.log('⚠️  注意事项:');
console.log('   - 更新密码会导致服务短暂中断');
console.log('   - 如果清空数据库，所有数据将丢失');
console.log('   - 建议先在本地测试，确认无误后再部署到服务器');
console.log('   - 已自动备份原 .env 文件，如需回滚可使用备份');
console.log();
console.log('='.repeat(70));
