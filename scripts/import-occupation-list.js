/**
 * 导入职业工种清单脚本
 * 从 Excel 文件导入职业工种数据到数据库
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../db.js';
import * as registrationService from '../src/services/registration.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('开始导入职业工种清单...\n');
  
  try {
    // Excel 文件路径
    const excelPath = join(__dirname, '../报名管理/福建省社会培训评价组织职业工种清单.xlsx');
    
    console.log('Excel 文件路径:', excelPath);
    console.log('开始解析和导入数据...\n');
    
    // 调用导入服务
    const result = await registrationService.importOccupationsFromExcel(db, excelPath);
    
    console.log('\n=== 导入完成 ===');
    console.log(`✓ 成功导入: ${result.imported} 条`);
    console.log(`✓ 跳过重复: ${result.skipped} 条`);
    console.log(`✗ 导入失败: ${result.errors.length} 条`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n错误详情:');
      result.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err}`);
      });
    }
    
    // 验证导入结果
    console.log('\n=== 验证导入结果 ===');
    const occupations = await registrationService.getOccupations(db);
    console.log(`✓ 数据库中共有 ${occupations.length} 个职业`);
    
    // 显示前10个职业
    console.log('\n前10个职业:');
    occupations.slice(0, 10).forEach((occ, index) => {
      console.log(`  ${index + 1}. ${occ}`);
    });
    
    // 测试获取某个职业的工种方向
    if (occupations.length > 0) {
      const testOccupation = '互联网营销师';
      console.log(`\n测试获取"${testOccupation}"的工种方向:`);
      const directions = await registrationService.getOccupationDirections(db, testOccupation);
      if (directions.length > 0) {
        directions.forEach((dir, index) => {
          console.log(`  ${index + 1}. ${dir}`);
        });
      } else {
        console.log('  该职业没有工种方向');
      }
    }
    
  } catch (error) {
    console.error('\n导入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

main();
