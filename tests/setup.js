// 测试环境设置文件
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// 使用与开发环境相同的数据库配置
// 这样可以避免需要单独配置测试数据库
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5434';  // 使用开发环境的端口
process.env.DB_NAME = 'edumaster';  // 使用开发环境的数据库
process.env.DB_USER = 'edumaster_user';  // 使用开发环境的用户
process.env.DB_PASSWORD = 'Tkl@s,dla=~7Jsa.40a1ebEp9V)OS1>B';  // 使用开发环境的密码

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
