/**
 * 管理功能手动验证脚本
 * 测试管理员相关的路由功能
 */

const API_BASE = 'http://localhost:3001';

// 管理员凭证
const ADMIN_CREDENTIALS = {
  phone: 'admin',
  password: 'admin',
  role: 'ADMIN'
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅ 通过' : '❌ 失败';
  const color = passed ? 'green' : 'red';
  log(`${status} - ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// 登录获取 token
async function login() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    if (!response.ok) {
      throw new Error(`登录失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    log(`管理员登录失败: ${error.message}`, 'red');
    return null;
  }
}

// 测试管理员账号管理
async function testAdminManagement(token) {
  logSection('测试管理员账号管理');
  
  try {
    // 1. 获取管理员列表
    let response = await fetch(`${API_BASE}/api/admin/admins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取管理员列表',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const admins = await response.json();
      log(`   当前管理员数量: ${admins.length}`, 'blue');
    }
    
    // 2. 创建管理员
    const newAdminData = {
      phone: 'test-admin-' + Date.now(),
      password: 'test123',
      nickname: '测试管理员',
      realName: '测试管理员'
    };
    
    response = await fetch(`${API_BASE}/api/admin/admins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAdminData)
    });
    
    logTest(
      '创建管理员',
      response.ok,
      `状态码: ${response.status}`
    );
    
    let newAdminId = null;
    if (response.ok) {
      const result = await response.json();
      newAdminId = result.id;
      log(`   新管理员 ID: ${newAdminId}`, 'blue');
    }
    
    // 3. 更新管理员信息
    if (newAdminId) {
      response = await fetch(`${API_BASE}/api/admin/admins/${newAdminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: '更新后的管理员'
        })
      });
      
      logTest(
        '更新管理员信息',
        response.ok,
        `状态码: ${response.status}`
      );
    }
    
    // 4. 删除管理员
    if (newAdminId) {
      response = await fetch(`${API_BASE}/api/admin/admins/${newAdminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      logTest(
        '删除管理员',
        response.ok,
        `状态码: ${response.status}`
      );
    }
    
    // 5. 修改密码（使用错误的旧密码）
    response = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldPassword: 'wrong-password',
        newPassword: 'new-password'
      })
    });
    
    logTest(
      '修改密码（错误旧密码）',
      !response.ok && response.status === 401,
      `状态码: ${response.status} (预期: 401)`
    );
    
  } catch (error) {
    log(`管理员账号管理测试失败: ${error.message}`, 'red');
  }
}

// 测试考试历史查询
async function testExamHistory(token) {
  logSection('测试考试历史查询');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/exam-history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取考试历史',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const history = await response.json();
      log(`   考试历史记录数量: ${history.length}`, 'blue');
    }
    
  } catch (error) {
    log(`考试历史测试失败: ${error.message}`, 'red');
  }
}

// 测试进度数据查询
async function testProgress(token) {
  logSection('测试进度数据查询');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/all-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取进度数据',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const progress = await response.json();
      log(`   进度记录数量: ${progress.length}`, 'blue');
    }
    
  } catch (error) {
    log(`进度数据测试失败: ${error.message}`, 'red');
  }
}

// 测试数据库修复功能
async function testDatabaseRepair(token) {
  logSection('测试数据库修复功能');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/repair-student-schema`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '执行数据库修复',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const result = await response.json();
      log(`   修复结果: ${JSON.stringify(result)}`, 'blue');
    }
    
  } catch (error) {
    log(`数据库修复测试失败: ${error.message}`, 'red');
  }
}

// 测试非管理员访问（应该返回 403）
async function testForbidden() {
  logSection('测试非管理员访问（预期 403）');
  
  // 使用学员 token
  try {
    const studentResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: 'student1',
        password: 'password123',
        role: 'STUDENT'
      })
    });
    
    if (!studentResponse.ok) {
      log('无法获取学员 token，跳过权限测试', 'yellow');
      return;
    }
    
    const studentData = await studentResponse.json();
    const studentToken = studentData.token;
    
    const endpoints = [
      '/api/admin/admins',
      '/api/admin/exam-history',
      '/api/admin/all-progress'
    ];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      
      logTest(
        `${endpoint}`,
        response.status === 403,
        `状态码: ${response.status} (预期: 403)`
      );
    }
    
  } catch (error) {
    log(`权限测试失败: ${error.message}`, 'red');
  }
}

// 主测试函数
async function runTests() {
  log('\n🚀 开始管理功能验证\n', 'cyan');
  
  // 登录获取 token
  log('正在登录管理员账号...', 'yellow');
  const adminToken = await login();
  
  if (!adminToken) {
    log('无法获取管理员 token，测试终止', 'red');
    process.exit(1);
  }
  
  log('✅ 管理员登录成功\n', 'green');
  
  // 测试管理功能
  await testAdminManagement(adminToken);
  await testExamHistory(adminToken);
  await testProgress(adminToken);
  await testDatabaseRepair(adminToken);
  
  // 测试权限控制
  await testForbidden();
  
  logSection('测试完成');
  log('所有管理功能测试已完成！', 'green');
}

// 运行测试
runTests().catch(error => {
  log(`测试执行失败: ${error.message}`, 'red');
  process.exit(1);
});
