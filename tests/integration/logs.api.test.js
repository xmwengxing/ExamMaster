/**
 * 日志查询API集成测试
 * 测试日志查询、统计和清理功能
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import logsRoutes from '../../src/routes/logs.routes.js';
import { errorLogger } from '../../src/services/error-logger.service.js';
import db from '../../db.js';

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/logs', logsRoutes);

describe('日志查询API集成测试', () => {
  let testLogIds = [];

  beforeAll(async () => {
    // 清理测试数据
    await db.query('DELETE FROM error_logs WHERE message LIKE \'%测试%\'');
  });

  afterAll(async () => {
    // 清理测试数据
    if (testLogIds.length > 0) {
      await db.query(
        'DELETE FROM error_logs WHERE id = ANY($1)',
        [testLogIds]
      );
    }
  });

  beforeEach(async () => {
    // 创建测试日志
    testLogIds = [];

    // 创建不同类型的测试日志
    const testError1 = new Error('测试错误1 - 导入任务失败');
    const logId1 = await errorLogger.logError(testError1, {
      operation: 'import_task',
      errorType: 'import_task_failed',
      taskId: 'test-task-1',
      userId: 'test-user-1',
      fileName: 'test.xlsx'
    });
    testLogIds.push(logId1);

    const testError2 = new Error('测试错误2 - 图片处理失败');
    const logId2 = await errorLogger.logError(testError2, {
      operation: 'image_processing',
      errorType: 'image_processing_failed',
      taskId: 'test-task-2',
      imageSource: 'test.jpg'
    });
    testLogIds.push(logId2);

    const testWarning = await errorLogger.logWarning('测试警告 - 数据验证', {
      operation: 'validation',
      taskId: 'test-task-3'
    });
    testLogIds.push(testWarning);

    // 等待数据库写入完成
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('GET /api/logs - 查询日志', () => {
    it('应该返回所有日志（无筛选条件）', async () => {
      const response = await request(app)
        .get('/api/logs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('应该按日志级别筛选', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ level: 'error' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const logs = response.body.data.logs;
      
      // 验证所有返回的日志都是error级别
      logs.forEach(log => {
        expect(log.level).toBe('error');
      });
    });

    it('应该按错误类型筛选', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ errorType: 'import_task_failed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const logs = response.body.data.logs;
      
      // 验证所有返回的日志都是指定类型
      logs.forEach(log => {
        expect(log.errorType).toBe('import_task_failed');
      });
    });

    it('应该按任务ID筛选', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ taskId: 'test-task-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const logs = response.body.data.logs;
      
      expect(logs.length).toBeGreaterThan(0);
      // 验证返回的日志包含指定任务ID
      const log = logs.find(l => l.message.includes('测试错误1'));
      expect(log).toBeDefined();
    });

    it('应该按用户ID筛选', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ userId: 'test-user-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const logs = response.body.data.logs;
      
      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该按时间范围筛选', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const response = await request(app)
        .get('/api/logs')
        .query({
          startTime: oneHourAgo.toISOString(),
          endTime: oneHourLater.toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeInstanceOf(Array);
    });

    it('应该支持分页（limit和offset）', async () => {
      const response1 = await request(app)
        .get('/api/logs')
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.data.logs.length).toBeLessThanOrEqual(2);
      expect(response1.body.data.limit).toBe(2);
      expect(response1.body.data.offset).toBe(0);

      const response2 = await request(app)
        .get('/api/logs')
        .query({ limit: 2, offset: 2 })
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data.offset).toBe(2);
    });

    it('应该返回完整的日志结构', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      const log = response.body.data.logs[0];

      // 验证日志结构
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('errorType');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('context');
      expect(log.context).toHaveProperty('operation');
    });
  });

  describe('GET /api/logs/stats - 获取错误统计', () => {
    it('应该返回按错误类型分组的统计', async () => {
      const response = await request(app)
        .get('/api/logs/stats')
        .query({ groupBy: 'errorType' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeInstanceOf(Array);
      expect(response.body.data.groupBy).toBe('errorType');

      // 验证统计结构
      if (response.body.data.stats.length > 0) {
        const stat = response.body.data.stats[0];
        expect(stat).toHaveProperty('group_key');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('string'); // PostgreSQL返回的count是字符串
      }
    });

    it('应该返回按日志级别分组的统计', async () => {
      const response = await request(app)
        .get('/api/logs/stats')
        .query({ groupBy: 'level' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeInstanceOf(Array);
      expect(response.body.data.groupBy).toBe('level');
    });

    it('应该返回按小时分组的统计', async () => {
      const response = await request(app)
        .get('/api/logs/stats')
        .query({ groupBy: 'hour' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeInstanceOf(Array);
    });

    it('应该返回按天分组的统计', async () => {
      const response = await request(app)
        .get('/api/logs/stats')
        .query({ groupBy: 'day' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeInstanceOf(Array);
    });

    it('应该支持时间范围筛选', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const response = await request(app)
        .get('/api/logs/stats')
        .query({
          startTime: oneHourAgo.toISOString(),
          groupBy: 'errorType'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/logs/:logId - 获取单个日志详情', () => {
    it('应该返回指定日志的详情', async () => {
      // 先获取一个日志ID
      const logsResponse = await request(app)
        .get('/api/logs')
        .query({ limit: 1 });

      const logId = logsResponse.body.data.logs[0].id;

      const response = await request(app)
        .get(`/api/logs/${logId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(logId);
    });

    it('应该返回404当日志不存在', async () => {
      const response = await request(app)
        .get('/api/logs/nonexistent-log-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不存在');
    });
  });

  describe('DELETE /api/logs/cleanup - 清理旧日志', () => {
    it('应该清理指定天数之前的日志', async () => {
      // 创建一个旧日志（模拟）
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40天前

      await db.query(
        `INSERT INTO error_logs 
         (id, timestamp, level, error_type, message, context, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'old-test-log',
          oldDate,
          'error',
          'unknown',
          '测试旧日志',
          JSON.stringify({ operation: 'test' }),
          JSON.stringify({})
        ]
      );

      const response = await request(app)
        .delete('/api/logs/cleanup')
        .send({ daysToKeep: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBeGreaterThanOrEqual(1);
      expect(response.body.data.daysToKeep).toBe(30);

      // 验证旧日志已被删除
      const checkResult = await db.query(
        'SELECT * FROM error_logs WHERE id = $1',
        ['old-test-log']
      );
      expect(checkResult.rows.length).toBe(0);
    });

    it('应该使用默认保留天数（30天）', async () => {
      const response = await request(app)
        .delete('/api/logs/cleanup')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.daysToKeep).toBe(30);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的时间格式', async () => {
      const response = await request(app)
        .get('/api/logs')
        .query({ startTime: 'invalid-date' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('应该处理数据库错误', async () => {
      // 这个测试需要模拟数据库错误，实际环境中可能难以触发
      // 可以通过传入无效的查询参数来测试
      const response = await request(app)
        .get('/api/logs')
        .query({ limit: -1 }); // 无效的limit值

      // 根据实际实现，可能返回500或400
      expect([400, 500]).toContain(response.status);
    });
  });
});
