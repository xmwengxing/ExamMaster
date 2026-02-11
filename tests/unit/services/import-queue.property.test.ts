/**
 * 导入任务队列属性测试
 * Feature: question-bank-import-optimization
 * Property 8: 任务队列入队保证
 * Property 9: 任务状态机正确性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ImportQueueService, importQueue } from '../../../src/services/import-queue.service';
import { v4 as uuidv4 } from 'uuid';
import db from '../../../db.js';

describe('Property 8: 任务队列入队保证', () => {
  let service: ImportQueueService;
  const testUserId = 'property-test-user';

  beforeEach(async () => {
    service = new ImportQueueService();
    
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
    
    // 清理Bull队列中的所有任务
    try {
      await importQueue.clean(0, 'completed');
      await importQueue.clean(0, 'failed');
      await importQueue.clean(0, 'delayed');
      await importQueue.clean(0, 'wait');
      await importQueue.clean(0, 'active');
    } catch (error) {
      // 忽略清理错误
    }
  });

  it('对于任何提交的导入任务，系统应该将任务加入队列并返回有效的任务ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '') + '.json'),
        fc.integer({ min: 1024, max: 100 * 1024 * 1024 }), // 1KB-100MB
        async (fileName, fileSize) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName,
            fileSize
          };

          // 添加任务到队列
          const returnedTaskId = await service.addImportTask(taskData);

          // 验证返回的任务ID有效
          expect(returnedTaskId).toBeDefined();
          expect(typeof returnedTaskId).toBe('string');
          expect(returnedTaskId.length).toBeGreaterThan(0);

          // 验证任务可以被查询
          const status = await service.getTaskStatus(taskId);
          expect(status).not.toBeNull();
          expect(status.task_id).toBe(taskId);
          expect(status.status).toBe('queued');

          // 清理：取消任务
          await service.cancelTask(taskId);
          
          // 从队列中移除
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('对于任何任务ID，应该能够查询任务状态', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }),
        async (fileName) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName: fileName + '.json',
            fileSize: 1024
          };

          await service.addImportTask(taskData);

          // 查询任务状态
          const status = await service.getTaskStatus(taskId);

          expect(status).not.toBeNull();
          expect(status.task_id).toBe(taskId);
          expect(['queued', 'processing', 'completed', 'failed', 'cancelled']).toContain(status.status);

          // 清理
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 9: 任务状态机正确性', () => {
  let service: ImportQueueService;
  const testUserId = 'property-test-user';

  beforeEach(async () => {
    service = new ImportQueueService();
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
    
    // 清理Bull队列中的所有任务
    try {
      await importQueue.clean(0, 'completed');
      await importQueue.clean(0, 'failed');
      await importQueue.clean(0, 'delayed');
      await importQueue.clean(0, 'wait');
      await importQueue.clean(0, 'active');
    } catch (error) {
      // 忽略清理错误
    }
  });

  it('对于任何导入任务，初始状态应该是queued', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }),
        fc.integer({ min: 1024, max: 10 * 1024 * 1024 }),
        async (fileName, fileSize) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName: fileName + '.json',
            fileSize
          };

          await service.addImportTask(taskData);

          const status = await service.getTaskStatus(taskId);
          expect(status.status).toBe('queued');

          // 清理
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('对于任何取消的任务，状态应该变为cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }),
        async (fileName) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName: fileName + '.json',
            fileSize: 1024
          };

          await service.addImportTask(taskData);

          // 取消任务
          await service.cancelTask(taskId);

          // 验证状态
          const status = await service.getTaskStatus(taskId);
          expect(status.status).toBe('cancelled');

          // 清理
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('对于任何任务，状态不应该出现逆向转换', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }),
        async (fileName) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName: fileName + '.json',
            fileSize: 1024
          };

          await service.addImportTask(taskData);

          // 获取初始状态
          const initialStatus = await service.getTaskStatus(taskId);
          expect(initialStatus.status).toBe('queued');

          // 尝试多次查询状态，验证不会逆向转换
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const currentStatus = await service.getTaskStatus(taskId);
            
            // 状态应该只能是 queued, processing, completed, failed, cancelled
            expect(['queued', 'processing', 'completed', 'failed', 'cancelled']).toContain(currentStatus.status);
            
            // 如果状态是completed或failed，不应该再变回queued或processing
            if (initialStatus.status === 'completed' || initialStatus.status === 'failed') {
              expect(['completed', 'failed', 'cancelled']).toContain(currentStatus.status);
            }
          }

          // 清理
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});

describe('Property 10: 进度信息准确性', () => {
  let service: ImportQueueService;
  const testUserId = 'property-test-user';

  beforeEach(async () => {
    service = new ImportQueueService();
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
    
    // 清理Bull队列中的所有任务
    try {
      await importQueue.clean(0, 'completed');
      await importQueue.clean(0, 'failed');
      await importQueue.clean(0, 'delayed');
      await importQueue.clean(0, 'wait');
      await importQueue.clean(0, 'active');
    } catch (error) {
      // 忽略清理错误
    }
  });

  it('对于任何执行中的任务，进度信息应该合理', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }),
        async (fileName) => {
          const taskId = uuidv4();
          const taskData = {
            taskId,
            userId: testUserId,
            filePath: `/tmp/${fileName}`,
            fileName: fileName + '.json',
            fileSize: 1024
          };

          await service.addImportTask(taskData);

          const status = await service.getTaskStatus(taskId);

          // 如果有进度信息，验证其合理性
          if (status.progress) {
            const progress = typeof status.progress === 'string' 
              ? JSON.parse(status.progress) 
              : status.progress;

            // 百分比应该在0-100之间
            if (progress.percentage !== undefined) {
              expect(progress.percentage).toBeGreaterThanOrEqual(0);
              expect(progress.percentage).toBeLessThanOrEqual(100);
            }

            // 阶段应该是有效值
            if (progress.stage) {
              expect(['parsing', 'validating', 'inserting', 'completed']).toContain(progress.stage);
            }
          }

          // 清理
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            await job.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
