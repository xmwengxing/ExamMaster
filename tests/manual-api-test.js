/**
 * 手动 API 测试脚本
 * 
 * 测试主要 API 端点的功能
 */

const API_BASE = 'http://localhost:3001/api';

// 测试用户凭据（使用已存在的管理员账号）
const TEST_ADMIN = {
  phone: 'admin',
  password: 'admin123',
  role: 'ADMIN'
};

let authToken = null;

// 辅助函数：发送 HTTP 请求
async function request(method, path, data = null, useAuth = false) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: result
    };
  } catch (error) {
    console.error(`请求失败: ${method} ${path}`, error.message);
    throw error;
  }
}

// 测试函数
async function testLogin() {
  console.log('\n=== 测试 1: 用户登录 ===');
  
  const response = await request('POST', '/auth/login', TEST_ADMIN);
  
  if (response.ok && response.data.token) {
    authToken = response.data.token;
    console.log('✅ 登录成功');
    console.log('   用户ID:', response.data.user.id);
    console.log('   用户角色:', response.data.user.role);
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ 登录失败:', response.data);
    return false;
  }
}

async function testGetBanks() {
  console.log('\n=== 测试 2: 获取题库列表 ===');
  
  const response = await request('GET', '/banks', null, true);
  
  if (response.ok && Array.isArray(response.data)) {
    console.log(`✅ 获取题库成功，共 ${response.data.length} 个题库`);
    response.data.forEach((bank, index) => {
      console.log(`   ${index + 1}. ${bank.name} (${bank.question_count || 0} 道题)`);
    });
    return true;
  } else {
    console.log('❌ 获取题库失败:', response.data);
    return false;
  }
}

async function testGetQuestions() {
  console.log('\n=== 测试 3: 获取题目列表 ===');
  
  // 先获取第一个题库
  const banksResponse = await request('GET', '/banks', null, true);
  if (!banksResponse.ok || !banksResponse.data.length) {
    console.log('❌ 没有可用的题库');
    return false;
  }
  
  const firstBank = banksResponse.data[0];
  const response = await request('GET', `/questions?bankId=${firstBank.id}`, null, true);
  
  if (response.ok && Array.isArray(response.data)) {
    console.log(`✅ 获取题目成功，共 ${response.data.length} 道题`);
    if (response.data.length > 0) {
      const firstQuestion = response.data[0];
      console.log('   第一道题目:');
      console.log('   - ID:', firstQuestion.id);
      console.log('   - 类型:', firstQuestion.type);
      console.log('   - 内容:', firstQuestion.content.substring(0, 50) + '...');
      console.log('   - 选项数量:', firstQuestion.options?.length || 0);
    }
    return true;
  } else {
    console.log('❌ 获取题目失败:', response.data);
    return false;
  }
}

async function testGetProfile() {
  console.log('\n=== 测试 4: 获取用户资料 ===');
  
  const response = await request('GET', '/user/profile', null, true);
  
  if (response.ok && response.data.id) {
    console.log('✅ 获取用户资料成功');
    console.log('   用户ID:', response.data.id);
    console.log('   手机号:', response.data.phone);
    console.log('   角色:', response.data.role);
    console.log('   昵称:', response.data.nickname || '未设置');
    return true;
  } else {
    console.log('❌ 获取用户资料失败:', response.data);
    return false;
  }
}

async function testCreateQuestion() {
  console.log('\n=== 测试 5: 创建题目 ===');
  
  // 先获取第一个题库
  const banksResponse = await request('GET', '/banks', null, true);
  if (!banksResponse.ok || !banksResponse.data.length) {
    console.log('❌ 没有可用的题库');
    return false;
  }
  
  const firstBank = banksResponse.data[0];
  const testQuestion = {
    bankId: firstBank.id,
    type: 'SINGLE',
    content: '这是一道API测试题目',
    options: ['选项A', '选项B', '选项C', '选项D'],
    answer: 'A',
    explanation: '这是测试解析'
  };
  
  const response = await request('POST', '/questions', testQuestion, true);
  
  if (response.ok && response.data.success) {
    console.log('✅ 创建题目成功');
    console.log('   题目ID:', response.data.id);
    
    // 清理测试数据
    await request('DELETE', `/questions/${response.data.id}`, null, true);
    console.log('   ✅ 测试数据已清理');
    return true;
  } else {
    console.log('❌ 创建题目失败:', response.data);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n=== 测试 6: 数据库连接状态 ===');
  
  // 通过获取题库来间接测试数据库连接
  const response = await request('GET', '/banks', null, true);
  
  if (response.ok) {
    console.log('✅ 数据库连接正常');
    return true;
  } else {
    console.log('❌ 数据库连接异常');
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('========================================');
  console.log('   EduMaster API 手动测试');
  console.log('========================================');
  console.log('API 地址:', API_BASE);
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  
  const results = [];
  
  try {
    // 测试 1: 登录
    const loginResult = await testLogin();
    results.push({ name: '用户登录', passed: loginResult });
    
    if (!loginResult) {
      console.log('\n❌ 登录失败，无法继续后续测试');
      return;
    }
    
    // 测试 2: 获取题库
    const banksResult = await testGetBanks();
    results.push({ name: '获取题库列表', passed: banksResult });
    
    // 测试 3: 获取题目
    const questionsResult = await testGetQuestions();
    results.push({ name: '获取题目列表', passed: questionsResult });
    
    // 测试 4: 获取用户资料
    const profileResult = await testGetProfile();
    results.push({ name: '获取用户资料', passed: profileResult });
    
    // 测试 5: 创建题目
    const createResult = await testCreateQuestion();
    results.push({ name: '创建题目', passed: createResult });
    
    // 测试 6: 数据库连接
    const dbResult = await testDatabaseConnection();
    results.push({ name: '数据库连接', passed: dbResult });
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
  
  // 输出测试结果汇总
  console.log('\n========================================');
  console.log('   测试结果汇总');
  console.log('========================================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name}`);
  });
  
  console.log('\n----------------------------------------');
  console.log(`总计: ${passed}/${total} 测试通过`);
  console.log('----------------------------------------');
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！系统运行正常。');
  } else {
    console.log(`\n⚠️  有 ${total - passed} 个测试失败，请检查系统配置。`);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
