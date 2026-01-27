// 笔记服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveNote, getNote } from '../../../src/services/note.service.js';

let mockDb;

describe('笔记服务单元测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  describe('saveNote', () => {
    it('应该创建新笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await saveNote(mockDb, 'user-1', 'q-1', '这是一条笔记');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(false);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        ['user-1', 'q-1', '这是一条笔记']
      );
    });

    it('应该更新已有笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await saveNote(mockDb, 'user-1', 'q-1', '更新后的笔记');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(false);
      // UPSERT 语法会处理插入或更新
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        ['user-1', 'q-1', '更新后的笔记']
      );
    });

    it('应该删除空内容笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await saveNote(mockDb, 'user-1', 'q-1', '');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM notes WHERE user_id = $1 AND question_id = $2',
        ['user-1', 'q-1']
      );
    });

    it('应该删除仅包含空格的笔记', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await saveNote(mockDb, 'user-1', 'q-1', '   ');
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['user-1', 'q-1']
      );
    });

    it('属性 2：添加操作的持久化 - 保存的笔记可以被查询到', async () => {
      // 验证：需求 8.1
      // 对于任何笔记，保存后应该能够通过查询获取到相同的内容
      
      const testContent = '测试笔记内容';
      
      // 保存笔记
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      const saveResult = await saveNote(mockDb, 'user-1', 'q-test', testContent);
      expect(saveResult.success).toBe(true);
      
      // 模拟查询返回保存的笔记
      mockDb.getOne.mockResolvedValue({
        user_id: 'user-1',
        question_id: 'q-test',
        content: testContent,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      });
      
      // 查询笔记
      const note = await getNote(mockDb, 'user-1', 'q-test');
      
      // 验证内容一致
      expect(note).not.toBeNull();
      expect(note.content).toBe(testContent);
      expect(note.userId).toBe('user-1');
      expect(note.questionId).toBe('q-test');
    });
  });

  describe('getNote', () => {
    it('应该返回正确的笔记', async () => {
      const mockNote = {
        user_id: 'user-1',
        question_id: 'q-1',
        content: '这是笔记内容',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      mockDb.getOne.mockResolvedValue(mockNote);
      
      const result = await getNote(mockDb, 'user-1', 'q-1');
      
      expect(result).not.toBeNull();
      expect(result.userId).toBe('user-1');
      expect(result.questionId).toBe('q-1');
      expect(result.content).toBe('这是笔记内容');
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    it('应该返回 null 当笔记不存在时', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      const result = await getNote(mockDb, 'user-1', 'q-1');
      
      expect(result).toBeNull();
    });

    it('应该正确处理不同用户对同一题目的笔记', async () => {
      // 用户1的笔记
      mockDb.getOne.mockResolvedValueOnce({
        user_id: 'user-1',
        question_id: 'q-1',
        content: '用户1的笔记',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      });
      
      const note1 = await getNote(mockDb, 'user-1', 'q-1');
      expect(note1.content).toBe('用户1的笔记');
      
      // 用户2的笔记
      mockDb.getOne.mockResolvedValueOnce({
        user_id: 'user-2',
        question_id: 'q-1',
        content: '用户2的笔记',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      });
      
      const note2 = await getNote(mockDb, 'user-2', 'q-1');
      expect(note2.content).toBe('用户2的笔记');
      
      // 验证查询使用了正确的用户ID
      expect(mockDb.getOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('边界情况', () => {
    it('应该处理数据库保存错误', async () => {
      mockDb.execute.mockRejectedValue(new Error('数据库写入失败'));
      
      await expect(saveNote(mockDb, 'user-1', 'q-1', '笔记')).rejects.toThrow('数据库写入失败');
    });

    it('应该处理数据库查询错误', async () => {
      mockDb.getOne.mockRejectedValue(new Error('数据库查询失败'));
      
      await expect(getNote(mockDb, 'user-1', 'q-1')).rejects.toThrow('数据库查询失败');
    });

    it('应该处理 null 内容', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const result = await saveNote(mockDb, 'user-1', 'q-1', null);
      
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });
  });
});
