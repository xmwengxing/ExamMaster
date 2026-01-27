// 错题服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as mistakeService from '../../../src/services/mistake.service.js';

describe('错题服务 - getUserMistakes', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该返回用户的错题列表', async () => {
    const mockQuestions = [
      {
        id: 'q-1',
        bank_id: 'bank-1',
        type: 'SINGLE',
        content: '错题1',
        options: ['A', 'B', 'C', 'D'],
        answer: 'A',
        explanation: '解析1',
        chapter: null,
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: false,
        tags: null,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: 'q-2',
        bank_id: 'bank-1',
        type: 'MULTIPLE',
        content: '错题2',
        options: ['A', 'B', 'C', 'D'],
        answer: ['A', 'B'],
        explanation: '解析2',
        chapter: null,
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: false,
        tags: null,
        sort_order: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    mockDb.getMany.mockResolvedValue(mockQuestions);

    const result = await mistakeService.getUserMistakes(mockDb, 'user-1');

    expect(mockDb.getMany).toHaveBeenCalledWith(
      expect.stringContaining('SELECT q.* FROM questions q'),
      ['user-1']
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('q-1');
    expect(result[0].bankId).toBe('bank-1');
    expect(result[1].id).toBe('q-2');
  });

  it('应该返回空数组当用户没有错题时', async () => {
    mockDb.getMany.mockResolvedValue([]);

    const result = await mistakeService.getUserMistakes(mockDb, 'user-1');

    expect(result).toEqual([]);
  });

  it('应该正确解析题目字段', async () => {
    const mockQuestions = [
      {
        id: 'q-1',
        bank_id: 'bank-1',
        type: 'SINGLE',
        content: '测试题目',
        options: JSON.stringify(['选项A', '选项B']),
        answer: JSON.stringify('A'),
        explanation: '测试解析',
        chapter: '第一章',
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: true,
        tags: ['tag-1'],
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    mockDb.getMany.mockResolvedValue(mockQuestions);

    const result = await mistakeService.getUserMistakes(mockDb, 'user-1');

    expect(result[0].options).toEqual(['选项A', '选项B']);
    expect(result[0].answer).toBe('A');
    expect(result[0].aiGradingEnabled).toBe(true);
  });
});

describe('错题服务 - addMistake', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该成功添加新错题', async () => {
    mockDb.getOne.mockResolvedValue(null); // 不存在
    mockDb.execute.mockResolvedValue({ rowCount: 1 });

    const result = await mistakeService.addMistake(mockDb, 'user-1', 'q-1');

    expect(mockDb.getOne).toHaveBeenCalledWith(
      'SELECT * FROM mistakes WHERE user_id = $1 AND question_id = $2',
      ['user-1', 'q-1']
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO mistakes (user_id, question_id) VALUES ($1, $2)',
      ['user-1', 'q-1']
    );
    expect(result).toEqual({ success: true, added: true });
  });

  it('应该不重复添加已存在的错题（幂等性）', async () => {
    mockDb.getOne.mockResolvedValue({ user_id: 'user-1', question_id: 'q-1' }); // 已存在

    const result = await mistakeService.addMistake(mockDb, 'user-1', 'q-1');

    expect(mockDb.getOne).toHaveBeenCalled();
    expect(mockDb.execute).not.toHaveBeenCalled(); // 不应该执行插入
    expect(result).toEqual({ success: true, added: false });
  });

  it('应该在题目ID为空时抛出错误', async () => {
    await expect(mistakeService.addMistake(mockDb, 'user-1', '')).rejects.toThrow('题目ID不能为空');
    await expect(mistakeService.addMistake(mockDb, 'user-1', null)).rejects.toThrow('题目ID不能为空');
  });

  it('应该支持多次添加同一题目（幂等性测试）', async () => {
    // 第一次添加
    mockDb.getOne.mockResolvedValueOnce(null);
    mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
    
    const result1 = await mistakeService.addMistake(mockDb, 'user-1', 'q-1');
    expect(result1).toEqual({ success: true, added: true });

    // 第二次添加（已存在）
    mockDb.getOne.mockResolvedValueOnce({ user_id: 'user-1', question_id: 'q-1' });
    
    const result2 = await mistakeService.addMistake(mockDb, 'user-1', 'q-1');
    expect(result2).toEqual({ success: true, added: false });

    // 第三次添加（仍然已存在）
    mockDb.getOne.mockResolvedValueOnce({ user_id: 'user-1', question_id: 'q-1' });
    
    const result3 = await mistakeService.addMistake(mockDb, 'user-1', 'q-1');
    expect(result3).toEqual({ success: true, added: false });
  });
});

describe('错题服务 - 属性测试', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('属性 5：错题添加的幂等性 - 多次添加只产生一条记录', async () => {
    // 验证：需求 6.3
    // 对于任何题目，多次添加到错题集的操作应该只产生一条记录，不会重复添加

    const userId = 'user-test';
    const questionId = 'q-test';

    // 模拟第一次添加（不存在）
    mockDb.getOne.mockResolvedValueOnce(null);
    mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
    
    const firstAdd = await mistakeService.addMistake(mockDb, userId, questionId);
    expect(firstAdd.added).toBe(true);

    // 模拟第二次添加（已存在）
    mockDb.getOne.mockResolvedValueOnce({ user_id: userId, question_id: questionId });
    
    const secondAdd = await mistakeService.addMistake(mockDb, userId, questionId);
    expect(secondAdd.added).toBe(false);
    expect(secondAdd.success).toBe(true);

    // 验证只执行了一次插入操作
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });

  it('属性 1：用户数据隔离 - 只返回当前用户的错题', async () => {
    // 验证：需求 6.1
    // 对于任何学员用户，查询错题时应该只返回该用户自己的数据

    const mockQuestions = [
      {
        id: 'q-1',
        bank_id: 'bank-1',
        type: 'SINGLE',
        content: '用户1的错题',
        options: ['A', 'B'],
        answer: 'A',
        explanation: '',
        chapter: null,
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: false,
        tags: null,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    mockDb.getMany.mockResolvedValue(mockQuestions);

    const result = await mistakeService.getUserMistakes(mockDb, 'user-1');

    // 验证查询时使用了用户ID过滤
    expect(mockDb.getMany).toHaveBeenCalledWith(
      expect.stringContaining('WHERE m.user_id = $1'),
      ['user-1']
    );
    
    // 验证返回的数据
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q-1');
  });
});
