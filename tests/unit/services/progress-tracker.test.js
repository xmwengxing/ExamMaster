/**
 * 进度跟踪服务 - 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { progressTrackerService } from '../../../src/services/progress-tracker.service.js';
import db from '../../../db.js';

describe('ProgressTrackerService', () => {
  const testTaskIds = [];

  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE task_id LIKE $1', ['test_tracker_%']);
  });

  afterEach(async () => {
    // 清理测试数据
    for (const taskId of testTaskIds) {
      await db.query('DELETE FROM import_tasks WHERE task_id = $1', [taskId]);
    }
    testTaskIds.length = 0;
    await db.query('DELETE FROM import_tasks WHERE task_id LIKE $1', ['test_tracker_%']);
  });

  describe('createProgress', () => {
    it('应该创建初始进度记录', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'queued']
      );

      const progress = await progressTrackerService.createProgress(taskId, 100);

      expect(progress.taskId).toBe(taskId);
      expect(progress.total).toBe(100);
      expect(progress.processed).toBe(0);
      expect(progress.succeeded).toBe(0);
      expect(progress.failed).toBe(0);
      expect(progress.currentStage).toBe('parsing');
      expect(progress.percentage).toBe(0);
    });
  });

  describe('updateProcessed', () => {
    it('应该正确更新已处理数量', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 100);
      const updated = await progressTrackerService.updateProcessed(taskId, 50, 45, 5);

      expect(updated.processed).toBe(50);
      expect(updated.succeeded).toBe(45);
      expect(updated.failed).toBe(5);
      expect(updated.percentage).toBe(50);
    });

    it('应该计算预计剩余时间', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 100);
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updated = await progressTrackerService.updateProcessed(taskId, 25, 25, 0);

      expect(updated.estimatedTimeLeft).toBeGreaterThanOrEqual(0);
    });

    it('应该在进度记录不存在时抛出错误', async () => {
      await expect(
        progressTrackerService.updateProcessed('nonexistent', 10, 10, 0)
      ).rejects.toThrow('进度记录不存在');
    });
  });

  describe('updateStage', () => {
    it('应该正确更新当前阶段', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 100);
      const updated = await progressTrackerService.updateStage(taskId, 'validating');

      expect(updated.currentStage).toBe('validating');
    });

    it('应该在进度记录不存在时抛出错误', async () => {
      await expect(
        progressTrackerService.updateStage('nonexistent', 'validating')
      ).rejects.toThrow('进度记录不存在');
    });
  });

  describe('getProgress', () => {
    it('应该获取进度信息', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 100);
      const progress = await progressTrackerService.getProgress(taskId);

      expect(progress).not.toBeNull();
      expect(progress.taskId).toBe(taskId);
      expect(progress.total).toBe(100);
    });

    it('应该在任务不存在时返回null', async () => {
      const progress = await progressTrackerService.getProgress('nonexistent');
      expect(progress).toBeNull();
    });
  });

  describe('generateSummary', () => {
    it('应该生成导入结果摘要', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
        [taskId, 1, 'test.json', 1000, 'completed']
      );

      await progressTrackerService.createProgress(taskId, 100);
      await progressTrackerService.updateProcessed(taskId, 100, 95, 5);

      const summary = await progressTrackerService.generateSummary(taskId);

      expect(summary.taskId).toBe(taskId);
      expect(summary.fileName).toBe('test.json');
      expect(summary.status).toBe('completed');
      expect(summary.total).toBe(100);
      expect(summary.succeeded).toBe(95);
      expect(summary.failed).toBe(5);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该在任务不存在时返回null', async () => {
      const summary = await progressTrackerService.generateSummary('nonexistent');
      expect(summary).toBeNull();
    });
  });

  describe('generateFailureReport', () => {
    it('应该生成失败原因报告', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建失败的测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [taskId, 1, 'test.json', 1000, 'failed', '数据验证失败']
      );

      const report = await progressTrackerService.generateFailureReport(taskId);

      expect(report).not.toBeNull();
      expect(report.taskId).toBe(taskId);
      expect(report.errorMessage).toBe('数据验证失败');
    });

    it('应该在任务不是失败状态时返回null', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建成功的测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'completed']
      );

      const report = await progressTrackerService.generateFailureReport(taskId);
      expect(report).toBeNull();
    });
  });

  describe('getRealtimeProgress', () => {
    it('应该获取实时进度数据', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 100);
      await progressTrackerService.updateProcessed(taskId, 50, 45, 5);

      const realtime = await progressTrackerService.getRealtimeProgress(taskId);

      expect(realtime.taskId).toBe(taskId);
      expect(realtime.percentage).toBe(50);
      expect(realtime.processed).toBe(50);
      expect(realtime.total).toBe(100);
      expect(realtime.currentStage).toBe('parsing');
    });
  });

  describe('batchUpdateProgress', () => {
    it('应该批量更新进度', async () => {
      const taskId = `test_tracker_${Date.now()}`;
      testTaskIds.push(taskId);

      // 创建测试任务
      await db.query(
        `INSERT INTO import_tasks 
         (task_id, user_id, file_name, file_size, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [taskId, 1, 'test.json', 1000, 'processing']
      );

      await progressTrackerService.createProgress(taskId, 1000);
      
      // 模拟批量插入进度更新
      const updated = await progressTrackerService.batchUpdateProgress(
        taskId,
        0, // batchIndex
        500, // batchSize
        480, // batchSucceeded
        20 // batchFailed
      );

      expect(updated.processed).toBe(500);
      expect(updated.succeeded).toBe(480);
      expect(updated.failed).toBe(20);
    });
  });
});
