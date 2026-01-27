/**
 * 日志功能手动验证脚本
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

// 测试登录日志
async function testLoginLogs(token) {
  logSection('测试登录日志功能');
  
  try {
    // 1. 获取登录日志（默认参数）
    let response = await fetch(`${API_BASE}/api/admin/login-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取登录日志（默认参数）',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const logs = await response.json();
      log(`   登录日志数量: ${logs.length}`, 'blue');
      if (logs.length > 0) {
        log(`   最新登录: ${logs[0].phone} (${logs[0].role}) at ${logs[0].time}`, 'blue');
      }
    }
    
    // 2. 获取登录日志（带分页参数）
    response = await fetch(`${API_BASE}/api/admin/login-logs?limit=5&offset=0`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取登录日志（分页参数）',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const logs = await response.json();
      log(`   返回记录数: ${logs.length} (限制: 5)`, 'blue');
    }
    
  } catch (error) {
    log(`登录日志测试失败: ${error.message}`, 'red');
  }
}

// 测试审计日志
async function testAuditLogs(token) {
  logSection('测试审计日志功能');
  
  try {
    // 1. 创建审计日志
    let response = await fetch(`${API_BASE}/api/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: '测试操作',
        target: '测试目标'
      })
    });
    
    logTest(
      '创建审计日志',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const result = await response.json();
      log(`   创建结果: ${JSON.stringify(result)}`, 'blue');
    }
    
    // 2. 获取审计日志（默认参数）
    response = await fetch(`${API_BASE}/api/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取审计日志（默认参数）',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const logs = await response.json();
      log(`   审计日志数量: ${logs.length}`, 'blue');
      if (logs.length > 0) {
        const latest = logs[0];
        log(`   最新操作: ${latest.action} by ${latest.operator_name || latest.operatorName}`, 'blue');
      }
    }
    
    // 3. 获取审计日志（带过滤参数）
    response = await fetch(`${API_BASE}/api/admin/audit-logs?action=测试操作&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest(
      '获取审计日志（过滤参数）',
      response.ok,
      `状态码: ${response.status}`
    );
    
    if (response.ok) {
      const logs = await response.json();
      log(`   过滤后记录数: ${logs.length}`, 'blue');
    }
    
    // 4. 创建审计日志（缺少必填字段）
    response = await fetch(`${API_BASE}/api/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: '测试目标'
        // 缺少 action 字段
      })
    });
    
    logTest(
      '创建审计日志（缺少必填字段）',
      !response.ok && response.status === 400,
      `状态码: ${response.status} (预期: 400)`
    );
    
  } catch (error) {
    log(`审计日志测试失败: ${error.message}`, 'red');
  }
}

// 测试日志数据结构
async function testLogDataStructure(token) {
  logSection('测试日志数据结构');
  
  try {
    // 1. 验证登录日志数据结构
    const loginResponse = await fetch(`${API_BASE}/api/admin/login-logs?limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (loginResponse.ok) {
      const logs = await loginResponse.json();
      if (logs.length > 0) {
        const log = logs[0];
        const hasRequiredFields = log.id && log.user_id && log.phone && log.role && log.time;
        logTest(
          '登录日志包含必需字段',
          hasRequiredFields,
          hasRequiredFields ? '所有必需字段都存在' : '缺少某些必需字段'
        );
        console.log(`   字段: ${Object.keys(log).join(', ')}`);
      }
    }
    
    // 2. 验证审计日志数据结构
    const auditResponse = await fetch(`${API_BASE}/api/admin/audit-logs?limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (auditResponse.ok) {
      const logs = await auditResponse.json();
      if (logs.length > 0) {
        const log = logs[0];
        const hasRequiredFields = log.id && log.action && log.time;
        logTest(
          '审计日志包含必需字段',
          hasRequiredFields,
          hasRequiredFields ? '所有必需字段都存在' : '缺少某些必需字段'
        );
        console.log(`   字段: ${Object.keys(log).join(', ')}`);
      }
    }
    
  } catch (error) {
    log(`数据结构测试失败: ${error.message}`, 'red');
  }
}

// 主测试函数
async function runTests() {
  log('\n🚀 开始日志功能验证\n', 'cyan');
  
  // 登录获取 token
  log('正在登录管理员账号...', 'yellow');
  const adminToken = await login();
  
  if (!adminToken) {
    log('无法获取管理员 token，测试终止', 'red');
    process.exit(1);
  }
  
  log('✅ 管理员登录成功\n', 'green');
  
  // 测试日志功能
  await testLoginLogs(adminToken);
  await testAuditLogs(adminToken);
  await testLogDataStructure(adminToken);
  
  logSection('测试完成');
  log('所有日志功能测试已完成！', 'green');
}

// 运行测试
runTests().catch(error => {
  log(`测试执行失败: ${error.message}`, 'red');
  process.exit(1);
});
