/**
 * Web转换API集成测试
 * 测试文件上传、转换、验证和下载功能
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import conversionRoutes from '../../src/routes/conversion.routes.js';
import path from 'path';
import fs from 'fs/promises';
import * as XLSX from 'xlsx';

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/convert', conversionRoutes);

describe('Web转换API集成测试', () => {
  let testFilePath;

  beforeAll(async () => {
    // 创建测试Excel文件
    const testData = [
      {
        '题干': '1+1等于几？',
        '题型': '单选',
        '选项': 'A. 1|B. 2|C. 3|D. 4',
        '答案': 'B',
        '解析': '基础数学题',
        '单元/章节': '第一章'
      },
      {
        '题干': '以下哪些是编程语言？',
        '题型': '多选',
        '选项': 'A. Python|B. Java|C. HTML|D. JavaScript',
        '答案': 'ABD',
        '解析': 'HTML是标记语言，不是编程语言'
      },
      {
        '题干': 'JavaScript是一种编程语言',
        '题型': '判断',
        '答案': '正确'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    testFilePath = path.join(process.cwd(), 'uploads', 'temp', 'test-questions.xlsx');
    
    // 确保目录存在
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    
    XLSX.writeFile(wb, testFilePath);
  });

  afterAll(async () => {
    // 清理测试文件
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('POST /api/convert/upload - 上传并转换文件', () => {
    it('应该成功上传并转换Excel文件', async () => {
      const response = await request(app)
        .post('/api/convert/upload')
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.questions).toBeInstanceOf(Array);
      expect(response.body.data.questions.length).toBeGreaterThan(0);
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.totalCount).toBe(response.body.data.questions.length);
      expect(response.body.validation).toBeDefined();
    });

    it('应该正确解析题目内容', async () => {
      const response = await request(app)
        .post('/api/convert/upload')
        .attach('file', testFilePath)
        .expect(200);

      const questions = response.body.data.questions;
      
      // 验证第一题（单选题）
      const q1 = questions.find(q => q.content.includes('1+1'));
      expect(q1).toBeDefined();
      expect(q1.type).toBe('SINGLE');
      expect(q1.options).toBeInstanceOf(Array);
      expect(q1.options.length).toBeGreaterThanOrEqual(2);
      expect(q1.answer).toBe('B');
      expect(q1.explanation).toBeTruthy();

      // 验证第二题（多选题）
      const q2 = questions.find(q => q.content.includes('编程语言'));
      expect(q2).toBeDefined();
      expect(q2.type).toBe('MULTIPLE');
      expect(q2.options.length).toBeGreaterThanOrEqual(2);
      expect(q2.answer).toContain('A');
      expect(q2.answer).toContain('B');

      // 验证第三题（判断题）
      const q3 = questions.find(q => q.content.includes('JavaScript'));
      expect(q3).toBeDefined();
      expect(q3.type).toBe('JUDGE');
      expect(q3.answer).toBe('A'); // 正确应该转换为A
    });

    it('应该返回400当未上传文件', async () => {
      const response = await request(app)
        .post('/api/convert/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('请上传文件');
    });

    it('应该拒绝不支持的文件格式', async () => {
      // 创建一个文本文件
      const txtFilePath = path.join(process.cwd(), 'uploads', 'temp', 'test.txt');
      await fs.writeFile(txtFilePath, 'test content');

      const response = await request(app)
        .post('/api/convert/upload')
        .attach('file', txtFilePath);

      // multer的fileFilter会拒绝文件，可能返回400或500
      expect([400, 500]).toContain(response.status);
      
      if (response.body) {
        // 如果有响应体，验证错误信息
        expect(response.body.success).not.toBe(true);
      }

      // 清理
      await fs.unlink(txtFilePath);
    });
  });

  describe('POST /api/convert/validate - 验证题目数据', () => {
    it('应该验证有效的题目数据', async () => {
      const validQuestions = [
        {
          content: '测试题目',
          type: 'SINGLE',
          options: ['选项A', '选项B', '选项C'],
          answer: 'A',
          explanation: '测试解析'
        }
      ];

      const response = await request(app)
        .post('/api/convert/validate')
        .send({ questions: validQuestions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validation).toBeDefined();
      expect(response.body.validation.valid).toBe(true);
      expect(response.body.validation.errors).toBeInstanceOf(Array);
      expect(response.body.validation.errors.length).toBe(0);
    });

    it('应该检测缺少题目内容的错误', async () => {
      const invalidQuestions = [
        {
          content: '',
          type: 'SINGLE',
          options: ['A', 'B'],
          answer: 'A'
        }
      ];

      const response = await request(app)
        .post('/api/convert/validate')
        .send({ questions: invalidQuestions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validation.valid).toBe(false);
      expect(response.body.validation.errors.length).toBeGreaterThan(0);
      
      const contentError = response.body.validation.errors.find(
        e => e.field === 'content'
      );
      expect(contentError).toBeDefined();
      expect(contentError.message).toContain('不能为空');
    });

    it('应该检测缺少答案的错误', async () => {
      const invalidQuestions = [
        {
          content: '测试题目',
          type: 'SINGLE',
          options: ['A', 'B'],
          answer: ''
        }
      ];

      const response = await request(app)
        .post('/api/convert/validate')
        .send({ questions: invalidQuestions })
        .expect(200);

      expect(response.body.validation.valid).toBe(false);
      
      const answerError = response.body.validation.errors.find(
        e => e.field === 'answer'
      );
      expect(answerError).toBeDefined();
    });

    it('应该检测选择题选项不足的错误', async () => {
      const invalidQuestions = [
        {
          content: '测试题目',
          type: 'SINGLE',
          options: ['A'], // 只有一个选项
          answer: 'A'
        }
      ];

      const response = await request(app)
        .post('/api/convert/validate')
        .send({ questions: invalidQuestions })
        .expect(200);

      expect(response.body.validation.valid).toBe(false);
      
      const optionsError = response.body.validation.errors.find(
        e => e.field === 'options'
      );
      expect(optionsError).toBeDefined();
      expect(optionsError.message).toContain('至少需要2个选项');
    });

    it('应该返回400当数据无效', async () => {
      const response = await request(app)
        .post('/api/convert/validate')
        .send({ questions: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效');
    });
  });

  describe('POST /api/convert/download - 下载JSON', () => {
    it('应该生成并下载JSON文件', async () => {
      const questions = [
        {
          content: '测试题目',
          type: 'SINGLE',
          options: ['A', 'B', 'C'],
          answer: 'A',
          explanation: '测试解析'
        }
      ];

      const response = await request(app)
        .post('/api/convert/download')
        .send({ questions })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('questions.json');

      // 验证JSON结构
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.version).toBe('2.0');
      expect(response.body.metadata.totalQuestions).toBe(1);
      expect(response.body.metadata.source).toBe('web-converter');
      expect(response.body.questions).toEqual(questions);
    });

    it('应该返回400当题目数据无效', async () => {
      const response = await request(app)
        .post('/api/convert/download')
        .send({ questions: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效');
    });

    it('应该返回400当缺少题目数据', async () => {
      const response = await request(app)
        .post('/api/convert/download')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('题型标准化测试', () => {
    it('应该正确识别各种题型表示', async () => {
      const testData = [
        { '题干': '题目1', '题型': '单选', '选项': 'A. 1|B. 2', '答案': 'A' },
        { '题干': '题目2', '题型': 'SINGLE', '选项': 'A. 1|B. 2', '答案': 'A' },
        { '题干': '题目3', '题型': '1', '选项': 'A. 1|B. 2', '答案': 'A' },
        { '题干': '题目4', '题型': '多选', '选项': 'A. 1|B. 2', '答案': 'AB' },
        { '题干': '题目5', '题型': 'MULTIPLE', '选项': 'A. 1|B. 2', '答案': 'AB' },
        { '题干': '题目6', '题型': '判断', '答案': '正确' },
        { '题干': '题目7', '题型': 'JUDGE', '答案': '对' }
      ];

      const ws = XLSX.utils.json_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const typesTestPath = path.join(process.cwd(), 'uploads', 'temp', 'test-types.xlsx');
      XLSX.writeFile(wb, typesTestPath);

      const response = await request(app)
        .post('/api/convert/upload')
        .attach('file', typesTestPath)
        .expect(200);

      const questions = response.body.data.questions;
      
      // 验证单选题识别
      expect(questions[0].type).toBe('SINGLE');
      expect(questions[1].type).toBe('SINGLE');
      expect(questions[2].type).toBe('SINGLE');

      // 验证多选题识别
      expect(questions[3].type).toBe('MULTIPLE');
      expect(questions[4].type).toBe('MULTIPLE');

      // 验证判断题识别
      expect(questions[5].type).toBe('JUDGE');
      expect(questions[6].type).toBe('JUDGE');

      // 清理
      await fs.unlink(typesTestPath);
    });
  });

  describe('错误处理', () => {
    it('应该处理文件读取错误', async () => {
      const response = await request(app)
        .post('/api/convert/upload')
        .attach('file', Buffer.from('invalid excel content'), 'test.xlsx');

      // 可能返回200但包含错误，或返回500
      if (response.status === 200) {
        // 如果返回200，应该有validation错误
        expect(response.body.data.questions.length).toBe(0);
      } else {
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('失败');
      }
    });
  });
});
