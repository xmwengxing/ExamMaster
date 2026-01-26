// 用户服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bcryptjs（必须在导入服务之前）
vi.mock('bcryptjs', () => {
  const mockCompareSync = vi.fn();
  const mockHashSync = vi.fn();
  
  return {
    default: {
      compareSync: mockCompareSync,
      hashSync: mockHashSync
    },
    compareSync: mockCompareSync,
    hashSync: mockHashSync
  };
});

// 导入服务和 bcrypt
const userService = await import('../../../src/services/user.service.js');
const bcryptModule = await import('bcryptjs');
const bcrypt = bcryptModule.default;

describe('用户服务 - getUserProfile', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该返回用户资料（camelCase格式）', async () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      role: 'STUDENT',
      nickname: '测试用户',
      avatar: 'avatar.jpg',
      gender: 'male',
      school: '测试学校',
      major: '计算机',
      company: '测试公司',
      accuracy: 85.5,
      real_name: '张三',
      id_card: '123456789012345678',
      education_type: '本科',
      education_level: '大学',
      class_name: '2024级1班',
      student_perms: ['exam', 'practice'],
      allowed_bank_ids: [1, 2, 3],
      last_login: '2024-01-01T00:00:00Z',
      last_activity: '2024-01-01T12:00:00Z',
      login_history: [{ time: '2024-01-01T00:00:00Z' }],
      deepseek_api_key: 'test-key',
      total_online_time: 3600,
      custom_fields: { field1: 'value1' },
      mistake_count: 10,
      daily_goal: 30,
      password: 'hashed_password'
    };

    mockDb.getOne.mockResolvedValue(mockUser);

    const result = await userService.getUserProfile(mockDb, 1);

    expect(mockDb.getOne).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    expect(result).toEqual({
      id: 1,
      phone: '13800138000',
      role: 'STUDENT',
      nickname: '测试用户',
      avatar: 'avatar.jpg',
      gender: 'male',
      school: '测试学校',
      major: '计算机',
      company: '测试公司',
      accuracy: 85.5,
      realName: '张三',
      idCard: '123456789012345678',
      educationType: '本科',
      educationLevel: '大学',
      className: '2024级1班',
      studentPerms: ['exam', 'practice'],
      allowedBankIds: [1, 2, 3],
      lastLogin: '2024-01-01T00:00:00Z',
      lastActivity: '2024-01-01T12:00:00Z',
      loginHistory: [{ time: '2024-01-01T00:00:00Z' }],
      deepseekApiKey: 'test-key',
      totalOnlineTime: 3600,
      customFields: { field1: 'value1' },
      mistakeCount: 10,
      dailyGoal: 30
    });
    // 确保不返回密码
    expect(result.password).toBeUndefined();
  });

  it('应该处理空数组字段的默认值', async () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      role: 'STUDENT',
      nickname: '测试用户',
      accuracy: 0,
      real_name: null,
      id_card: null,
      education_type: null,
      education_level: null,
      class_name: null,
      student_perms: null,
      allowed_bank_ids: null,
      last_login: null,
      last_activity: null,
      login_history: null,
      deepseek_api_key: null,
      total_online_time: null,
      custom_fields: null,
      mistake_count: null,
      daily_goal: null
    };

    mockDb.getOne.mockResolvedValue(mockUser);

    const result = await userService.getUserProfile(mockDb, 1);

    expect(result.studentPerms).toEqual([]);
    expect(result.allowedBankIds).toEqual([]);
    expect(result.loginHistory).toEqual([]);
    expect(result.totalOnlineTime).toBe(0);
    expect(result.customFields).toEqual({});
    expect(result.mistakeCount).toBe(0);
    expect(result.dailyGoal).toBe(20);
  });

  it('应该在用户不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await userService.getUserProfile(mockDb, 999);

    expect(result).toBeNull();
  });
});

describe('用户服务 - updateUserProfile', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该更新用户资料', async () => {
    const updates = {
      nickname: '新昵称',
      school: '新学校',
      daily_goal: 50
    };

    await userService.updateUserProfile(mockDb, 1, updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE users SET nickname = $1, school = $2, daily_goal = $3 WHERE id = $4',
      ['新昵称', '新学校', 50, 1]
    );
  });

  it('应该处理JSON对象字段', async () => {
    const updates = {
      custom_fields: { key: 'value' },
      student_perms: ['perm1', 'perm2']
    };

    await userService.updateUserProfile(mockDb, 1, updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE users SET custom_fields = $1, student_perms = $2 WHERE id = $3',
      ['{"key":"value"}', '["perm1","perm2"]', 1]
    );
  });

  it('应该过滤掉id字段', async () => {
    const updates = {
      id: 999,
      nickname: '新昵称'
    };

    await userService.updateUserProfile(mockDb, 1, updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE users SET nickname = $1 WHERE id = $2',
      ['新昵称', 1]
    );
  });

  it('应该在没有更新字段时不执行查询', async () => {
    await userService.updateUserProfile(mockDb, 1, {});

    expect(mockDb.execute).not.toHaveBeenCalled();
  });
});

describe('用户服务 - changePassword', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
    // 重置 mock 调用记录，但不清除实现
    vi.clearAllMocks();
  });

  it('应该成功修改密码', async () => {
    const mockUser = {
      id: 1,
      password: 'old_hashed_password'
    };

    mockDb.getOne.mockResolvedValue(mockUser);
    // 在测试中设置 bcrypt mock 的返回值
    bcrypt.compareSync.mockReturnValueOnce(true);
    bcrypt.hashSync.mockReturnValueOnce('new_hashed_password');

    const result = await userService.changePassword(mockDb, 1, 'oldPass', 'newPass');

    expect(result).toEqual({ success: true });
    expect(mockDb.getOne).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE users SET password = $1 WHERE id = $2',
      ['new_hashed_password', 1]
    );
  });

  it('应该在缺少旧密码时返回错误', async () => {
    const result = await userService.changePassword(mockDb, 1, '', 'newPass');

    expect(result).toEqual({ success: false, error: '请提供旧密码和新密码' });
    expect(mockDb.getOne).not.toHaveBeenCalled();
  });

  it('应该在缺少新密码时返回错误', async () => {
    const result = await userService.changePassword(mockDb, 1, 'oldPass', '');

    expect(result).toEqual({ success: false, error: '请提供旧密码和新密码' });
    expect(mockDb.getOne).not.toHaveBeenCalled();
  });

  it('应该在新密码太短时返回错误', async () => {
    const result = await userService.changePassword(mockDb, 1, 'oldPass', '123');

    expect(result).toEqual({ success: false, error: '新密码长度至少为4位' });
    expect(mockDb.getOne).not.toHaveBeenCalled();
  });

  it('应该在用户不存在时返回错误', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await userService.changePassword(mockDb, 999, 'oldPass', 'newPass');

    expect(result).toEqual({ success: false, error: '用户不存在' });
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('应该在旧密码不正确时返回错误', async () => {
    const mockUser = {
      id: 1,
      password: 'old_hashed_password'
    };

    mockDb.getOne.mockResolvedValue(mockUser);
    bcrypt.compareSync.mockReturnValueOnce(false);

    const result = await userService.changePassword(mockDb, 1, 'wrongPass', 'newPass');

    expect(result).toEqual({ success: false, error: '旧密码不正确' });
    expect(mockDb.execute).not.toHaveBeenCalled();
  });
});

describe('用户服务 - updateLastActivity', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该更新最后活动时间', async () => {
    const result = await userService.updateLastActivity(mockDb, 1);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE users SET last_activity = $1 WHERE id = $2',
      [expect.any(String), 1]
    );
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('用户服务 - resetUserData', () => {
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
    mockDb = {
      transaction: vi.fn(async (callback) => {
        return await callback(mockClient);
      })
    };
  });

  it('应该重置用户学习数据', async () => {
    const result = await userService.resetUserData(mockDb, 1);

    expect(result).toEqual({ success: true, clearedTables: 10 });
    
    // 验证删除了所有表的数据
    const expectedTables = [
      'practice_records',
      'exam_history',
      'mistakes',
      'favorites',
      'notes',
      'srs_records',
      'daily_progress',
      'practical_records',
      'discussion_likes',
      'comments'
    ];

    expectedTables.forEach((table) => {
      expect(mockClient.query).toHaveBeenCalledWith(
        `DELETE FROM ${table} WHERE user_id = $1`,
        [1]
      );
    });

    // 验证重置了用户统计数据
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE users SET accuracy = 0, mistake_count = 0, daily_goal = 20 WHERE id = $1',
      [1]
    );
  });
});

describe('用户服务 - getUserProgress', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回用户进度记录', async () => {
    const mockProgress = [
      { id: '1_2024-01-01', user_id: 1, date: '2024-01-01', count: 10 },
      { id: '1_2024-01-02', user_id: 1, date: '2024-01-02', count: 15 }
    ];

    mockDb.getMany.mockResolvedValue(mockProgress);

    const result = await userService.getUserProgress(mockDb, 1);

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM daily_progress WHERE user_id = $1',
      [1]
    );
    expect(result).toEqual(mockProgress);
  });

  it('应该在没有进度记录时返回空数组', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await userService.getUserProgress(mockDb, 1);

    expect(result).toEqual([]);
  });
});

describe('用户服务 - incrementDailyProgress', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该在记录存在时增加计数', async () => {
    const mockProgress = { id: '1_2024-01-01', count: 10 };
    mockDb.getOne.mockResolvedValue(mockProgress);

    await userService.incrementDailyProgress(mockDb, 1);

    const today = new Date().toISOString().split('T')[0];
    const id = `1_${today}`;

    expect(mockDb.getOne).toHaveBeenCalledWith(
      'SELECT * FROM daily_progress WHERE id = $1',
      [id]
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE daily_progress SET count = count + 1 WHERE id = $1',
      [id]
    );
  });

  it('应该在记录不存在时创建新记录', async () => {
    mockDb.getOne.mockResolvedValue(null);

    await userService.incrementDailyProgress(mockDb, 1);

    const today = new Date().toISOString().split('T')[0];
    const id = `1_${today}`;

    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO daily_progress (id, user_id, date, count) VALUES ($1, $2, $3, 1)',
      [id, 1, today]
    );
  });
});

describe('用户服务 - getAllUsersProgress', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回所有用户的进度记录', async () => {
    const mockProgress = [
      { id: '1_2024-01-02', user_id: 1, date: '2024-01-02', count: 15 },
      { id: '2_2024-01-02', user_id: 2, date: '2024-01-02', count: 20 },
      { id: '1_2024-01-01', user_id: 1, date: '2024-01-01', count: 10 }
    ];

    mockDb.getMany.mockResolvedValue(mockProgress);

    const result = await userService.getAllUsersProgress(mockDb);

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM daily_progress ORDER BY date DESC'
    );
    expect(result).toEqual(mockProgress);
  });

  it('应该在没有进度记录时返回空数组', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await userService.getAllUsersProgress(mockDb);

    expect(result).toEqual([]);
  });
});
