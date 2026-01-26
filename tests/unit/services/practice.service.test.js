// 练习服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as practiceService from '../../../src/services/practice.service.js';

describe('练习服务 - getPracticeRecords', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回用户的练习记录列表（camelCase格式）', async () => {
    const mockRecords = [
      {
        id: 'practice-1',
        user_id: 'user-1',
        bank_id: 'bank-1',
        bank_name: '题库1',
        type: 'RANDOM',
        question_type_filter: 'ALL',
        mode: 'PRACTICE',
        count: 10,
        date: '2024-01-01',
        current_index: 5,
        user_answers: { 'q1': 'A' },
        is_custom: false
      }
    ];

    mockDb.getMany.mockResolvedValue(mockRecords);

    const result = await practiceService.getPracticeRecords(mockDb, 'user-1');

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM practice_records WHERE user_id = $1',
      ['user-1']
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'practice-1',
      userId: 'user-1',
      bankId: 'bank-1',
      bankName: '题库1',
      type: 'RANDOM',
      questionTypeFilter: 'ALL',
      mode: 'PRACTICE',
      count: 10,
      date: '2024-01-01',
      currentIndex: 5,
      userAnswers: { 'q1': 'A' },
      isCustom: false
    });
  });

  it('应该处理空结果', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await practiceService.getPracticeRecords(mockDb, 'user-1');

    expect(result).toEqual([]);
  });
});

describe('练习服务 - getPracticeRecordById', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该返回指定的练习记录', async () => {
    const mockRecord = {
      id: 'practice-1',
      user_id: 'user-1',
      bank_id: 'bank-1',
      bank_name: '题库1',
      type: 'RANDOM',
      question_type_filter: 'ALL',
      mode: 'PRACTICE',
      count: 10,
      date: '2024-01-01',
      current_index: 5,
      user_answers: { 'q1': 'A' },
      is_custom: false
    };

    mockDb.getOne.mockResolvedValue(mockRecord);

    const result = await practiceService.getPracticeRecordById(mockDb, 'practice-1', 'user-1');

    expect(mockDb.getOne).toHaveBeenCalledWith(
      'SELECT * FROM practice_records WHERE id = $1 AND user_id = $2',
      ['practice-1', 'user-1']
    );
    expect(result.id).toBe('practice-1');
    expect(result.userId).toBe('user-1');
  });

  it('应该在记录不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await practiceService.getPracticeRecordById(mockDb, 'non-existent', 'user-1');

    expect(result).toBeNull();
  });
});

describe('练习服务 - createPracticeRecord', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功创建练习记录', async () => {
    const practiceData = {
      bankId: 'bank-1',
      bankName: '题库1',
      type: 'RANDOM',
      questionTypeFilter: 'ALL',
      mode: 'PRACTICE',
      count: 10,
      date: '2024-01-01',
      currentIndex: 0,
      userAnswers: {},
      isCustom: false
    };

    const result = await practiceService.createPracticeRecord(mockDb, 'user-1', practiceData);

    expect(result).toMatch(/^practice-\d+$/);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO practice_records'),
      expect.arrayContaining([
        expect.any(String),
        'user-1',
        'bank-1',
        '题库1',
        'RANDOM',
        'ALL',
        'PRACTICE',
        10,
        '2024-01-01',
        0,
        '{}',
        false
      ])
    );
  });

  it('应该使用提供的 ID', async () => {
    const practiceData = {
      id: 'custom-practice-id',
      bankId: 'bank-1',
      bankName: '题库1',
      type: 'RANDOM',
      mode: 'PRACTICE',
      count: 10,
      date: '2024-01-01'
    };

    const result = await practiceService.createPracticeRecord(mockDb, 'user-1', practiceData);

    expect(result).toBe('custom-practice-id');
  });
});

describe('练习服务 - updatePracticeRecord', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新练习记录', async () => {
    mockDb.execute.mockResolvedValue({ rowCount: 1 });

    const updates = {
      currentIndex: 5,
      userAnswers: { 'q1': 'A', 'q2': 'B' },
      date: '2024-01-02'
    };

    const result = await practiceService.updatePracticeRecord(mockDb, 'practice-1', 'user-1', updates);

    expect(result).toBe(1);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE practice_records'),
      [5, '{"q1":"A","q2":"B"}', '2024-01-02', 'practice-1', 'user-1']
    );
  });

  it('应该在没有更新时返回0', async () => {
    mockDb.execute.mockResolvedValue({ rowCount: 0 });

    const updates = {
      currentIndex: 5,
      userAnswers: {}
    };

    const result = await practiceService.updatePracticeRecord(mockDb, 'non-existent', 'user-1', updates);

    expect(result).toBe(0);
  });
});

describe('练习服务 - deletePracticeRecord', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该成功删除练习记录', async () => {
    mockDb.getOne.mockResolvedValue({ id: 'practice-1', user_id: 'user-1' });

    const result = await practiceService.deletePracticeRecord(mockDb, 'practice-1', 'user-1');

    expect(result).toBe(true);
    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM practice_records WHERE id = $1 AND user_id = $2',
      ['practice-1', 'user-1']
    );
  });

  it('应该在记录不存在时返回false', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await practiceService.deletePracticeRecord(mockDb, 'non-existent', 'user-1');

    expect(result).toBe(false);
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('应该验证记录所有权', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await practiceService.deletePracticeRecord(mockDb, 'practice-1', 'wrong-user');

    expect(result).toBe(false);
    expect(mockDb.getOne).toHaveBeenCalledWith(
      'SELECT * FROM practice_records WHERE id = $1 AND user_id = $2',
      ['practice-1', 'wrong-user']
    );
  });
});
