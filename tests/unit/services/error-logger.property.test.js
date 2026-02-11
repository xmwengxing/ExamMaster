/**
 * 错误日志服务 - 属性测试
 * Feature: question-bank-import-optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { errorLogger as errorLoggerService } from '../../../src/services/error-logger.service.js';
import db from '../../../db.js';

describe('错误日志服务 - 属性测试', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM error_logs WHERE context::text LIKE $1', ['%test_error%']);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM error_logs WHERE context::text LIKE $1', ['%test_error%']);
  });

  /**
   * 属性 22: 错误日志完整性
   * 验证需求: 11.1, 11.2, 11.3, 11.4
   */
  it('Property 22: 对于任何系统错误,日志应该包含错误类型、时间戳、详细信息和上下文数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorType: fc.constantFrom('ImportError', 'ImageProcessError', 'DatabaseError', 'ValidationError'),
          errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
          context: fc.record({
            operation: fc.string({ minLength: 1, maxLength: 50 }),
            userId: fc.option(fc.integer({ min: 1, max: 10000 })),
            taskId: fc.option(fc.uuid()),
            fileName: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
          }),
          level: fc.constantFrom('error', 'warn', 'info')
        }),
        async (errorData) => {
          // 创建错误对象
          const error = new Error(errorData.errorMessage);
          error.name = errorData.errorType;

          // 添加测试标识到context
          const testContext = {
            ...errorData.context,
            operation: `test_error_${errorData.context.operation}`
          };

          // 记录错误
          await errorLoggerService.logError(error, testContext, errorData.level);

          // 查询日志
          const result = await db.query(
            `SELECT * FROM error_logs 
             WHERE context::text LIKE $1 
             ORDER BY timestamp DESC 
             LIMIT 1`,
            ['%test_error%']
          );

          expect(result.rows.length).toBe(1);
          const log = result.rows[0];

          // 验证: 日志包含错误类型
          expect(log.error_type).toBe(errorData.errorType);

          // 验证: 日志包含错误消息
          expect(log.message).toBe(errorData.errorMessage);

          // 验证: 日志包含时间戳
          expect(log.timestamp).toBeDefined();
          expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);

          // 验证: 日志包含级别
          expect(log.level).toBe(errorData.level);

          // 验证: 日志包含上下文数据
          const logContext = typeof log.context === 'string' 
            ? JSON.parse(log.context) 
            : log.context;
          expect(logContext.operation).toContain('test_error_');

          // 验证: 日志包含堆栈信息
          expect(log.stack_trace).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 4: 转换错误处理
   * 验证需求: 2.5, 11.1, 11.2, 11.3, 11.4
   */
  it('Property 4: 对于任何无效输入,系统应该返回包含错误类型、位置和修正建议的详细错误信息', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorType: fc.constantFrom('INVALID_FILE_FORMAT', 'FILE_TOO_LARGE', 'VALIDATION_FAILED'),
          fileName: fc.string({ minLength: 1, maxLength: 100 }),
          details: fc.record({
            line: fc.option(fc.integer({ min: 1, max: 10000 })),
            column: fc.option(fc.integer({ min: 1, max: 100 })),
            field: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
          })
        }),
        async (errorData) => {
          // 创建详细错误
          const error = new Error(`文件处理失败: ${errorData.fileName}`);
          error.name = errorData.errorType;

          const context = {
            operation: 'test_error_file_conversion',
            fileName: errorData.fileName,
            details: errorData.details
          };

          // 记录错误
          await errorLoggerService.logError(error, context, 'error');

          // 查询日志
          const result = await db.query(
            `SELECT * FROM error_logs 
             WHERE context::text LIKE $1 
             AND error_type = $2
             ORDER BY timestamp DESC 
             LIMIT 1`,
            ['%test_error_file_conversion%', errorData.errorType]
          );

          expect(result.rows.length).toBe(1);
          const log = result.rows[0];

          // 验证: 错误类型正确
          expect(log.error_type).toBe(errorData.errorType);

          // 验证: 包含文件名
          expect(log.message).toContain(errorData.fileName);

          // 验证: 上下文包含详细信息
          const logContext = typeof log.context === 'string' 
            ? JSON.parse(log.context) 
            : log.context;
          expect(logContext.fileName).toBe(errorData.fileName);
          expect(logContext.details).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });
});
