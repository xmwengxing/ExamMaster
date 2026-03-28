// 导入人工智能训练师专业对照表
// 从 Word 文档中提取专业名称并导入到数据库

import mammoth from 'mammoth';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('开始导入人工智能训练师专业对照表...');

    // 读取 Word 文档
    const docPath = path.join(__dirname, '../报名管理/人工智能训练师专业对照表.docx');
    const result = await mammoth.extractRawText({ path: docPath });
    const text = result.value;

    console.log('文档内容提取成功');
    console.log('文档内容预览:', text.substring(0, 500));

    // 解析专业名称
    // 假设文档格式为每行一个专业名称,或者用逗号、分号分隔
    const lines = text.split('\n');
    const majors = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // 跳过空行、标题行、说明行
      if (!trimmed || 
          trimmed.includes('专业对照表') || 
          trimmed.includes('说明') ||
          trimmed.includes('备注') ||
          trimmed.length < 2) {
        continue;
      }

      // 如果一行包含多个专业(用逗号、分号、顿号分隔)
      const parts = trimmed.split(/[,，;；、]/);
      for (const part of parts) {
        const major = part.trim();
        if (major && major.length >= 2 && major.length <= 50) {
          majors.push(major);
        }
      }
    }

    // 去重
    const uniqueMajors = [...new Set(majors)];
    console.log(`\n提取到 ${uniqueMajors.length} 个不同的专业名称`);
    console.log('专业列表:', uniqueMajors.slice(0, 10), '...');

    // 导入到数据库
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const major of uniqueMajors) {
      try {
        // 检查是否已存在
        const existing = await db.getOne(
          'SELECT * FROM major_mappings WHERE occupation = $1 AND major_name = $2',
          ['人工智能训练师', major]
        );

        if (existing) {
          console.log(`跳过已存在的专业: ${major}`);
          skipped++;
          continue;
        }

        // 插入新记录
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.query(
          `INSERT INTO major_mappings 
           (id, occupation, major_name, level_4_compatible, level_3_compatible, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, '人工智能训练师', major, false, true, now, now]
        );

        console.log(`✓ 导入专业: ${major}`);
        imported++;
      } catch (error) {
        console.error(`✗ 导入失败: ${major}`, error.message);
        errors.push({ major, error: error.message });
      }
    }

    console.log('\n导入完成!');
    console.log(`成功: ${imported} 条`);
    console.log(`跳过: ${skipped} 条`);
    console.log(`失败: ${errors.length} 条`);

    if (errors.length > 0) {
      console.log('\n失败详情:');
      errors.forEach(({ major, error }) => {
        console.log(`  - ${major}: ${error}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

main();
