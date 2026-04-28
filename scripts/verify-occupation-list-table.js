/**
 * 验证职业工种清单表 (occupation_list) 创建脚本
 * 
 * 功能:
 * 1. 验证表结构是否正确创建
 * 2. 验证所有索引是否存在
 * 3. 验证示例数据是否插入成功
 * 4. 测试关键词搜索功能
 */

import db from '../db.js';

/**
 * 验证表是否存在
 */
async function verifyTableExists() {
  console.log('\n=== 验证表是否存在 ===');
  
  const result = await db.getOne(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'occupation_list'
    );
  `);
  
  const exists = result.exists;
  
  if (exists) {
    console.log('✓ occupation_list 表已创建');
  } else {
    console.log('✗ occupation_list 表不存在');
    throw new Error('表不存在');
  }
}

/**
 * 验证表结构
 */
async function verifyTableStructure() {
  console.log('\n=== 验证表结构 ===');
  
  const columns = await db.getMany(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'occupation_list'
    ORDER BY ordinal_position;
  `);
  
  console.log('表字段:');
  columns.forEach(col => {
    console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });
  
  // 验证必需字段
  const requiredColumns = ['id', 'occupation', 'direction', 'created_at', 'updated_at'];
  const columnNames = columns.map(col => col.column_name);
  
  requiredColumns.forEach(colName => {
    if (columnNames.includes(colName)) {
      console.log(`✓ 字段 ${colName} 存在`);
    } else {
      console.log(`✗ 字段 ${colName} 不存在`);
      throw new Error(`缺少字段: ${colName}`);
    }
  });
}

/**
 * 验证索引
 */
async function verifyIndexes() {
  console.log('\n=== 验证索引 ===');
  
  const indexes = await db.getMany(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'occupation_list'
    ORDER BY indexname;
  `);
  
  console.log('表索引:');
  indexes.forEach(idx => {
    console.log(`  - ${idx.indexname}`);
  });
  
  // 验证必需索引
  const requiredIndexes = [
    'idx_occupation_list_occupation',
    'idx_occupation_list_direction',
    'idx_occupation_list_occupation_direction',
    'idx_occupation_list_occupation_gin'
  ];
  
  const indexNames = indexes.map(idx => idx.indexname);
  
  requiredIndexes.forEach(idxName => {
    if (indexNames.includes(idxName)) {
      console.log(`✓ 索引 ${idxName} 存在`);
    } else {
      console.log(`✗ 索引 ${idxName} 不存在`);
      throw new Error(`缺少索引: ${idxName}`);
    }
  });
}

/**
 * 验证示例数据
 */
async function verifyExampleData() {
  console.log('\n=== 验证示例数据 ===');
  
  const result = await db.getOne(`
    SELECT COUNT(*) as count FROM occupation_list;
  `);
  
  const count = parseInt(result.count);
  
  console.log(`示例数据记录数: ${count}`);
  
  if (count > 0) {
    console.log('✓ 示例数据已插入');
    
    // 显示部分示例数据
    const samples = await db.getMany(`
      SELECT id, occupation, direction
      FROM occupation_list
      LIMIT 5;
    `);
    
    console.log('\n示例数据预览:');
    samples.forEach(row => {
      console.log(`  - ${row.occupation} ${row.direction ? `(${row.direction})` : '(无工种方向)'}`);
    });
  } else {
    console.log('⚠ 未找到示例数据（这可能是正常的）');
  }
}

/**
 * 测试关键词搜索功能
 */
async function testKeywordSearch() {
  console.log('\n=== 测试关键词搜索功能 ===');
  
  // 测试1: 搜索"人工智能"
  console.log('\n测试1: 搜索关键词 "人工智能"');
  const result1 = await db.getMany(`
    SELECT occupation, direction
    FROM occupation_list
    WHERE occupation ILIKE '%人工智能%'
    ORDER BY occupation, direction;
  `);
  
  console.log(`找到 ${result1.length} 条记录:`);
  result1.forEach(row => {
    console.log(`  - ${row.occupation} ${row.direction ? `(${row.direction})` : ''}`);
  });
  
  // 测试2: 搜索"电工"
  console.log('\n测试2: 搜索关键词 "电工"');
  const result2 = await db.getMany(`
    SELECT occupation, direction
    FROM occupation_list
    WHERE occupation ILIKE '%电工%'
    ORDER BY occupation, direction;
  `);
  
  console.log(`找到 ${result2.length} 条记录:`);
  result2.forEach(row => {
    console.log(`  - ${row.occupation} ${row.direction ? `(${row.direction})` : ''}`);
  });
  
  // 测试3: 查询某个职业的所有工种方向
  console.log('\n测试3: 查询"人工智能训练师"的所有工种方向');
  const result3 = await db.getMany(`
    SELECT direction
    FROM occupation_list
    WHERE occupation = '人工智能训练师'
    ORDER BY direction;
  `);
  
  console.log(`找到 ${result3.length} 个工种方向:`);
  result3.forEach(row => {
    console.log(`  - ${row.direction || '(无工种方向)'}`);
  });
}

/**
 * 测试插入和查询
 */
async function testInsertAndQuery() {
  console.log('\n=== 测试插入和查询 ===');
  
  // 插入测试数据
  const testId = `test-occupation-${Date.now()}`;
  
  const insertResult = await db.getOne(
    `INSERT INTO occupation_list (id, occupation, direction)
     VALUES ($1, $2, $3)
     RETURNING *;`,
    [testId, '测试职业', '测试工种方向']
  );
  
  console.log('✓ 插入测试数据成功');
  console.log(`  ID: ${insertResult.id}`);
  console.log(`  职业: ${insertResult.occupation}`);
  console.log(`  工种方向: ${insertResult.direction}`);
  
  // 查询测试数据
  const selectResult = await db.getOne(
    `SELECT * FROM occupation_list WHERE id = $1;`,
    [testId]
  );
  
  if (selectResult) {
    console.log('✓ 查询测试数据成功');
  } else {
    throw new Error('查询测试数据失败');
  }
  
  // 删除测试数据
  await db.execute(
    `DELETE FROM occupation_list WHERE id = $1;`,
    [testId]
  );
  console.log('✓ 删除测试数据成功');
}

/**
 * 主函数
 */
async function main() {
  console.log('开始验证 occupation_list 表...\n');
  
  try {
    await verifyTableExists();
    await verifyTableStructure();
    await verifyIndexes();
    await verifyExampleData();
    await testKeywordSearch();
    await testInsertAndQuery();
    
    console.log('\n=== 验证完成 ===');
    console.log('✓ 所有验证通过！occupation_list 表创建成功！');
    
  } catch (error) {
    console.error('\n=== 验证失败 ===');
    console.error('✗ 错误:', error.message);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// 运行验证
main();
