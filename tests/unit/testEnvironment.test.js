// 测试环境验证
import { describe, it, expect } from 'vitest';
import { generateTestToken, createMockRequest, createMockResponse } from '../helpers/testUtils.js';
import { createMockDb, createMockUser } from '../helpers/mockDb.js';

describe('测试环境配置', () => {
  it('应该正确设置环境变量', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-secret-key');
  });
  
  it('应该能够生成测试 token', () => {
    const token = generateTestToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
  
  it('应该能够创建 mock 请求对象', () => {
    const req = createMockRequest({
      body: { test: 'data' },
      params: { id: '123' }
    });
    
    expect(req.body).toEqual({ test: 'data' });
    expect(req.params).toEqual({ id: '123' });
    expect(req.ip).toBe('127.0.0.1');
  });
  
  it('应该能够创建 mock 响应对象', () => {
    const res = createMockResponse();
    
    expect(res.status).toBeDefined();
    expect(res.json).toBeDefined();
    expect(res.send).toBeDefined();
    
    // 测试链式调用
    res.status(200).json({ success: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
  
  it('应该能够创建 mock 数据库对象', () => {
    const db = createMockDb();
    
    expect(db.execute).toBeDefined();
    expect(db.getOne).toBeDefined();
    expect(db.getMany).toBeDefined();
    expect(db.paginate).toBeDefined();
    expect(db.transaction).toBeDefined();
  });
  
  it('应该能够创建 mock 用户数据', () => {
    const user = createMockUser({
      phone: '13900139000',
      nickname: '自定义昵称'
    });
    
    expect(user.id).toBeDefined();
    expect(user.phone).toBe('13900139000');
    expect(user.nickname).toBe('自定义昵称');
    expect(user.role).toBe('STUDENT');
  });
});
