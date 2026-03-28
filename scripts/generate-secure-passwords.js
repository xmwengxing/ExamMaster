#!/usr/bin/env node

/**
 * 安全密码生成工具（Docker 兼容版本）
 * 用于生成符合安全要求的强密码
 * 
 * 重要改进：
 * - 移除了 $ 符号（避免被 docker-compose 解释为环境变量）
 * - 移除了 ` 符号（避免在 shell 中被解释为命令替换）
 * - 生成的密码可直接在 .env 文件中使用，无需引号包裹
 * 
 * 使用方法：
 * node scripts/generate-secure-passwords.js
 */

import crypto from 'crypto';

/**
 * 生成强密码（Docker 兼容版本）
 * @param {number} length - 密码长度（默认 32）
 * @returns {string} 生成的密码
 * 
 * 注意：移除了 $ 符号，因为它会被 docker-compose 解释为环境变量
 * 移除了 ` 符号，因为它在 shell 中有特殊含义
 */
function generateStrongPassword(length = 32) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  // 移除 $ 和 ` 符号，避免在 docker-compose 和 shell 中被解释为特殊字符
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
 * 生成 JWT 密钥
 * @returns {string} 64 字符的十六进制字符串
 */
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 验证密码强度
 * @param {string} password - 要验证的密码
 * @returns {object} 验证结果
 */
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 16,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    // 更新正则表达式，移除 $ 符号
    special: /[!@#%^&*()_+\-=\[\]{}|;:,.<>?~]/.test(password)
  };
  
  const passed = Object.values(checks).every(check => check);
  
  return {
    passed,
    checks,
    message: passed 
      ? '✅ 密码强度符合要求' 
      : '❌ 密码强度不足，请确保满足所有要求'
  };
}

// 主程序
console.log('='.repeat(60));
console.log('EduMaster 安全密码生成工具');
console.log('='.repeat(60));
console.log();

// 生成数据库密码
const dbPassword = generateStrongPassword(32);
console.log('📊 数据库密码 (DB_PASSWORD):');
console.log(dbPassword);
console.log();

// 验证数据库密码
const dbValidation = validatePasswordStrength(dbPassword);
console.log(dbValidation.message);
console.log('  - 长度 >= 16: ' + (dbValidation.checks.length ? '✅' : '❌'));
console.log('  - 包含大写字母: ' + (dbValidation.checks.uppercase ? '✅' : '❌'));
console.log('  - 包含小写字母: ' + (dbValidation.checks.lowercase ? '✅' : '❌'));
console.log('  - 包含数字: ' + (dbValidation.checks.numbers ? '✅' : '❌'));
console.log('  - 包含特殊字符: ' + (dbValidation.checks.special ? '✅' : '❌'));
console.log();

// 生成 JWT 密钥
const jwtSecret = generateJWTSecret();
console.log('🔐 JWT 密钥 (JWT_SECRET):');
console.log(jwtSecret);
console.log();

// 生成额外的备用密码
console.log('🔄 备用密码（可选）:');
for (let i = 1; i <= 3; i++) {
  console.log(`  ${i}. ${generateStrongPassword(24)}`);
}
console.log();

// 使用说明
console.log('='.repeat(60));
console.log('📝 使用说明:');
console.log('='.repeat(60));
console.log('1. 复制上面生成的密码到 .env 文件');
console.log('2. 替换 DB_PASSWORD 和 JWT_SECRET 的值');
console.log('3. ✅ 密码已优化，不包含 $ 符号，可直接使用无需引号');
console.log('4. 确保 .env 文件权限设置为 600 (仅所有者可读写)');
console.log('   chmod 600 .env');
console.log('5. 不要将 .env 文件提交到版本控制系统');
console.log('6. 定期更换密码（建议每 90 天）');
console.log();

// 安全提示
console.log('='.repeat(60));
console.log('⚠️  安全提示:');
console.log('='.repeat(60));
console.log('• 不要在多个系统中使用相同的密码');
console.log('• 不要通过不安全的渠道（如邮件、即时消息）传输密码');
console.log('• 使用密码管理器安全存储密码');
console.log('• 定期审查和更新密码');
console.log('• 启用双因素认证（如果支持）');
console.log();

// 生成 .env 示例
console.log('='.repeat(60));
console.log('📄 .env 文件示例:');
console.log('='.repeat(60));
console.log(`# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
# ✅ 密码不包含 $ 符号，可直接使用无需引号
DB_PASSWORD=${dbPassword}

# JWT 配置
JWT_SECRET=${jwtSecret}

# 其他配置
NODE_ENV=production
PORT=3001
`);
console.log('='.repeat(60));
