// 导入人工智能训练师专业对照表
// 根据文档手动整理的专业列表

import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

// 人工智能训练师相关专业列表
// 根据《人工智能训练师》（2021年版）国家职业技能标准整理
const majors = [
  // 电子信息类 - 本科
  '电子信息工程', '电子科学与技术', '通信工程', '微电子科学与工程',
  '光电信息科学与工程', '信息工程', '广播电视工程', '人工智能',
  '智能科学与技术', '电磁场与无线技术',
  
  // 计算机类 - 本科
  '计算机科学与技术', '软件工程', '网络工程', '信息安全',
  '数字媒体技术', '智能科学与技术', '数据科学与大数据技术',
  '网络空间安全', '虚拟现实技术', '区块链工程',
  
  // 通信类 - 专科
  '通信技术', '现代通信技术', '移动通信技术', '光通信技术',
  
  // 计算机类 - 专科
  '计算机应用技术', '软件技术', '大数据技术', '云计算技术应用',
  '人工智能技术应用', '人工智能技术服务', '虚拟现实技术应用',
  '区块链技术应用', '信息安全技术应用',
  
  // 电子信息类 - 专科
  '电子信息工程技术', '物联网应用技术', '应用电子技术',
  '智能产品开发与应用', '智能终端技术与应用',
  
  // 中职专业
  '计算机应用', '计算机网络技术', '软件与信息服务',
  '数字媒体技术应用', '物联网技术应用', '电子信息技术',
  
  // 医药卫生类
  '护理学', '护理', '助产', '药学', '中医学', '针灸推拿',
  '康复治疗学', '康复治疗技术', '医学检验技术', '医学影像技术',
  
  // 装备制造类
  '机械设计制造及其自动化', '机械工程', '机电一体化技术',
  '电气自动化技术', '工业机器人技术', '智能制造工程',
  '自动化', '机器人工程',
  
  // 教育类
  '教育技术学', '现代教育技术', '学前教育', '小学教育',
  
  // 语言类
  '英语', '商务英语', '应用英语', '日语', '应用日语',
  
  // 体育类
  '体育教育', '社会体育指导与管理', '运动训练',
  
  // 其他相关专业
  '数据科学与大数据技术', '物联网工程', '电子商务',
  '电子商务技术', '移动应用开发', '工业互联网技术',
  '智能控制技术', '新能源汽车技术', '汽车电子技术'
];

async function main() {
  try {
    console.log('开始导入人工智能训练师专业对照表...');
    console.log(`共 ${majors.length} 个专业\n`);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const major of majors) {
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
