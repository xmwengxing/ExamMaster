/**
 * 任务 1 验证脚本
 * 验证所有环境准备和依赖安装是否正确完成
 */

import fs from 'fs';
import path from 'path';

console.log('========================================');
console.log('任务 1 验证脚本');
console.log('========================================\n');

let allPassed = true;

// 1. 检查 package.json 依赖
console.log('1️⃣  检查 Node.js 依赖...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // 检查 pg
  if (packageJson.dependencies.pg) {
    console.log('   ✅ pg (node-postgres) 已安装:', packageJson.dependencies.pg);
  } else {
    console.log('   ❌ pg (node-postgres) 未安装');
    allPassed = false;
  }
  
  // 检查 vitest
  if (packageJson.devDependencies.vitest) {
    console.log('   ✅ vitest 已安装:', packageJson.devDependencies.vitest);
  } else {
    console.log('   ❌ vitest 未安装');
    allPassed = false;
  }
  
  // 检查 fast-check
  if (packageJson.devDependencies['fast-check']) {
    console.log('   ✅ fast-check 已安装:', packageJson.devDependencies['fast-check']);
  } else {
    console.log('   ❌ fast-check 未安装');
    allPassed = false;
  }
  
  // 检查 sqlite3 是否已移除
  if (!packageJson.dependencies.sqlite3) {
    console.log('   ✅ sqlite3 已移除');
  } else {
    console.log('   ❌ sqlite3 仍然存在，应该移除');
    allPassed = false;
  }
  
  // 检查测试脚本
  if (packageJson.scripts.test) {
    console.log('   ✅ 测试脚本已配置:', packageJson.scripts.test);
  } else {
    console.log('   ⚠️  测试脚本未配置');
  }
  
} catch (error) {
  console.log('   ❌ 无法读取 package.json:', error.message);
  allPassed = false;
}

console.log('');

// 2. 检查配置文件
console.log('2️⃣  检查配置文件...');

const configFiles = [
  'vitest.config.js',
  '.env',
  '.env.example'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} 存在`);
  } else {
    console.log(`   ❌ ${file} 不存在`);
    allPassed = false;
  }
});

console.log('');

// 3. 检查 .env 配置
console.log('3️⃣  检查 .env 配置...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} 已配置`);
    } else {
      console.log(`   ❌ ${varName} 未配置`);
      allPassed = false;
    }
  });
  
  // 检查端口是否为 5433
  if (envContent.includes('DB_PORT=5433')) {
    console.log('   ✅ 数据库端口配置正确 (5433)');
  } else {
    console.log('   ⚠️  数据库端口可能配置错误（应为 5433）');
  }
  
} catch (error) {
  console.log('   ❌ 无法读取 .env 文件:', error.message);
  allPassed = false;
}

console.log('');

// 4. 检查测试文件
console.log('4️⃣  检查测试文件...');
if (fs.existsSync('tests/setup.test.js')) {
  console.log('   ✅ tests/setup.test.js 存在');
} else {
  console.log('   ❌ tests/setup.test.js 不存在');
  allPassed = false;
}

console.log('');

// 5. 检查辅助文件
console.log('5️⃣  检查辅助文件...');

const helperFiles = [
  'POSTGRESQL_SETUP.md',
  '数据库配置说明.md',
  'setup-database.sql',
  'setup-database.ps1',
  'test-db-connection.js',
  '任务1完成总结.md'
];

helperFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} 存在`);
  } else {
    console.log(`   ⚠️  ${file} 不存在（可选）`);
  }
});

console.log('');

// 6. 测试数据库连接
console.log('6️⃣  测试数据库连接...');
console.log('   运行: node test-db-connection.js');
console.log('   （请手动运行此命令验证数据库连接）');

console.log('');

// 7. 运行单元测试
console.log('7️⃣  运行单元测试...');
console.log('   运行: npm test');
console.log('   （请手动运行此命令验证测试框架）');

console.log('');

// 最终结果
console.log('========================================');
if (allPassed) {
  console.log('✅ 任务 1 验证通过！');
  console.log('========================================');
  console.log('');
  console.log('下一步：');
  console.log('1. 运行 node test-db-connection.js 验证数据库连接');
  console.log('2. 运行 npm test 验证测试框架');
  console.log('3. 继续执行任务 2：创建 PostgreSQL 数据库架构');
  process.exit(0);
} else {
  console.log('❌ 任务 1 验证失败！');
  console.log('========================================');
  console.log('');
  console.log('请检查上述错误并修复后重新验证。');
  process.exit(1);
}
