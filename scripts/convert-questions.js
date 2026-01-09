/**
 * 题目格式转换脚本
 * 将原始题库文件（Excel/Word）转换为系统要求的CSV格式
 * 
 * 使用方法：
 * 1. 安装依赖：npm install xlsx mammoth
 * 2. 运行脚本：node scripts/convert-questions.js
 */

import XLSX from 'xlsx';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV 转义函数
function escapeCsvField(field) {
  if (!field) return '';
  const str = String(field).trim();
  // 如果包含逗号、引号或换行符，需要用双引号包裹，并转义内部的双引号
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 标准化题型
function normalizeQuestionType(type) {
  const typeStr = String(type).trim().toUpperCase();
  if (typeStr.includes('单选') || typeStr === 'SINGLE' || typeStr === 'A') {
    return 'SINGLE';
  }
  if (typeStr.includes('多选') || typeStr === 'MULTIPLE' || typeStr === 'B') {
    return 'MULTIPLE';
  }
  if (typeStr.includes('判断') || typeStr === 'JUDGE' || typeStr === 'C') {
    return 'JUDGE';
  }
  return 'SINGLE'; // 默认单选
}

// 标准化答案格式
function normalizeAnswer(answer, questionType) {
  if (!answer) return '';
  const answerStr = String(answer).trim().toUpperCase();
  
  if (questionType === 'JUDGE') {
    // 判断题：正确/对/√/T -> A, 错误/错/×/F -> B
    if (answerStr.includes('正确') || answerStr === '对' || answerStr === '√' || answerStr === 'T' || answerStr === 'TRUE') {
      return 'A';
    }
    if (answerStr.includes('错误') || answerStr === '错' || answerStr === '×' || answerStr === 'F' || answerStr === 'FALSE') {
      return 'B';
    }
  }
  
  // 移除所有非字母字符
  return answerStr.replace(/[^A-Z]/g, '');
}

// 处理选项：将多种格式统一为 A|B|C|D 格式
function normalizeOptions(options, questionType) {
  if (questionType === 'JUDGE') {
    return ''; // 判断题不需要选项
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
  } else {
    // 尝试匹配 A. B. C. D. 格式
    const matches = optionsStr.match(/[A-Z][.、．]\s*[^A-Z.、．]+/g);
    if (matches) {
      optionsList = matches.map(m => m.replace(/^[A-Z][.、．]\s*/, ''));
    } else {
      optionsList = [optionsStr];
    }
  }
  
  // 清理选项：移除序号（A. B. 等）
  optionsList = optionsList.map(opt => {
    return opt.trim()
      .replace(/^[A-Z][.、．]\s*/, '')
      .replace(/^[①②③④⑤⑥⑦⑧]\s*/, '')
      .replace(/^\d+[.、．]\s*/, '');
  }).filter(opt => opt.length > 0);
  
  return optionsList.join('|');
}

// 转换样本1（假设格式：题型 | 题干 | 选项 | 答案 | 解析）
async function convertSample1() {
  console.log('正在处理：原始题库样本1.xlsx');
  
  try {
    const workbook = XLSX.readFile('原始题库样本1.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const questions = [];
    
    // 跳过标题行，从第二行开始
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[0]) continue;
      
      const questionType = normalizeQuestionType(row[0] || '');
      const question = String(row[1] || '').trim();
      const options = normalizeOptions(row[2] || '', questionType);
      const answer = normalizeAnswer(row[3] || '', questionType);
      const explanation = String(row[4] || '').trim();
      
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
    
    console.log(`样本1：成功转换 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error('处理样本1时出错：', error.message);
    return [];
  }
}

// 转换样本2（假设格式可能不同）
async function convertSample2() {
  console.log('正在处理：原始题库样本2.xlsx');
  
  try {
    const workbook = XLSX.readFile('原始题库样本2.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const questions = [];
    
    // 跳过标题行
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[0]) continue;
      
      const questionType = normalizeQuestionType(row[0] || '');
      const question = String(row[1] || '').trim();
      const options = normalizeOptions(row[2] || '', questionType);
      const answer = normalizeAnswer(row[3] || '', questionType);
      const explanation = String(row[4] || '').trim();
      
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
    
    console.log(`样本2：成功转换 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error('处理样本2时出错：', error.message);
    return [];
  }
}

// 转换样本3（Word文档）
async function convertSample3() {
  console.log('正在处理：原始题库样本3.docx');
  
  try {
    const result = await mammoth.extractRawText({ path: '原始题库样本3.docx' });
    const text = result.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    const questions = [];
    let currentQuestion = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测题目开始（通常以数字开头）
      const questionMatch = line.match(/^(\d+)[.、．]\s*(.+)/);
      if (questionMatch) {
        // 保存上一题
        if (currentQuestion && currentQuestion.question) {
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
        continue;
      }
      
      if (!currentQuestion) continue;
      
      // 检测选项（A. B. C. D.）
      const optionMatch = line.match(/^([A-Z])[.、．]\s*(.+)/);
      if (optionMatch) {
        if (currentQuestion.options) {
          currentQuestion.options += '|';
        }
        currentQuestion.options += optionMatch[2].trim();
        continue;
      }
      
      // 检测答案
      const answerMatch = line.match(/^[答案|正确答案][:：]\s*([A-Z]+)/i);
      if (answerMatch) {
        currentQuestion.answer = answerMatch[1].toUpperCase();
        
        // 根据答案长度判断题型
        if (currentQuestion.answer.length > 1) {
          currentQuestion.type = 'MULTIPLE';
        } else if (!currentQuestion.options) {
          currentQuestion.type = 'JUDGE';
        }
        continue;
      }
      
      // 检测解析
      const explanationMatch = line.match(/^[解析|答案解析][:：]\s*(.+)/i);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1].trim();
        continue;
      }
      
      // 如果是题干的延续
      if (currentQuestion.question && !currentQuestion.options && !line.match(/^[A-Z][.、．]/)) {
        currentQuestion.question += ' ' + line;
      }
    }
    
    // 保存最后一题
    if (currentQuestion && currentQuestion.question) {
      questions.push(currentQuestion);
    }
    
    console.log(`样本3：成功转换 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error('处理样本3时出错：', error.message);
    return [];
  }
}

// 生成CSV文件
function generateCSV(questions, outputFile) {
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
  fs.writeFileSync(outputFile, csv, 'utf8');
  console.log(`\n✓ 已生成文件：${outputFile}`);
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('题目格式转换工具');
  console.log('='.repeat(60));
  console.log('');
  
  const allQuestions = [];
  
  // 检查文件是否存在
  const files = [
    { name: '原始题库样本1.xlsx', converter: convertSample1 },
    { name: '原始题库样本2.xlsx', converter: convertSample2 },
    { name: '原始题库样本3.docx', converter: convertSample3 }
  ];
  
  for (const file of files) {
    if (fs.existsSync(file.name)) {
      const questions = await file.converter();
      allQuestions.push(...questions);
    } else {
      console.log(`⚠ 文件不存在，跳过：${file.name}`);
    }
  }
  
  if (allQuestions.length === 0) {
    console.log('\n❌ 没有找到可转换的题目');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`总计转换：${allQuestions.length} 道题目`);
  console.log('='.repeat(60));
  
  // 生成合并的CSV文件
  generateCSV(allQuestions, '转换后的题目-合并.csv');
  
  // 按题型分类生成CSV文件
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
  
  console.log('\n✓ 转换完成！');
  console.log('\n提示：请检查生成的CSV文件，确认格式正确后再导入系统。');
}

// 运行
main().catch(console.error);
