/**
 * 智能题目格式转换脚本（自动检测格式）
 * 自动识别Excel/Word文件的列结构，适配不同格式
 * 
 * 使用方法：
 * 1. 安装依赖：npm install xlsx mammoth
 * 2. 运行脚本：node scripts/convert-questions-auto.js
 * 3. 指定章节：node scripts/convert-questions-auto.js --chapter "九上第一单元"
 */

import XLSX from 'xlsx';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
let CUSTOM_CHAPTER = null;
const chapterIndex = process.argv.indexOf('--chapter');
if (chapterIndex !== -1 && chapterIndex + 1 < process.argv.length) {
  CUSTOM_CHAPTER = process.argv[chapterIndex + 1];
}

// CSV 转义函数
function escapeCsvField(field) {
  if (!field) return '';
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 标准化题型
function normalizeQuestionType(type) {
  if (!type) return 'SINGLE';
  const typeStr = String(type).trim().toUpperCase();
  
  if (typeStr.includes('单选') || typeStr === 'SINGLE' || typeStr === 'A' || typeStr === '1') {
    return 'SINGLE';
  }
  if (typeStr.includes('多选') || typeStr === 'MULTIPLE' || typeStr === 'B' || typeStr === '2') {
    return 'MULTIPLE';
  }
  if (typeStr.includes('判断') || typeStr === 'JUDGE' || typeStr === 'C' || typeStr === '3') {
    return 'JUDGE';
  }
  return 'SINGLE';
}

// 标准化答案格式
function normalizeAnswer(answer, questionType) {
  if (!answer) return '';
  const answerStr = String(answer).trim().toUpperCase();
  
  if (questionType === 'JUDGE') {
    if (answerStr.includes('正确') || answerStr === '对' || answerStr === '√' || 
        answerStr === 'T' || answerStr === 'TRUE' || answerStr === 'A' || answerStr === '1') {
      return 'A';
    }
    if (answerStr.includes('错误') || answerStr === '错' || answerStr === '×' || 
        answerStr === 'F' || answerStr === 'FALSE' || answerStr === 'B' || answerStr === '0') {
      return 'B';
    }
  }
  
  return answerStr.replace(/[^A-Z]/g, '');
}

// 处理选项
function normalizeOptions(options, questionType) {
  if (questionType === 'JUDGE') {
    return '';
  }
  
  if (!options) return '';
  
  let optionsList = [];
  const optionsStr = String(options).trim();
  
  // 尝试多种分隔符
  if (optionsStr.includes('|')) {
    optionsList = optionsStr.split('|');
  } else if (optionsStr.includes('\n')) {
    optionsList = optionsStr.split('\n');
  } else if (optionsStr.includes('；')) {
    optionsList = optionsStr.split('；');
  } else if (optionsStr.includes(';')) {
    optionsList = optionsStr.split(';');
  } else if (optionsStr.includes('###')) {
    optionsList = optionsStr.split('###');
  } else {
    // 尝试匹配 A. B. C. D. 格式
    const matches = optionsStr.match(/[A-Z][.、．]\s*[^A-Z.、．]+/g);
    if (matches) {
      optionsList = matches.map(m => m.replace(/^[A-Z][.、．]\s*/, ''));
    } else {
      optionsList = [optionsStr];
    }
  }
  
  // 清理选项
  optionsList = optionsList.map(opt => {
    return opt.trim()
      .replace(/^[A-Z][.、．]\s*/, '')
      .replace(/^[①②③④⑤⑥⑦⑧]\s*/, '')
      .replace(/^\d+[.、．]\s*/, '')
      .replace(/^[（(]\s*[A-Z]\s*[)）]\s*/, '');
  }).filter(opt => opt.length > 0);
  
  return optionsList.join('|');
}

// 智能检测Excel列结构
function detectExcelColumns(worksheet) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length === 0) return null;
  
  const headerRow = data[0];
  const columns = {
    type: -1,
    question: -1,
    options: -1,
    answer: -1,
    explanation: -1
  };
  
  // 检测列
  headerRow.forEach((header, index) => {
    const h = String(header).trim().toLowerCase();
    
    if (h.includes('题型') || h.includes('type') || h === '类型') {
      columns.type = index;
    } else if (h.includes('题干') || h.includes('题目') || h.includes('question') || h === '内容') {
      columns.question = index;
    } else if (h.includes('选项') || h.includes('option')) {
      columns.options = index;
    } else if (h.includes('答案') || h.includes('answer') || h === '正确答案') {
      columns.answer = index;
    } else if (h.includes('解析') || h.includes('explanation') || h.includes('说明')) {
      columns.explanation = index;
    }
  });
  
  // 如果没有检测到标题，尝试按位置推断
  if (columns.question === -1) {
    if (headerRow.length >= 5) {
      columns.type = 0;
      columns.question = 1;
      columns.options = 2;
      columns.answer = 3;
      columns.explanation = 4;
    } else if (headerRow.length >= 4) {
      columns.question = 0;
      columns.options = 1;
      columns.answer = 2;
      columns.explanation = 3;
    }
  }
  
  console.log('  检测到的列结构：', columns);
  return columns;
}

// 转换Excel文件（智能检测）
async function convertExcelFile(filePath) {
  console.log(`正在处理：${filePath}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 检测列结构
    const columns = detectExcelColumns(worksheet);
    if (!columns) {
      console.log('  ⚠ 无法识别文件结构');
      return [];
    }
    
    const questions = [];
    const startRow = (columns.type >= 0 || columns.question >= 0) ? 1 : 0;
    
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // 提取数据
      const typeValue = columns.type >= 0 ? row[columns.type] : '';
      const questionValue = columns.question >= 0 ? row[columns.question] : row[0];
      const optionsValue = columns.options >= 0 ? row[columns.options] : row[1];
      const answerValue = columns.answer >= 0 ? row[columns.answer] : row[2];
      const explanationValue = columns.explanation >= 0 ? row[columns.explanation] : row[3];
      
      if (!questionValue) continue;
      
      const questionType = normalizeQuestionType(typeValue);
      const question = String(questionValue).trim();
      const options = normalizeOptions(optionsValue, questionType);
      const answer = normalizeAnswer(answerValue, questionType);
      const explanation = explanationValue ? String(explanationValue).trim() : '';
      
      if (question) {
        questions.push({
          type: questionType,
          question,
          options,
          answer,
          explanation
        });
      }
    }
    
    console.log(`  ✓ 成功转换 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error(`  ✗ 处理失败：${error.message}`);
    return [];
  }
}

// 转换Word文档
async function convertWordFile(filePath) {
  console.log(`正在处理：${filePath}`);
  
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    const questions = [];
    let currentQuestion = null;
    let optionsList = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 检测题目开始
      const questionMatch = line.match(/^(\d+)[.、．)\s]+(.+)/);
      if (questionMatch) {
        // 保存上一题
        if (currentQuestion && currentQuestion.question) {
          if (optionsList.length > 0) {
            currentQuestion.options = optionsList.join('|');
          }
          questions.push(currentQuestion);
        }
        
        // 开始新题
        currentQuestion = {
          type: 'SINGLE',
          question: questionMatch[2].trim(),
          options: '',
          answer: '',
          explanation: ''
        };
        optionsList = [];
        continue;
      }
      
      if (!currentQuestion) continue;
      
      // 检测选项
      const optionMatch = line.match(/^([A-Z])[.、．)\s]+(.+)/);
      if (optionMatch) {
        optionsList.push(optionMatch[2].trim());
        continue;
      }
      
      // 检测答案
      const answerMatch = line.match(/^(?:答案|正确答案|参考答案)[:：\s]+([A-Z]+|正确|错误|对|错)/i);
      if (answerMatch) {
        currentQuestion.answer = normalizeAnswer(answerMatch[1], currentQuestion.type);
        
        // 根据答案判断题型
        if (currentQuestion.answer.length > 1) {
          currentQuestion.type = 'MULTIPLE';
        } else if (optionsList.length === 0 || optionsList.length === 2) {
          // 没有选项或只有2个选项，可能是判断题
          const ans = answerMatch[1].trim();
          if (ans === '正确' || ans === '错误' || ans === '对' || ans === '错') {
            currentQuestion.type = 'JUDGE';
            optionsList = [];
          }
        }
        continue;
      }
      
      // 检测解析
      const explanationMatch = line.match(/^(?:解析|答案解析|说明)[:：\s]+(.+)/i);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1].trim();
        continue;
      }
      
      // 题干延续
      if (currentQuestion.question && optionsList.length === 0 && 
          !currentQuestion.answer && !line.match(/^[A-Z][.、．)/)) {
        currentQuestion.question += ' ' + line;
      }
    }
    
    // 保存最后一题
    if (currentQuestion && currentQuestion.question) {
      if (optionsList.length > 0) {
        currentQuestion.options = optionsList.join('|');
      }
      questions.push(currentQuestion);
    }
    
    console.log(`  ✓ 成功转换 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error(`  ✗ 处理失败：${error.message}`);
    return [];
  }
}

// 生成CSV文件
function generateCSV(questions, outputFile) {
  const header = '题型(SINGLE/MULTIPLE/JUDGE/FILL_IN_BLANK/SHORT_ANSWER),题干,选项(用|分隔),答案,解析,单元/章节,填空配置(格式:blank1:答案1|答案2;blank2:答案3),简答参考答案\n';
  
  const rows = questions.map(q => {
    return [
      q.type,
      escapeCsvField(q.question),
      escapeCsvField(q.options),
      q.answer,
      escapeCsvField(q.explanation),
      escapeCsvField(q.chapter || ''),  // 单元/章节
      escapeCsvField(q.fillBlanks || ''),  // 填空配置
      escapeCsvField(q.shortAnswer || '')  // 简答参考答案
    ].join(',');
  });
  
  const csv = header + rows.join('\n');
  fs.writeFileSync(outputFile, csv, 'utf8');
  console.log(`\n✓ 已生成：${outputFile}`);
}

// 生成统计报告
function generateReport(questions) {
  const stats = {
    total: questions.length,
    single: questions.filter(q => q.type === 'SINGLE').length,
    multiple: questions.filter(q => q.type === 'MULTIPLE').length,
    judge: questions.filter(q => q.type === 'JUDGE').length,
    withExplanation: questions.filter(q => q.explanation).length
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('转换统计');
  console.log('='.repeat(60));
  console.log(`总题目数：${stats.total}`);
  console.log(`  - 单选题：${stats.single} (${(stats.single/stats.total*100).toFixed(1)}%)`);
  console.log(`  - 多选题：${stats.multiple} (${(stats.multiple/stats.total*100).toFixed(1)}%)`);
  console.log(`  - 判断题：${stats.judge} (${(stats.judge/stats.total*100).toFixed(1)}%)`);
  console.log(`包含解析：${stats.withExplanation} (${(stats.withExplanation/stats.total*100).toFixed(1)}%)`);
  console.log('='.repeat(60));
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('智能题目格式转换工具');
  console.log('='.repeat(60));
  console.log('');
  
  if (CUSTOM_CHAPTER) {
    console.log(`📌 已设置章节信息: ${CUSTOM_CHAPTER}`);
    console.log('   所有题目将统一使用此章节信息');
    console.log('');
  }
  
  const allQuestions = [];
  
  // 扫描所有Excel和Word文件
  const files = fs.readdirSync('.')
    .filter(f => f.match(/^原始题库.*\.(xlsx|xls|docx)$/i));
  
  if (files.length === 0) {
    console.log('❌ 未找到原始题库文件');
    console.log('\n请将文件命名为"原始题库样本*.xlsx"或"原始题库样本*.docx"');
    console.log('例如：原始题库样本1.xlsx、原始题库样本2.xlsx、原始题库样本3.docx');
    return;
  }
  
  console.log(`找到 ${files.length} 个文件：`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');
  
  // 处理每个文件
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    let questions = [];
    
    if (ext === '.xlsx' || ext === '.xls') {
      questions = await convertExcelFile(file);
    } else if (ext === '.docx') {
      questions = await convertWordFile(file);
    }
    
    // 如果用户指定了章节，覆盖所有题目的章节信息
    if (CUSTOM_CHAPTER) {
      questions.forEach(q => {
        q.chapter = CUSTOM_CHAPTER;
      });
    }
    
    allQuestions.push(...questions);
    console.log('');
  }
  
  if (allQuestions.length === 0) {
    console.log('❌ 没有成功转换任何题目');
    return;
  }
  
  // 生成统计报告
  generateReport(allQuestions);
  
  // 生成CSV文件
  console.log('\n正在生成CSV文件...\n');
  generateCSV(allQuestions, '转换后的题目-合并.csv');
  
  // 按题型分类
  const singleQuestions = allQuestions.filter(q => q.type === 'SINGLE');
  const multipleQuestions = allQuestions.filter(q => q.type === 'MULTIPLE');
  const judgeQuestions = allQuestions.filter(q => q.type === 'JUDGE');
  
  if (singleQuestions.length > 0) {
    generateCSV(singleQuestions, '转换后的题目-单选题.csv');
  }
  if (multipleQuestions.length > 0) {
    generateCSV(multipleQuestions, '转换后的题目-多选题.csv');
  }
  if (judgeQuestions.length > 0) {
    generateCSV(judgeQuestions, '转换后的题目-判断题.csv');
  }
  
  console.log('\n✅ 转换完成！');
  if (CUSTOM_CHAPTER) {
    console.log(`\n📌 所有题目已设置章节: ${CUSTOM_CHAPTER}`);
  }
  console.log('\n📝 提示：生成的CSV文件已更新为新格式（8个字段）');
  console.log('        包含：题型、题干、选项、答案、解析、单元/章节、填空配置、简答参考答案');
  console.log('        请检查生成的CSV文件，确认格式正确后再导入系统。');
}

// 运行
main().catch(console.error);
