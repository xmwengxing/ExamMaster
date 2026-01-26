/**
 * 分页功能测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../db.js';

describe('分页查询功能测试', () => {
  beforeAll(async () => {
    // 确保数据库连接正常
    await db.query('SELECT 1');
  });

  afterAll(async () => {
    // 关闭数据库连接
    await db.closePool();
  });

  it('应该能够分页查询数据', async () => {
    const result = await db.paginate('users', {
      page: 1,
      pageSize: 10,
      orderBy: 'created_at DESC'
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('totalPages');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('应该能够使用 WHERE 条件分页查询', async () => {
    const result = await db.paginate('users', {
      page: 1,
      pageSize: 5,
      where: "role = 'STUDENT'",
      params: [],
      orderBy: 'created_at DESC'
    });

    expect(result.data.length).toBeLessThanOrEqual(5);
    result.data.forEach(user => {
      expect(user.role).toBe('STUDENT');
    });
  });

  it('应该正确计算总页数', async () => {
    const result = await db.paginate('users', {
      page: 1,
      pageSize: 10
    });

    const expectedTotalPages = Math.ceil(result.total / 10);
    expect(result.totalPages).toBe(expectedTotalPages);
  });
});
