/**
 * 手动功能验证脚本
 * 测试所有新实现的路由功能
 */

const API_BASE = 'http://localhost:3001';

// 测试用户凭证
const STUDENT_CREDENTIALS = {
  phone: 'student1',
  password: 'password123',
  role: 'STUDENT'
};

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
async function login(credentials, role = 'student') {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`登录失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    log(`登录失败 (${role}): ${error.message}`, 'red');
    return null;
  }
}

// 测试错题功能
async function testMistakes(token) {
  logSection('测试错题管理功能');
  
  try {
    // 1. 获取错题列表
    let response = await fetch(`${API_BASE}/api/mistakes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取错题列表',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const mistakes = await response.json();
      log(`   当前错题数量: ${mistakes.length}`, 'blue');
    }
    
    // 2. 添加错题
    response = await fetch(`${API_BASE}/api/mistakes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionId: 'test-q-1' })
    });
    
    logTest(
      '添加错题',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const result = await response.json();
      log(`   添加结果: ${JSON.stringify(result)}`, 'blue');
    }
    
    // 3. 验证错题已添加
    response = await fetch(`${API_BASE}/api/mistakes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const mistakes = await response.json();
      const found = mistakes.some(m => 
        m.question_id === 'test-q-1' || 
        m.questionId === 'test-q-1' ||
        m.id === 'test-q-1'
      );
      logTest(
        '验证错题已添加',
        found,
        found ? '错题已成功添加到列表' : `未找到刚添加的错题（返回 ${mistakes.length} 条记录）`
      );
      if (!found && mistakes.length > 0) {
        log(`   第一条记录的字段: ${Object.keys(mistakes[0]).join(', ')}`, 'blue');
      }
    }
    
  } catch (error) {
    log(`错题测试失败: ${error.message}`, 'red');
  }
}

// 测试收藏功能
async function testFavorites(token) {
  logSection('测试收藏管理功能');
  
  try {
    // 1. 获取收藏列表
    let response = await fetch(`${API_BASE}/api/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取收藏列表',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const favorites = await response.json();
      log(`   当前收藏数量: ${favorites.length}`, 'blue');
    }
    
    // 2. 切换收藏（添加）
    response = await fetch(`${API_BASE}/api/favorites/test-q-2`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '切换收藏状态（添加）',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const result = await response.json();
      log(`   切换结果: ${JSON.stringify(result)}`, 'blue');
    }
    
    // 3. 验证收藏已添加
    response = await fetch(`${API_BASE}/api/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const favorites = await response.json();
      const found = favorites.some(f => 
        f.question_id === 'test-q-2' || 
        f.questionId === 'test-q-2' ||
        f.id === 'test-q-2'
      );
      logTest(
        '验证收藏已添加',
        found,
        found ? '收藏已成功添加到列表' : `未找到刚添加的收藏（返回 ${favorites.length} 条记录）`
      );
      if (!found && favorites.length > 0) {
        log(`   第一条记录的字段: ${Object.keys(favorites[0]).join(', ')}`, 'blue');
      }
    }
    
    // 4. 切换收藏（取消）
    response = await fetch(`${API_BASE}/api/favorites/test-q-2`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '切换收藏状态（取消）',
      response.ok,
      `状态码: ${response.status}`
    );
    
  } catch (error) {
    log(`收藏测试失败: ${error.message}`, 'red');
  }
}

// 测试笔记功能
async function testNotes(token) {
  logSection('测试笔记管理功能');
  
  try {
    // 1. 保存笔记
    let response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: 'test-q-3',
        content: '这是一条测试笔记'
      })
    });
    
    logTest(
      '保存笔记',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const result = await response.json();
      log(`   保存结果: ${JSON.stringify(result)}`, 'blue');
    }
    
    // 2. 查询笔记
    response = await fetch(`${API_BASE}/api/notes/test-q-3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '查询笔记',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const note = await response.json();
      log(`   笔记内容: ${note?.content || '无'}`, 'blue');
      logTest(
        '验证笔记内容',
        note?.content === '这是一条测试笔记',
        note?.content === '这是一条测试笔记' ? '笔记内容正确' : '笔记内容不匹配'
      );
    }
    
    // 3. 更新笔记
    response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: 'test-q-3',
        content: '这是更新后的笔记'
      })
    });
    
    logTest(
      '更新笔记',
      response.ok,
      `状态码: ${response.status}`
    );
    
    // 4. 删除笔记（空内容）
    response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: 'test-q-3',
        content: ''
      })
    });
    
    logTest(
      '删除笔记（空内容）',
      response.ok,
      `状态码: ${response.status}`
    );
    
  } catch (error) {
    log(`笔记测试失败: ${error.message}`, 'red');
  }
}

// 测试 SRS 功能
async function testSRS(token) {
  logSection('测试 SRS 记录功能');
  
  try {
    // 1. 获取 SRS 记录
    const response = await fetch(`${API_BASE}/api/srs/records`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取 SRS 记录',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const records = await response.json();
      log(`   当前 SRS 记录数量: ${records.length}`, 'blue');
    }
    
  } catch (error) {
    log(`SRS 测试失败: ${error.message}`, 'red');
  }
}

// 测试未认证访问（应该返回 401）
async function testUnauthorized() {
  logSection('测试未认证访问（预期 401）');
  
  const endpoints = [
    '/api/mistakes',
    '/api/favorites',
    '/api/notes/test-q-1',
    '/api/srs/records'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      logTest(
        `${endpoint}`,
        response.status === 401,
        `状态码: ${response.status} (预期: 401)`
      );
    } catch (error) {
      log(`测试失败: ${error.message}`, 'red');
    }
  }
}

// 主测试函数
async function runTests() {
  log('\n🚀 开始手动功能验证\n', 'cyan');
  
  // 登录获取 token
  log('正在登录学员账号...', 'yellow');
  const studentToken = await login(STUDENT_CREDENTIALS, 'student');
  
  if (!studentToken) {
    log('无法获取学员 token，跳过学员功能测试', 'red');
  } else {
    log('✅ 学员登录成功\n', 'green');
    
    // 测试核心功能
    await testMistakes(studentToken);
    await testFavorites(studentToken);
    await testNotes(studentToken);
    await testSRS(studentToken);
  }
  
  // 测试未认证访问
  await testUnauthorized();
  
  logSection('测试完成');
  log('所有核心功能测试已完成！', 'green');
}

// 运行测试
runTests().catch(error => {
  log(`测试执行失败: ${error.message}`, 'red');
  process.exit(1);
});
