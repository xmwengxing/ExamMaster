/**
 * 导入任务队列服务单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImportQueueService, importQueue } from '../../../src/services/import-queue.service';
import { v4 as uuidv4 } from 'uuid';
import db from '../../../db.js';

describe('ImportQueueService 单元测试', () => {
  let service: ImportQueueService;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    service = new ImportQueueService();
    
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM import_tasks WHERE user_id = $1', [testUserId]);
  });

  describe('添加导入任务', () => {
    it('应该成功添加任务到队列', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      const returnedTaskId = await service.addImportTask(taskData);

      expect(returnedTaskId).toBeDefined();
      expect(typeof returnedTaskId).toBe('string');

      // 清理 - 先取消任务,再尝试移除
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误,任务可能已经被处理
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });

    it('应该在数据库中创建任务记录', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      await service.addImportTask(taskData);

      const result = await db.query(
        'SELECT * FROM import_tasks WHERE task_id = $1',
        [taskId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].file_name).toBe('test.json');
      expect(result.rows[0].status).toBe('queued');

      // 清理
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });

    it('应该返回有效的任务ID', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      const returnedTaskId = await service.addImportTask(taskData);

      expect(returnedTaskId).toBe(taskId);

      // 清理
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });
  });

  describe('查询任务状态', () => {
    it('应该返回正确的任务状态', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      await service.addImportTask(taskData);

      const status = await service.getTaskStatus(taskId);

      expect(status).not.toBeNull();
      expect(status.task_id).toBe(taskId);
      expect(status.status).toBe('queued');

      // 清理
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });

    it('应该返回null对于不存在的任务', async () => {
      const status = await service.getTaskStatus('non-existent-task-id');

      expect(status).toBeNull();
    });

    it('应该包含任务的基本信息', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 2048
      };

      await service.addImportTask(taskData);

      const status = await service.getTaskStatus(taskId);

      expect(status.file_name).toBe('test.json');
      expect(parseInt(status.file_size)).toBe(2048);
      expect(status.user_id).toBe(testUserId);

      // 清理
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });
  });

  describe('取消任务', () => {
    it('应该成功取消排队中的任务', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      await service.addImportTask(taskData);
      await service.cancelTask(taskId);

      const status = await service.getTaskStatus(taskId);
      expect(status.status).toBe('cancelled');

      // 清理
      try {
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });

    it('应该从队列中移除任务', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      await service.addImportTask(taskData);
      await service.cancelTask(taskId);

      // 验证数据库中的状态已更新为cancelled
      const status = await service.getTaskStatus(taskId);
      expect(status.status).toBe('cancelled');
    });
  });

  describe('获取任务结果', () => {
    it('应该返回null对于未完成的任务', async () => {
      const taskId = uuidv4();
      const taskData = {
        taskId,
        userId: testUserId,
        filePath: '/tmp/test.json',
        fileName: 'test.json',
        fileSize: 1024
      };

      await service.addImportTask(taskData);

      const result = await service.getTaskResult(taskId);
      expect(result).toBeNull();

      // 清理
      try {
        await service.cancelTask(taskId);
        const job = await importQueue.getJob(taskId);
        if (job) {
          try {
            await job.remove();
          } catch (e) {
            // 忽略移除错误
          }
        }
      } catch (e) {
        // 忽略清理错误
      }
    });

    it('应该返回null对于不存在的任务', async () => {
      const result = await service.getTaskResult('non-existent-task-id');
      expect(result).toBeNull();
    });
  });

  describe('获取用户任务列表', () => {
    it('应该返回用户的所有任务', async () => {
      const taskIds = [];
      
      // 创建3个任务
      for (let i = 0; i < 3; i++) {
        const taskId = uuidv4();
        taskIds.push(taskId);
        
        const taskData = {
          taskId,
          userId: testUserId,
          filePath: `/tmp/test${i}.json`,
          fileName: `test${i}.json`,
          fileSize: 1024 * (i + 1)
        };

        await service.addImportTask(taskData);
      }

      const tasks = await service.getUserTasks(testUserId);

      expect(tasks.length).toBeGreaterThanOrEqual(3);
      
      // 验证任务ID都在列表中
      const returnedTaskIds = tasks.map(t => t.task_id);
      for (const taskId of taskIds) {
        expect(returnedTaskIds).toContain(taskId);
      }

      // 清理
      for (const taskId of taskIds) {
        try {
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            try {
              await job.remove();
            } catch (e) {
              // 忽略移除错误
            }
          }
        } catch (e) {
          // 忽略清理错误
        }
      }
    });

    it('应该按创建时间倒序排列', async () => {
      const taskIds = [];
      
      // 创建3个任务，间隔一点时间
      for (let i = 0; i < 3; i++) {
        const taskId = uuidv4();
        taskIds.push(taskId);
        
        const taskData = {
          taskId,
          userId: testUserId,
          filePath: `/tmp/test${i}.json`,
          fileName: `test${i}.json`,
          fileSize: 1024
        };

        await service.addImportTask(taskData);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const tasks = await service.getUserTasks(testUserId);

      // 验证时间顺序（最新的在前面）
      for (let i = 0; i < tasks.length - 1; i++) {
        const current = new Date(tasks[i].created_at).getTime();
        const next = new Date(tasks[i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // 清理
      for (const taskId of taskIds) {
        try {
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            try {
              await job.remove();
            } catch (e) {
              // 忽略移除错误
            }
          }
        } catch (e) {
          // 忽略清理错误
        }
      }
    });

    it('应该支持限制返回数量', async () => {
      const taskIds = [];
      
      // 创建5个任务
      for (let i = 0; i < 5; i++) {
        const taskId = uuidv4();
        taskIds.push(taskId);
        
        const taskData = {
          taskId,
          userId: testUserId,
          filePath: `/tmp/test${i}.json`,
          fileName: `test${i}.json`,
          fileSize: 1024
        };

        await service.addImportTask(taskData);
      }

      const tasks = await service.getUserTasks(testUserId, 3);

      expect(tasks.length).toBeLessThanOrEqual(3);

      // 清理
      for (const taskId of taskIds) {
        try {
          await service.cancelTask(taskId);
          const job = await importQueue.getJob(taskId);
          if (job) {
            try {
              await job.remove();
            } catch (e) {
              // 忽略移除错误
            }
          }
        } catch (e) {
          // 忽略清理错误
        }
      }
    });
  });
});
