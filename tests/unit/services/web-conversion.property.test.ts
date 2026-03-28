/**
 * Web转换服务 - 属性测试
 * 
 * **验证需求: 2.2, 2.3**
 * 
 * 属性 3: 文件解析转换正确性
 * - 解析后的题目应该包含所有必要字段
 * - 转换为JSON后应该保持数据完整性
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WebConversionService, ParsedQuestion } from '../../../src/services/web-conversion.service';

describe('WebConversionService - 属性测试', () => {
  const service = new WebConversionService();

  /**
   * 属性 3: 文件解析转换正确性
   * **验证需求: 2.2, 2.3**
   */
  it('属性3: 转换为JSON后应该保持数据完整性', () => {
    fc.assert(
      fc.property(
        // 生成随机题目数据
        fc.array(
          fc.record({
            content: fc.string({ minLength: 10, maxLength: 200 }),
            type: fc.constantFrom('SINGLE', 'MULTIPLE', 'JUDGE', 'FILL_IN_BLANK', 'SHORT_ANSWER'),
            answer: fc.string({ minLength: 1, maxLength: 10 }),
            explanation: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
            chapter: fc.option(fc.string({ minLength: 5, maxLength: 50 }))
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (questions) => {
          // 构造ParsedQuestions对象
          const parsed = {
            questions: questions as ParsedQuestion[],
            metadata: {
              fileName: 'test.xlsx',
              totalCount: questions.length,
              parseTime: new Date()
            }
          };

          // 转换为JSON
          const json = service.convertToJSON(parsed);

          // 验证属性: 数据完整性
          expect(json.metadata.totalQuestions).toBe(questions.length);
          expect(json.questions.length).toBe(questions.length);
          expect(json.metadata.version).toBe('2.0');
          expect(json.metadata.source).toBe('web-converter');

          // 验证每个题目的数据都被保留
          json.questions.forEach((question, index) => {
            expect(question.content).toBe(questions[index].content);
            expect(question.type).toBe(questions[index].type);
            expect(question.answer).toBe(questions[index].answer);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 4: 转换错误处理
   * **验证需求: 2.5**
   */
  it('属性4: 验证应该正确识别无效题目', () => {
    fc.assert(
      fc.property(
        // 生成可能无效的题目数据
        fc.array(
          fc.record({
            content: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' }),
            type: fc.constantFrom('SINGLE', 'MULTIPLE', 'JUDGE', 'FILL_IN_BLANK', 'SHORT_ANSWER'),
            answer: fc.option(fc.string({ minLength: 0, maxLength: 10 }), { nil: '' }),
            options: fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 5 }))
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (questions) => {
          const json = {
            metadata: {
              version: '2.0',
              createdAt: new Date().toISOString(),
              totalQuestions: questions.length,
              source: 'test'
            },
            questions: questions as ParsedQuestion[]
          };

          const result = service.validateJSON(json);

          // 验证属性: 如果有题目缺少必填字段，应该被检测出来
          const hasInvalidQuestions = questions.some(q => 
            !q.content || q.content.trim() === '' || !q.answer
          );

          if (hasInvalidQuestions) {
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }

          // 验证属性: 选择题缺少选项应该被检测出来
          const hasInvalidOptions = questions.some(q =>
            (q.type === 'SINGLE' || q.type === 'MULTIPLE') &&
            (!q.options || q.options.length < 2)
          );

          if (hasInvalidOptions) {
            expect(result.valid).toBe(false);
            const optionErrors = result.errors.filter(e => e.field === 'options');
            expect(optionErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 5: 题型标准化的一致性
   * **验证需求: 12.1**
   */
  it('属性5: 题型标准化应该一致且可预测', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { input: '单选', expected: 'SINGLE' },
          { input: 'SINGLE', expected: 'SINGLE' },
          { input: 'A', expected: 'SINGLE' },
          { input: '1', expected: 'SINGLE' },
          { input: '多选', expected: 'MULTIPLE' },
          { input: 'MULTIPLE', expected: 'MULTIPLE' },
          { input: 'B', expected: 'MULTIPLE' },
          { input: '2', expected: 'MULTIPLE' },
          { input: '判断', expected: 'JUDGE' },
          { input: 'JUDGE', expected: 'JUDGE' },
          { input: 'C', expected: 'JUDGE' },
          { input: '3', expected: 'JUDGE' },
          { input: '填空', expected: 'FILL_IN_BLANK' },
          { input: 'FILL_IN_BLANK', expected: 'FILL_IN_BLANK' },
          { input: 'D', expected: 'FILL_IN_BLANK' },
          { input: '4', expected: 'FILL_IN_BLANK' },
          { input: '简答', expected: 'SHORT_ANSWER' },
          { input: 'SHORT_ANSWER', expected: 'SHORT_ANSWER' },
          { input: 'E', expected: 'SHORT_ANSWER' },
          { input: '5', expected: 'SHORT_ANSWER' }
        ),
        ({ input, expected }) => {
          // 使用私有方法的变通方案：通过解析Excel行来测试
          const row = {
            '题干': '测试题目',
            '题型': input,
            '答案': 'A'
          };

          // 这里我们无法直接测试私有方法，但可以通过公共API间接验证
          // 验证属性: 相同的输入应该总是产生相同的输出
          const result1 = service['normalizeQuestionType'](input);
          const result2 = service['normalizeQuestionType'](input);
          
          expect(result1).toBe(result2);
          expect(result1).toBe(expected);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 属性 6: 答案解析的正确性
   * **验证需求: 12.1**
   */
  it('属性6: 判断题答案解析应该正确转换', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { input: '正确', expected: 'A' },
          { input: '对', expected: 'A' },
          { input: '√', expected: 'A' },
          { input: 'T', expected: 'A' },
          { input: 'TRUE', expected: 'A' },
          { input: 'A', expected: 'A' },
          { input: '1', expected: 'A' },
          { input: '错误', expected: 'B' },
          { input: '错', expected: 'B' },
          { input: '×', expected: 'B' },
          { input: 'F', expected: 'B' },
          { input: 'FALSE', expected: 'B' },
          { input: 'B', expected: 'B' },
          { input: '0', expected: 'B' }
        ),
        ({ input, expected }) => {
          const result = service['parseAnswer'](input, 'JUDGE');
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 13 }
    );
  });
});
