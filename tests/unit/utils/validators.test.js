// validators.js 单元测试
import { describe, it, expect } from 'vitest';
import {
  validateFillInBlankAnswers,
  checkBlankAnswer,
  isValidEmail,
  isValidPhone,
  validatePassword,
  validateUsername,
  validateQuestionOptions,
  validateQuestionAnswer,
  isValidScore,
  isValidId
} from '../../../src/utils/validators.js';

describe('validators.js 单元测试', () => {
  
  describe('validateFillInBlankAnswers', () => {
    it('应该正确验证填空题答案', () => {
      const blanks = [
        { id: 1, acceptedAnswers: ['答案1', 'answer1'], caseSensitive: false },
        { id: 2, acceptedAnswers: ['答案2'], caseSensitive: true }
      ];
      const userAnswers = {
        1: 'Answer1',  // 不区分大小写，应该正确
        2: '答案2'      // 区分大小写，应该正确
      };
      
      const result = validateFillInBlankAnswers(blanks, userAnswers, 100);
      
      expect(result.correct).toBe(2);
      expect(result.total).toBe(2);
      expect(result.score).toBe(100);
      expect(result.details).toHaveLength(2);
    });

    it('应该处理部分正确的答案', () => {
      const blanks = [
        { id: 1, acceptedAnswers: ['正确'], caseSensitive: false },
        { id: 2, acceptedAnswers: ['正确'], caseSensitive: false }
      ];
      const userAnswers = {
        1: '正确',
        2: '错误'
      };
      
      const result = validateFillInBlankAnswers(blanks, userAnswers, 100);
      
      expect(result.correct).toBe(1);
      expect(result.total).toBe(2);
      expect(result.score).toBe(50);
    });

    it('应该处理空的填空配置', () => {
      const result = validateFillInBlankAnswers([], {}, 100);
      
      expect(result.correct).toBe(0);
      expect(result.total).toBe(0);
      expect(result.score).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it('应该处理缺失的用户答案', () => {
      const blanks = [
        { id: 1, acceptedAnswers: ['答案'], caseSensitive: false }
      ];
      const userAnswers = {};
      
      const result = validateFillInBlankAnswers(blanks, userAnswers, 100);
      
      expect(result.correct).toBe(0);
      expect(result.total).toBe(1);
      expect(result.score).toBe(0);
    });
  });

  describe('checkBlankAnswer', () => {
    it('应该正确检查不区分大小写的答案', () => {
      const blank = { id: 1, acceptedAnswers: ['Test'], caseSensitive: false };
      
      expect(checkBlankAnswer('test', blank)).toBe(true);
      expect(checkBlankAnswer('TEST', blank)).toBe(true);
      expect(checkBlankAnswer('Test', blank)).toBe(true);
      expect(checkBlankAnswer('wrong', blank)).toBe(false);
    });

    it('应该正确检查区分大小写的答案', () => {
      const blank = { id: 1, acceptedAnswers: ['Test'], caseSensitive: true };
      
      expect(checkBlankAnswer('Test', blank)).toBe(true);
      expect(checkBlankAnswer('test', blank)).toBe(false);
      expect(checkBlankAnswer('TEST', blank)).toBe(false);
    });

    it('应该处理多个可接受答案', () => {
      const blank = { id: 1, acceptedAnswers: ['答案1', '答案2', '答案3'], caseSensitive: false };
      
      expect(checkBlankAnswer('答案1', blank)).toBe(true);
      expect(checkBlankAnswer('答案2', blank)).toBe(true);
      expect(checkBlankAnswer('答案3', blank)).toBe(true);
      expect(checkBlankAnswer('答案4', blank)).toBe(false);
    });

    it('应该去除前后空格', () => {
      const blank = { id: 1, acceptedAnswers: ['答案'], caseSensitive: false };
      
      expect(checkBlankAnswer('  答案  ', blank)).toBe(true);
      expect(checkBlankAnswer('答案 ', blank)).toBe(true);
      expect(checkBlankAnswer(' 答案', blank)).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('应该验证有效的邮箱', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('应该验证有效的中国大陆手机号', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('15912345678')).toBe(true);
      expect(isValidPhone('18888888888')).toBe(true);
    });

    it('应该拒绝无效的手机号', () => {
      expect(isValidPhone('12345678901')).toBe(false);  // 第二位不是3-9
      expect(isValidPhone('1380013800')).toBe(false);   // 少于11位
      expect(isValidPhone('138001380000')).toBe(false); // 多于11位
      expect(isValidPhone('23800138000')).toBe(false);  // 不是1开头
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('应该验证基本密码', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
    });

    it('应该检查最小长度', () => {
      const result = validatePassword('12345', { minLength: 6 });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能少于');
    });

    it('应该检查最大长度', () => {
      const result = validatePassword('a'.repeat(51), { maxLength: 50 });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能超过');
    });

    it('应该检查大写字母', () => {
      const result = validatePassword('password123', { requireUppercase: true });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('大写字母');
    });

    it('应该检查小写字母', () => {
      const result = validatePassword('PASSWORD123', { requireLowercase: true });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('小写字母');
    });

    it('应该检查数字', () => {
      const result = validatePassword('password', { requireNumber: true });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('数字');
    });

    it('应该检查特殊字符', () => {
      const result = validatePassword('Password123', { requireSpecialChar: true });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('特殊字符');
    });

    it('应该验证复杂密码', () => {
      const result = validatePassword('Password123!', {
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('应该验证有效的用户名', () => {
      expect(validateUsername('user123').valid).toBe(true);
      expect(validateUsername('test_user').valid).toBe(true);
      expect(validateUsername('用户名').valid).toBe(true);
    });

    it('应该检查最小长度', () => {
      const result = validateUsername('ab', { minLength: 3 });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能少于');
    });

    it('应该检查最大长度', () => {
      const result = validateUsername('a'.repeat(21), { maxLength: 20 });
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能超过');
    });

    it('应该拒绝特殊字符（默认）', () => {
      const result = validateUsername('user@123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('只能包含');
    });

    it('应该处理空值', () => {
      expect(validateUsername('').valid).toBe(false);
      expect(validateUsername(null).valid).toBe(false);
    });
  });

  describe('validateQuestionOptions', () => {
    it('应该验证选择题选项', () => {
      const result = validateQuestionOptions(['选项A', '选项B', '选项C'], 'single_choice');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝少于2个选项的选择题', () => {
      const result = validateQuestionOptions(['选项A'], 'single_choice');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('至少需要 2 个选项');
    });

    it('应该拒绝空选项', () => {
      const result = validateQuestionOptions(['选项A', '', '选项C'], 'single_choice');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能为空');
    });

    it('应该允许判断题没有选项', () => {
      const result = validateQuestionOptions([], 'true_false');
      expect(result.valid).toBe(true);
    });

    it('应该允许填空题没有选项', () => {
      const result = validateQuestionOptions([], 'fill_in_blank');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝非数组选项', () => {
      const result = validateQuestionOptions('not an array', 'single_choice');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('必须是数组');
    });
  });

  describe('validateQuestionAnswer', () => {
    it('应该验证单选题答案', () => {
      expect(validateQuestionAnswer('A', 'single_choice').valid).toBe(true);
      expect(validateQuestionAnswer(['A'], 'single_choice').valid).toBe(false);
    });

    it('应该验证多选题答案', () => {
      expect(validateQuestionAnswer(['A', 'B'], 'multiple_choice').valid).toBe(true);
      expect(validateQuestionAnswer('A', 'multiple_choice').valid).toBe(false);
      expect(validateQuestionAnswer([], 'multiple_choice').valid).toBe(false);
    });

    it('应该验证判断题答案', () => {
      expect(validateQuestionAnswer(true, 'true_false').valid).toBe(true);
      expect(validateQuestionAnswer(false, 'true_false').valid).toBe(true);
      expect(validateQuestionAnswer('true', 'true_false').valid).toBe(true);
      expect(validateQuestionAnswer('false', 'true_false').valid).toBe(true);
      expect(validateQuestionAnswer('yes', 'true_false').valid).toBe(false);
    });

    it('应该验证填空题答案', () => {
      expect(validateQuestionAnswer({ 1: '答案' }, 'fill_in_blank').valid).toBe(true);
      expect(validateQuestionAnswer(['答案'], 'fill_in_blank').valid).toBe(true);
      expect(validateQuestionAnswer('答案', 'fill_in_blank').valid).toBe(false);
    });

    it('应该拒绝空答案', () => {
      expect(validateQuestionAnswer('', 'single_choice').valid).toBe(false);
      expect(validateQuestionAnswer(null, 'single_choice').valid).toBe(false);
      expect(validateQuestionAnswer(undefined, 'single_choice').valid).toBe(false);
    });

    it('应该拒绝未知题目类型', () => {
      const result = validateQuestionAnswer('答案', 'unknown_type');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('未知');
    });
  });

  describe('isValidScore', () => {
    it('应该验证有效分数', () => {
      expect(isValidScore(50)).toBe(true);
      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(100)).toBe(true);
    });

    it('应该拒绝超出范围的分数', () => {
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(101)).toBe(false);
    });

    it('应该支持自定义范围', () => {
      expect(isValidScore(50, 0, 50)).toBe(true);
      expect(isValidScore(51, 0, 50)).toBe(false);
    });

    it('应该拒绝非数字', () => {
      expect(isValidScore('50')).toBe(false);
      expect(isValidScore(NaN)).toBe(false);
      expect(isValidScore(null)).toBe(false);
    });
  });

  describe('isValidId', () => {
    it('应该验证数字 ID', () => {
      expect(isValidId(1)).toBe(true);
      expect(isValidId(123)).toBe(true);
    });

    it('应该拒绝无效的数字 ID', () => {
      expect(isValidId(0)).toBe(false);
      expect(isValidId(-1)).toBe(false);
      expect(isValidId(1.5)).toBe(false);
    });

    it('应该验证数字字符串 ID', () => {
      expect(isValidId('123')).toBe(true);
      expect(isValidId('1')).toBe(true);
    });

    it('应该验证 UUID', () => {
      expect(isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('应该验证其他字符串 ID', () => {
      expect(isValidId('bank-123')).toBe(true);
      expect(isValidId('user_abc')).toBe(true);
    });

    it('应该拒绝无效 ID', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId(null)).toBe(false);
      expect(isValidId(undefined)).toBe(false);
      expect(isValidId('0')).toBe(false);
    });
  });

});
