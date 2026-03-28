// 收藏服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserFavorites, toggleFavorite } from '../../../src/services/favorite.service.js';

let mockDb;

describe('收藏服务单元测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  describe('getUserFavorites', () => {
    it('应该返回用户的收藏题目列表', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '收藏题目1',
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
          content: '收藏题目2',
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
      
      const result = await getUserFavorites(mockDb, 'user-1');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('q-1');
      expect(result[0].bankId).toBe('bank-1');
      expect(result[0].content).toBe('收藏题目1');
      expect(result[1].id).toBe('q-2');
      
      // 验证查询使用了正确的参数
      expect(mockDb.getMany).toHaveBeenCalledWith(
        expect.stringContaining('WHERE f.user_id = $1'),
        ['user-1']
      );
    });

    it('应该返回空数组当用户没有收藏时', async () => {
      mockDb.getMany.mockResolvedValue([]);
      
      const result = await getUserFavorites(mockDb, 'user-1');
      
      expect(result).toEqual([]);
    });

    it('应该正确解析题目的 options 和 answer 字段', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '测试题',
          options: JSON.stringify(['选项A', '选项B']),
          answer: JSON.stringify('A'),
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
      
      const result = await getUserFavorites(mockDb, 'user-1');
      
      expect(result[0].options).toEqual(['选项A', '选项B']);
      expect(result[0].answer).toBe('A');
    });
  });

  describe('toggleFavorite', () => {
    it('应该添加收藏当题目未被收藏时', async () => {
      mockDb.getOne.mockResolvedValue(null); // 不存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await toggleFavorite(mockDb, 'user-1', 'q-1');
      
      expect(result.isFavorited).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO favorites (user_id, question_id) VALUES ($1, $2)',
        ['user-1', 'q-1']
      );
    });

    it('应该取消收藏当题目已被收藏时', async () => {
      mockDb.getOne.mockResolvedValue({ user_id: 'user-1', question_id: 'q-1' }); // 已存在
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await toggleFavorite(mockDb, 'user-1', 'q-1');
      
      expect(result.isFavorited).toBe(false);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM favorites WHERE user_id = $1 AND question_id = $2',
        ['user-1', 'q-1']
      );
    });

    it('属性 4：收藏切换的往返一致性 - 连续两次切换回到初始状态', async () => {
      // 验证：需求 7.4
      // 对于任何题目，连续两次切换收藏状态应该回到初始状态
      
      // 初始状态：未收藏
      // 第一次切换：添加收藏
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result1 = await toggleFavorite(mockDb, 'user-1', 'q-test');
      expect(result1.isFavorited).toBe(true);
      
      // 第二次切换：取消收藏
      mockDb.getOne.mockResolvedValueOnce({ user_id: 'user-1', question_id: 'q-test' });
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result2 = await toggleFavorite(mockDb, 'user-1', 'q-test');
      expect(result2.isFavorited).toBe(false);
      
      // 验证执行了一次插入和一次删除
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
      expect(mockDb.execute).toHaveBeenNthCalledWith(
        1,
        'INSERT INTO favorites (user_id, question_id) VALUES ($1, $2)',
        ['user-1', 'q-test']
      );
      expect(mockDb.execute).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM favorites WHERE user_id = $1 AND question_id = $2',
        ['user-1', 'q-test']
      );
    });

    it('应该正确处理不同用户对同一题目的收藏', async () => {
      // 用户1添加收藏
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result1 = await toggleFavorite(mockDb, 'user-1', 'q-1');
      expect(result1.isFavorited).toBe(true);
      
      // 用户2也添加收藏（独立操作）
      mockDb.getOne.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce({ rowCount: 1 });
      
      const result2 = await toggleFavorite(mockDb, 'user-2', 'q-1');
      expect(result2.isFavorited).toBe(true);
      
      // 验证两次都执行了插入操作
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('边界情况', () => {
    it('应该处理数据库查询错误', async () => {
      mockDb.getMany.mockRejectedValue(new Error('数据库连接失败'));
      
      await expect(getUserFavorites(mockDb, 'user-1')).rejects.toThrow('数据库连接失败');
    });

    it('应该处理切换收藏时的数据库错误', async () => {
      mockDb.getOne.mockRejectedValue(new Error('查询失败'));
      
      await expect(toggleFavorite(mockDb, 'user-1', 'q-1')).rejects.toThrow('查询失败');
    });
  });
});
