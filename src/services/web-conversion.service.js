/**
 * Web转换服务
 * 在浏览器中解析Excel/Word文件并转换为JSON格式
 */

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { imageProcessorService } from './image-processor.service.js';

export class WebConversionService {
  /**
   * 解析上传的文件
   */
  async parseFile(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await this.parseExcelFile(file);
    } else if (fileName.endsWith('.docx')) {
      return await this.parseWordFile(file);
    } else {
      throw new Error('不支持的文件格式,请上传Excel或Word文件');
    }
  }

  /**
   * 解析Excel文件
   */
  async parseExcelFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const questions = [];

    for (const row of rows) {
      try {
        const question = await this.parseExcelRow(row);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error('解析行失败:', error);
      }
    }

    return {
      questions,
      metadata: {
        fileName: file.name,
        totalCount: questions.length,
        parseTime: new Date()
      }
    };
  }

  /**
   * 解析Excel行数据
   */
  async parseExcelRow(row) {
    // 获取题目内容
    const content = row['题干'] || row['题目内容'] || row['question'] || row['content'];
    if (!content) return null;

    // 获取题型
    const typeStr = row['题型'] || row['type'] || 'SINGLE';
    const type = this.normalizeQuestionType(typeStr);

    // 获取选项
    const optionsStr = row['选项'] || row['options'] || '';
    const options = this.parseOptions(optionsStr, type);

    // 获取答案
    const answerStr = row['答案'] || row['answer'] || '';
    const answer = this.parseAnswer(answerStr, type);

    // 获取解析
    const explanation = row['解析'] || row['explanation'] || '';

    // 获取章节
    const chapter = row['单元/章节'] || row['chapter'] || '';

    // 获取填空配置
    const fillBlanks = row['填空配置'] || row['fillBlanks'] || '';

    // 获取简答参考答案
    const shortAnswer = row['简答参考答案'] || row['shortAnswer'] || '';

    // 处理图片
    const processedContent = await imageProcessorService.processImagesInContent(content);

    return {
      content: processedContent,
      type,
      options,
      answer,
      explanation,
      chapter,
      fillBlanks,
      shortAnswer
    };
  }

  /**
   * 解析Word文件
   */
  async parseWordFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    const questions = this.parseHTMLToQuestions(html);

    return {
      questions,
      metadata: {
        fileName: file.name,
        totalCount: questions.length,
        parseTime: new Date()
      }
    };
  }

  /**
   * 从HTML中解析题目
   */
  parseHTMLToQuestions(html) {
    const questions = [];
    
    // 使用正则表达式提取题目结构
    const lines = html.split(/<\/?p>/g).filter(line => line.trim());
    
    let currentQuestion = null;
    let options = [];

    for (const line of lines) {
      const cleanLine = line.replace(/<[^>]+>/g, '').trim();
      if (!cleanLine) continue;

      // 检测题目开始
      const questionMatch = cleanLine.match(/^(\d+)[.、．)\s]+(.+)/);
      if (questionMatch) {
        // 保存上一题
        if (currentQuestion && currentQuestion.content) {
          if (options.length > 0) {
            currentQuestion.options = options;
          }
          questions.push(currentQuestion);
        }

        // 开始新题
        currentQuestion = {
          content: questionMatch[2],
          type: 'SINGLE',
          answer: ''
        };
        options = [];
        continue;
      }

      if (!currentQuestion) continue;

      // 检测选项
      const optionMatch = cleanLine.match(/^([A-Z])[.、．)\s]+(.+)/);
      if (optionMatch) {
        options.push(optionMatch[2]);
        continue;
      }

      // 检测答案
      const answerMatch = cleanLine.match(/^(?:答案|正确答案|参考答案)[:：\s]+([A-Z]+|正确|错误|对|错)/i);
      if (answerMatch) {
        currentQuestion.answer = this.parseAnswer(answerMatch[1], currentQuestion.type || 'SINGLE');
        continue;
      }

      // 检测解析
      const explanationMatch = cleanLine.match(/^(?:解析|答案解析|说明)[:：\s]+(.+)/i);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1];
        continue;
      }
    }

    // 保存最后一题
    if (currentQuestion && currentQuestion.content) {
      if (options.length > 0) {
        currentQuestion.options = options;
      }
      questions.push(currentQuestion);
    }

    return questions;
  }

  /**
   * 标准化题型
   */
  normalizeQuestionType(typeStr) {
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
    if (type.includes('简答') || type === 'SHORT_ANSWER' || type === 'E' || type === '5') {
      return 'SHORT_ANSWER';
    }

    return 'SINGLE';
  }

  /**
   * 解析选项
   */
  parseOptions(optionsStr, type) {
    if (type === 'JUDGE' || type === 'FILL_IN_BLANK' || type === 'SHORT_ANSWER') {
      return undefined;
    }

    if (!optionsStr) return [];

    // 按分隔符分割
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
      // 尝试匹配 A. B. C. D. 格式
      const matches = optionsStr.match(/[A-Z][.、．]\s*[^A-Z.、．]+/g);
      if (matches) {
        options = matches;
      } else {
        options = [optionsStr];
      }
    }

    // 清理选项
    return options
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)
      .map(opt => {
        // 移除序号
        return opt.replace(/^[A-Z][.、．]\s*/, '').trim();
      });
  }

  /**
   * 解析答案
   */
  parseAnswer(answerStr, type) {
    if (!answerStr) return '';

    const answer = answerStr.toString().trim().toUpperCase();

    if (type === 'JUDGE') {
      // 判断题答案转换
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
      // 多选题返回数组
      return answer.split('').filter(c => /[A-Z]/.test(c));
    }

    // 移除所有非字母字符
    return answer.replace(/[^A-Z]/g, '');
  }

  /**
   * 转换为系统JSON格式
   */
  convertToJSON(parsed) {
    return {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        totalQuestions: parsed.questions.length,
        source: 'web-converter'
      },
      questions: parsed.questions
    };
  }

  /**
   * 验证转换结果
   */
  validateJSON(json) {
    const errors = [];

    json.questions.forEach((question, index) => {
      // 验证必填字段
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

      // 验证选择题选项
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

      // 验证答案与题型匹配
      if (question.type === 'MULTIPLE' && typeof question.answer === 'string') {
        errors.push({
          index,
          field: 'answer',
          message: '多选题答案应该是数组',
          value: question.answer,
          suggestion: '请使用数组格式,如: ["A", "B"]'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 导出单例
export const webConversionService = new WebConversionService();
