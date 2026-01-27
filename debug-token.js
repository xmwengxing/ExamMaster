/**
 * 调试 JWT Token 脚本
 */

const API_BASE = 'http://localhost:3001';

async function debugToken() {
  try {
    // 登录
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: 'admin',
        password: 'admin',
        role: 'ADMIN'
      })
    });
    
    if (!response.ok) {
      console.error('登录失败:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('登录成功！');
    console.log('\nToken:', data.token);
    
    // 解码 token（不验证签名）
    const parts = data.token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('\nToken Payload:');
      console.log(JSON.stringify(payload, null, 2));
    }
    
    console.log('\nUser Info:');
    console.log('  ID:', data.user.id);
    console.log('  Role:', data.user.role);
    console.log('  Nickname:', data.user.nickname);
    
    // 测试访问管理员路由
    console.log('\n测试访问管理员路由...');
    const testResponse = await fetch(`${API_BASE}/api/admin/admins`, {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    
    console.log('状态码:', testResponse.status);
    const result = await testResponse.json();
    console.log('响应:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

debugToken();
