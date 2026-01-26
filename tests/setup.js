// 测试环境设置文件
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'edumaster_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

// 全局测试钩子
beforeAll(() => {
  console.log('🧪 测试环境初始化...');
});

afterAll(() => {
  console.log('✅ 测试环境清理完成');
});

// 每个测试前后的钩子
beforeEach(() => {
  // 可以在这里重置 mock 或清理状态
});

afterEach(() => {
  // 清理测试数据
});
