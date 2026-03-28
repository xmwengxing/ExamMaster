/**
 * 系统配置和监控模块服务层
 */

import db from '../../db.js';

/**
 * 获取数据库监控信息
 * @returns {Promise<Object>} 监控数据
 */
export async function getDatabaseMonitor() {
  // 获取连接池状态
  const poolStatus = db.getPoolStatus();
  
  // 获取数据库大小
  const dbSizeResult = await db.getOne(
    "SELECT pg_size_pretty(pg_database_size($1)) as size",
    [process.env.DB_NAME || 'edumaster']
  );
  
  // 获取连接数
  const connectionResult = await db.getOne(`
    SELECT 
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle
    FROM pg_stat_activity
  `);
  
  // 获取表统计
  const tableStatsResult = await db.getOne(`
    SELECT 
      count(*) as table_count,
      sum(n_live_tup) as total_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
  `);
  
  return {
    timestamp: new Date().toISOString(),
    pool: poolStatus,
    database: {
      size: dbSizeResult.size,
      tableCount: parseInt(tableStatsResult.table_count),
      totalRows: parseInt(tableStatsResult.total_rows)
    },
    connections: {
      total: parseInt(connectionResult.total),
      active: parseInt(connectionResult.active),
      idle: parseInt(connectionResult.idle)
    }
  };
}

/**
 * 获取用户每日进度
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 进度列表
 */
export async function getUserProgress(userId) {
  const rows = await db.getMany('SELECT * FROM daily_progress WHERE user_id = $1', [userId]);
  return rows || [];
}

/**
 * 获取所有用户进度（管理员）
 * @returns {Promise<Array>} 所有进度列表
 */
export async function getAllProgress() {
  const rows = await db.getMany('SELECT * FROM daily_progress ORDER BY date DESC');
  return rows || [];
}
