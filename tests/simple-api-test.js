/**
 * 简单的 API 连接测试
 */

async function testConnection() {
  console.log('测试 API 服务器连接...\n');
  
  try {
    // 测试服务器是否运行
    const response = await fetch('http://localhost:3001/api/banks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应状态文本:', response.statusText);
    
    if (response.status === 401) {
      console.log('✅ 服务器正在运行（需要认证）');
      return true;
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ 服务器正在运行');
      console.log('响应数据:', data);
      return true;
    } else {
      console.log('❌ 服务器响应异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 无法连接到服务器:', error.message);
    return false;
  }
}

// 测试登录
async function testLogin() {
  console.log('\n测试登录 API...\n');
  
  const credentials = {
    phone: 'admin',
    password: 'admin123',
    role: 'ADMIN'
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('响应状态:', response.status);
    
    const text = await response.text();
    console.log('响应内容:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ 登录成功');
      console.log('Token:', data.token?.substring(0, 20) + '...');
      return data.token;
    } else {
      console.log('❌ 登录失败');
      return null;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return null;
  }
}

async function main() {
  console.log('========================================');
  console.log('   简单 API 测试');
  console.log('========================================\n');
  
  // 测试连接
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n请确保 API 服务器正在运行: npm run start:server');
    return;
  }
  
  // 测试登录
  const token = await testLogin();
  
  if (token) {
    console.log('\n✅ API 服务器功能正常');
  } else {
    console.log('\n⚠️  登录功能需要检查');
  }
}

main();
