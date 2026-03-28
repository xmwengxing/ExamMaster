/**
 * 验证专业对照表 (major_mappings) 创建结果
 * 检查表结构、索引、约束和示例数据
 */

import db from '../db.js';
import logger from '../utils/logger.js';

/**
 * 验证表是否存在
 */
async function verifyTableExists() {
  console.log('\n=== 1. 验证表是否存在 ===');
  
  const result = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'major_mappings'
    );
  `);
  
  const exists = result.rows[0].exists;
  console.log(`表 major_mappings 存在: ${exists ? '✓' : '✗'}`);
  
  return exists;
}

/**
 * 验证表结构
 */
async function verifyTableStructure() {
  console.log('\n=== 2. 验证表结构 ===');
  
  const result = await db.query(`
    SELECT 
      column_name, 
      data_type, 
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'major_mappings'
    ORDER BY ordinal_position;
  `);
  
  console.log('表字段:');
  result.rows.forEach(row => {
    const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
    const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
    console.log(`  - ${row.column_name}: ${row.data_type}${length} ${nullable} ${defaultVal}`);
  });
  
  // 验证必需字段
  const requiredFields = ['id', 'occupation', 'major_name', 'level_4_compatible', 'level_3_compatible', 'created_at', 'updated_at'];
  const actualFields = result.rows.map(row => row.column_name);
  const missingFields = requiredFields.filter(field => !actualFields.includes(field));
  
  if (missingFields.length === 0) {
    console.log('\n✓ 所有必需字段都存在');
  } else {
    console.log(`\n✗ 缺少字段: ${missingFields.join(', ')}`);
  }
  
  return missingFields.length === 0;
}

/**
 * 验证索引
 */
async function verifyIndexes() {
  console.log('\n=== 3. 验证索引 ===');
  
  const result = await db.query(`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'major_mappings'
    ORDER BY indexname;
  `);
  
  console.log('表索引:');
  result.rows.forEach(row => {
    console.log(`  - ${row.indexname}`);
    console.log(`    ${row.indexdef}`);
  });
  
  // 验证必需索引
  const requiredIndexes = [
    'idx_major_mappings_occupation',
    'idx_major_mappings_major_name',
    'idx_major_mappings_occupation_major'
  ];
  
  const actualIndexes = result.rows.map(row => row.indexname);
  const missingIndexes = requiredIndexes.filter(idx => !actualIndexes.includes(idx));
  
  if (missingIndexes.length === 0) {
    console.log('\n✓ 所有必需索引都存在');
  } else {
    console.log(`\n✗ 缺少索引: ${missingIndexes.join(', ')}`);
  }
  
  return missingIndexes.length === 0;
}

/**
 * 验证唯一约束
 */
async function verifyUniqueConstraint() {
  console.log('\n=== 4. 验证唯一约束 ===');
  
  const result = await db.query(`
    SELECT 
      conname as constraint_name,
      contype as constraint_type
    FROM pg_constraint
    WHERE conrelid = 'major_mappings'::regclass
    AND contype = 'u';
  `);
  
  console.log('唯一约束:');
  result.rows.forEach(row => {
    console.log(`  - ${row.constraint_name} (类型: ${row.constraint_type})`);
  });
  
  // 检查是否有唯一约束（通过唯一索引实现）
  const indexResult = await db.query(`
    SELECT 
      indexname
    FROM pg_indexes
    WHERE tablename = 'major_mappings'
    AND indexdef LIKE '%UNIQUE%';
  `);
  
  if (indexResult.rows.length > 0) {
    console.log('\n✓ 唯一约束存在（通过唯一索引实现）');
    return true;
  } else {
    console.log('\n✗ 未找到唯一约束');
    return false;
  }
}

/**
 * 验证检查约束
 */
async function verifyCheckConstraint() {
  console.log('\n=== 5. 验证检查约束 ===');
  
  const result = await db.query(`
    SELECT 
      conname as constraint_name,
      pg_get_constraintdef(oid) as constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'major_mappings'::regclass
    AND contype = 'c';
  `);
  
  console.log('检查约束:');
  result.rows.forEach(row => {
    console.log(`  - ${row.constraint_name}`);
    console.log(`    ${row.constraint_definition}`);
  });
  
  // 验证至少一个兼容级别为 true 的约束
  const hasCompatibleCheck = result.rows.some(row => 
    row.constraint_name === 'chk_at_least_one_compatible'
  );
  
  if (hasCompatibleCheck) {
    console.log('\n✓ 兼容性检查约束存在');
  } else {
    console.log('\n✗ 缺少兼容性检查约束');
  }
  
  return hasCompatibleCheck;
}

/**
 * 验证示例数据
 */
async function verifySampleData() {
  console.log('\n=== 6. 验证示例数据 ===');
  
  const result = await db.query(`
    SELECT 
      id,
      occupation,
      major_name,
      level_4_compatible,
      level_3_compatible
    FROM major_mappings
    ORDER BY id;
  `);
  
  console.log(`示例数据记录数: ${result.rows.length}`);
  
  if (result.rows.length > 0) {
    console.log('\n示例数据:');
    result.rows.forEach(row => {
      console.log(`  - ${row.id}`);
      console.log(`    职业: ${row.occupation}`);
      console.log(`    专业: ${row.major_name}`);
      console.log(`    四级兼容: ${row.level_4_compatible ? '是' : '否'}`);
      console.log(`    三级兼容: ${row.level_3_compatible ? '是' : '否'}`);
    });
    console.log('\n✓ 示例数据已插入');
  } else {
    console.log('\n⚠ 未找到示例数据');
  }
  
  return result.rows.length > 0;
}

/**
 * 测试唯一约束
 */
async function testUniqueConstraint() {
  console.log('\n=== 7. 测试唯一约束 ===');
  
  try {
    // 尝试插入重复的职业-专业组合
    await db.query(`
      INSERT INTO major_mappings (id, occupation, major_name, level_4_compatible, level_3_compatible)
      VALUES ('test-duplicate', '人工智能训练师', '计算机应用技术', TRUE, TRUE);
    `);
    
    console.log('✗ 唯一约束未生效（允许插入重复数据）');
    
    // 清理测试数据
    await db.query(`DELETE FROM major_mappings WHERE id = 'test-duplicate';`);
    
    return false;
  } catch (error) {
    if (error.code === '23505') { // 唯一约束违反错误代码
      console.log('✓ 唯一约束正常工作（拒绝重复数据）');
      return true;
    } else {
      console.log(`✗ 测试失败: ${error.message}`);
      return false;
    }
  }
}

/**
 * 测试检查约束
 */
async function testCheckConstraint() {
  console.log('\n=== 8. 测试检查约束 ===');
  
  try {
    // 尝试插入两个兼容级别都为 false 的记录
    await db.query(`
      INSERT INTO major_mappings (id, occupation, major_name, level_4_compatible, level_3_compatible)
      VALUES ('test-check', '测试职业', '测试专业', FALSE, FALSE);
    `);
    
    console.log('✗ 检查约束未生效（允许插入无效数据）');
    
    // 清理测试数据
    await db.query(`DELETE FROM major_mappings WHERE id = 'test-check';`);
    
    return false;
  } catch (error) {
    if (error.code === '23514') { // 检查约束违反错误代码
      console.log('✓ 检查约束正常工作（拒绝无效数据）');
      return true;
    } else {
      console.log(`✗ 测试失败: ${error.message}`);
      return false;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始验证专业对照表 (major_mappings)...\n');
  
  try {
    const results = {
      tableExists: await verifyTableExists(),
      tableStructure: await verifyTableStructure(),
      indexes: await verifyIndexes(),
      uniqueConstraint: await verifyUniqueConstraint(),
      checkConstraint: await verifyCheckConstraint(),
      sampleData: await verifySampleData(),
      uniqueConstraintTest: await testUniqueConstraint(),
      checkConstraintTest: await testCheckConstraint()
    };
    
    console.log('\n=== 验证结果汇总 ===');
    console.log(`表存在: ${results.tableExists ? '✓' : '✗'}`);
    console.log(`表结构正确: ${results.tableStructure ? '✓' : '✗'}`);
    console.log(`索引完整: ${results.indexes ? '✓' : '✗'}`);
    console.log(`唯一约束存在: ${results.uniqueConstraint ? '✓' : '✗'}`);
    console.log(`检查约束存在: ${results.checkConstraint ? '✓' : '✗'}`);
    console.log(`示例数据存在: ${results.sampleData ? '✓' : '⚠'}`);
    console.log(`唯一约束测试: ${results.uniqueConstraintTest ? '✓' : '✗'}`);
    console.log(`检查约束测试: ${results.checkConstraintTest ? '✓' : '✗'}`);
    
    const allPassed = Object.entries(results)
      .filter(([key]) => key !== 'sampleData') // 示例数据是可选的
      .every(([, value]) => value === true);
    
    if (allPassed) {
      console.log('\n✓ 所有验证通过！专业对照表创建成功。');
    } else {
      console.log('\n✗ 部分验证失败，请检查上述错误。');
    }
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    logger.error('验证过程出错', {
      error: error.message,
      stack: error.stack
    });
    console.error(`\n✗ 验证过程出错: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();
