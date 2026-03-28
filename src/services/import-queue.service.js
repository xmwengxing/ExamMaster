/**
 * 导入任务队列服务
 * 使用Bull队列处理题库批量导入任务
 */

import Queue from 'bull';
import db from '../../db.js';
import { webConversionService } from './web-conversion.service.js';
import fs from 'fs/promises';

// Redis配置
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

// 创建导入队列
export const importQueue = new Queue('question-import', {
  redis: REDIS_CONFIG,
  defaultJobOptions: {
    attempts: 3, // 最多重试3次
    backoff: {
      type: 'exponential',
      delay: 2000 // 初始延迟2秒
    },
    removeOnComplete: false, // 保留已完成的任务
    removeOnFail: false, // 保留失败的任务
    timeout: 30 * 60 * 1000 // 30分钟超时
  }
});

/**
 * 任务队列服务类
 */
export class ImportQueueService {
  /**
   * 添加导入任务到队列
   */
  async addImportTask(data) {
    // 在数据库中创建任务记录
    await db.query(
      `INSERT INTO import_tasks 
       (task_id, user_id, file_name, file_size, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [data.taskId, data.userId, data.fileName, data.fileSize, 'queued']
    );

    // 添加到队列
    const job = await importQueue.add(data, {
      jobId: data.taskId
    });

    return job.id;
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId) {
    // 从数据库获取任务信息
    const result = await db.query(
      `SELECT task_id, user_id, file_name, file_size, status, progress, result, error_message, created_at, started_at, completed_at
       FROM import_tasks
       WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = result.rows[0];

    // 尝试从队列获取任务进度
    const job = await importQueue.getJob(taskId);
    if (job) {
      const jobState = await job.getState();
      const progress = job.progress();

      return {
        ...task,
        queueState: jobState,
        progress: progress || task.progress
      };
    }

    return task;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId) {
    // 从队列中移除任务
    try {
      const job = await importQueue.getJob(taskId);
      if (job) {
        const state = await job.getState();
        // 只尝试移除未完成的任务
        if (state === 'waiting' || state === 'delayed') {
          try {
            await job.remove();
          } catch (error) {
            // 忽略移除错误,任务可能已经被处理
            console.log(`无法移除任务 ${taskId}:`, error.message);
          }
        }
      }
    } catch (error) {
      // 忽略获取任务错误
      console.log(`无法获取任务 ${taskId}:`, error.message);
    }

    // 更新数据库状态
    await db.query(
      `UPDATE import_tasks 
       SET status = $1, completed_at = NOW()
       WHERE task_id = $2 AND status IN ('queued', 'processing')`,
      ['cancelled', taskId]
    );
  }


  /**
   * 获取任务结果
   */
  async getTaskResult(taskId) {
    const result = await db.query(
      `SELECT task_id, status, result, error_message, created_at, completed_at
       FROM import_tasks
       WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = result.rows[0];

    if (task.status !== 'completed' && task.status !== 'failed') {
      return null;
    }

    const duration = task.completed_at && task.created_at
      ? (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / 1000
      : 0;

    return {
      taskId: task.task_id,
      success: task.status === 'completed',
      ...(task.result || {}),
      duration
    };
  }

  /**
   * 获取用户的所有任务
   */
  async getUserTasks(userId, limit = 50) {
    const result = await db.query(
      `SELECT task_id, file_name, file_size, status, progress, created_at, started_at, completed_at
       FROM import_tasks
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

/**
 * 处理导入任务
 */
importQueue.process(async (job) => {
  const { taskId, userId, filePath, fileName } = job.data;
  const startTime = Date.now();

  try {
    // 更新任务状态为处理中
    await db.query(
      `UPDATE import_tasks 
       SET status = $1, started_at = NOW()
       WHERE task_id = $2`,
      ['processing', taskId]
    );

    // 阶段1: 解析文件
    job.progress({ stage: 'parsing', percentage: 10 });
    await db.query(
      `UPDATE import_tasks SET progress = $1 WHERE task_id = $2`,
      [JSON.stringify({ stage: 'parsing', percentage: 10 }), taskId]
    );

    const fileBuffer = await fs.readFile(filePath);
    const file = new File([fileBuffer], fileName);
    const parsed = await webConversionService.parseFile(file);

    // 阶段2: 验证数据
    job.progress({ stage: 'validating', percentage: 30 });
    await db.query(
      `UPDATE import_tasks SET progress = $1 WHERE task_id = $2`,
      [JSON.stringify({ stage: 'validating', percentage: 30 }), taskId]
    );

    const json = webConversionService.convertToJSON(parsed);
    const validation = webConversionService.validateJSON(json);

    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.errors.length} 个错误`);
    }

    // 阶段3: 批量插入
    job.progress({ stage: 'inserting', percentage: 50 });
    await db.query(
      `UPDATE import_tasks SET progress = $1 WHERE task_id = $2`,
      [JSON.stringify({ stage: 'inserting', percentage: 50 }), taskId]
    );

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // 分批插入（每批500条）
    const batchSize = 500;
    for (let i = 0; i < json.questions.length; i += batchSize) {
      const batch = json.questions.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const question = batch[j];
        try {
          await db.query(
            `INSERT INTO questions 
             (content, type, options, answer, explanation, chapter, fill_blanks, short_answer, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (content) DO NOTHING`,
            [
              question.content,
              question.type,
              JSON.stringify(question.options || []),
              JSON.stringify(question.answer),
              question.explanation || '',
              question.chapter || '',
              question.fillBlanks || '',
              question.shortAnswer || '',
              userId
            ]
          );
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push({
            index: i + j,
            message: error.message
          });
        }
      }

      // 更新进度
      const percentage = 50 + Math.floor((i + batch.length) / json.questions.length * 50);
      job.progress({ stage: 'inserting', percentage });
      await db.query(
        `UPDATE import_tasks SET progress = $1 WHERE task_id = $2`,
        [JSON.stringify({ stage: 'inserting', percentage }), taskId]
      );
    }

    // 完成
    const result = {
      taskId,
      success: true,
      totalQuestions: json.questions.length,
      successCount,
      failureCount,
      errors: errors.slice(0, 100), // 只保留前100个错误
      duration: (Date.now() - startTime) / 1000
    };

    await db.query(
      `UPDATE import_tasks 
       SET status = $1, result = $2, completed_at = NOW()
       WHERE task_id = $3`,
      ['completed', JSON.stringify(result), taskId]
    );

    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }

    return result;
  } catch (error) {
    // 任务失败
    await db.query(
      `UPDATE import_tasks 
       SET status = $1, error_message = $2, completed_at = NOW()
       WHERE task_id = $3`,
      ['failed', error.message, taskId]
    );

    throw error;
  }
});

// 导出服务实例
export const importQueueService = new ImportQueueService();
