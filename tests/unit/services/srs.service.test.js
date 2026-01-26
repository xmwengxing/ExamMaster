// SRS 服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as srsService from '../../../src/services/srs.service.js';

describe('SRS 服务 - getSRSRecords', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回用户的 SRS 记录列表', async () => {
    const mockRecords = [
      {
        id: 'srs-1',
        user_id: 'user-1',
        question_id: 'q1',
        interval: 1,
        ease_factor: 2.5,
        repetitions: 1,
        next_review_date: '2024-01-02',
        status: 'active'
      },
      {
        id: 'srs-2',
        user_id: 'user-1',
        question_id: 'q2',
        interval: 6,
        ease_factor: 2.6,
        repetitions: 2,
        next_review_date: '2024-01-08',
        status: 'active'
      }
    ];

    mockDb.getMany.mockResolvedValue(mockRecords);

    const result = await srsService.getSRSRecords(mockDb, 'user-1');

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM srs_records WHERE user_id = $1',
      ['user-1']
    );
    expect(result).toHaveLength(2);
    expect(result[0].question_id).toBe('q1');
  });

  it('应该处理空结果', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await srsService.getSRSRecords(mockDb, 'user-1');

    expect(result).toEqual([]);
  });
});

describe('SRS 服务 - getSRSRecord', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该返回指定的 SRS 记录', async () => {
    const mockRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 1,
      ease_factor: 2.5,
      repetitions: 1,
      next_review_date: '2024-01-02',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(mockRecord);

    const result = await srsService.getSRSRecord(mockDb, 'user-1', 'q1');

    expect(mockDb.getOne).toHaveBeenCalledWith(
      'SELECT * FROM srs_records WHERE user_id = $1 AND question_id = $2',
      ['user-1', 'q1']
    );
    expect(result.question_id).toBe('q1');
  });

  it('应该在记录不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await srsService.getSRSRecord(mockDb, 'user-1', 'non-existent');

    expect(result).toBeNull();
  });
});

describe('SRS 服务 - updateSRSRecord', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该创建新的 SRS 记录（GOOD 级别）', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'GOOD');

    expect(result.userId).toBe('user-1');
    expect(result.questionId).toBe('q1');
    expect(result.interval).toBe(1); // 第一次复习间隔为 1 天
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(2.5);
    expect(mockDb.execute).toHaveBeenCalled();
  });

  it('应该更新现有的 SRS 记录（GOOD 级别，第二次复习）', async () => {
    const existingRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 1,
      ease_factor: 2.5,
      repetitions: 1,
      next_review_date: '2024-01-02',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(existingRecord);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'GOOD');

    expect(result.interval).toBe(6); // 第二次复习间隔为 6 天
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBe(2.5);
  });

  it('应该更新现有的 SRS 记录（GOOD 级别，第三次复习）', async () => {
    const existingRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 6,
      ease_factor: 2.5,
      repetitions: 2,
      next_review_date: '2024-01-08',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(existingRecord);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'GOOD');

    expect(result.interval).toBe(15); // 6 * 2.5 = 15 天
    expect(result.repetitions).toBe(3);
    expect(result.easeFactor).toBe(2.5);
  });

  it('应该处理 HARD 级别（重置复习）', async () => {
    const existingRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 6,
      ease_factor: 2.5,
      repetitions: 2,
      next_review_date: '2024-01-08',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(existingRecord);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'HARD');

    expect(result.interval).toBe(0); // 今天仍需复习
    expect(result.repetitions).toBe(0); // 重置复习次数
    expect(result.easeFactor).toBe(2.3); // 2.5 - 0.2 = 2.3
  });

  it('应该处理 EASY 级别（增加难度因子）', async () => {
    const existingRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 1,
      ease_factor: 2.5,
      repetitions: 1,
      next_review_date: '2024-01-02',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(existingRecord);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'EASY');

    expect(result.interval).toBe(6); // 第二次复习间隔为 6 天
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBe(2.65); // 2.5 + 0.15 = 2.65
  });

  it('应该确保难度因子不低于 1.3', async () => {
    const existingRecord = {
      id: 'srs-1',
      user_id: 'user-1',
      question_id: 'q1',
      interval: 1,
      ease_factor: 1.4,
      repetitions: 1,
      next_review_date: '2024-01-02',
      status: 'active'
    };

    mockDb.getOne.mockResolvedValue(existingRecord);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'HARD');

    expect(result.easeFactor).toBe(1.3); // 不低于 1.3
  });

  it('应该在缺少必需参数时抛出错误', async () => {
    await expect(
      srsService.updateSRSRecord(mockDb, 'user-1', null, 'GOOD')
    ).rejects.toThrow('questionId 和 level 是必需的');

    await expect(
      srsService.updateSRSRecord(mockDb, 'user-1', 'q1', null)
    ).rejects.toThrow('questionId 和 level 是必需的');
  });

  it('应该生成有效的下次复习日期', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await srsService.updateSRSRecord(mockDb, 'user-1', 'q1', 'GOOD');

    expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // 验证日期是明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = tomorrow.toISOString().split('T')[0];
    expect(result.nextReviewDate).toBe(expectedDate);
  });
});
