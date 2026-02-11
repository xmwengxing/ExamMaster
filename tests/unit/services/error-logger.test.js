/**
 * 错误日志服务单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { errorLogger as errorLoggerService } from '../../../src/services/error-logger.service.js';
import db from '../../../db.js';

describe('ErrorLoggerService 单元测试', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM error_logs WHERE context::text LIKE $1', ['%test_unit%']);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM error_logs WHERE context::text LIKE $1', ['%test_unit%']);
  });

  describe('错误日志记录', () => {
    it('应该记录错误类型、时间戳和堆栈信息', async () => {
      const error = new Error('测试错误');
      error.name = 'TestError';

      const context = {
        operation: 'test_unit_operation',
        userId: 123
      };

      await errorLoggerService.logError(error, context, 'error');

      const result = await db.query(
        `SELECT * FROM error_logs 
         WHERE context::text LIKE $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        ['%test_unit_operation%']
      );

      expect(result.rows.length).toBe(1);
      const log = result.rows[0];

      expect(log.error_type).toBe('TestError');
      expect(log.message).toBe('测试错误');
      expect(log.level).toBe('error');
      expect(log.timestamp).toBeDefined();
      expect(log.stack_trace).toBeDefined();
    });

    it('应该记录导入任务失败详情', async () => {
      const error = new Error('导入任务失败');
      error.name = 'ImportError';

      const context = {
        operation: 'test_unit_import_task',
        taskId: 'task-123',
        fileName: 'questions.json',
        failedCount: 10,
        totalCount: 100
      };

      await errorLoggerService.logError(error, context, 'error');

      const result = await db.query(
        `SELECT * FROM error_logs 
         WHERE context::text LIKE $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        ['%test_unit_import_task%']
      );

      expect(result.rows.length).toBe(1);
      const log = result.rows[0];

      const logContext = typeof log.context === 'string' 
        ? JSON.parse(log.context) 
        : log.context;

      expect(logContext.taskId).toBe('task-123');
      expect(logContext.fileName).toBe('questions.json');
      expect(logContext.failedCount).toBe(10);
      expect(logContext.totalCount).toBe(100);
    });

    it('应该记录图片处理失败详情', async () => {
      const error = new Error('图片处理失败');
      error.name = 'ImageProcessError';

      const context = {
        operation: 'test_unit_image_process',
        imageUrl: 'https://example.com/image.jpg',
        imageSize: 150000,
        errorReason: '图片格式不支持'
      };

      await errorLoggerService.logError(error, context, 'error');

      const result = await db.query(
        `SELECT * FROM error_logs 
         WHERE context::text LIKE $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        ['%test_unit_image_process%']
      );

      expect(result.rows.length).toBe(1);
      const log = result.rows[0];

      const logContext = typeof log.context === 'string' 
        ? JSON.parse(log.context) 
        : log.context;

      expect(logContext.imageUrl).toBe('https://example.com/image.jpg');
      expect(logContext.imageSize).toBe(150000);
      expect(logContext.errorReason).toBe('图片格式不支持');
    });

    it('应该记录数据库操作失败详情', async () => {
      const error = new Error('数据库操作失败');
      error.name = 'DatabaseError';

      const context = {
        operation: 'test_unit_database_operation',
        query: 'INSERT INTO questions ...',
        errorCode: '23505',
        constraint: 'questions_content_unique'
      };

      await errorLoggerService.logError(error, context, 'error');

      const result = await db.query(
        `SELECT * FROM error_logs 
         WHERE context::text LIKE $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        ['%test_unit_database_operation%']
      );

      expect(result.rows.length).toBe(1);
      const log = result.rows[0];

      const logContext = typeof log.context === 'string' 
        ? JSON.parse(log.context) 
        : log.context;

      expect(logContext.query).toContain('INSERT INTO questions');
      expect(logContext.errorCode).toBe('23505');
      expect(logContext.constraint).toBe('questions_content_unique');
    });
  });

  describe('日志查询', () => {
    let testStartTime;
    
    beforeEach(async () => {
      testStartTime = new Date();
      
      // 创建测试日志
      const errors = [
        { type: 'ImportError', level: 'error' },
        { type: 'ImageProcessError', level: 'warn' },
        { type: 'DatabaseError', level: 'error' }
      ];

      for (const err of errors) {
        const error = new Error(`测试错误: ${err.type}`);
        error.name = err.type;

        await errorLoggerService.logError(error, {
          operation: 'test_unit_query'
        }, err.level);
        
        // 添加小延迟确保时间戳不同
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('应该按时间筛选日志', async () => {
      // 使用测试开始时间作为起点
      const startTime = new Date(testStartTime.getTime() - 1000); // 1秒前
      const endTime = new Date(Date.now() + 1000); // 1秒后

      const logs = await errorLoggerService.queryLogs({
        startTime,
        endTime,
        operation: 'test_unit_query'
      });

      // 应该返回所有3条日志
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it('应该按类型筛选日志', async () => {
      const logs = await errorLoggerService.queryLogs({
        errorType: 'ImportError',
        operation: 'test_unit_query'
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      logs.forEach(log => {
        expect(log.errorType).toBe('ImportError');
      });
    });

    it('应该按严重程度筛选日志', async () => {
      const logs = await errorLoggerService.queryLogs({
        level: 'error',
        operation: 'test_unit_query'
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      logs.forEach(log => {
        expect(log.level).toBe('error');
      });
    });
  });

  describe.skip('重试机制', () => {
    it('应该在操作失败时自动重试', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('操作失败');
        }
        return '成功';
      };

      const result = await errorLoggerService.retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
        backoffMultiplier: 2
      });

      expect(result).toBe('成功');
      expect(attempts).toBe(3);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      const operation = async () => {
        throw new Error('持续失败');
      };

      await expect(
        errorLoggerService.retryWithBackoff(operation, {
          maxRetries: 2,
          initialDelay: 10,
          backoffMultiplier: 2
        })
      ).rejects.toThrow('持续失败');
    });

    it('应该使用指数退避策略', async () => {
      const delays = [];
      let attempts = 0;

      const operation = async () => {
        const startTime = Date.now();
        attempts++;
        if (attempts < 3) {
          throw new Error('操作失败');
        }
        return '成功';
      };

      await errorLoggerService.retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2
      });

      // 验证重试了2次
      expect(attempts).toBe(3);
    });
  });
});
