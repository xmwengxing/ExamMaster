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
  console.error('数据库连接池意外错误:', err);
  console.error('错误时间:', new Date().toISOString());
  console.error('客户端信息:', client ? '客户端存在' : '客户端不存在');
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
    
    // 记录查询日志（迁移时禁用，只记录慢查询）
    if (duration > 5000) {
      console.log('慢查询警告:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('查询执行失败:', {
      error: error.message,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params
    });
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
    console.log('事务开始');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.log('事务提交成功');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('事务回滚:', error.message);
    throw error;
  } finally {
    client.release();
    console.log('事务连接已释放');
  }
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
  console.log('正在关闭数据库连接池...');
  console.log('当前连接池状态:', getPoolStatus());
  
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭连接池时出错:', error);
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
  getPoolStatus,
  closePool,
  pool
};

// 进程退出时优雅关闭连接池
process.on('SIGINT', async () => {
  console.log('\n收到 SIGINT 信号，正在关闭...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n收到 SIGTERM 信号，正在关闭...');
  await closePool();
  process.exit(0);
});
