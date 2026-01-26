/**
 * AI 服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiService from '../../../src/services/ai.service.js';
import db from '../../../db.js';

// Mock db 模块
vi.mock('../../../db.js', () => ({
  default: {
    getOne: vi.fn(),
    getMany: vi.fn(),
    execute: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('AI 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('应该生成 AI 内容', async () => {
      db.getOne
        .mockResolvedValueOnce({ deepseek_api_key: 'test-key' });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '生成的内容' } }]
        })
      });

      const result = await aiService.generateContent('测试提示词', 'user-1');

      expect(result.text).toBe('生成的内容');
    });

    it('应该在未配置 API Key 时抛出错误', async () => {
      db.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        aiService.generateContent('测试', 'user-1')
      ).rejects.toThrow('未配置 DeepSeek API Key');
    });
  });

  describe('saveAnalysis', () => {
    it('应该保存 AI 解析', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await aiService.saveAnalysis('user-1', 'q-1', '解析内容');

      expect(result.success).toBe(true);
    });

    it('应该在缺少参数时抛出错误', async () => {
      await expect(
        aiService.saveAnalysis('user-1', '', '内容')
      ).rejects.toThrow('缺少必要参数');
    });
  });

  describe('getAnalysis', () => {
    it('应该获取 AI 解析', async () => {
      db.getOne.mockResolvedValue({ content: '解析内容' });

      const result = await aiService.getAnalysis('user-1', 'q-1');

      expect(result.content).toBe('解析内容');
    });

    it('应该在不存在时返回 null', async () => {
      db.getOne.mockResolvedValue(null);

      const result = await aiService.getAnalysis('user-1', 'q-1');

      expect(result).toBeNull();
    });
  });

  describe('getAllAnalysis', () => {
    it('应该返回所有解析记录', async () => {
      db.getOne.mockResolvedValue({ total: 10 });
      db.getMany.mockResolvedValue([{ userId: 'user-1' }]);

      const result = await aiService.getAllAnalysis({ page: 1, pageSize: 30 });

      expect(result.records).toHaveLength(1);
      expect(result.total).toBe(10);
    });
  });

  describe('gradeAnswer', () => {
    it('应该评分简答题', async () => {
      db.getOne.mockResolvedValue({ deepseek_api_key: 'test-key' });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"score": 85, "feedback": "很好", "suggestions": []}' } }]
        })
      });

      const result = await aiService.gradeAnswer({
        questionId: 'q-1',
        userAnswer: '用户答案',
        referenceAnswer: '参考答案'
      }, 'user-1');

      expect(result.score).toBe(85);
    });

    it('应该在缺少参数时抛出错误', async () => {
      await expect(
        aiService.gradeAnswer({ questionId: 'q-1' }, 'user-1')
      ).rejects.toThrow('缺少必要参数');
    });

    it('应该在答案过长时抛出错误', async () => {
      const longAnswer = 'a'.repeat(5001);
      
      await expect(
        aiService.gradeAnswer({
          questionId: 'q-1',
          userAnswer: longAnswer,
          referenceAnswer: '参考'
        }, 'user-1')
      ).rejects.toThrow('答案长度超过限制');
    });
  });
});
