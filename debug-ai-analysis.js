// 调试 AI 解析接口的认证问题
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'edumaster-secure-2025';

console.log('=== AI 解析接口调试 ===\n');
console.log('JWT_SECRET:', JWT_SECRET);
console.log('\n请在浏览器控制台执行以下命令获取 token:');
console.log('localStorage.getItem("edu_token")\n');
console.log('然后将 token 粘贴到这里进行验证...\n');

// 如果通过命令行参数传入 token
const token = process.argv[2];

if (token) {
  console.log('验证 token...\n');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token 有效！');
    console.log('解码后的数据:', JSON.stringify(decoded, null, 2));
    console.log('\n用户角色:', decoded.role);
    console.log('是否为管理员:', decoded.role === 'ADMIN');
  } catch (err) {
    console.log('❌ Token 无效！');
    console.log('错误信息:', err.message);
  }
} else {
  console.log('使用方法: node debug-ai-analysis.js <your-token>');
}
