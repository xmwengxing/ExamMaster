/**
 * Web转换服务 - 单元测试
 * 
 * **验证需求: 12.1, 12.2, 12.3**
 * 测试Excel解析、Word解析和字段识别准确性
 */

import { describe, it, expect } from 'vitest';
import { WebConversionService } from '../../../src/services/web-conversion.service';

describe('WebConversionService - 单元测试', () => {
  const service = new WebConversionService();

  describe('题型标准化', () => {
    it('应该正确识别单选题', () => {
      expect(service['normalizeQuestionType']('单选')).toBe('SINGLE');
      expect(service['normalizeQuestionType']('SINGLE')).toBe('SINGLE');
      expect(service['normalizeQuestionType']('A')).toBe('SINGLE');
      expect(service['normalizeQuestionType']('1')).toBe('SINGLE');
    });

    it('应该正确识别多选题', () => {
      expect(service['normalizeQuestionType']('多选')).toBe('MULTIPLE');
      expect(service['normalizeQuestionType']('MULTIPLE')).toBe('MULTIPLE');
      expect(service['normalizeQuestionType']('B')).toBe('MULTIPLE');
      expect(service['normalizeQuestionType']('2')).toBe('MULTIPLE');
    });

    it('应该正确识别判断题', () => {
      expect(service['normalizeQuestionType']('判断')).toBe('JUDGE');
      expect(service['normalizeQuestionType']('JUDGE')).toBe('JUDGE');
      expect(service['normalizeQuestionType']('C')).toBe('JUDGE');
      expect(service['normalizeQuestionType']('3')).toBe('JUDGE');
    });

    it('应该正确识别填空题', () => {
      expect(service['normalizeQuestionType']('填空')).toBe('FILL_IN_BLANK');
      expect(service['normalizeQuestionType']('FILL_IN_BLANK')).toBe('FILL_IN_BLANK');
      expect(service['normalizeQuestionType']('D')).toBe('FILL_IN_BLANK');
      expect(service['normalizeQuestionType']('4')).toBe('FILL_IN_BLANK');
    });

    it('应该正确识别简答题', () => {
      expect(service['normalizeQuestionType']('简答')).toBe('SHORT_ANSWER');
      expect(service['normalizeQuestionType']('SHORT_ANSWER')).toBe('SHORT_ANSWER');
      expect(service['normalizeQuestionType']('E')).toBe('SHORT_ANSWER');
      expect(service['normalizeQuestionType']('5')).toBe('SHORT_ANSWER');
    });

    it('未知题型应该默认为单选', () => {
      expect(service['normalizeQuestionType']('未知')).toBe('SINGLE');
      expect(service['normalizeQuestionType']('')).toBe('SINGLE');
    });
  });

  describe('选项解析', () => {
    it('应该正确解析管道符分隔的选项', () => {
      const options = service['parseOptions']('选项A|选项B|选项C|选项D', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B', '选项C', '选项D']);
    });

    it('应该正确解析换行符分隔的选项', () => {
      const options = service['parseOptions']('选项A\n选项B\n选项C\n选项D', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B', '选项C', '选项D']);
    });

    it('应该正确解析分号分隔的选项', () => {
      const options = service['parseOptions']('选项A;选项B;选项C;选项D', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B', '选项C', '选项D']);
    });

    it('应该正确解析中文分号分隔的选项', () => {
      const options = service['parseOptions']('选项A；选项B；选项C；选项D', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B', '选项C', '选项D']);
    });

    it('应该正确解析带序号的选项（每个选项单独一行）', () => {
      // 实际使用中，带序号的选项通常每个选项单独一行
      const options = service['parseOptions']('A. 选项A\nB. 选项B\nC. 选项C\nD. 选项D', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B', '选项C', '选项D']);
    });

    it('判断题不应该有选项', () => {
      const options = service['parseOptions']('任何内容', 'JUDGE');
      expect(options).toBeUndefined();
    });

    it('填空题不应该有选项', () => {
      const options = service['parseOptions']('任何内容', 'FILL_IN_BLANK');
      expect(options).toBeUndefined();
    });

    it('简答题不应该有选项', () => {
      const options = service['parseOptions']('任何内容', 'SHORT_ANSWER');
      expect(options).toBeUndefined();
    });

    it('应该过滤空选项', () => {
      const options = service['parseOptions']('选项A||选项B||', 'SINGLE');
      expect(options).toEqual(['选项A', '选项B']);
    });
  });

  describe('答案解析', () => {
    it('应该正确解析单选题答案', () => {
      expect(service['parseAnswer']('A', 'SINGLE')).toBe('A');
      expect(service['parseAnswer']('B', 'SINGLE')).toBe('B');
      expect(service['parseAnswer']('C', 'SINGLE')).toBe('C');
      expect(service['parseAnswer']('D', 'SINGLE')).toBe('D');
    });

    it('应该正确解析多选题答案', () => {
      const answer = service['parseAnswer']('ABC', 'MULTIPLE');
      expect(answer).toEqual(['A', 'B', 'C']);
    });

    it('应该正确解析多选题答案（带空格）', () => {
      const answer = service['parseAnswer']('A B C', 'MULTIPLE');
      expect(answer).toEqual(['A', 'B', 'C']);
    });

    it('应该正确解析判断题答案 - 正确', () => {
      expect(service['parseAnswer']('正确', 'JUDGE')).toBe('A');
      expect(service['parseAnswer']('对', 'JUDGE')).toBe('A');
      expect(service['parseAnswer']('√', 'JUDGE')).toBe('A');
      expect(service['parseAnswer']('T', 'JUDGE')).toBe('A');
      expect(service['parseAnswer']('TRUE', 'JUDGE')).toBe('A');
      expect(service['parseAnswer']('1', 'JUDGE')).toBe('A');
    });

    it('应该正确解析判断题答案 - 错误', () => {
      expect(service['parseAnswer']('错误', 'JUDGE')).toBe('B');
      expect(service['parseAnswer']('错', 'JUDGE')).toBe('B');
      expect(service['parseAnswer']('×', 'JUDGE')).toBe('B');
      expect(service['parseAnswer']('F', 'JUDGE')).toBe('B');
      expect(service['parseAnswer']('FALSE', 'JUDGE')).toBe('B');
      expect(service['parseAnswer']('0', 'JUDGE')).toBe('B');
    });

    it('应该移除答案中的非字母字符', () => {
      expect(service['parseAnswer']('答案：A', 'SINGLE')).toBe('A');
      expect(service['parseAnswer']('(A)', 'SINGLE')).toBe('A');
      expect(service['parseAnswer']('[A]', 'SINGLE')).toBe('A');
    });
  });

  describe('JSON转换', () => {
    it('应该正确转换为JSON格式', () => {
      const parsed = {
        questions: [
          {
            content: '测试题目1',
            type: 'SINGLE' as const,
            options: ['选项A', '选项B', '选项C', '选项D'],
            answer: 'A',
            explanation: '这是解析'
          },
          {
            content: '测试题目2',
            type: 'JUDGE' as const,
            answer: 'A'
          }
        ],
        metadata: {
          fileName: 'test.xlsx',
          totalCount: 2,
          parseTime: new Date()
        }
      };

      const json = service.convertToJSON(parsed);

      expect(json.metadata.version).toBe('2.0');
      expect(json.metadata.source).toBe('web-converter');
      expect(json.metadata.totalQuestions).toBe(2);
      expect(json.questions.length).toBe(2);
      expect(json.questions[0].content).toBe('测试题目1');
      expect(json.questions[1].content).toBe('测试题目2');
    });
  });

  describe('JSON验证', () => {
    it('应该接受有效的JSON', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 1,
          source: 'test'
        },
        questions: [
          {
            content: '测试题目',
            type: 'SINGLE' as const,
            options: ['选项A', '选项B'],
            answer: 'A'
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('应该拒绝缺少题目内容的题目', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 1,
          source: 'test'
        },
        questions: [
          {
            content: '',
            type: 'SINGLE' as const,
            options: ['选项A', '选项B'],
            answer: 'A'
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('content');
    });

    it('应该拒绝缺少答案的题目', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 1,
          source: 'test'
        },
        questions: [
          {
            content: '测试题目',
            type: 'SINGLE' as const,
            options: ['选项A', '选项B'],
            answer: ''
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('answer');
    });

    it('应该拒绝选择题选项少于2个', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 1,
          source: 'test'
        },
        questions: [
          {
            content: '测试题目',
            type: 'SINGLE' as const,
            options: ['选项A'],
            answer: 'A'
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const optionError = result.errors.find(e => e.field === 'options');
      expect(optionError).toBeDefined();
    });

    it('应该拒绝多选题答案不是数组', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 1,
          source: 'test'
        },
        questions: [
          {
            content: '测试题目',
            type: 'MULTIPLE' as const,
            options: ['选项A', '选项B', '选项C'],
            answer: 'ABC' // 应该是数组
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const answerError = result.errors.find(e => e.field === 'answer');
      expect(answerError).toBeDefined();
    });

    it('应该收集多个错误', () => {
      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: 2,
          source: 'test'
        },
        questions: [
          {
            content: '',
            type: 'SINGLE' as const,
            options: ['选项A'],
            answer: ''
          },
          {
            content: '测试题目2',
            type: 'MULTIPLE' as const,
            options: ['选项A', '选项B'],
            answer: 'AB' // 应该是数组
          }
        ]
      };

      const result = service.validateJSON(json);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3); // 至少有4个错误
    });
  });

  describe('HTML解析', () => {
    it('应该正确解析简单的题目结构', () => {
      const html = `
        <p>1. 这是第一道题目？</p>
        <p>A. 选项A</p>
        <p>B. 选项B</p>
        <p>C. 选项C</p>
        <p>D. 选项D</p>
        <p>答案：A</p>
        <p>解析：这是解析内容</p>
      `;

      const questions = service['parseHTMLToQuestions'](html);

      expect(questions.length).toBe(1);
      expect(questions[0].content).toBe('这是第一道题目？');
      expect(questions[0].options).toEqual(['选项A', '选项B', '选项C', '选项D']);
      expect(questions[0].answer).toBe('A');
      expect(questions[0].explanation).toBe('这是解析内容');
    });

    it('应该正确解析多道题目', () => {
      const html = `
        <p>1. 第一道题目？</p>
        <p>A. 选项A</p>
        <p>B. 选项B</p>
        <p>答案：A</p>
        <p>2. 第二道题目？</p>
        <p>A. 选项A</p>
        <p>B. 选项B</p>
        <p>答案：B</p>
      `;

      const questions = service['parseHTMLToQuestions'](html);

      expect(questions.length).toBe(2);
      expect(questions[0].content).toBe('第一道题目？');
      expect(questions[1].content).toBe('第二道题目？');
    });
  });
});
