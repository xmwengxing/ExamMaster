// 生产环境验证脚本
import https from 'https';

const BASE_URL = 'https://exammaster.zzzjl.com';

// 测试用户凭证（需要先在生产环境创建）
const TEST_USER = {
  username: 'test_user_prod',
  password: 'Test123456'
};

const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123'
};

// HTTP 请求辅助函数
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// 测试结果统计
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${message ? ': ' + message : ''}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     生产环境验证测试                   ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 1. 健康检查
    console.log('[1/8] 健康检查...');
    const health = await request('/api/health');
    logTest('健康检查', health.status === 200 && health.data?.status === 'healthy');

    // 2. 用户登录
    console.log('\n[2/8] 用户认证...');
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: TEST_USER
    });
    
    if (login.status === 200 && login.data?.token) {
      logTest('用户登录', true);
      const userToken = login.data.token;

      // 3. 测试错题API
      console.log('\n[3/8] 测试错题功能...');
      const mistakes = await request('/api/mistakes', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      logTest('获取错题列表', mistakes.status === 200);

      // 4. 测试收藏API
      console.log('\n[4/8] 测试收藏功能...');
      const favorites = await request('/api/favorites', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      logTest('获取收藏列表', favorites.status === 200);

      // 5. 测试SRS API
      console.log('\n[5/8] 测试SRS功能...');
      const srs = await request('/api/srs/records', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      logTest('获取SRS记录', srs.status === 200);

      // 6. 测试未授权访问
      console.log('\n[6/8] 测试权限控制...');
      const unauthorized = await request('/api/mistakes');
      logTest('未授权访问被拒绝', unauthorized.status === 401);

    } else {
      logTest('用户登录', false, `状态码: ${login.status}`);
      console.log('⚠️  跳过需要认证的测试');
    }

    // 7. 管理员登录
    console.log('\n[7/8] 管理员认证...');
    const adminLogin = await request('/api/auth/admin/login', {
      method: 'POST',
      body: TEST_ADMIN
    });

    if (adminLogin.status === 200 && adminLogin.data?.token) {
      logTest('管理员登录', true);
      const adminToken = adminLogin.data.token;

      // 8. 测试管理员API
      console.log('\n[8/8] 测试管理员功能...');
      const admins = await request('/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('获取管理员列表', admins.status === 200);

      const examHistory = await request('/api/admin/exam-history', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('获取考试历史', examHistory.status === 200);

      const loginLogs = await request('/api/admin/login-logs', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('获取登录日志', loginLogs.status === 200);

    } else {
      logTest('管理员登录', false, `状态码: ${adminLogin.status}`);
      console.log('⚠️  跳过管理员功能测试');
    }

  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
  }

  // 输出测试总结
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     测试总结                           ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`总测试数: ${results.passed + results.failed}`);
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.failed > 0) {
    console.log('失败的测试:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}${t.message ? ': ' + t.message : ''}`);
    });
    console.log();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests();
