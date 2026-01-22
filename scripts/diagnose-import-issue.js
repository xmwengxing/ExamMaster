// 诊断导入问题的脚本
import fs from 'fs';

console.log('=== 导入问题诊断 ===\n');

// 1. 检查 CSV 文件
const csvPath = '转换后的题目-单选题(1).csv';
try {
  const stats = fs.statSync(csvPath);
  console.log('✓ CSV 文件信息:');
  console.log(`  - 大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  - 路径: ${csvPath}\n`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  console.log(`  - 总行数: ${lines.length}`);
  console.log(`  - 题目数量: ${lines.length - 1} (不含标题行)\n`);
} catch (err) {
  console.error('✗ 无法读取 CSV 文件:', err.message);
}

// 2. 检查 server.js 配置
console.log('✓ server.js 配置检查:');
try {
  const serverContent = fs.readFileSync('server.js', 'utf-8');
  
  // 检查 body 大小限制
  const bodyLimitMatch = serverContent.match(/express\.json\(\{[^}]*limit:\s*['"]([^'"]+)['"]/);
  if (bodyLimitMatch) {
    console.log(`  - express.json limit: ${bodyLimitMatch[1]}`);
  } else {
    console.log('  - express.json limit: 未设置（默认 100kb）⚠️');
  }
  console.log();
} catch (err) {
  console.error('✗ 无法读取 server.js:', err.message);
}

// 3. 生成修复建议
console.log('=== 修复建议 ===\n');
console.log('根据错误 "500 Internal Server Error from nginx"，可能的原因：\n');

console.log('1. Nginx 超时设置（最可能）');
console.log('   当前 nginx.conf 中 proxy_read_timeout 为 60s');
console.log('   如果导入处理时间超过 60 秒，nginx 会返回 500 错误\n');
console.log('   解决方案：增加超时时间');
console.log('   在 nginx.conf 的 location /api 块中添加或修改：');
console.log('   ```');
console.log('   proxy_read_timeout 300s;    # 增加到 5 分钟');
console.log('   proxy_send_timeout 300s;');
console.log('   proxy_connect_timeout 300s;');
console.log('   ```\n');

console.log('2. 检查服务器日志');
console.log('   SSH 登录后执行：');
console.log('   ```bash');
console.log('   # 查看 nginx 错误日志');
console.log('   tail -f /var/log/nginx/edumaster_error.log');
console.log('');
console.log('   # 查看 PM2 应用日志');
console.log('   pm2 logs edumaster-api --lines 50');
console.log('   ```\n');

console.log('3. 检查 Node.js 进程状态');
console.log('   ```bash');
console.log('   pm2 status');
console.log('   pm2 describe edumaster-api');
console.log('   ```\n');

console.log('=== 快速修复步骤 ===\n');
console.log('步骤 1: 更新 nginx 配置');
console.log('步骤 2: 重启 nginx');
console.log('步骤 3: 重新测试导入\n');

console.log('详细命令见下方输出...\n');
