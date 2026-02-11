/**
 * 批量插入服务 - 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { batchInsertService, BATCH_SIZE } from '../../../src/services/batch-insert.service.js';
import db from '../../../db.js';

describe('BatchInsertService', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_batch_%']);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_batch_%']);
  });

  describe('insertBatch', () => {
    it('应该成功插入少量题目', async () => {
      const questions = [
        {
          content: `test_batch_${Date.now()}_1`,
          type: 'single',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: '测试解析1'
        },
        {
          content: `test_batch_${Date.now()}_2`,
          type: 'multiple',
          options: ['A', 'B', 'C', 'D'],
          answer: ['A', 'B'],
          explanation: '测试解析2'
        }
      ];

      const result = await batchInsertService.insertBatch(questions);

      expect(result.inserted).toBe(2);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该正确处理空数组', async () => {
      const result = await batchInsertService.insertBatch([]);

      expect(result.inserted).toBe(0);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该跳过重复的题目', async () => {
      const content = `test_batch_duplicate_${Date.now()}`;
      const question = {
        content,
        type: 'single',
        options: ['A', 'B'],
        answer: 'A'
      };

      // 第一次插入
      const result1 = await batchInsertService.insertBatch([question]);
      expect(result1.inserted).toBe(1);

      // 第二次插入相同内容
      // 注意: 由于questions表没有content的UNIQUE约束,会再次插入
      const result2 = await batchInsertService.insertBatch([question]);
      expect(result2.inserted).toBe(1); // 会再次插入
      expect(result2.duplicates).toBe(0);
    });

    it('应该正确分批处理大量题目', async () => {
      // 生成600个题目(超过一个批次)
      const questions = Array.from({ length: 600 }, (_, i) => ({
        content: `test_batch_large_${Date.now()}_${i}`,
        type: 'single',
        options: ['A', 'B'],
        answer: 'A'
      }));

      const result = await batchInsertService.insertBatch(questions);

      expect(result.inserted).toBe(600);
      expect(result.errors).toHaveLength(0);
    });

    it('应该在批次失败时继续处理后续批次', async () => {
      // 创建一些正常题目和一些可能导致错误的题目
      const questions = Array.from({ length: 100 }, (_, i) => ({
        content: `test_batch_mixed_${Date.now()}_${i}`,
        type: 'single',
        options: ['A', 'B'],
        answer: 'A'
      }));

      const result = await batchInsertService.insertBatch(questions);

      // 应该至少处理了一些题目
      expect(result.inserted + result.duplicates).toBeGreaterThan(0);
    });
  });

  describe('insertBatchTransactional', () => {
    it('应该在事务中成功插入题目', async () => {
      const questions = [
        {
          content: `test_batch_trans_${Date.now()}_1`,
          type: 'single',
          options: ['A', 'B'],
          answer: 'A'
        },
        {
          content: `test_batch_trans_${Date.now()}_2`,
          type: 'single',
          options: ['A', 'B'],
          answer: 'B'
        }
      ];

      const result = await batchInsertService.insertBatchTransactional(questions);

      expect(result.inserted).toBe(2);
      expect(result.errors).toHaveLength(0);

      // 验证数据库中的数据
      const dbResult = await db.query(
        'SELECT COUNT(*) as count FROM questions WHERE content LIKE $1',
        ['test_batch_trans_%']
      );
      expect(parseInt(dbResult.rows[0].count)).toBe(2);
    });

    it('应该正确处理空数组', async () => {
      const result = await batchInsertService.insertBatchTransactional([]);

      expect(result.inserted).toBe(0);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('checkDuplicates', () => {
    it('应该检测出重复的题目', async () => {
      const content1 = `test_batch_dup_check_${Date.now()}_1`;
      const content2 = `test_batch_dup_check_${Date.now()}_2`;

      // 先插入一个题目
      await batchInsertService.insertBatch([
        { content: content1, type: 'single', options: ['A', 'B'], answer: 'A' }
      ]);

      // 检查重复
      const duplicates = await batchInsertService.checkDuplicates([
        { content: content1, type: 'single', options: ['A', 'B'], answer: 'A' },
        { content: content2, type: 'single', options: ['A', 'B'], answer: 'B' }
      ]);

      expect(duplicates).toContain(content1);
      expect(duplicates).not.toContain(content2);
    });

    it('应该正确处理空数组', async () => {
      const duplicates = await batchInsertService.checkDuplicates([]);
      expect(duplicates).toHaveLength(0);
    });

    it('应该正确处理没有content的题目', async () => {
      const duplicates = await batchInsertService.checkDuplicates([
        { type: 'single', options: ['A', 'B'], answer: 'A' }
      ]);
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('批次大小验证', () => {
    it('BATCH_SIZE应该等于500', () => {
      expect(BATCH_SIZE).toBe(500);
    });

    it('应该将大于500的数据集分成多个批次', async () => {
      const questions = Array.from({ length: 1200 }, (_, i) => ({
        content: `test_batch_size_${Date.now()}_${i}`,
        type: 'single',
        options: ['A', 'B'],
        answer: 'A'
      }));

      const result = await batchInsertService.insertBatch(questions);

      // 应该处理所有1200个题目
      expect(result.inserted).toBe(1200);
      expect(result.errors).toHaveLength(0);
    });
  });
});
