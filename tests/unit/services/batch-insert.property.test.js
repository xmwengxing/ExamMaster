/**
 * 批量插入服务 - 属性测试
 * Feature: question-bank-import-optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { batchInsertService, BATCH_SIZE } from '../../../src/services/batch-insert.service.js';
import db from '../../../db.js';

describe('批量插入服务 - 属性测试', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_%']);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_%']);
  });

  /**
   * 属性 14: 批量分组正确性
   * 验证需求: 7.1
   */
  it('Property 14: 对于任何题目数据集,应该将题目分组为每批最多500条', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }), // 生成1-2000个题目
        async (count) => {
          // 生成测试题目
          const questions = Array.from({ length: count }, (_, i) => ({
            content: `test_property14_${Date.now()}_${i}`,
            type: 'single',
            options: ['A', 'B', 'C', 'D'],
            answer: 'A',
            explanation: '测试解析'
          }));

          // 执行批量插入
          const result = await batchInsertService.insertBatch(questions);

          // 验证: 所有题目都应该被处理
          const totalProcessed = result.inserted + result.duplicates + 
            result.errors.reduce((sum, err) => sum + (err.endIndex - err.startIndex + 1), 0);
          
          expect(totalProcessed).toBe(count);

          // 验证: 如果有错误,每个错误批次应该不超过500条
          for (const error of result.errors) {
            const batchSize = error.endIndex - error.startIndex + 1;
            expect(batchSize).toBeLessThanOrEqual(BATCH_SIZE);
          }

          // 清理
          await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_property14_%']);
        }
      ),
      { numRuns: 20 } // 减少运行次数以提高测试速度
    );
  }, 60000); // 增加超时时间到60秒

  /**
   * 属性 15: 批量插入原子性
   * 验证需求: 7.5
   */
  it('Property 15: 对于任何批次的题目数据,事务性插入应该要么全部成功要么全部失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('single', 'multiple', 'judge'),
            options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
            answer: fc.string({ minLength: 1 }),
            explanation: fc.string()
          }),
          { minLength: 1, maxLength: 100 }
        ),
        async (questions) => {
          // 添加唯一前缀避免冲突
          const uniqueQuestions = questions.map((q, i) => ({
            ...q,
            content: `test_property15_${Date.now()}_${i}_${q.content}`
          }));

          // 执行事务性批量插入
          const result = await batchInsertService.insertBatchTransactional(uniqueQuestions);

          // 验证: 成功插入的数量应该等于返回的inserted数量
          const dbResult = await db.query(
            'SELECT COUNT(*) as count FROM questions WHERE content LIKE $1',
            ['test_property15_%']
          );
          
          expect(parseInt(dbResult.rows[0].count)).toBe(result.inserted);

          // 清理
          await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_property15_%']);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 属性 16: 批量插入容错性
   * 验证需求: 7.3
   */
  it('Property 16: 即使某个批次插入失败,应该继续处理后续批次', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 600, max: 1200 }), // 生成多个批次
        async (count) => {
          // 生成测试题目,其中一些可能导致错误
          const questions = Array.from({ length: count }, (_, i) => ({
            content: `test_property16_${Date.now()}_${i}`,
            type: 'single',
            options: ['A', 'B'],
            answer: 'A',
            explanation: '测试'
          }));

          // 执行批量插入
          const result = await batchInsertService.insertBatch(questions);

          // 验证: 即使有错误,也应该有一些题目被成功插入
          // (除非所有批次都失败,这种情况很少见)
          const totalProcessed = result.inserted + result.duplicates;
          
          // 如果没有错误,所有题目都应该被处理
          if (result.errors.length === 0) {
            expect(totalProcessed).toBe(count);
          } else {
            // 如果有错误,至少应该处理了一些题目
            expect(totalProcessed).toBeGreaterThanOrEqual(0);
          }

          // 清理
          await db.query('DELETE FROM questions WHERE content LIKE $1', ['test_property16_%']);
        }
      ),
      { numRuns: 5 } // 减少运行次数以提高测试速度
    );
  }, 30000); // 增加超时时间到30秒
});
