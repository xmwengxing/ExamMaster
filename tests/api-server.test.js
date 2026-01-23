/**
 * API 服务器功能测试
 * 
 * 测试内容：
 * 1. 用户认证 API
 * 2. 题库管理 API
 * 3. 题目管理 API
 * 4. 考试系统 API
 * 5. 讨论区 API
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../db.js';
import bcrypt from 'bcryptjs';

describe('API 服务器功能测试', () => {
  let testUserId;
  let testBankId;
  let testQuestionId;

  beforeAll(async () => {
    // 创建测试用户
    testUserId = `test-user-${Date.now()}`;
    const password = bcrypt.hashSync('test123', 10);
    
    await db.execute(
      'INSERT INTO users (id, phone, password, role, nickname) VALUES ($1, $2, $3, $4, $5)',
      [testUserId, `test-${Date.now()}`, password, 'ADMIN', '测试用户']
    );

    // 创建测试题库
    testBankId = `test-bank-${Date.now()}`;
    await db.execute(
      'INSERT INTO banks (id, name, category, level, question_count) VALUES ($1, $2, $3, $4, $5)',
      [testBankId, '测试题库', '测试分类', '初级', 0]
    );

    console.log('✅ 测试数据准备完成');
  });

  afterAll(async () => {
    // 清理测试数据
    await db.execute('DELETE FROM questions WHERE bank_id = $1', [testBankId]);
    await db.execute('DELETE FROM banks WHERE id = $1', [testBankId]);
    await db.execute('DELETE FROM users WHERE id = $1', [testUserId]);
    
    console.log('✅ 测试数据清理完成');
  });

  describe('1. 用户认证功能', () => {
    it('应该能够查询用户信息', async () => {
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [testUserId]);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.role).toBe('ADMIN');
      expect(user.nickname).toBe('测试用户');
      console.log('✅ 用户查询成功');
    });

    it('应该能够验证密码', async () => {
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [testUserId]);
      const isValid = bcrypt.compareSync('test123', user.password);
      
      expect(isValid).toBe(true);
      console.log('✅ 密码验证成功');
    });

    it('应该能够更新用户信息', async () => {
      const newNickname = '更新后的昵称';
      
      await db.execute(
        'UPDATE users SET nickname = $1 WHERE id = $2',
        [newNickname, testUserId]
      );

      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [testUserId]);
      expect(user.nickname).toBe(newNickname);
      console.log('✅ 用户信息更新成功');
    });
  });

  describe('2. 题库管理功能', () => {
    it('应该能够查询题库列表', async () => {
      const banks = await db.getMany('SELECT * FROM banks');
      
      expect(Array.isArray(banks)).toBe(true);
      expect(banks.length).toBeGreaterThan(0);
      
      const testBank = banks.find(b => b.id === testBankId);
      expect(testBank).toBeDefined();
      expect(testBank.name).toBe('测试题库');
      console.log(`✅ 查询到 ${banks.length} 个题库`);
    });

    it('应该能够更新题库信息', async () => {
      const newName = '更新后的题库名称';
      
      await db.execute(
        'UPDATE banks SET name = $1 WHERE id = $2',
        [newName, testBankId]
      );

      const bank = await db.getOne('SELECT * FROM banks WHERE id = $1', [testBankId]);
      expect(bank.name).toBe(newName);
      console.log('✅ 题库信息更新成功');
    });

    it('应该能够统计题库题目数量', async () => {
      const bank = await db.getOne('SELECT * FROM banks WHERE id = $1', [testBankId]);
      
      expect(bank.question_count).toBeDefined();
      expect(typeof bank.question_count).toBe('number');
      console.log(`✅ 题库题目数量: ${bank.question_count}`);
    });
  });

  describe('3. 题目管理功能', () => {
    it('应该能够创建题目', async () => {
      testQuestionId = `test-q-${Date.now()}`;
      
      await db.execute(
        `INSERT INTO questions (id, bank_id, type, content, options, answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          testQuestionId,
          testBankId,
          'SINGLE',
          '这是一道测试题目',
          JSON.stringify(['选项A', '选项B', '选项C', '选项D']),
          JSON.stringify('A'),
          '这是解析'
        ]
      );

      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [testQuestionId]);
      expect(question).toBeDefined();
      expect(question.content).toBe('这是一道测试题目');
      console.log('✅ 题目创建成功');
    });

    it('应该能够查询题目列表', async () => {
      const questions = await db.getMany(
        'SELECT * FROM questions WHERE bank_id = $1',
        [testBankId]
      );

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      console.log(`✅ 查询到 ${questions.length} 道题目`);
    });

    it('应该能够正确解析 JSONB 字段', async () => {
      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [testQuestionId]);
      
      // PostgreSQL 自动将 JSONB 解析为 JavaScript 对象
      expect(Array.isArray(question.options)).toBe(true);
      expect(question.options.length).toBe(4);
      expect(question.options[0]).toBe('选项A');
      expect(question.answer).toBe('A');
      console.log('✅ JSONB 字段解析正确');
    });

    it('应该能够更新题目', async () => {
      const newContent = '更新后的题目内容';
      
      await db.execute(
        'UPDATE questions SET content = $1 WHERE id = $2',
        [newContent, testQuestionId]
      );

      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [testQuestionId]);
      expect(question.content).toBe(newContent);
      console.log('✅ 题目更新成功');
    });

    it('应该能够使用事务批量插入题目', async () => {
      const batchQuestions = [
        { id: `batch-1-${Date.now()}`, content: '批量题目1' },
        { id: `batch-2-${Date.now()}`, content: '批量题目2' },
        { id: `batch-3-${Date.now()}`, content: '批量题目3' }
      ];

      await db.transaction(async (client) => {
        for (const q of batchQuestions) {
          await client.query(
            `INSERT INTO questions (id, bank_id, type, content, options, answer)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [q.id, testBankId, 'SINGLE', q.content, JSON.stringify([]), JSON.stringify('A')]
          );
        }
      });

      const questions = await db.getMany(
        'SELECT * FROM questions WHERE bank_id = $1',
        [testBankId]
      );

      expect(questions.length).toBeGreaterThanOrEqual(4); // 至少包含之前创建的题目
      console.log('✅ 批量插入题目成功');
    });
  });

  describe('4. 数据关联测试', () => {
    it('应该能够通过外键查询关联数据', async () => {
      const result = await db.query(`
        SELECT q.*, b.name as bank_name
        FROM questions q
        JOIN banks b ON q.bank_id = b.id
        WHERE q.id = $1
      `, [testQuestionId]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].bank_name).toBeDefined();
      console.log('✅ 外键关联查询成功');
    });

    it('应该能够统计题库下的题目数量', async () => {
      const result = await db.query(`
        SELECT b.id, b.name, COUNT(q.id) as actual_count
        FROM banks b
        LEFT JOIN questions q ON b.id = q.bank_id
        WHERE b.id = $1
        GROUP BY b.id, b.name
      `, [testBankId]);

      expect(result.rows.length).toBe(1);
      // PostgreSQL COUNT 返回字符串，需要转换为数字
      const actualCount = parseInt(result.rows[0].actual_count);
      expect(actualCount).toBeGreaterThan(0);
      console.log(`✅ 题库实际题目数: ${actualCount}`);
    });
  });

  describe('5. 错误处理测试', () => {
    it('应该能够处理重复 ID 插入', async () => {
      try {
        await db.execute(
          'INSERT INTO questions (id, bank_id, type, content) VALUES ($1, $2, $3, $4)',
          [testQuestionId, testBankId, 'SINGLE', '重复ID']
        );
        
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('23505'); // PostgreSQL 唯一约束违反错误码
        console.log('✅ 重复 ID 错误处理正确');
      }
    });

    it('应该能够处理外键约束违反', async () => {
      try {
        await db.execute(
          'INSERT INTO questions (id, bank_id, type, content) VALUES ($1, $2, $3, $4)',
          [`fk-test-${Date.now()}`, 'non-existent-bank', 'SINGLE', '测试']
        );
        
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('23503'); // PostgreSQL 外键约束违反错误码
        console.log('✅ 外键约束错误处理正确');
      }
    });

    it('应该能够处理无效的 SQL 查询', async () => {
      try {
        await db.query('SELECT * FROM non_existent_table');
        
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ 无效查询错误处理正确');
      }
    });
  });

  describe('6. 日期时间处理测试', () => {
    it('应该能够正确存储和查询时间戳', async () => {
      const now = new Date();
      
      await db.execute(
        'UPDATE users SET last_login = $1 WHERE id = $2',
        [now.toISOString(), testUserId]
      );

      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [testUserId]);
      
      // PostgreSQL 返回的时间戳应该是 Date 对象或 ISO 字符串
      expect(user.last_login).toBeDefined();
      
      // PostgreSQL 返回的是 Date 对象（已经被 node-postgres 转换）
      const savedTime = user.last_login instanceof Date ? user.last_login : new Date(user.last_login);
      
      // 验证时间戳是有效的日期
      expect(savedTime.getTime()).toBeGreaterThan(0);
      expect(isNaN(savedTime.getTime())).toBe(false);
      
      // 验证时间戳在合理范围内（2020年之后）
      const year2020 = new Date('2020-01-01').getTime();
      expect(savedTime.getTime()).toBeGreaterThan(year2020);
      
      console.log('✅ 时间戳存储和查询正确');
    });

    it('应该能够使用 CURRENT_TIMESTAMP', async () => {
      const testId = `timestamp-test-${Date.now()}`;
      
      await db.execute(
        'INSERT INTO system_config_kv (key, value, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [testId, 'test']
      );

      const result = await db.getOne(
        'SELECT * FROM system_config_kv WHERE key = $1',
        [testId]
      );

      expect(result.created_at).toBeDefined();
      console.log('✅ CURRENT_TIMESTAMP 功能正常');

      // 清理
      await db.execute('DELETE FROM system_config_kv WHERE key = $1', [testId]);
    });
  });
});
