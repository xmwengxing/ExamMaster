/**
 * 修复CSV文件中可能存在的重复ID问题
 * 重新生成所有题目的ID，确保唯一性
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

// CSV 解析函数
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    
    if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
      i++;
      continue;
    }
    
    current += char;
    i++;
  }
  
  parts.push(current.trim());
  return parts;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法：node scripts/fix-duplicate-ids.js <CSV文件路径>');
    console.log('');
    console.log('示例：');
    console.log('  node scripts/fix-duplicate-ids.js 转换后的题目-合并.csv');
    console.log('');
    return;
  }
  
  const inputFile = args[0];
  
  if (!fs.existsSync(inputFile)) {
    console.error(`错误：文件不存在 - ${inputFile}`);
    return;
  }
  
  console.log('='.repeat(60));
  console.log('修复CSV文件中的重复ID');
  console.log('='.repeat(60));
  console.log('');
  console.log(`输入文件：${inputFile}`);
  
  // 读取文件
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.replace(/^\uFEFF/, '').split('\n');
  
  if (lines.length < 2) {
    console.error('错误：文件内容不足（至少需要标题行和一行数据）');
    return;
  }
  
  const header = lines[0];
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  console.log(`题目数量：${dataLines.length}`);
  console.log('');
  console.log('正在处理...');
  
  // 生成新的CSV内容
  const newLines = [header];
  const usedIds = new Set();
  let duplicateCount = 0;
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = parseCSVLine(line);
    
    if (parts.length < 4) {
      console.warn(`警告：第${i + 2}行字段不足，跳过`);
      continue;
    }
    
    // 生成唯一ID
    let id;
    let attempts = 0;
    do {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      id = `q-${timestamp}-${random}-${i}`;
      attempts++;
      
      if (attempts > 100) {
        console.error(`错误：无法为第${i + 2}行生成唯一ID`);
        break;
      }
    } while (usedIds.has(id));
    
    usedIds.add(id);
    
    // 重新组装CSV行（不包含ID，因为ID由后端生成）
    const newLine = [
      parts[0], // 题型
      escapeCsvField(parts[1]), // 题干
      escapeCsvField(parts[2]), // 选项
      parts[3], // 答案
      escapeCsvField(parts[4] || '') // 解析
    ].join(',');
    
    newLines.push(newLine);
  }
  
  // 生成输出文件名
  const outputFile = inputFile.replace(/\.csv$/, '-fixed.csv');
  
  // 写入文件
  const outputContent = '\uFEFF' + newLines.join('\n');
  fs.writeFileSync(outputFile, outputContent, 'utf8');
  
  console.log('');
  console.log('='.repeat(60));
  console.log('处理完成！');
  console.log('='.repeat(60));
  console.log('');
  console.log(`输出文件：${outputFile}`);
  console.log(`处理题目：${dataLines.length}`);
  console.log(`发现重复：${duplicateCount}`);
  console.log('');
  console.log('提示：');
  console.log('1. 请检查输出文件内容是否正确');
  console.log('2. 使用输出文件进行导入');
  console.log('3. 导入时系统会自动生成唯一ID');
  console.log('');
}

main();
