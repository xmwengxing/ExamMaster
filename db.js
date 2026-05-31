/**
 * PostgreSQL 数据库连接池模块
 * 
 * 功能：
 * - 创建和管理数据库连接池
 * - 提供查询辅助函数
 * - 错误处理和日志记录
 * - 优雅关闭连接池
 */

import pg from 'pg';
import 'dotenv/config';
import logger, { logDatabaseQuery, logDatabaseError } from './utils/logger.js';

const { Pool } = pg;

// 创建连接池实例
const pool = new Pool({
  // 连接参数
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'edumaster_user',
  password: process.env.DB_PASSWORD,
  
  // 连接池配置
  min: 2,                          // 最小连接数
  max: 20,                         // 最大连接数
  idleTimeoutMillis: 30000,        // 空闲连接超时时间（30秒）
  connectionTimeoutMillis: 2000,   // 连接超时时间（2秒）
});

// 连接池错误处理
pool.on('error', (err, client) => {
  logger.error('数据库连接池意外错误', {
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
    hasClient: !!client,
  });
});

// 连接池连接事件（用于调试）- 迁移时禁用
// pool.on('connect', (client) => {
//   console.log('新的数据库连接已建立');
// });

// 连接池获取连接事件（用于调试）- 迁移时禁用
// pool.on('acquire', (client) => {
//   console.log('从连接池获取连接');
// });

// 连接池释放连接事件（用于调试）- 迁移时禁用
// pool.on('remove', (client) => {
//   console.log('连接已从连接池移除');
// });

/**
 * 查询辅助函数 - 执行 SQL 查询
 * @param {string} text - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 */
export async function query(text, params) {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn('慢查询警告', {
        query: text.substring(0, 200),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    } else if (process.env.LOG_LEVEL === 'debug') {
      logDatabaseQuery(text, params, duration);
    }
    
    return result;
  } catch (error) {
    logDatabaseError(error, text, params);
    throw error;
  }
}

/**
 * 获取单行数据
 * @param {string} text - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Object|null>} 单行数据或 null
 */
export async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * 获取多行数据
 * @param {string} text - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Array>} 数据行数组
 */
export async function getMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * 执行插入/更新/删除操作
 * @param {string} text - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} 执行结果
 */
export async function execute(text, params) {
  // 不做任何转换，让 PostgreSQL 驱动自动处理
  // pg 驱动会自动将 JavaScript 对象/数组转换为 JSONB
  const result = await query(text, params);
  return {
    rowCount: result.rowCount,
    rows: result.rows
  };
}

/**
 * 获取数据库客户端（用于事务）
 * @returns {Promise<Object>} 数据库客户端
 */
export async function getClient() {
  const client = await pool.connect();
  
  // 为客户端添加查询方法的包装，用于日志记录
  const originalQuery = client.query.bind(client);
  client.query = async (...args) => {
    const start = Date.now();
    
    // 不做任何参数转换，让 PostgreSQL 驱动自动处理
    // pg 驱动会自动将 JavaScript 对象/数组转换为 JSONB
    
    try {
      const result = await originalQuery(...args);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV !== 'production' || duration > 1000) {
        console.log('事务查询:', {
          text: args[0].substring(0, 100) + (args[0].length > 100 ? '...' : ''),
          duration: `${duration}ms`
        });
      }
      
      return result;
    } catch (error) {
      console.error('事务查询失败:', {
        error: error.message,
        query: args[0].substring(0, 100)
      });
      throw error;
    }
  };
  
  return client;
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数，接收 client 参数
 * @returns {Promise<any>} 事务执行结果
 */
export async function transaction(callback) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    logger.debug('事务开始');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('事务提交成功');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('事务回滚', { error: error.message });
    throw error;
  } finally {
    client.release();
    logger.debug('事务连接已释放');
  }
}

/**
 * 批量插入数据（使用 COPY 命令优化性能）
 * 适用于大批量数据插入（>1000 行）
 * 
 * @param {string} tableName - 表名
 * @param {Array<string>} columns - 列名数组
 * @param {Array<Array>} rows - 数据行数组，每行是一个值数组
 * @returns {Promise<number>} 插入的行数
 */
export async function bulkInsert(tableName, columns, rows) {
  if (!rows || rows.length === 0) {
    return 0;
  }
  
  const start = Date.now();
  const client = await getClient();
  
  try {
    // 使用 COPY 命令进行批量插入
    // COPY 比 INSERT 快 10-100 倍
    const copyQuery = `COPY ${tableName} (${columns.join(', ')}) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '\\N', QUOTE '"', ESCAPE '"')`;
    
    // 创建 CSV 格式的数据流
    const stream = client.query(pg.from(copyQuery));
    
    // 写入数据
    for (const row of rows) {
      // 将每行数据转换为 CSV 格式
      const csvRow = row.map(value => {
        if (value === null || value === undefined) {
          return '\\N'; // PostgreSQL NULL 表示
        }
        
        // 处理 JSON 对象
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // 转换为字符串
        value = String(value);
        
        // 转义引号和换行符
        value = value.replace(/"/g, '""');
        
        // 如果包含逗号、引号或换行符，需要用引号包裹
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
          return `"${value}"`;
        }
        
        return value;
      }).join(',');
      
      stream.write(csvRow + '\n');
    }
    
    // 结束流
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end();
    });
    
    const duration = Date.now() - start;
    logger.info('批量插入完成', {
      table: tableName,
      rows: rows.length,
      duration: `${duration}ms`,
      throughput: `${Math.round(rows.length / (duration / 1000))} rows/s`
    });
    
    return rows.length;
  } catch (error) {
    logger.error('批量插入失败', {
      table: tableName,
      error: error.message,
      rowCount: rows.length
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 批量插入数据（使用事务和批处理）
 * 适用于中等批量数据插入（100-1000 行）
 * 
 * @param {string} tableName - 表名
 * @param {Array<string>} columns - 列名数组
 * @param {Array<Object>} rows - 数据对象数组
 * @param {number} batchSize - 批处理大小，默认 100
 * @returns {Promise<number>} 插入的行数
 */
export async function batchInsert(tableName, columns, rows, batchSize = 100) {
  if (!rows || rows.length === 0) {
    return 0;
  }
  
  const start = Date.now();
  let inserted = 0;
  
  await transaction(async (client) => {
    // 分批处理
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // 构建批量插入语句
      const placeholders = [];
      const values = [];
      let paramIndex = 1;
      
      for (const row of batch) {
        const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
        
        for (const col of columns) {
          let value = row[col];
          
          // 处理 JSON 对象
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          
          values.push(value);
        }
      }
      
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
      await client.query(sql, values);
      
      inserted += batch.length;
    }
  });
  
  const duration = Date.now() - start;
  logger.info('批量插入完成', {
    table: tableName,
    rows: inserted,
    duration: `${duration}ms`,
    throughput: `${Math.round(inserted / (duration / 1000))} rows/s`
  });
  
  return inserted;
}

/**
 * 分页查询数据
 * 
 * @param {string} tableName - 表名
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码（从 1 开始）
 * @param {number} options.pageSize - 每页大小
 * @param {string} options.where - WHERE 条件（可选）
 * @param {Array} options.params - WHERE 条件参数（可选）
 * @param {string} options.orderBy - 排序字段（可选，默认 id ASC）
 * @returns {Promise<Object>} 分页结果 { data, total, page, pageSize, totalPages }
 */
export async function paginate(tableName, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    where = '',
    params = [],
    orderBy = 'id ASC'
  } = options;
  
  // 验证参数
  if (page < 1) {
    throw new Error('页码必须大于等于 1');
  }
  
  if (pageSize < 1 || pageSize > 100) {
    throw new Error('每页大小必须在 1-100 之间');
  }
  
  const start = Date.now();
  
  // 构建 WHERE 子句
  const whereClause = where ? `WHERE ${where}` : '';
  
  // 查询总记录数
  const countSql = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].total);
  
  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);
  
  // 如果请求的页码超出范围，返回空结果
  if (page > totalPages && totalPages > 0) {
    return {
      data: [],
      total,
      page,
      pageSize,
      totalPages
    };
  }
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  // 查询数据
  const dataSql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query(dataSql, [...params, pageSize, offset]);
  
  const duration = Date.now() - start;
  
  logger.debug('分页查询完成', {
    table: tableName,
    page,
    pageSize,
    total,
    totalPages,
    duration: `${duration}ms`
  });
  
  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * 获取连接池状态
 * @returns {Object} 连接池状态信息
 */
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,      // 总连接数
    idleCount: pool.idleCount,        // 空闲连接数
    waitingCount: pool.waitingCount   // 等待连接的请求数
  };
}

/**
 * 优雅关闭连接池
 * @returns {Promise<void>}
 */
export async function closePool() {
  logger.info('正在关闭数据库连接池', getPoolStatus());
  
  try {
    await pool.end();
    logger.info('数据库连接池已关闭');
  } catch (error) {
    logger.error('关闭连接池时出错', { error: error.message });
    throw error;
  }
}

// 导出连接池实例（用于高级用法）
export { pool };

// 默认导出
export default {
  query,
  getOne,
  getMany,
  execute,
  getClient,
  transaction,
  bulkInsert,
  batchInsert,
  paginate,
  getPoolStatus,
  closePool,
  pool
};

// 进程退出时优雅关闭连接池
process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭...');
  await closePool();
  process.exit(0);
});
