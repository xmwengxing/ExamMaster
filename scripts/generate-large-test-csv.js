/**
 * 生成大批量测试CSV文件
 * 用于测试导入性能和错误处理
 */

import fs from 'fs';

// CSV 转义函数
function escapeCsvField(field) {
  if (!field) return '';
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 生成题目
function generateQuestions(count) {
  const questions = [];
  const types = ['SINGLE', 'MULTIPLE', 'JUDGE'];
  
  for (let i = 1; i <= count; i++) {
    const type = types[i % 3];
    let question, options, answer;
    
    if (type === 'SINGLE') {
      question = `单选题${i}：这是第${i}道单选题`;
      options = `选项A${i}|选项B${i}|选项C${i}|选项D${i}`;
      answer = ['A', 'B', 'C', 'D'][i % 4];
    } else if (type === 'MULTIPLE') {
      question = `多选题${i}：这是第${i}道多选题`;
      options = `选项A${i}|选项B${i}|选项C${i}|选项D${i}`;
      answer = ['AB', 'ABC', 'ACD', 'ABCD'][i % 4];
    } else {
      question = `判断题${i}：这是第${i}道判断题`;
      options = '';
      answer = i % 2 === 0 ? 'A' : 'B';
    }
    
    // 每10题添加一些特殊字符
    if (i % 10 === 0) {
      question += '，包含逗号';
    }
    if (i % 15 === 0) {
      question += '和"引号"';
    }
    
    const explanation = `这是第${i}题的解析说明`;
    
    questions.push({
      type,
      question,
      options,
      answer,
      explanation
    });
  }
  
  return questions;
}

// 生成CSV文件
function generateCSV(questions, filename) {
  const header = '题型(SINGLE/MULTIPLE/JUDGE),题干,选项(用|分隔;判断题可留空),答案(如A或ABC),解析\n';
  
  const rows = questions.map(q => {
    return [
      q.type,
      escapeCsvField(q.question),
      escapeCsvField(q.options),
      q.answer,
      escapeCsvField(q.explanation)
    ].join(',');
  });
  
  const csv = header + rows.join('\n');
  fs.writeFileSync(filename, '\uFEFF' + csv, 'utf8');
  
  return csv;
}

// 主函数
function main() {
  console.log('='.repeat(60));
  console.log('生成大批量测试CSV文件');
  console.log('='.repeat(60));
  console.log('');
  
  const sizes = [
    { count: 100, name: '测试-100题.csv' },
    { count: 500, name: '测试-500题.csv' },
    { count: 1000, name: '测试-1000题.csv' }
  ];
  
  for (const size of sizes) {
    console.log(`生成 ${size.count} 题...`);
    const startTime = Date.now();
    
    const questions = generateQuestions(size.count);
    generateCSV(questions, size.name);
    
    const elapsed = Date.now() - startTime;
    const fileSize = (fs.statSync(size.name).size / 1024).toFixed(2);
    
    console.log(`✓ 已生成：${size.name}`);
    console.log(`  - 题目数：${size.count}`);
    console.log(`  - 文件大小：${fileSize} KB`);
    console.log(`  - 生成耗时：${elapsed} ms`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('生成完成！');
  console.log('='.repeat(60));
  console.log('');
  console.log('使用方法：');
  console.log('1. 在系统中创建测试题库');
  console.log('2. 导入生成的CSV文件');
  console.log('3. 观察导入速度和结果');
  console.log('');
  console.log('性能参考：');
  console.log('- 100题：应在1秒内完成');
  console.log('- 500题：应在3-5秒内完成');
  console.log('- 1000题：应在10秒内完成');
  console.log('');
}

main();
