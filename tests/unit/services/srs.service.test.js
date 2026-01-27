// SRS 服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSRSRecords, getSRSRecord, updateSRSRecord } from '../../../src/services/srs.service.js';

let mockDb;

describe('SRS 服务单元测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  describe('getSRSRecords', () => {
    it('应该返回用户的 SRS 记录列表', async () => {
      const mockRecords = [
        {
          id: 'srs-1',
          user_id: 'user-1',
          question_id: 'q-1',
          interval: 1,
          ease_factor: 2.5,
          repetitions: 1,
          next_review_date: '2024-01-02',
          status: 'active'
        },
        {
          id: 'srs-2',
          user_id: 'user-1',
          question_id: 'q-2',
          interval: 6,
          ease_factor: 2.5,
          repetitions: 2,
          next_review_date: '2024-01-08',
          status: 'active'
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockRecords);
      
      const result = await getSRSRecords(mockDb, 'user-1');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('srs-1');
      expect(result[1].id).toBe('srs-2');
      
      // 验证查询使用了正确的参数
      expect(mockDb.getMany).toHaveBeenCalledWith(
        'SELECT * FROM srs_records WHERE user_id = $1',
        ['user-1']
      );
    });

    it('应该返回空数组当用户没有 SRS 记录时', async () => {
      mockDb.getMany.mockResolvedValue([]);
      
      const result = await getSRSRecords(mockDb, 'user-1');
      
      expect(result).toEqual([]);
    });

    it('应该处理 null 返回值', async () => {
      mockDb.getMany.mockResolvedValue(null);
      
      const result = await getSRSRecords(mockDb, 'user-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('getSRSRecord', () => {
    it('应该返回单个 SRS 记录', async () => {
      const mockRecord = {
        id: 'srs-1',
        user_id: 'user-1',
        question_id: 'q-1',
        interval: 1,
        ease_factor: 2.5,
        repetitions: 1,
        next_review_date: '2024-01-02',
        status: 'active'
      };
      
      mockDb.getOne.mockResolvedValue(mockRecord);
      
      const result = await getSRSRecord(mockDb, 'user-1', 'q-1');
      
      expect(result).toEqual(mockRecord);
      expect(mockDb.getOne).toHaveBeenCalledWith(
        'SELECT * FROM srs_records WHERE user_id = $1 AND question_id = $2',
        ['user-1', 'q-1']
      );
    });

    it('应该返回 null 当记录不存在时', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      const result = await getSRSRecord(mockDb, 'user-1', 'q-1');
      
      expect(result).toBeNull();
    });
  });

  describe('updateSRSRecord', () => {
    it('应该创建新的 SRS 记录（GOOD）', async () => {
      mockDb.getOne.mockResolvedValue(null); // 不存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await updateSRSRecord(mockDb, 'user-1', 'q-1', 'GOOD');
      
      expect(result.userId).toBe('user-1');
      expect(result.questionId).toBe('q-1');
      expect(result.interval).toBe(1); // 第一次复习间隔为 1 天
      expect(result.easeFactor).toBe(2.5);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe('active');
      
      // 验证执行了插入操作
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO srs_records'),
        expect.any(Array)
      );
    });

    it('应该更新已有的 SRS 记录（GOOD）', async () => {
      const existingRecord = {
        id: 'srs-1',
        user_id: 'user-1',
        question_id: 'q-1',
        interval: 1,
        ease_factor: 2.5,
        repetitions: 1,
        next_review_date: '2024-01-02',
        status: 'active'
      };
      
      mockDb.getOne.mockResolvedValue(existingRecord);
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await updateSRSRecord(mockDb, 'user-1', 'q-1', 'GOOD');
      
      expect(result.interval).toBe(6); // 第二次复习间隔为 6 天
      expect(result.repetitions).toBe(2);
    });

    it('应该处理 HARD 级别（重置间隔）', async () => {
      const existingRecord = {
        id: 'srs-1',
        user_id: 'user-1',
        question_id: 'q-1',
        interval: 6,
        ease_factor: 2.5,
        repetitions: 2,
        next_review_date: '2024-01-08',
        status: 'active'
      };
      
      mockDb.getOne.mockResolvedValue(existingRecord);
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await updateSRSRecord(mockDb, 'user-1', 'q-1', 'HARD');
      
      expect(result.interval).toBe(0); // HARD 级别间隔为 0（今天仍需复习）
      expect(result.repetitions).toBe(0); // 重置重复次数
      expect(result.easeFactor).toBeLessThan(2.5); // 降低难度系数
    });

    it('应该处理 EASY 级别（增加难度系数）', async () => {
      mockDb.getOne.mockResolvedValue(null);
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await updateSRSRecord(mockDb, 'user-1', 'q-1', 'EASY');
      
      expect(result.interval).toBe(1); // 第一次复习间隔为 1 天
      expect(result.easeFactor).toBeGreaterThan(2.5); // 增加难度系数
      expect(result.repetitions).toBe(1);
    });

    it('属性 7：SRS 间隔计算的单调性 - GOOD/EASY 时间隔应该增加', async () => {
      // 验证：需求 5.2, 5.3
      // 对于任何 SRS 记录，使用 GOOD 或 EASY 反馈时，下次复习间隔应该大于等于当前间隔
      
      // 第一次复习（GOOD）
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result1 = await updateSRSRecord(mockDb, 'user-1', 'q-test', 'GOOD');
      const interval1 = result1.interval;
      expect(interval1).toBe(1);
      
      // 第二次复习（GOOD）
      mockDb.getOne.mockResolvedValueOnce({
        id: result1.id,
        user_id: 'user-1',
        question_id: 'q-test',
        interval: interval1,
        ease_factor: result1.easeFactor,
        repetitions: result1.repetitions,
        next_review_date: result1.nextReviewDate,
        status: 'active'
      });
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result2 = await updateSRSRecord(mockDb, 'user-1', 'q-test', 'GOOD');
      const interval2 = result2.interval;
      expect(interval2).toBeGreaterThan(interval1); // 间隔应该增加
      expect(interval2).toBe(6);
      
      // 第三次复习（GOOD）
      mockDb.getOne.mockResolvedValueOnce({
        id: result2.id,
        user_id: 'user-1',
        question_id: 'q-test',
        interval: interval2,
        ease_factor: result2.easeFactor,
        repetitions: result2.repetitions,
        next_review_date: result2.nextReviewDate,
        status: 'active'
      });
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result3 = await updateSRSRecord(mockDb, 'user-1', 'q-test', 'GOOD');
      const interval3 = result3.interval;
      expect(interval3).toBeGreaterThan(interval2); // 间隔继续增加
    });

    it('应该拒绝缺少必需参数的请求', async () => {
      await expect(updateSRSRecord(mockDb, 'user-1', null, 'GOOD')).rejects.toThrow('questionId 和 level 是必需的');
      await expect(updateSRSRecord(mockDb, 'user-1', 'q-1', null)).rejects.toThrow('questionId 和 level 是必需的');
    });
  });

  describe('边界情况', () => {
    it('应该处理数据库查询错误', async () => {
      mockDb.getMany.mockRejectedValue(new Error('数据库连接失败'));
      
      await expect(getSRSRecords(mockDb, 'user-1')).rejects.toThrow('数据库连接失败');
    });

    it('应该处理更新时的数据库错误', async () => {
      mockDb.getOne.mockResolvedValue(null);
      mockDb.execute.mockRejectedValue(new Error('数据库写入失败'));
      
      await expect(updateSRSRecord(mockDb, 'user-1', 'q-1', 'GOOD')).rejects.toThrow('数据库写入失败');
    });
  });
});
