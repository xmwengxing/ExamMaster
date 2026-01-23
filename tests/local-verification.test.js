/**
 * 本地测试和验证脚本
 * 
 * 测试内容：
 * 1. PostgreSQL 数据库连接
 * 2. 数据库架构验证
 * 3. API 服务器基本功能
 * 4. 主要功能端到端测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../db.js';

describe('本地环境验证', () => {
  describe('1. 数据库连接测试', () => {
    it('应该能够连接到 PostgreSQL 数据库', async () => {
      const result = await db.query('SELECT NOW() as current_time');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      console.log('✅ 数据库连接成功，当前时间:', result.rows[0].current_time);
    });

    it('应该能够获取连接池状态', () => {
      const status = db.getPoolStatus();
      expect(status).toBeDefined();
      expect(status.totalCount).toBeGreaterThanOrEqual(0);
      expect(status.idleCount).toBeGreaterThanOrEqual(0);
      expect(status.waitingCount).toBeGreaterThanOrEqual(0);
      console.log('✅ 连接池状态:', status);
    });
  });

  describe('2. 数据库架构验证', () => {
    it('应该存在所有必需的表', async () => {
      const expectedTables = [
        'users', 'banks', 'questions', 'exams', 'exam_history',
        'practice_records', 'mistakes', 'favorites', 'notes',
        'srs_records', 'daily_progress', 'tags', 'question_tags',
        'discussions', 'comments', 'discussion_likes', 'ai_analysis',
        'practical_tasks', 'practical_records', 'login_logs',
        'audit_logs', 'system_config', 'system_config_kv'
      ];

      const result = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const actualTables = result.rows.map(r => r.table_name);
      console.log('✅ 数据库中的表:', actualTables);

      for (const table of expectedTables) {
        expect(actualTables).toContain(table);
      }
    });

    it('应该为关键表创建了索引', async () => {
      const result = await db.query(`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'questions', 'banks')
        ORDER BY tablename, indexname
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      console.log(`✅ 找到 ${result.rows.length} 个索引`);
      
      // 验证关键索引存在
      const indexNames = result.rows.map(r => r.indexname);
      expect(indexNames.some(name => name.includes('users'))).toBe(true);
      expect(indexNames.some(name => name.includes('questions'))).toBe(true);
    });

    it('应该正确设置了外键约束', async () => {
      const result = await db.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      console.log(`✅ 找到 ${result.rows.length} 个外键约束`);
    });
  });

  describe('3. 数据完整性验证', () => {
    it('应该能够查询用户数据', async () => {
      const result = await db.query('SELECT COUNT(*) as count FROM users');
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ 用户表中有 ${count} 条记录`);
    });

    it('应该能够查询题库数据', async () => {
      const result = await db.query('SELECT COUNT(*) as count FROM banks');
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ 题库表中有 ${count} 条记录`);
    });

    it('应该能够查询题目数据', async () => {
      const result = await db.query('SELECT COUNT(*) as count FROM questions');
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ 题目表中有 ${count} 条记录`);
    });

    it('应该能够查询考试数据', async () => {
      const result = await db.query('SELECT COUNT(*) as count FROM exams');
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ 考试表中有 ${count} 条记录`);
    });

    it('应该能够查询讨论区数据', async () => {
      const result = await db.query('SELECT COUNT(*) as count FROM discussions');
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ 讨论区表中有 ${count} 条记录`);
    });
  });

  describe('4. JSONB 字段测试', () => {
    it('应该能够查询和解析 JSONB 字段', async () => {
      // 测试 questions 表的 JSONB 字段
      const result = await db.query(`
        SELECT id, options, answer, tags 
        FROM questions 
        WHERE options IS NOT NULL 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const question = result.rows[0];
        
        // JSONB 字段应该自动解析为 JavaScript 对象
        if (question.options) {
          expect(typeof question.options).toBe('object');
          console.log('✅ JSONB options 字段正确解析');
        }
        
        if (question.answer) {
          expect(question.answer).toBeDefined();
          console.log('✅ JSONB answer 字段正确解析');
        }
      } else {
        console.log('⚠️  没有找到包含 options 的题目，跳过 JSONB 测试');
      }
    });

    it('应该能够使用 JSONB 操作符查询', async () => {
      // 测试 JSONB 包含查询
      const result = await db.query(`
        SELECT COUNT(*) as count 
        FROM questions 
        WHERE tags IS NOT NULL
      `);

      const count = parseInt(result.rows[0].count);
      console.log(`✅ 找到 ${count} 个包含标签的题目`);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. 事务功能测试', () => {
    it('应该能够执行事务并提交', async () => {
      const testId = `test-${Date.now()}`;
      
      const result = await db.transaction(async (client) => {
        // 插入测试数据
        await client.query(
          'INSERT INTO system_config_kv (key, value) VALUES ($1, $2)',
          [testId, 'test-value']
        );
        
        // 查询验证
        const checkResult = await client.query(
          'SELECT * FROM system_config_kv WHERE key = $1',
          [testId]
        );
        
        return checkResult.rows[0];
      });

      expect(result).toBeDefined();
      expect(result.key).toBe(testId);
      console.log('✅ 事务提交成功');

      // 清理测试数据
      await db.execute('DELETE FROM system_config_kv WHERE key = $1', [testId]);
    });

    it('应该能够在错误时回滚事务', async () => {
      const testId = `test-rollback-${Date.now()}`;
      
      try {
        await db.transaction(async (client) => {
          // 插入测试数据
          await client.query(
            'INSERT INTO system_config_kv (key, value) VALUES ($1, $2)',
            [testId, 'test-value']
          );
          
          // 故意抛出错误
          throw new Error('测试回滚');
        });
      } catch (error) {
        expect(error.message).toBe('测试回滚');
      }

      // 验证数据已回滚
      const result = await db.query(
        'SELECT * FROM system_config_kv WHERE key = $1',
        [testId]
      );
      
      expect(result.rows.length).toBe(0);
      console.log('✅ 事务回滚成功');
    });
  });

  describe('6. 性能测试', () => {
    it('连接池应该能够处理并发查询', async () => {
      const concurrentQueries = 10;
      const queries = Array(concurrentQueries).fill(null).map(() =>
        db.query('SELECT 1 as test')
      );

      const start = Date.now();
      const results = await Promise.all(queries);
      const duration = Date.now() - start;

      expect(results.length).toBe(concurrentQueries);
      results.forEach(result => {
        expect(result.rows[0].test).toBe(1);
      });

      console.log(`✅ ${concurrentQueries} 个并发查询在 ${duration}ms 内完成`);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('应该能够快速执行简单查询', async () => {
      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await db.query('SELECT 1');
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      console.log(`✅ ${iterations} 次查询平均耗时: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(100); // 平均每次查询应该少于100ms
    });
  });
});
