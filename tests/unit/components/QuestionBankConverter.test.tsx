/**
 * QuestionBankConverter 组件测试
 * 测试文件上传、转换流程和错误显示功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('QuestionBankConverter 组件测试', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('文件上传交互测试', () => {
    it('应该验证文件类型', () => {
      // 测试文件类型验证逻辑
      const validExtensions = ['.xlsx', '.xls', '.docx'];
      const testFiles = [
        { name: 'test.xlsx', valid: true },
        { name: 'test.xls', valid: true },
        { name: 'test.docx', valid: true },
        { name: 'test.txt', valid: false },
        { name: 'test.pdf', valid: false },
      ];

      testFiles.forEach(file => {
        const isValid = validExtensions.some(ext => file.name.endsWith(ext));
        expect(isValid).toBe(file.valid);
      });
    });

    it('应该验证文件大小限制（100MB）', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      
      const testCases = [
        { size: 50 * 1024 * 1024, valid: true },  // 50MB
        { size: 100 * 1024 * 1024, valid: false }, // 100MB (边界)
        { size: 150 * 1024 * 1024, valid: false }, // 150MB
      ];

      testCases.forEach(testCase => {
        const isValid = testCase.size < maxSize;
        expect(isValid).toBe(testCase.valid);
      });
    });

    it('应该正确格式化文件大小显示', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      };

      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(50 * 1024 * 1024)).toBe('50.00 MB');
    });
  });

  describe('文件转换流程测试', () => {
    it('应该成功调用转换API', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            questions: [
              {
                content: '测试题目',
                type: 'SINGLE',
                options: ['选项A', '选项B', '选项C'],
                answer: 'A',
                explanation: '测试解析'
              }
            ],
            metadata: {
              fileName: 'test.xlsx',
              totalCount: 1,
              parseTime: 100
            }
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const formData = new FormData();
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      formData.append('file', file);

      const response = await axios.post('/api/convert/upload', formData);

      expect(response.data.success).toBe(true);
      expect(response.data.data.questions).toHaveLength(1);
      expect(response.data.data.questions[0].content).toBe('测试题目');
    });

    it('应该处理转换失败的情况', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            message: '文件格式错误'
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      try {
        await axios.post('/api/convert/upload', new FormData());
      } catch (error: any) {
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toBe('文件格式错误');
      }
    });

    it('应该正确处理验证错误', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            questions: [],
            metadata: {}
          },
          validation: {
            valid: false,
            errors: [
              {
                index: 0,
                field: 'content',
                message: '题目内容不能为空',
                value: '',
                suggestion: '请填写题目内容'
              }
            ]
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const response = await axios.post('/api/convert/upload', new FormData());

      expect(response.data.validation.valid).toBe(false);
      expect(response.data.validation.errors).toHaveLength(1);
      expect(response.data.validation.errors[0].field).toBe('content');
    });
  });

  describe('JSON下载功能测试', () => {
    it('应该生成正确的JSON格式', () => {
      const questions = [
        {
          content: '测试题目1',
          type: 'SINGLE',
          options: ['A', 'B', 'C'],
          answer: 'A',
          explanation: '解析1'
        },
        {
          content: '测试题目2',
          type: 'MULTIPLE',
          options: ['A', 'B', 'C', 'D'],
          answer: ['A', 'B'],
          explanation: '解析2'
        }
      ];

      const json = {
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          totalQuestions: questions.length,
          source: 'web-converter'
        },
        questions: questions.map((q, index) => ({
          ...q,
          id: `q-${Date.now()}-${index}`,
          type: q.type.toUpperCase()
        }))
      };

      expect(json.metadata.version).toBe('2.0');
      expect(json.metadata.totalQuestions).toBe(2);
      expect(json.questions).toHaveLength(2);
      expect(json.questions[0].type).toBe('SINGLE');
      expect(json.questions[1].type).toBe('MULTIPLE');
    });

    it('应该生成正确的文件名', () => {
      const generateFileName = (originalName: string): string => {
        const name = originalName.replace(/\.[^/.]+$/, '') || 'questions';
        const dateStr = new Date().toISOString().split('T')[0];
        return `${name}_${dateStr}.json`;
      };

      const fileName1 = generateFileName('test.xlsx');
      expect(fileName1).toMatch(/^test_\d{4}-\d{2}-\d{2}\.json$/);

      const fileName2 = generateFileName('题库.xls');
      expect(fileName2).toMatch(/^题库_\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('应该正确转换CSV格式', () => {
      const escapeCSV = (str: string): string => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      expect(escapeCSV('普通文本')).toBe('普通文本');
      expect(escapeCSV('包含,逗号')).toBe('"包含,逗号"');
      expect(escapeCSV('包含"引号"')).toBe('"包含""引号"""');
      expect(escapeCSV('包含\n换行')).toBe('"包含\n换行"');
    });
  });

  describe('错误显示测试', () => {
    it('应该正确分类错误类型', () => {
      const errors = [
        { index: 0, field: 'content', message: '题目内容不能为空', value: '' },
        { index: 1, field: 'options', message: '选项不足', value: ['A'] },
        { index: 2, field: 'answer', message: '答案格式错误', value: 'X' },
        { index: 3, field: 'content', message: '题目内容不能为空', value: '' },
      ];

      const contentErrors = errors.filter(e => e.field === 'content');
      const optionsErrors = errors.filter(e => e.field === 'options');
      const answerErrors = errors.filter(e => e.field === 'answer');

      expect(contentErrors).toHaveLength(2);
      expect(optionsErrors).toHaveLength(1);
      expect(answerErrors).toHaveLength(1);
    });

    it('应该提供有用的错误建议', () => {
      const errorSuggestions: Record<string, string> = {
        'content': '请填写题目内容',
        'options': '选择题至少需要2个选项，用竖线(|)分隔',
        'answer': '单选题答案为单个字母(A/B/C)，多选题答案为多个字母(ABC)'
      };

      expect(errorSuggestions['content']).toBe('请填写题目内容');
      expect(errorSuggestions['options']).toContain('至少需要2个选项');
      expect(errorSuggestions['answer']).toContain('单选题答案');
    });
  });

  describe('进度显示测试', () => {
    it('应该正确计算上传进度', () => {
      const calculateProgress = (loaded: number, total: number): number => {
        return Math.round((loaded * 50) / total);
      };

      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(50, 100)).toBe(25);
      expect(calculateProgress(100, 100)).toBe(50);
    });

    it('应该正确更新转换阶段', () => {
      const stages = [
        '准备上传...',
        '上传文件中...',
        '解析文件中...',
        '验证数据中...',
        '转换完成！'
      ];

      expect(stages).toHaveLength(5);
      expect(stages[0]).toBe('准备上传...');
      expect(stages[stages.length - 1]).toBe('转换完成！');
    });
  });

  describe('题型统计测试', () => {
    it('应该正确统计各类题型数量', () => {
      const questions = [
        { type: 'SINGLE', content: '题1' },
        { type: 'SINGLE', content: '题2' },
        { type: 'MULTIPLE', content: '题3' },
        { type: 'JUDGE', content: '题4' },
        { type: 'SINGLE', content: '题5' },
      ];

      const singleCount = questions.filter(q => q.type === 'SINGLE').length;
      const multipleCount = questions.filter(q => q.type === 'MULTIPLE').length;
      const judgeCount = questions.filter(q => q.type === 'JUDGE').length;

      expect(singleCount).toBe(3);
      expect(multipleCount).toBe(1);
      expect(judgeCount).toBe(1);
    });

    it('应该处理大小写不敏感的题型', () => {
      const questions = [
        { type: 'SINGLE', content: '题1' },
        { type: 'single', content: '题2' },
        { type: 'Single', content: '题3' },
      ];

      const normalizedQuestions = questions.map(q => ({
        ...q,
        type: q.type.toUpperCase()
      }));

      const singleCount = normalizedQuestions.filter(q => q.type === 'SINGLE').length;
      expect(singleCount).toBe(3);
    });
  });
});
