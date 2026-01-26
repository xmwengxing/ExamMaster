// parsers.js 单元测试
import { describe, it, expect } from 'vitest';
import {
  parseOptionsField,
  parseAnswerField,
  normalizeArrayField,
  parseJsonbField,
  snakeToCamel,
  camelToSnake,
  parseDateField,
  parseBooleanField,
  parseIntField,
  parseFloatField
} from '../../../src/utils/parsers.js';

describe('parsers.js 单元测试', () => {
  
  describe('parseOptionsField', () => {
    it('应该解析数组格式的选项', () => {
      const result = parseOptionsField(['选项A', '选项B', '选项C']);
      expect(result).toEqual(['选项A', '选项B', '选项C']);
    });

    it('应该解析 JSON 字符串格式的选项', () => {
      const result = parseOptionsField('["选项A","选项B","选项C"]');
      expect(result).toEqual(['选项A', '选项B', '选项C']);
    });

    it('应该解析管道符分隔的旧格式选项', () => {
      const result = parseOptionsField('选项A|选项B|选项C');
      expect(result).toEqual(['选项A', '选项B', '选项C']);
    });

    it('应该处理单个选项字符串', () => {
      const result = parseOptionsField('单个选项');
      expect(result).toEqual(['单个选项']);
    });

    it('应该处理空值', () => {
      expect(parseOptionsField(null)).toEqual([]);
      expect(parseOptionsField(undefined)).toEqual([]);
      expect(parseOptionsField('')).toEqual([]);
    });

    it('应该处理无效的 JSON 字符串', () => {
      const result = parseOptionsField('{invalid json}');
      expect(result).toEqual(['{invalid json}']);
    });
  });

  describe('parseAnswerField', () => {
    it('应该保持对象格式的答案', () => {
      const answer = { blanks: [{ id: 1, answer: 'test' }] };
      const result = parseAnswerField(answer);
      expect(result).toEqual(answer);
    });

    it('应该解析 JSON 字符串格式的答案', () => {
      const result = parseAnswerField('{"correct":"A"}');
      expect(result).toEqual({ correct: 'A' });
    });

    it('应该保持普通字符串答案', () => {
      const result = parseAnswerField('A');
      expect(result).toBe('A');
    });

    it('应该处理空值', () => {
      expect(parseAnswerField(null)).toBe('');
      expect(parseAnswerField(undefined)).toBe('');
    });

    it('应该处理数组格式的答案', () => {
      const answer = ['A', 'B', 'C'];
      const result = parseAnswerField(answer);
      expect(result).toEqual(answer);
    });
  });

  describe('normalizeArrayField', () => {
    it('应该保持数组格式', () => {
      const result = normalizeArrayField(['bank-1', 'bank-2']);
      expect(result).toEqual(['bank-1', 'bank-2']);
    });

    it('应该解析 JSON 字符串数组', () => {
      const result = normalizeArrayField('["bank-1","bank-2"]');
      expect(result).toEqual(['bank-1', 'bank-2']);
    });

    it('应该处理双重 JSON 编码', () => {
      const result = normalizeArrayField('"[\\"bank-1\\",\\"bank-2\\"]"');
      expect(result).toEqual(['bank-1', 'bank-2']);
    });

    it('应该从字符串中提取 bank-* 格式', () => {
      const result = normalizeArrayField('bank-123 bank-456');
      expect(result).toEqual(['bank-123', 'bank-456']);
    });

    it('应该处理空值', () => {
      expect(normalizeArrayField(null)).toEqual([]);
      expect(normalizeArrayField(undefined)).toEqual([]);
      expect(normalizeArrayField('')).toEqual([]);
    });

    it('应该处理无效格式', () => {
      const result = normalizeArrayField('invalid string');
      expect(result).toEqual([]);
    });
  });

  describe('parseJsonbField', () => {
    it('应该保持对象格式', () => {
      const obj = { key: 'value' };
      const result = parseJsonbField(obj);
      expect(result).toEqual(obj);
    });

    it('应该解析 JSON 字符串', () => {
      const result = parseJsonbField('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('应该返回默认值（null）', () => {
      expect(parseJsonbField(null)).toBeNull();
      expect(parseJsonbField(undefined)).toBeNull();
    });

    it('应该返回自定义默认值', () => {
      const defaultValue = { default: true };
      expect(parseJsonbField(null, defaultValue)).toEqual(defaultValue);
      expect(parseJsonbField(undefined, defaultValue)).toEqual(defaultValue);
    });

    it('应该处理无效的 JSON 字符串', () => {
      const defaultValue = { error: true };
      const result = parseJsonbField('{invalid}', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('snakeToCamel', () => {
    it('应该转换 snake_case 为 camelCase', () => {
      const input = {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01'
      };
      const result = snakeToCamel(input);
      expect(result).toEqual({
        userId: 1,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-01'
      });
    });

    it('应该处理已经是 camelCase 的字段', () => {
      const input = { userId: 1, userName: 'test' };
      const result = snakeToCamel(input);
      expect(result).toEqual(input);
    });

    it('应该处理空对象', () => {
      expect(snakeToCamel({})).toEqual({});
    });

    it('应该处理非对象输入', () => {
      expect(snakeToCamel(null)).toBeNull();
      expect(snakeToCamel(undefined)).toBeUndefined();
      expect(snakeToCamel('string')).toBe('string');
    });
  });

  describe('camelToSnake', () => {
    it('应该转换 camelCase 为 snake_case', () => {
      const input = {
        userId: 1,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-01'
      };
      const result = camelToSnake(input);
      expect(result).toEqual({
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01'
      });
    });

    it('应该处理已经是 snake_case 的字段', () => {
      const input = { user_id: 1, user_name: 'test' };
      const result = camelToSnake(input);
      expect(result).toEqual(input);
    });

    it('应该处理空对象', () => {
      expect(camelToSnake({})).toEqual({});
    });

    it('应该处理非对象输入', () => {
      expect(camelToSnake(null)).toBeNull();
      expect(camelToSnake(undefined)).toBeUndefined();
      expect(camelToSnake('string')).toBe('string');
    });
  });

  describe('parseDateField', () => {
    it('应该解析有效的日期字符串', () => {
      const result = parseDateField('2024-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    it('应该解析 ISO 格式日期', () => {
      const result = parseDateField('2024-01-01T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('应该处理 Date 对象', () => {
      const date = new Date('2024-01-01');
      const result = parseDateField(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('应该处理无效日期', () => {
      expect(parseDateField('invalid')).toBeNull();
      expect(parseDateField(null)).toBeNull();
      expect(parseDateField(undefined)).toBeNull();
    });
  });

  describe('parseBooleanField', () => {
    it('应该保持布尔值', () => {
      expect(parseBooleanField(true)).toBe(true);
      expect(parseBooleanField(false)).toBe(false);
    });

    it('应该解析字符串 "true"', () => {
      expect(parseBooleanField('true')).toBe(true);
      expect(parseBooleanField('True')).toBe(true);
      expect(parseBooleanField('TRUE')).toBe(true);
    });

    it('应该解析字符串 "1"', () => {
      expect(parseBooleanField('1')).toBe(true);
    });

    it('应该解析数字', () => {
      expect(parseBooleanField(1)).toBe(true);
      expect(parseBooleanField(0)).toBe(false);
      expect(parseBooleanField(-1)).toBe(true);
    });

    it('应该处理其他字符串', () => {
      expect(parseBooleanField('false')).toBe(false);
      expect(parseBooleanField('0')).toBe(false);
      expect(parseBooleanField('')).toBe(false);
    });

    it('应该处理空值', () => {
      expect(parseBooleanField(null)).toBe(false);
      expect(parseBooleanField(undefined)).toBe(false);
    });
  });

  describe('parseIntField', () => {
    it('应该解析整数', () => {
      expect(parseIntField(42)).toBe(42);
      expect(parseIntField('42')).toBe(42);
    });

    it('应该解析负整数', () => {
      expect(parseIntField(-42)).toBe(-42);
      expect(parseIntField('-42')).toBe(-42);
    });

    it('应该截断小数', () => {
      expect(parseIntField(42.7)).toBe(42);
      expect(parseIntField('42.7')).toBe(42);
    });

    it('应该返回默认值（0）', () => {
      expect(parseIntField(null)).toBe(0);
      expect(parseIntField(undefined)).toBe(0);
      expect(parseIntField('invalid')).toBe(0);
    });

    it('应该使用自定义默认值', () => {
      expect(parseIntField(null, -1)).toBe(-1);
      expect(parseIntField(undefined, 100)).toBe(100);
      expect(parseIntField('invalid', 999)).toBe(999);
    });
  });

  describe('parseFloatField', () => {
    it('应该解析浮点数', () => {
      expect(parseFloatField(42.5)).toBe(42.5);
      expect(parseFloatField('42.5')).toBe(42.5);
    });

    it('应该解析负浮点数', () => {
      expect(parseFloatField(-42.5)).toBe(-42.5);
      expect(parseFloatField('-42.5')).toBe(-42.5);
    });

    it('应该解析整数', () => {
      expect(parseFloatField(42)).toBe(42);
      expect(parseFloatField('42')).toBe(42);
    });

    it('应该返回默认值（0）', () => {
      expect(parseFloatField(null)).toBe(0);
      expect(parseFloatField(undefined)).toBe(0);
      expect(parseFloatField('invalid')).toBe(0);
    });

    it('应该使用自定义默认值', () => {
      expect(parseFloatField(null, -1.5)).toBe(-1.5);
      expect(parseFloatField(undefined, 100.5)).toBe(100.5);
      expect(parseFloatField('invalid', 999.9)).toBe(999.9);
    });
  });

});
