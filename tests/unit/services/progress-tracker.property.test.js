/**
 * 进度跟踪服务 - 属性测试
 * Feature: question-bank-import-optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { progressTrackerService } from '../../../src/services/progress-tracker.service.js';
import db from '../../../db.js';
import { v4 as uuidv4 } from 'uuid';

describe('进度跟踪服务 - 属性测试', () => {
  const testTaskIds = [];

  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE task_id LIKE $1', ['test_progress_%']);
  });

  afterEach(async () => {
    // 清理测试数据
    for (const taskId of testTaskIds) {
      await db.query('DELETE FROM import_tasks WHERE task_id = $1', [taskId]);
    }
    testTaskIds.length = 0;
    await db.query('DELETE FROM import_tasks WHERE task_id LIKE $1', ['test_progress_%']);
  });

  /**
   * 属性 10: 进度信息准确性
   * 验证需求: 5.2, 5.3
   */
  it('Property 10: 对于任何执行中的导入任务,已处理数量应该等于成功数量加失败数量', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 1000 }), // total
        fc.integer({ min: 0, max: 1000 }), // succeeded
        fc.integer({ min: 0, max: 1000 }), // failed
        async (total, succeeded, failed) => {
          // 确保 succeeded + failed 不超过 total
          const actualSucceeded = Math.min(succeeded, total);
          const actualFailed = Math.min(failed, total - actualSucceeded);
          const processed = actualSucceeded + actualFailed;

          const taskId = `test_progress_${Date.now()}_${Math.random()}`;
          testTaskIds.push(taskId);

          // 创建测试任务
          await db.query(
            `INSERT INTO import_tasks 
             (task_id, user_id, file_name, file_size, status, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [taskId, 1, 'test.json', 1000, 'processing']
          );

          // 创建进度记录
          await progressTrackerService.createProgress(taskId, total);

          // 更新进度
          await progressTrackerService.updateProcessed(
            taskId,
            processed,
            actualSucceeded,
            actualFailed
          );

          // 获取进度
          const progress = await progressTrackerService.getProgress(taskId);

          // 验证: 已处理数量 = 成功数量 + 失败数量
          expect(progress.processed).toBe(progress.succeeded + progress.failed);
          
          // 验证: 已处理数量不超过总数量
          expect(progress.processed).toBeLessThanOrEqual(progress.total);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 11: 进度跟踪记录创建
   * 验证需求: 5.1
   */
  it('Property 11: 对于任何开始的导入任务,应该创建包含任务ID、开始时间和初始状态的进度记录', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        async (totalQuestions) => {
          const taskId = `test_progress_${Date.now()}_${Math.random()}`;
          testTaskIds.push(taskId);

          // 创建测试任务
          await db.query(
            `INSERT INTO import_tasks 
             (task_id, user_id, file_name, file_size, status, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [taskId, 1, 'test.json', 1000, 'queued']
          );

          // 创建进度记录
          const progress = await progressTrackerService.createProgress(taskId, totalQuestions);

          // 验证: 进度记录包含必要字段
          expect(progress.taskId).toBe(taskId);
          expect(progress.total).toBe(totalQuestions);
          expect(progress.processed).toBe(0);
          expect(progress.succeeded).toBe(0);
          expect(progress.failed).toBe(0);
          expect(progress.currentStage).toBe('parsing');
          expect(progress.percentage).toBe(0);
          expect(progress.startTime).toBeGreaterThan(0);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * 属性 12: 导入统计准确性
   * 验证需求: 5.4
   */
  it('Property 12: 对于任何完成的导入任务,统计信息(成功数+失败数)应该等于输入的题目总数', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          total: fc.integer({ min: 10, max: 500 }),
          succeeded: fc.integer({ min: 0, max: 500 }),
          failed: fc.integer({ min: 0, max: 500 })
        }).filter(data => data.succeeded + data.failed === data.total),
        async (data) => {
          const taskId = `test_progress_${Date.now()}_${Math.random()}`;
          testTaskIds.push(taskId);

          // 创建测试任务
          await db.query(
            `INSERT INTO import_tasks 
             (task_id, user_id, file_name, file_size, status, created_at, started_at, completed_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
            [taskId, 1, 'test.json', 1000, 'completed']
          );

          // 创建进度记录
          await progressTrackerService.createProgress(taskId, data.total);

          // 更新为完成状态
          await progressTrackerService.updateProcessed(
            taskId,
            data.total,
            data.succeeded,
            data.failed
          );

          // 生成摘要
          const summary = await progressTrackerService.generateSummary(taskId);

          // 验证: 成功数 + 失败数 = 总数
          expect(summary.succeeded + summary.failed).toBe(summary.total);
        }
      ),
      { numRuns: 30 }
    );
  });
});
