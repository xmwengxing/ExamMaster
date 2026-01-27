// 生产环境简化验证脚本
import https from 'https';

const BASE_URL = 'https://exammaster.zzzjl.com';

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

async function verify() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     生产环境验证                       ║');
  console.log('╚════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. 健康检查
    console.log('[1/5] 健康检查...');
    const health = await request('/api/health');
    if (health.status === 200 && health.data?.status === 'healthy') {
      console.log('✅ 健康检查通过');
      console.log(`   - 状态: ${health.data.status}`);
      console.log(`   - 数据库: ${health.data.database}`);
      passed++;
    } else {
      console.log('❌ 健康检查失败');
      failed++;
    }

    // 2. 测试未授权访问（应该返回401）
    console.log('\n[2/5] 测试权限控制...');
    const unauthorized = await request('/api/mistakes');
    if (unauthorized.status === 401) {
      console.log('✅ 权限控制正常（未授权访问被拒绝）');
      passed++;
    } else {
      console.log(`❌ 权限控制异常（状态码: ${unauthorized.status}）`);
      failed++;
    }

    // 3. 测试错题路由存在
    console.log('\n[3/5] 测试错题路由...');
    const mistakes = await request('/api/mistakes');
    if (unauthorized.status === 401) {
      console.log('✅ 错题路由已注册');
      passed++;
    } else {
      console.log(`❌ 错题路由异常（状态码: ${mistakes.status}）`);
      failed++;
    }

    // 4. 测试收藏路由存在
    console.log('\n[4/5] 测试收藏路由...');
    const favorites = await request('/api/favorites');
    if (favorites.status === 401) {
      console.log('✅ 收藏路由已注册');
      passed++;
    } else {
      console.log(`❌ 收藏路由异常（状态码: ${favorites.status}）`);
      failed++;
    }

    // 5. 测试SRS路由存在
    console.log('\n[5/5] 测试SRS路由...');
    const srs = await request('/api/srs/records');
    if (srs.status === 401) {
      console.log('✅ SRS路由已注册');
      passed++;
    } else {
      console.log(`❌ SRS路由异常（状态码: ${srs.status}）`);
      failed++;
    }

  } catch (error) {
    console.error('\n❌ 验证过程出错:', error.message);
    failed++;
  }

  // 输出总结
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     验证总结                           ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`总测试数: ${passed + failed}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  if (passed === 5) {
    console.log('🎉 生产环境验证通过！所有新增路由已正确部署。\n');
    return 0;
  } else {
    console.log('⚠️  部分验证失败，请检查服务器日志。\n');
    return 1;
  }
}

verify().then(code => process.exit(code));
