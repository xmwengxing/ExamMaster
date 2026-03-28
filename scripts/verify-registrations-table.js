/**
 * 验证 registrations 表结构
 */

import db from '../db.js';

async function verifyTable() {
  try {
    console.log('\n=== 验证 registrations 表结构 ===\n');
    
    // 1. 检查表是否存在
    const tableExists = await db.getOne(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registrations'
      );
    `);
    
    console.log('✓ 表存在:', tableExists.exists);
    
    if (!tableExists.exists) {
      console.error('✗ registrations 表不存在!');
      process.exit(1);
    }
    
    // 2. 检查表结构
    const columns = await db.getMany(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'registrations'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n表字段 (共', columns.length, '个):');
    columns.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(35)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 3. 检查索引
    const indexes = await db.getMany(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'registrations'
      ORDER BY indexname;
    `);
    
    console.log('\n索引 (共', indexes.length, '个):');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // 4. 检查外键约束
    const foreignKeys = await db.getMany(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'registrations';
    `);
    
    console.log('\n外键约束 (共', foreignKeys.length, '个):');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    });
    
    // 5. 检查 CHECK 约束
    const checkConstraints = await db.getMany(`
      SELECT
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'registrations'
      AND con.contype = 'c';
    `);
    
    console.log('\nCHECK 约束 (共', checkConstraints.length, '个):');
    checkConstraints.forEach(chk => {
      console.log(`  - ${chk.constraint_name}: ${chk.constraint_definition}`);
    });
    
    console.log('\n✓ registrations 表结构验证完成!\n');
    
  } catch (error) {
    console.error('\n✗ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

verifyTable();
