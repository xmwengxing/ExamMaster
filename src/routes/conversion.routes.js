/**
 * 题库转换API路由
 * 支持Excel和Word文档转换
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

const router = express.Router();

// 配置文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB（Web版本限制，大文件请使用本地GUI工具）
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式,请上传Excel或Word文件'));
    }
  }
});

/**
 * 智能检测题型
 * 与Python转换工具保持一致的识别逻辑
 */
function detectQuestionType(content, options, answer) {
  const hasOptions = options && options.length > 0;
  
  // 1. 检测填空题：题目中包含连续下划线（但如果有选项，则不是填空题）
  if (!hasOptions) {
    if (content.includes('___') || content.includes('____') || content.includes('______')) {
      return 'FILL_IN_BLANK';
    }
  }
  
  // 2. 检测简答题/问答题：没有选项，且答案较长或包含特定关键词
  if (!hasOptions) {
    // 检查题目内容是否包含问答题特征
    const keywords = ['阅读材料', '根据材料', '结合所学', '分析', '概括', '归纳', '论述', '简述', '说明', '回答问题', '完成任务'];
    const hasKeyword = keywords.some(kw => content.includes(kw));
    
    if (hasKeyword) {
      return 'SHORT_ANSWER';
    }
    
    // 答案较长也认为是简答题
    if (answer && answer.toString().trim().length > 10) {
      return 'SHORT_ANSWER';
    }
  }
  
  // 3. 检测判断题：只有2个选项，或答案是"正确/错误"
  if (hasOptions && options.length === 2) {
    const optText = options.join('').toLowerCase();
    if (optText.includes('正确') || optText.includes('错误') || 
        optText.includes('对') || optText.includes('错') ||
        optText.includes('true') || optText.includes('false')) {
      return 'JUDGE';
    }
  }
  
  if (answer) {
    const ansLower = answer.toString().toLowerCase().trim();
    if (['正确', '错误', '对', '错', 'true', 'false', 't', 'f', 'a', 'b'].includes(ansLower)) {
      if (!hasOptions) {
        return 'JUDGE';
      }
    }
  }
  
  // 4. 检测多选题：答案包含多个字母
  if (answer) {
    const letters = answer.toString().toUpperCase().match(/[A-Z]/g);
    if (letters && letters.length > 1) {
      return 'MULTIPLE';
    }
  }
  
  // 5. 默认单选题
  return 'SINGLE';
}

/**
 * 标准化题型
 */
function normalizeQuestionType(typeStr) {
  if (!typeStr) return 'SINGLE';
  
  const type = typeStr.toString().trim().toUpperCase();
  
  if (type.includes('单选') || type === 'SINGLE' || type === 'A' || type === '1') {
    return 'SINGLE';
  }
  if (type.includes('多选') || type === 'MULTIPLE' || type === 'B' || type === '2') {
    return 'MULTIPLE';
  }
  if (type.includes('判断') || type === 'JUDGE' || type === 'C' || type === '3') {
    return 'JUDGE';
  }
  if (type.includes('填空') || type === 'FILL_IN_BLANK' || type === 'D' || type === '4') {
    return 'FILL_IN_BLANK';
  }
  if (type.includes('简答') || type.includes('问答') || type.includes('复合') || 
      type === 'SHORT_ANSWER' || type === 'ESSAY' || type === 'E' || type === '5') {
    return 'SHORT_ANSWER';
  }
  
  return 'SINGLE';
}

/**
 * 解析选项
 */
function parseOptions(optionsStr, type) {
  if (type === 'JUDGE' || type === 'FILL_IN_BLANK' || type === 'SHORT_ANSWER') {
    return undefined;
  }
  
  if (!optionsStr) return [];
  
  let options = [];
  
  if (optionsStr.includes('|')) {
    options = optionsStr.split('|');
  } else if (optionsStr.includes('\n')) {
    options = optionsStr.split('\n');
  } else if (optionsStr.includes('；')) {
    options = optionsStr.split('；');
  } else if (optionsStr.includes(';')) {
    options = optionsStr.split(';');
  } else {
    options = [optionsStr];
  }
  
  return options
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0)
    .map(opt => opt.replace(/^[A-Z][.、．]\s*/, '').trim());
}

/**
 * 解析答案
 */
function parseAnswer(answerStr, type) {
  if (!answerStr) return '';
  
  const answer = answerStr.toString().trim().toUpperCase();
  
  if (type === 'JUDGE') {
    if (answer.includes('正确') || answer.includes('对') || answer.includes('√') || 
        answer === 'T' || answer === 'TRUE' || answer === 'A' || answer === '1') {
      return 'A';
    }
    if (answer.includes('错误') || answer.includes('错') || answer.includes('×') || 
        answer === 'F' || answer === 'FALSE' || answer === 'B' || answer === '0') {
      return 'B';
    }
  }
  
  if (type === 'MULTIPLE') {
    return answer.split('').filter(c => /[A-Z]/.test(c));
  }
  
  return answer.replace(/[^A-Z]/g, '');
}

/**
 * 解析Excel文件
 */
async function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  const questions = [];
  
  for (const row of rows) {
    try {
      const content = row['题干'] || row['题目内容'] || row['question'] || row['content'];
      if (!content) continue;
      
      const typeStr = row['题型'] || row['type'] || '';
      let type = normalizeQuestionType(typeStr);
      
      const optionsStr = row['选项'] || row['options'] || '';
      const options = parseOptions(optionsStr, type);
      
      const answerStr = row['答案'] || row['answer'] || '';
      const answer = parseAnswer(answerStr, type);
      
      // 智能题型识别：只有默认类型（SINGLE）才进行智能识别
      if (!typeStr || type === 'SINGLE') {
        const detectedType = detectQuestionType(content.toString(), options, answer);
        // 如果有明确的题型标记，则不覆盖；否则使用智能识别结果
        if (!typeStr) {
          type = detectedType;
        }
      }
      
      const explanation = row['解析'] || row['explanation'] || '';
      const chapter = row['单元/章节'] || row['chapter'] || '';
      const fillBlanks = row['填空配置'] || row['fillBlanks'] || '';
      const shortAnswer = row['简答参考答案'] || row['shortAnswer'] || '';
      
      questions.push({
        content: content.toString().trim(),
        type,
        options,
        answer,
        explanation: explanation ? explanation.toString().trim() : '',
        chapter: chapter ? chapter.toString().trim() : '',
        fillBlanks: fillBlanks ? fillBlanks.toString().trim() : '',
        shortAnswer: shortAnswer ? shortAnswer.toString().trim() : ''
      });
    } catch (error) {
      console.error('解析行失败:', error);
    }
  }
  
  return questions;
}

/**
 * 解析Word文件
 * 注意：Web版本不提取图片，只提取文本内容
 */
async function parseWordFile(filePath) {
  // 使用mammoth提取纯文本
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  // 按行分割
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const questions = [];
  let currentQuestion = null;
  let optionsList = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测题目开始（支持多种格式）
    // 格式1: 1. 题目内容
    // 格式2: 1、题目内容
    // 格式3: 【单选题】题目内容
    const questionMatch = line.match(/^(\d+)[.、．)\s]+(.+)/);
    const typeMatch = line.match(/^【(单选题|多选题|判断题|填空题|简答题|问答题|复合题)】(.+)/);
    
    if (questionMatch || typeMatch) {
      // 保存上一题
      if (currentQuestion && currentQuestion.content) {
        if (optionsList.length > 0) {
          currentQuestion.options = optionsList;
        }
        
        // 智能判断题型（如果没有明确的题型标记）
        if (currentQuestion.type === 'SINGLE') {
          currentQuestion.type = detectQuestionType(
            currentQuestion.content,
            optionsList,
            currentQuestion.answer
          );
        }
        
        questions.push(currentQuestion);
      }
      
      // 开始新题
      let content = '';
      let type = 'SINGLE';
      
      if (typeMatch) {
        const typeStr = typeMatch[1];
        type = normalizeQuestionType(typeStr);
        content = typeMatch[2];
      } else {
        content = questionMatch[2];
      }
      
      currentQuestion = {
        content: content.trim(),
        type: type,
        options: [],
        answer: '',
        explanation: '',
        chapter: ''
      };
      optionsList = [];
      continue;
    }
    
    // 检测选项（A. B. C. D. 或 A、B、C、D、）
    const optionMatch = line.match(/^([A-Z])[.、．]\s*(.+)/);
    if (optionMatch && currentQuestion) {
      optionsList.push(optionMatch[2].trim());
      continue;
    }
    
    // 检测答案
    const answerMatch = line.match(/^(答案|参考答案|正确答案)[：:]\s*(.+)/);
    if (answerMatch && currentQuestion) {
      currentQuestion.answer = parseAnswer(answerMatch[2], currentQuestion.type);
      continue;
    }
    
    // 检测解析
    const explanationMatch = line.match(/^(解析|答案解析|详解)[：:]\s*(.+)/);
    if (explanationMatch && currentQuestion) {
      currentQuestion.explanation = explanationMatch[2].trim();
      continue;
    }
    
    // 检测章节
    const chapterMatch = line.match(/^(章节|单元)[：:]\s*(.+)/);
    if (chapterMatch && currentQuestion) {
      currentQuestion.chapter = chapterMatch[2].trim();
      continue;
    }
    
    // 如果当前有题目，且不是特殊行，可能是题目内容的延续
    if (currentQuestion && !currentQuestion.answer && optionsList.length === 0) {
      currentQuestion.content += ' ' + line;
    }
  }
  
  // 保存最后一题
  if (currentQuestion && currentQuestion.content) {
    if (optionsList.length > 0) {
      currentQuestion.options = optionsList;
    }
    
    // 智能判断题型
    if (currentQuestion.type === 'SINGLE') {
      currentQuestion.type = detectQuestionType(
        currentQuestion.content,
        optionsList,
        currentQuestion.answer
      );
    }
    
    questions.push(currentQuestion);
  }
  
  return questions;
}

/**
 * 验证题目数据
 */
function validateQuestions(questions) {
  const errors = [];
  
  questions.forEach((question, index) => {
    if (!question.content || question.content.trim() === '') {
      errors.push({
        index,
        field: 'content',
        message: '题目内容不能为空',
        value: question.content,
        suggestion: '请填写题目内容'
      });
    }
    
    if (!question.answer) {
      errors.push({
        index,
        field: 'answer',
        message: '答案不能为空',
        value: question.answer,
        suggestion: '请填写答案'
      });
    }
    
    if ((question.type === 'SINGLE' || question.type === 'MULTIPLE') && 
        (!question.options || question.options.length < 2)) {
      errors.push({
        index,
        field: 'options',
        message: '选择题至少需要2个选项',
        value: question.options,
        suggestion: '请添加更多选项'
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * POST /api/convert/upload
 * 上传文件并转换
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let questions = [];

    // 根据文件类型选择解析器
    if (ext === '.xlsx' || ext === '.xls') {
      questions = await parseExcelFile(req.file.path);
    } else if (ext === '.docx') {
      questions = await parseWordFile(req.file.path);
    } else {
      // 清理临时文件
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: '不支持的文件格式'
      });
    }

    // 验证
    const validation = validateQuestions(questions);

    // 清理临时文件
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          fileName: req.file.originalname,
          fileType: ext,
          totalCount: questions.length,
          parseTime: new Date().toISOString()
        }
      },
      validation
    });
  } catch (error) {
    console.error('转换失败:', error);
    
    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // 忽略清理错误
      }
    }

    res.status(500).json({
      success: false,
      message: '转换失败',
      error: error.message
    });
  }
});

/**
 * POST /api/convert/download
 * 下载转换后的JSON
 */
router.post('/download', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目数据'
      });
    }

    const json = {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        totalQuestions: questions.length,
        source: 'web-converter'
      },
      questions
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.json');

    res.json(json);
  } catch (error) {
    console.error('下载失败:', error);
    res.status(500).json({
      success: false,
      message: '下载失败',
      error: error.message
    });
  }
});

/**
 * POST /api/convert/validate
 * 验证题目数据
 */
router.post('/validate', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目数据'
      });
    }

    const validation = validateQuestions(questions);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({
      success: false,
      message: '验证失败',
      error: error.message
    });
  }
});

export default router;
