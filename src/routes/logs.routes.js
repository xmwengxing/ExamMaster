/**
 * 错误日志API路由
 */

import express from 'express';
import { errorLogger } from '../services/error-logger.service.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All log endpoints require admin authentication
router.use(auth, adminAuth);

/**
 * GET /api/logs
 * 查询错误日志
 * 
 * 查询参数:
 * - startTime: 开始时间 (ISO 8601格式)
 * - endTime: 结束时间 (ISO 8601格式)
 * - level: 日志级别 (error/warn/info/debug)
 * - errorType: 错误类型
 * - taskId: 任务ID
 * - userId: 用户ID
 * - limit: 返回数量限制 (默认100)
 * - offset: 偏移量 (默认0)
 */
router.get('/', async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      level,
      errorType,
      taskId,
      userId,
      limit,
      offset
    } = req.query;

    // 构建查询选项
    const options = {};

    if (startTime) {
      options.startTime = new Date(startTime);
    }

    if (endTime) {
      options.endTime = new Date(endTime);
    }

    if (level) {
      options.level = level;
    }

    if (errorType) {
      options.errorType = errorType;
    }

    if (taskId) {
      options.taskId = taskId;
    }

    if (userId) {
      options.userId = userId;
    }

    if (limit) {
      options.limit = parseInt(limit);
    }

    if (offset) {
      options.offset = parseInt(offset);
    }

    // 查询日志
    const logs = await errorLogger.queryLogs(options);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        limit: options.limit || 100,
        offset: options.offset || 0
      }
    });
  } catch (error) {
    console.error('查询日志失败:', error);
    res.status(500).json({
      success: false,
      message: '查询日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/stats
 * 获取错误统计
 * 
 * 查询参数:
 * - startTime: 开始时间 (ISO 8601格式)
 * - endTime: 结束时间 (ISO 8601格式)
 * - groupBy: 分组方式 (level/errorType/hour/day)
 */
router.get('/stats', async (req, res) => {
  try {
    const { startTime, endTime, groupBy } = req.query;

    const options = {};

    if (startTime) {
      options.startTime = new Date(startTime);
    }

    if (endTime) {
      options.endTime = new Date(endTime);
    }

    if (groupBy) {
      options.groupBy = groupBy;
    }

    // 获取统计
    const stats = await errorLogger.getErrorStats(options);

    res.json({
      success: true,
      data: {
        stats,
        groupBy: groupBy || 'errorType'
      }
    });
  } catch (error) {
    console.error('获取错误统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取错误统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/:logId
 * 获取单个日志详情
 */
router.get('/:logId', async (req, res) => {
  try {
    const { logId } = req.params;

    const logs = await errorLogger.queryLogs({ limit: 1 });
    const log = logs.find(l => l.id === logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '日志不存在'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志详情失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/logs/cleanup
 * 清理旧日志
 * 
 * 请求体:
 * - daysToKeep: 保留天数 (默认30天)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const deletedCount = await errorLogger.cleanupOldLogs(daysToKeep);

    res.json({
      success: true,
      data: {
        deletedCount,
        daysToKeep
      },
      message: `已清理 ${deletedCount} 条旧日志`
    });
  } catch (error) {
    console.error('清理日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清理日志失败',
      error: error.message
    });
  }
});

export default router;
