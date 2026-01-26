// 测试工具函数
import jwt from 'jsonwebtoken';

/**
 * 生成测试用的 JWT token
 */
export function generateTestToken(payload = {}) {
  const defaultPayload = {
    id: 'user-123',
    role: 'STUDENT',
    ...payload
  };
  
  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '1h'
  });
}

/**
 * 生成管理员 token
 */
export function generateAdminToken(payload = {}) {
  return generateTestToken({
    id: 'admin-123',
    role: 'ADMIN',
    ...payload
  });
}

/**
 * 创建 Express 请求 mock
 */
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    method: 'GET',
    originalUrl: '/api/test',
    ...overrides
  };
}

/**
 * 创建 Express 响应 mock
 */
export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    statusCode: 200
  };
  return res;
}

/**
 * 创建 Express next 函数 mock
 */
export function createMockNext() {
  return vi.fn();
}

/**
 * 等待异步操作完成
 */
export function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深度克隆对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 比较两个对象是否相等（忽略顺序）
 */
export function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * 生成随机字符串
 */
export function randomString(length = 10) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 生成随机数字
 */
export function randomNumber(min = 0, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 清理测试数据库（如果使用真实数据库）
 */
export async function cleanupTestDatabase(db) {
  // 这里可以添加清理测试数据的逻辑
  // 例如：删除所有测试数据
  console.log('清理测试数据库...');
}

/**
 * 断言错误消息
 */
export function assertErrorMessage(error, expectedMessage) {
  if (error.message !== expectedMessage) {
    throw new Error(`Expected error message "${expectedMessage}", but got "${error.message}"`);
  }
}

/**
 * 断言 HTTP 状态码
 */
export function assertStatusCode(res, expectedCode) {
  const actualCode = res.statusCode || (res.status.mock?.calls?.[0]?.[0]);
  if (actualCode !== expectedCode) {
    throw new Error(`Expected status code ${expectedCode}, but got ${actualCode}`);
  }
}
