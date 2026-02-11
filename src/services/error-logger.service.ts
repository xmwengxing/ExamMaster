/**
 * 错误日志服务
 * 记录系统错误到数据库和文件
 */

import db from '../../db.js';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import path from 'path';

// 日志级别
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// 错误类型
export type ErrorType = 
  | 'import_task_failed'
  | 'image_processing_failed'
  | 'database_operation_failed'
  | 'file_parsing_failed'
  | 'validation_failed'
  | 'upload_failed'
  | 'queue_error'
  | 'unknown';

// 错误日志接口
export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  errorType: ErrorType;
  message: string;
  context: {
    userId?: string;
    taskId?: string;
    fileName?: string;
    operation: string;
    [key: string]: any;
  };
  stack?: string;
  metadata?: Record<string, any>;
}

// 日志查询选项
export interface LogQueryOptions {
  startTime?: Date;
  endTime?: Date;
  level?: LogLevel;
  errorType?: ErrorType;
  taskId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 错误日志服务类
 */
export class ErrorLoggerService {
  private fileLogger: winston.Logger;

  constructor() {
    // 初始化文件日志器
    this.fileLogger = winston.createLogger({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        // 错误日志文件
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'import-errors.log'),
          level: 'error'
        }),
        // 所有日志文件
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'import-combined.log')
        })
      ]
    });

    // 开发环境下同时输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      this.fileLogger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * 记录错误日志
   */
  async logError(
    error: Error,
    context: {
      userId?: string;
      taskId?: string;
      fileName?: string;
      operation: string;
      errorType?: ErrorType;
      [key: string]: any;
    }
  ): Promise<string> {
    const errorLog: ErrorLog = {
      id: uuidv4(),
      timestamp: new Date(),
      level: 'error',
      errorType: context.errorType || (error.name as ErrorType) || 'unknown',
      message: error.message,
      context: {
        operation: context.operation,
        userId: context.userId,
        taskId: context.taskId,
        fileName: context.fileName,
        ...context
      },
      stack: error.stack,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        errorName: error.name
      }
    };

    // 写入数据库
    try {
      await db.query(
        `INSERT INTO error_logs 
         (id, timestamp, level, error_type, message, context, stack_trace, metadata, task_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          errorLog.id,
          errorLog.timestamp,
          errorLog.level,
          errorLog.errorType,
          errorLog.message,
          JSON.stringify(errorLog.context),
          errorLog.stack,
          JSON.stringify(errorLog.metadata),
          context.taskId || null
        ]
      );
    } catch (dbError) {
      console.error('写入错误日志到数据库失败:', dbError);
    }

    // 写入文件
    this.fileLogger.error({
      ...errorLog,
      context: JSON.stringify(errorLog.context),
      metadata: JSON.stringify(errorLog.metadata)
    });

    return errorLog.id;
  }

  /**
   * 记录警告日志
   */
  async logWarning(
    message: string,
    context: {
      userId?: string;
      taskId?: string;
      operation: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const warningLog: ErrorLog = {
      id: uuidv4(),
      timestamp: new Date(),
      level: 'warn',
      errorType: 'unknown',
      message,
      context: {
        operation: context.operation,
        ...context
      },
      metadata: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // 写入数据库
    try {
      await db.query(
        `INSERT INTO error_logs 
         (id, timestamp, level, error_type, message, context, metadata, task_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          warningLog.id,
          warningLog.timestamp,
          warningLog.level,
          warningLog.errorType,
          warningLog.message,
          JSON.stringify(warningLog.context),
          JSON.stringify(warningLog.metadata),
          context.taskId || null
        ]
      );
    } catch (dbError) {
      console.error('写入警告日志到数据库失败:', dbError);
    }

    // 写入文件
    this.fileLogger.warn({
      ...warningLog,
      context: JSON.stringify(warningLog.context),
      metadata: JSON.stringify(warningLog.metadata)
    });

    return warningLog.id;
  }

  /**
   * 记录导入任务失败
   */
  async logImportTaskFailure(
    taskId: string,
    error: Error,
    context: {
      userId: string;
      fileName: string;
      fileSize: number;
      processedCount?: number;
      stage?: string;
    }
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      taskId,
      operation: 'import_task',
      errorType: 'import_task_failed'
    });
  }

  /**
   * 记录图片处理失败
   */
  async logImageProcessingFailure(
    error: Error,
    context: {
      taskId?: string;
      imageSource: string;
      imageSize?: number;
      operation: string;
    }
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      operation: context.operation,
      errorType: 'image_processing_failed'
    });
  }

  /**
   * 记录数据库操作失败
   */
  async logDatabaseOperationFailure(
    error: Error,
    context: {
      taskId?: string;
      operation: string;
      query?: string;
      params?: any[];
    }
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      operation: context.operation,
      errorType: 'database_operation_failed',
      query: context.query,
      params: context.params ? JSON.stringify(context.params) : undefined
    });
  }

  /**
   * 记录文件解析失败
   */
  async logFileParsingFailure(
    error: Error,
    context: {
      taskId?: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }
  ): Promise<string> {
    return this.logError(error, {
      ...context,
      operation: 'file_parsing',
      errorType: 'file_parsing_failed'
    });
  }

  /**
   * 查询错误日志
   */
  async queryLogs(options: LogQueryOptions = {}): Promise<ErrorLog[]> {
    const {
      startTime,
      endTime,
      level,
      errorType,
      taskId,
      userId,
      limit = 100,
      offset = 0
    } = options;

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (startTime) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startTime);
    }

    if (endTime) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endTime);
    }

    if (level) {
      conditions.push(`level = $${paramIndex++}`);
      params.push(level);
    }

    if (errorType) {
      conditions.push(`error_type = $${paramIndex++}`);
      params.push(errorType);
    }

    if (taskId) {
      conditions.push(`task_id = $${paramIndex++}`);
      params.push(taskId);
    }

    if (userId) {
      conditions.push(`context->>'userId' = $${paramIndex++}`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 执行查询
    const query = `
      SELECT id, timestamp, level, error_type, message, context, stack_trace, metadata, task_id
      FROM error_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      errorType: row.error_type,
      message: row.message,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
      stack: row.stack_trace,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    }));
  }

  /**
   * 获取错误统计
   */
  async getErrorStats(options: {
    startTime?: Date;
    endTime?: Date;
    groupBy?: 'level' | 'errorType' | 'hour' | 'day';
  } = {}): Promise<any[]> {
    const { startTime, endTime, groupBy = 'errorType' } = options;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (startTime) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startTime);
    }

    if (endTime) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endTime);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    let groupByClause: string;
    let selectClause: string;

    switch (groupBy) {
      case 'level':
        selectClause = 'level as group_key';
        groupByClause = 'level';
        break;
      case 'errorType':
        selectClause = 'error_type as group_key';
        groupByClause = 'error_type';
        break;
      case 'hour':
        selectClause = 'DATE_TRUNC(\'hour\', timestamp) as group_key';
        groupByClause = 'DATE_TRUNC(\'hour\', timestamp)';
        break;
      case 'day':
        selectClause = 'DATE_TRUNC(\'day\', timestamp) as group_key';
        groupByClause = 'DATE_TRUNC(\'day\', timestamp)';
        break;
      default:
        selectClause = 'error_type as group_key';
        groupByClause = 'error_type';
    }

    const query = `
      SELECT ${selectClause}, COUNT(*) as count
      FROM error_logs
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY count DESC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * 清理旧日志
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      'DELETE FROM error_logs WHERE timestamp < $1',
      [cutoffDate]
    );

    return result.rowCount || 0;
  }
}

// 导出单例
export const errorLogger = new ErrorLoggerService();
