/**
 * 实操服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as practicalService from '../../../src/services/practical.service.js';
import db from '../../../db.js';

// Mock db 模块
vi.mock('../../../db.js', () => ({
  default: {
    getMany: vi.fn(),
    execute: vi.fn()
  }
}));

describe('实操服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPracticalTasks', () => {
    it('应该返回所有实操任务', async () => {
      const mockTasks = [
        {
          id: 'pt-1',
          title: '任务1',
          parts: [{ title: '部分1' }],
          created_at: '2024-01-01'
        }
      ];
      db.getMany.mockResolvedValue(mockTasks);

      const result = await practicalService.getPracticalTasks();

      expect(db.getMany).toHaveBeenCalledWith('SELECT * FROM practical_tasks ORDER BY created_at DESC');
      expect(result).toEqual([
        {
          id: 'pt-1',
          title: '任务1',
          parts: [{ title: '部分1' }],
          createdAt: '2024-01-01'
        }
      ]);
    });

    it('应该处理空结果', async () => {
      db.getMany.mockResolvedValue(null);

      const result = await practicalService.getPracticalTasks();

      expect(result).toEqual([]);
    });
  });

  describe('createPracticalTask', () => {
    it('应该创建实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        title: '新任务',
        parts: [{ title: '部分1' }]
      };

      const result = await practicalService.createPracticalTask(taskData);

      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO practical_tasks (id, title, parts, created_at) VALUES ($1, $2, $3::jsonb, $4)',
        expect.arrayContaining([
          expect.stringMatching(/^pt-\d+$/),
          '新任务',
          JSON.stringify([{ title: '部分1' }]),
          expect.any(String)
        ])
      );
      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^pt-\d+$/);
    });

    it('应该使用提供的ID', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        id: 'custom-id',
        title: '新任务',
        parts: []
      };

      const result = await practicalService.createPracticalTask(taskData);

      expect(result.id).toBe('custom-id');
    });

    it('应该处理空parts', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        title: '新任务'
      };

      await practicalService.createPracticalTask(taskData);

      expect(db.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.any(String),
          '新任务',
          JSON.stringify([]),
          expect.any(String)
        ])
      );
    });
  });

  describe('updatePracticalTask', () => {
    it('应该更新实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const taskData = {
        title: '更新的任务',
        parts: [{ title: '新部分' }]
      };

      const result = await practicalService.updatePracticalTask('pt-1', taskData);

      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE practical_tasks SET title = $1, parts = $2::jsonb WHERE id = $3',
        ['更新的任务', JSON.stringify([{ title: '新部分' }]), 'pt-1']
      );
      expect(result.success).toBe(true);
    });
  });

  describe('deletePracticalTask', () => {
    it('应该删除实操任务', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await practicalService.deletePracticalTask('pt-1');

      expect(db.execute).toHaveBeenCalledWith('DELETE FROM practical_tasks WHERE id = $1', ['pt-1']);
      expect(result.success).toBe(true);
    });
  });

  describe('getPracticalRecords', () => {
    it('应该返回学员自己的记录', async () => {
      const mockRecords = [
        {
          id: 'ptr-1',
          user_id: 'user-1',
          task_id: 'pt-1',
          answers: { q1: 'answer1' },
          submitted_at: '2024-01-01'
        }
      ];
      db.getMany.mockResolvedValue(mockRecords);

      const result = await practicalService.getPracticalRecords('user-1', false);

      expect(db.getMany).toHaveBeenCalledWith(
        'SELECT * FROM practical_records WHERE user_id = $1 ORDER BY submitted_at DESC',
        ['user-1']
      );
      expect(result).toEqual([
        {
          id: 'ptr-1',
          userId: 'user-1',
          taskId: 'pt-1',
          answers: { q1: 'answer1' },
          submittedAt: '2024-01-01'
        }
      ]);
    });

    it('应该返回所有记录（管理员）', async () => {
      const mockRecords = [
        {
          id: 'ptr-1',
          user_id: 'user-1',
          task_id: 'pt-1',
          answers: {},
          submitted_at: '2024-01-01'
        }
      ];
      db.getMany.mockResolvedValue(mockRecords);

      const result = await practicalService.getPracticalRecords('admin-1', true);

      expect(db.getMany).toHaveBeenCalledWith('SELECT * FROM practical_records ORDER BY submitted_at DESC');
      expect(result).toHaveLength(1);
    });

    it('应该处理空结果', async () => {
      db.getMany.mockResolvedValue(null);

      const result = await practicalService.getPracticalRecords('user-1', false);

      expect(result).toEqual([]);
    });
  });

  describe('createPracticalRecord', () => {
    it('应该创建实操记录', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const recordData = {
        userId: 'user-1',
        taskId: 'pt-1',
        answers: { q1: 'answer1' }
      };

      const result = await practicalService.createPracticalRecord(recordData);

      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO practical_records (id, user_id, task_id, answers, submitted_at) VALUES ($1, $2, $3, $4::jsonb, $5)',
        expect.arrayContaining([
          expect.stringMatching(/^ptr-\d+$/),
          'user-1',
          'pt-1',
          JSON.stringify({ q1: 'answer1' }),
          expect.any(String)
        ])
      );
      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^ptr-\d+$/);
    });

    it('应该使用提供的ID', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const recordData = {
        id: 'custom-record-id',
        userId: 'user-1',
        taskId: 'pt-1',
        answers: {}
      };

      const result = await practicalService.createPracticalRecord(recordData);

      expect(result.id).toBe('custom-record-id');
    });
  });

  describe('deletePracticalRecord', () => {
    it('应该删除实操记录', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await practicalService.deletePracticalRecord('ptr-1', 'user-1');

      expect(db.execute).toHaveBeenCalledWith(
        'DELETE FROM practical_records WHERE id = $1 AND user_id = $2',
        ['ptr-1', 'user-1']
      );
      expect(result.success).toBe(true);
    });

    it('应该在记录不存在时抛出错误', async () => {
      db.execute.mockResolvedValue({ rowCount: 0 });

      await expect(
        practicalService.deletePracticalRecord('ptr-1', 'user-1')
      ).rejects.toThrow('记录不存在或无权删除');
    });
  });
});
