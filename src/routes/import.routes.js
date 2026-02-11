/**
 * 导入任务API路由
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
// 使用简化版服务（不依赖Redis）
import { simpleImportQueueService as importQueueService } from '../services/import-queue-simple.service.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/import/start
 * 开始导入任务
 */
router.post('/start', auth, adminAuth, async (req, res) => {
  try {
    const { filePath, fileName, fileSize } = req.body;
    const userId = req.user?.id || 'anonymous';

    console.log('[Import] 开始导入任务:', { filePath, fileName, fileSize, userId });

    if (!filePath || !fileName) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: filePath, fileName'
      });
    }

    // 生成任务ID
    const taskId = uuidv4();

    console.log('[Import] 生成任务ID:', taskId);

    // 添加到任务队列
    await importQueueService.addImportTask({
      taskId,
      userId,
      filePath,
      fileName,
      fileSize: fileSize || 0
    });

    console.log('[Import] 任务已添加到队列');

    res.json({
      success: true,
      data: {
        taskId,
        status: 'queued',
        message: '导入任务已添加到队列'
      }
    });
  } catch (error) {
    console.error('[Import] 开始导入失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '开始导入失败'
    });
  }
});

/**
 * GET /api/import/status/:taskId
 * 查询任务状态
 */
router.get('/status/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: taskId'
      });
    }

    // 获取任务状态
    const status = await importQueueService.getTaskStatus(taskId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('查询任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查询任务状态失败'
    });
  }
});

/**
 * GET /api/import/result/:taskId
 * 获取任务结果
 */
router.get('/result/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: taskId'
      });
    }

    // 获取任务结果
    const result = await importQueueService.getTaskResult(taskId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '任务结果不存在或任务未完成'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取任务结果失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取任务结果失败'
    });
  }
});

/**
 * DELETE /api/import/cancel/:taskId
 * 取消任务
 */
router.delete('/cancel/:taskId', auth, adminAuth, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: taskId'
      });
    }

    // 取消任务
    await importQueueService.cancelTask(taskId);

    res.json({
      success: true,
      message: '任务已取消'
    });
  } catch (error) {
    console.error('取消任务失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消任务失败'
    });
  }
});

/**
 * GET /api/import/tasks
 * 获取用户的所有任务
 */
router.get('/tasks', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const limit = parseInt(req.query.limit) || 50;

    console.log('[Import] 获取任务列表:', { userId, limit });

    // 获取任务列表
    const tasks = await importQueueService.getUserTasks(userId, limit);

    console.log('[Import] 任务列表:', tasks.length);

    res.json({
      success: true,
      data: {
        tasks,
        total: tasks.length
      }
    });
  } catch (error) {
    console.error('[Import] 获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取任务列表失败'
    });
  }
});

export default router;
