/**
 * 进度跟踪服务
 * 跟踪导入任务的实时进度和生成结果摘要
 */

import db from '../../db.js';

export class ProgressTrackerService {
  /**
   * 创建进度跟踪记录
   */
  async createProgress(taskId, totalQuestions) {
    const progress = {
      taskId,
      total: totalQuestions,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentStage: 'parsing',
      percentage: 0,
      startTime: Date.now(),
      estimatedTimeLeft: 0
    };

    // 更新数据库中的进度信息
    await db.query(
      `UPDATE import_tasks 
       SET progress = $1
       WHERE task_id = $2`,
      [JSON.stringify(progress), taskId]
    );

    return progress;
  }

  /**
   * 更新已处理数量
   */
  async updateProcessed(taskId, processed, succeeded, failed) {
    // 获取当前进度
    const current = await this.getProgress(taskId);
    if (!current) {
      throw new Error('进度记录不存在');
    }

    // 计算新的进度
    const percentage = Math.floor((processed / current.total) * 100);
    const elapsed = Date.now() - current.startTime;
    const estimatedTimeLeft = processed > 0 
      ? Math.floor((elapsed / processed) * (current.total - processed) / 1000)
      : 0;

    const updatedProgress = {
      ...current,
      processed,
      succeeded,
      failed,
      percentage,
      estimatedTimeLeft
    };

    // 更新数据库
    await db.query(
      `UPDATE import_tasks 
       SET progress = $1
       WHERE task_id = $2`,
      [JSON.stringify(updatedProgress), taskId]
    );

    return updatedProgress;
  }

  /**
   * 更新当前阶段
   */
  async updateStage(taskId, stage) {
    // 获取当前进度
    const current = await this.getProgress(taskId);
    if (!current) {
      throw new Error('进度记录不存在');
    }

    // 更新阶段
    const updatedProgress = {
      ...current,
      currentStage: stage
    };

    // 更新数据库
    await db.query(
      `UPDATE import_tasks 
       SET progress = $1
       WHERE task_id = $2`,
      [JSON.stringify(updatedProgress), taskId]
    );

    return updatedProgress;
  }

  /**
   * 获取进度信息
   */
  async getProgress(taskId) {
    const result = await db.query(
      `SELECT progress FROM import_tasks WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const progress = result.rows[0].progress;
    
    // 如果progress是字符串,解析为对象
    if (typeof progress === 'string') {
      try {
        return JSON.parse(progress);
      } catch (e) {
        console.error('[ProgressTracker] Failed to parse progress JSON:', e);
        return {};
      }
    }

    return progress;
  }

  /**
   * 生成导入结果摘要
   */
  async generateSummary(taskId) {
    // 获取任务信息
    const result = await db.query(
      `SELECT task_id, file_name, status, progress, result, error_message, 
              created_at, started_at, completed_at
       FROM import_tasks
       WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = result.rows[0];
    const progress = typeof task.progress === 'string' 
      ? JSON.parse(task.progress) 
      : task.progress;
    const taskResult = typeof task.result === 'string'
      ? JSON.parse(task.result)
      : task.result;

    // 计算总耗时
    const duration = task.completed_at && task.started_at
      ? (new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000
      : 0;

    // 生成摘要
    const summary = {
      taskId: task.task_id,
      fileName: task.file_name,
      status: task.status,
      total: progress?.total || 0,
      succeeded: progress?.succeeded || taskResult?.successCount || 0,
      failed: progress?.failed || taskResult?.failureCount || 0,
      duration: Math.round(duration),
      startTime: task.started_at,
      endTime: task.completed_at,
      errorMessage: task.error_message
    };

    return summary;
  }

  /**
   * 生成失败原因报告
   */
  async generateFailureReport(taskId) {
    // 获取任务信息
    const result = await db.query(
      `SELECT task_id, file_name, status, result, error_message
       FROM import_tasks
       WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = result.rows[0];
    
    if (task.status !== 'failed') {
      return null;
    }

    const taskResult = typeof task.result === 'string'
      ? JSON.parse(task.result)
      : task.result;

    // 生成失败报告
    const report = {
      taskId: task.task_id,
      fileName: task.file_name,
      errorMessage: task.error_message,
      errors: taskResult?.errors || [],
      failedCount: taskResult?.failureCount || 0
    };

    return report;
  }

  /**
   * 获取实时进度数据(用于WebSocket推送)
   */
  async getRealtimeProgress(taskId) {
    const progress = await this.getProgress(taskId);
    if (!progress) {
      return null;
    }

    return {
      taskId,
      percentage: progress.percentage,
      processed: progress.processed,
      total: progress.total,
      succeeded: progress.succeeded,
      failed: progress.failed,
      currentStage: progress.currentStage,
      estimatedTimeLeft: progress.estimatedTimeLeft
    };
  }

  /**
   * 批量更新进度(用于批量插入场景)
   */
  async batchUpdateProgress(taskId, batchIndex, batchSize, batchSucceeded, batchFailed) {
    const current = await this.getProgress(taskId);
    if (!current) {
      throw new Error('进度记录不存在');
    }

    const processed = current.processed + batchSize;
    const succeeded = current.succeeded + batchSucceeded;
    const failed = current.failed + batchFailed;

    return await this.updateProcessed(taskId, processed, succeeded, failed);
  }
}

// 导出单例
export const progressTrackerService = new ProgressTrackerService();
