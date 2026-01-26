/**
 * 查询性能分析脚本
 * 
 * 功能：
 * - 分析慢查询
 * - 检查索引使用情况
 * - 提供优化建议
 */

import db from '../db.js';
import 'dotenv/config';

console.log('='.repeat(60));
console.log('查询性能分析工具');
console.log('='.repeat(60));
console.log('');

/**
 * 分析表大小
 */
async function analyzeTableSizes() {
  console.log('📊 表大小分析');
  console.log('-'.repeat(60));
  
  const result = await db.getMany(`
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 20
  `);
  
  console.table(result.map(r => ({
    表名: r.tablename,
    大小: r.size
  })));
  
  console.log('');
}

/**
 * 分析索引使用情况
 */
async function analyzeIndexUsage() {
  console.log('📈 索引使用情况分析');
  console.log('-'.repeat(60));
  
  const result = await db.getMany(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20
  `);
  
  console.table(result.map(r => ({
    表名: r.tablename,
    索引名: r.indexname,
    扫描次数: r.scans,
    读取行数: r.tuples_read,
    获取行数: r.tuples_fetched,
    大小: r.size
  })));
  
  console.log('');
  
  // 查找未使用的索引
  console.log('⚠️  未使用的索引（可能需要删除）');
  console.log('-'.repeat(60));
  
  const unusedIndexes = await db.getMany(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC
  `);
  
  if (unusedIndexes.length > 0) {
    console.table(unusedIndexes.map(r => ({
      表名: r.tablename,
      索引名: r.indexname,
      大小: r.size
    })));
  } else {
    console.log('✅ 所有索引都在使用中');
  }
  
  console.log('');
}

/**
 * 分析缓存命中率
 */
async function analyzeCacheHitRatio() {
  console.log('💾 缓存命中率分析');
  console.log('-'.repeat(60));
  
  const result = await db.getOne(`
    SELECT 
      sum(heap_blks_read) as heap_read,
      sum(heap_blks_hit) as heap_hit,
      CASE 
        WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
        ELSE round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2)
      END as cache_hit_ratio
    FROM pg_statio_user_tables
  `);
  
  console.log(`堆块读取: ${result.heap_read}`);
  console.log(`堆块命中: ${result.heap_hit}`);
  console.log(`缓存命中率: ${result.cache_hit_ratio}%`);
  
  if (result.cache_hit_ratio < 90) {
    console.log('⚠️  缓存命中率较低，建议增加 shared_buffers');
  } else {
    console.log('✅ 缓存命中率良好');
  }
  
  console.log('');
}

/**
 * 分析表统计信息
 */
async function analyzeTableStats() {
  console.log('📋 表统计信息');
  console.log('-'.repeat(60));
  
  const result = await db.getMany(`
    SELECT 
      schemaname,
      relname as tablename,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      CASE 
        WHEN n_live_tup = 0 THEN 0
        ELSE round(n_dead_tup::numeric / n_live_tup * 100, 2)
      END as dead_tuple_ratio,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
    LIMIT 20
  `);
  
  console.table(result.map(r => ({
    表名: r.tablename,
    活跃行数: r.live_tuples,
    死亡行数: r.dead_tuples,
    死亡比例: r.dead_tuple_ratio + '%',
    最后清理: r.last_vacuum || r.last_autovacuum || '从未',
    最后分析: r.last_analyze || r.last_autoanalyze || '从未'
  })));
  
  // 检查需要清理的表
  const needVacuum = result.filter(r => r.dead_tuple_ratio > 10);
  if (needVacuum.length > 0) {
    console.log('');
    console.log('⚠️  以下表需要清理（死亡行数比例 > 10%）：');
    needVacuum.forEach(r => {
      console.log(`  - ${r.tablename}: ${r.dead_tuple_ratio}%`);
    });
    console.log('');
    console.log('建议运行: VACUUM ANALYZE;');
  }
  
  console.log('');
}

/**
 * 分析 JSONB 字段使用情况
 */
async function analyzeJsonbFields() {
  console.log('🔍 JSONB 字段分析');
  console.log('-'.repeat(60));
  
  // 检查 questions 表的 tags 字段
  const tagsStats = await db.getOne(`
    SELECT 
      COUNT(*) as total,
      COUNT(tags) as with_tags,
      COUNT(*) - COUNT(tags) as without_tags,
      round((COUNT(tags)::numeric / COUNT(*)) * 100, 2) as tags_usage_ratio
    FROM questions
  `);
  
  console.log('questions 表 tags 字段统计：');
  console.log(`  总题目数: ${tagsStats.total}`);
  console.log(`  有标签: ${tagsStats.with_tags}`);
  console.log(`  无标签: ${tagsStats.without_tags}`);
  console.log(`  使用率: ${tagsStats.tags_usage_ratio}%`);
  console.log('');
  
  // 检查 users 表的 JSONB 字段
  const usersStats = await db.getOne(`
    SELECT 
      COUNT(*) as total,
      COUNT(student_perms) as with_perms,
      COUNT(allowed_bank_ids) as with_banks,
      COUNT(custom_fields) as with_custom
    FROM users
    WHERE role = 'STUDENT'
  `);
  
  console.log('users 表 JSONB 字段统计（学员）：');
  console.log(`  总学员数: ${usersStats.total}`);
  console.log(`  有权限配置: ${usersStats.with_perms}`);
  console.log(`  有题库限制: ${usersStats.with_banks}`);
  console.log(`  有自定义字段: ${usersStats.with_custom}`);
  console.log('');
}

/**
 * 提供优化建议
 */
async function provideOptimizationSuggestions() {
  console.log('💡 优化建议');
  console.log('-'.repeat(60));
  
  const suggestions = [];
  
  // 检查连接池配置
  const poolStatus = db.getPoolStatus();
  if (poolStatus.totalCount >= 18) {
    suggestions.push('⚠️  连接池接近最大值，考虑增加 max 配置');
  }
  
  // 检查慢查询
  const slowQueries = await db.getMany(`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      max_time
    FROM pg_stat_statements
    WHERE mean_time > 1000
    ORDER BY mean_time DESC
    LIMIT 5
  `).catch(() => []);
  
  if (slowQueries.length > 0) {
    suggestions.push('⚠️  发现慢查询，建议使用 EXPLAIN ANALYZE 分析');
    slowQueries.forEach((q, i) => {
      console.log(`  ${i + 1}. 平均耗时: ${Math.round(q.mean_time)}ms, 调用次数: ${q.calls}`);
      console.log(`     查询: ${q.query.substring(0, 100)}...`);
    });
  }
  
  if (suggestions.length === 0) {
    console.log('✅ 当前性能良好，无需优化');
  } else {
    suggestions.forEach(s => console.log(s));
  }
  
  console.log('');
}

/**
 * 示例：使用 EXPLAIN ANALYZE 分析查询
 */
async function showExplainExample() {
  console.log('📝 查询计划分析示例');
  console.log('-'.repeat(60));
  
  console.log('使用 EXPLAIN ANALYZE 分析查询性能：');
  console.log('');
  console.log('示例 1: 按标签查询题目');
  console.log("  EXPLAIN ANALYZE SELECT * FROM questions WHERE tags @> '[\"tag1\"]'::jsonb;");
  console.log('');
  console.log('示例 2: 按题库和类型查询题目');
  console.log("  EXPLAIN ANALYZE SELECT * FROM questions WHERE bank_id = 'bank-1' AND type = 'SINGLE';");
  console.log('');
  console.log('示例 3: 分页查询学员');
  console.log("  EXPLAIN ANALYZE SELECT * FROM users WHERE role = 'STUDENT' ORDER BY created_at DESC LIMIT 20 OFFSET 0;");
  console.log('');
  console.log('示例 4: JSONB 字段包含查询');
  console.log("  EXPLAIN ANALYZE SELECT * FROM users WHERE allowed_bank_ids @> '[\"bank-1\"]'::jsonb;");
  console.log('');
}

/**
 * 主函数
 */
async function main() {
  try {
    await analyzeTableSizes();
    await analyzeIndexUsage();
    await analyzeCacheHitRatio();
    await analyzeTableStats();
    await analyzeJsonbFields();
    await provideOptimizationSuggestions();
    showExplainExample();
    
    console.log('='.repeat(60));
    console.log('分析完成！');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('分析失败:', error);
    process.exit(1);
  }
}

// 运行分析
main();
