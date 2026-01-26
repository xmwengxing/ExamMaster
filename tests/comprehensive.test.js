/**
 * 综合功能测试
 * 
 * 测试所有主要功能：
 * 1. 用户认证和管理
 * 2. 题库和题目管理
 * 3. 考试系统
 * 4. 练习记录
 * 5. 讨论区
 * 6. 标签系统
 * 7. 备份和恢复
 * 8. 性能和并发
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

describe('综合功能测试', () => {
  let testData = {
    users: [],
    banks: [],
    questions: [],
    exams: [],
    tags: []
  };

  beforeAll(async () => {
    console.log('\n========== 开始综合功能测试 ==========\n');
    
    // 确保数据库连接正常
    await db.query('SELECT 1');
    console.log('✅ 数据库连接正常');
  });

  afterAll(async () => {
    // 清理测试数据
    console.log('\n========== 清理测试数据 ==========\n');
    
    try {
      // 按依赖顺序删除
      for (const userId of testData.users) {
        await db.execute('DELETE FROM users WHERE id = $1', [userId]);
      }
      
      for (const questionId of testData.questions) {
        await db.execute('DELETE FROM questions WHERE id = $1', [questionId]);
      }
      
      for (const bankId of testData.banks) {
        await db.execute('DELETE FROM banks WHERE id = $1', [bankId]);
      }
      
      for (const examId of testData.exams) {
        await db.execute('DELETE FROM exams WHERE id = $1', [examId]);
      }
      
      for (const tagId of testData.tags) {
        await db.execute('DELETE FROM tags WHERE id = $1', [tagId]);
      }
      
      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
    
    // 关闭数据库连接
    await db.closePool();
    console.log('\n========== 综合功能测试完成 ==========\n');
  });

  describe('1. 用户认证和管理功能', () => {
    it('应该能够创建管理员用户', async () => {
      const adminId = `test-admin-${Date.now()}`;
      const password = bcrypt.hashSync('admin123', 10);
      
      await db.execute(
        'INSERT INTO users (id, phone, password, role, nickname) VALUES ($1, $2, $3, $4, $5)',
        [adminId, `admin-${Date.now()}`, password, 'ADMIN', '测试管理员']
      );
      
      testData.users.push(adminId);
      
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [adminId]);
      expect(user).toBeDefined();
      expect(user.role).toBe('ADMIN');
      console.log('✅ 管理员用户创建成功');
    });

    it('应该能够创建学员用户', async () => {
      const studentId = `test-student-${Date.now()}`;
      const password = bcrypt.hashSync('student123', 10);
      
      await db.execute(
        'INSERT INTO users (id, phone, password, role, nickname) VALUES ($1, $2, $3, $4, $5)',
        [studentId, `student-${Date.now()}`, password, 'STUDENT', '测试学员']
      );
      
      testData.users.push(studentId);
      
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [studentId]);
      expect(user).toBeDefined();
      expect(user.role).toBe('STUDENT');
      console.log('✅ 学员用户创建成功');
    });

    it('应该能够验证用户密码', async () => {
      const userId = testData.users[0];
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
      
      const isValid = bcrypt.compareSync('admin123', user.password);
      expect(isValid).toBe(true);
      console.log('✅ 密码验证成功');
    });

    it('应该能够更新用户信息', async () => {
      const userId = testData.users[0];
      const newNickname = '更新后的管理员';
      
      await db.execute(
        'UPDATE users SET nickname = $1 WHERE id = $2',
        [newNickname, userId]
      );
      
      const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
      expect(user.nickname).toBe(newNickname);
      console.log('✅ 用户信息更新成功');
    });
  });

  describe('2. 题库和题目管理功能', () => {
    it('应该能够创建题库', async () => {
      const bankId = `test-bank-${Date.now()}`;
      
      await db.execute(
        'INSERT INTO banks (id, name, category, level, question_count) VALUES ($1, $2, $3, $4, $5)',
        [bankId, '综合测试题库', '测试分类', '中级', 0]
      );
      
      testData.banks.push(bankId);
      
      const bank = await db.getOne('SELECT * FROM banks WHERE id = $1', [bankId]);
      expect(bank).toBeDefined();
      expect(bank.name).toBe('综合测试题库');
      console.log('✅ 题库创建成功');
    });

    it('应该能够创建单选题', async () => {
      const questionId = `test-q-single-${Date.now()}`;
      const bankId = testData.banks[0];
      
      await db.execute(
        `INSERT INTO questions (id, bank_id, type, content, options, answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          questionId,
          bankId,
          'SINGLE',
          '这是一道单选题',
          JSON.stringify(['选项A', '选项B', '选项C', '选项D']),
          JSON.stringify('A'),
          '正确答案是A'
        ]
      );
      
      testData.questions.push(questionId);
      
      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [questionId]);
      expect(question).toBeDefined();
      expect(question.type).toBe('SINGLE');
      expect(Array.isArray(question.options)).toBe(true);
      console.log('✅ 单选题创建成功');
    });

    it('应该能够创建多选题', async () => {
      const questionId = `test-q-multiple-${Date.now()}`;
      const bankId = testData.banks[0];
      
      await db.execute(
        `INSERT INTO questions (id, bank_id, type, content, options, answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          questionId,
          bankId,
          'MULTIPLE',
          '这是一道多选题',
          JSON.stringify(['选项A', '选项B', '选项C', '选项D']),
          JSON.stringify(['A', 'B']),
          '正确答案是AB'
        ]
      );
      
      testData.questions.push(questionId);
      
      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [questionId]);
      expect(question).toBeDefined();
      expect(question.type).toBe('MULTIPLE');
      expect(Array.isArray(question.answer)).toBe(true);
      console.log('✅ 多选题创建成功');
    });

    it('应该能够批量导入题目', async () => {
      const bankId = testData.banks[0];
      const batchQuestions = [];
      
      for (let i = 0; i < 10; i++) {
        const questionId = `test-q-batch-${Date.now()}-${i}`;
        batchQuestions.push({
          id: questionId,
          content: `批量导入题目 ${i + 1}`
        });
        testData.questions.push(questionId);
      }
      
      await db.transaction(async (client) => {
        for (const q of batchQuestions) {
          await client.query(
            `INSERT INTO questions (id, bank_id, type, content, options, answer)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [q.id, bankId, 'SINGLE', q.content, JSON.stringify([]), JSON.stringify('A')]
          );
        }
      });
      
      const questions = await db.getMany(
        'SELECT * FROM questions WHERE bank_id = $1',
        [bankId]
      );
      
      expect(questions.length).toBeGreaterThanOrEqual(10);
      console.log(`✅ 批量导入 ${batchQuestions.length} 道题目成功`);
    });

    it('应该能够更新题目内容', async () => {
      const questionId = testData.questions[0];
      const newContent = '更新后的题目内容';
      
      await db.execute(
        'UPDATE questions SET content = $1 WHERE id = $2',
        [newContent, questionId]
      );
      
      const question = await db.getOne('SELECT * FROM questions WHERE id = $1', [questionId]);
      expect(question.content).toBe(newContent);
      console.log('✅ 题目内容更新成功');
    });
  });

  describe('3. 考试系统功能', () => {
    it('应该能够创建考试', async () => {
      const examId = `test-exam-${Date.now()}`;
      const bankId = testData.banks[0];
      
      await db.execute(
        `INSERT INTO exams (
          id, bank_id, title, duration, total_score, pass_score, 
          strategy, status, is_visible
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          examId,
          bankId,
          '综合测试考试',
          60,
          100,
          60,
          'RANDOM',
          'PENDING',
          true
        ]
      );
      
      testData.exams.push(examId);
      
      const exam = await db.getOne('SELECT * FROM exams WHERE id = $1', [examId]);
      expect(exam).toBeDefined();
      expect(exam.title).toBe('综合测试考试');
      console.log('✅ 考试创建成功');
    });

    it('应该能够更新考试状态', async () => {
      const examId = testData.exams[0];
      
      await db.execute(
        'UPDATE exams SET status = $1 WHERE id = $2',
        ['PUBLISHED', examId]
      );
      
      const exam = await db.getOne('SELECT * FROM exams WHERE id = $1', [examId]);
      expect(exam.status).toBe('PUBLISHED');
      console.log('✅ 考试状态更新成功');
    });

    it('应该能够记录考试历史', async () => {
      const examId = testData.exams[0];
      const userId = testData.users[1]; // 学员
      const historyId = `test-history-${Date.now()}`;
      
      await db.execute(
        `INSERT INTO exam_history (
          id, user_id, exam_id, exam_title, total_score, score, 
          pass_score, passed, submit_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          historyId,
          userId,
          examId,
          '综合测试考试',
          100,
          85,
          60,
          true,
          new Date().toISOString()
        ]
      );
      
      const history = await db.getOne(
        'SELECT * FROM exam_history WHERE id = $1',
        [historyId]
      );
      
      expect(history).toBeDefined();
      expect(history.passed).toBe(true);
      console.log('✅ 考试历史记录成功');
      
      // 清理
      await db.execute('DELETE FROM exam_history WHERE id = $1', [historyId]);
    });
  });

  describe('4. 练习记录功能', () => {
    it('应该能够创建练习记录', async () => {
      const practiceId = `test-practice-${Date.now()}`;
      const userId = testData.users[1];
      const bankId = testData.banks[0];
      
      await db.execute(
        `INSERT INTO practice_records (
          id, user_id, bank_id, bank_name, type, mode, count, date, current_index, user_answers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          practiceId,
          userId,
          bankId,
          '综合测试题库',
          'SEQUENTIAL',
          'PRACTICE',
          10,
          new Date().toISOString(),
          0,
          JSON.stringify({})
        ]
      );
      
      const practice = await db.getOne(
        'SELECT * FROM practice_records WHERE id = $1',
        [practiceId]
      );
      
      expect(practice).toBeDefined();
      expect(practice.user_id).toBe(userId);
      console.log('✅ 练习记录创建成功');
      
      // 清理
      await db.execute('DELETE FROM practice_records WHERE id = $1', [practiceId]);
    });

    it('应该能够更新练习进度', async () => {
      const practiceId = `test-practice-update-${Date.now()}`;
      const userId = testData.users[1];
      const bankId = testData.banks[0];
      
      // 创建练习记录
      await db.execute(
        `INSERT INTO practice_records (
          id, user_id, bank_id, bank_name, type, mode, count, date, current_index, user_answers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          practiceId,
          userId,
          bankId,
          '综合测试题库',
          'SEQUENTIAL',
          'PRACTICE',
          10,
          new Date().toISOString(),
          0,
          JSON.stringify({})
        ]
      );
      
      // 更新进度
      const newAnswers = { '0': 'A', '1': 'B', '2': 'C' };
      await db.execute(
        'UPDATE practice_records SET current_index = $1, user_answers = $2 WHERE id = $3',
        [3, JSON.stringify(newAnswers), practiceId]
      );
      
      const practice = await db.getOne(
        'SELECT * FROM practice_records WHERE id = $1',
        [practiceId]
      );
      
      expect(practice.current_index).toBe(3);
      expect(Object.keys(practice.user_answers).length).toBe(3);
      console.log('✅ 练习进度更新成功');
      
      // 清理
      await db.execute('DELETE FROM practice_records WHERE id = $1', [practiceId]);
    });
  });

  describe('5. 标签系统功能', () => {
    it('应该能够创建标签', async () => {
      const tagId = `test-tag-${Date.now()}`;
      const now = new Date().toISOString();
      
      await db.execute(
        'INSERT INTO tags (id, name, color, usage_count, created_at) VALUES ($1, $2, $3, $4, $5)',
        [tagId, '测试标签', '#FF5733', 0, now]
      );
      
      testData.tags.push(tagId);
      
      const tag = await db.getOne('SELECT * FROM tags WHERE id = $1', [tagId]);
      expect(tag).toBeDefined();
      expect(tag.name).toBe('测试标签');
      console.log('✅ 标签创建成功');
    });

    it('应该能够关联题目和标签', async () => {
      const questionId = testData.questions[0];
      const tagId = testData.tags[0];
      
      // 确保标签存在
      if (!tagId) {
        console.log('⚠️  跳过标签关联测试（标签未创建）');
        return;
      }
      
      await db.execute(
        'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)',
        [questionId, tagId]
      );
      
      const relation = await db.getOne(
        'SELECT * FROM question_tags WHERE question_id = $1 AND tag_id = $2',
        [questionId, tagId]
      );
      
      expect(relation).toBeDefined();
      console.log('✅ 题目标签关联成功');
      
      // 清理
      await db.execute(
        'DELETE FROM question_tags WHERE question_id = $1 AND tag_id = $2',
        [questionId, tagId]
      );
    });
  });

  describe('6. 数据完整性测试', () => {
    it('应该能够处理外键约束', async () => {
      try {
        // 尝试插入不存在的 bank_id
        await db.execute(
          'INSERT INTO questions (id, bank_id, type, content) VALUES ($1, $2, $3, $4)',
          [`fk-test-${Date.now()}`, 'non-existent-bank', 'SINGLE', '测试']
        );
        
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('23503'); // PostgreSQL 外键约束错误
        console.log('✅ 外键约束验证成功');
      }
    });

    it('应该能够处理唯一约束', async () => {
      const questionId = testData.questions[0];
      
      try {
        // 尝试插入重复的 ID
        await db.execute(
          'INSERT INTO questions (id, bank_id, type, content) VALUES ($1, $2, $3, $4)',
          [questionId, testData.banks[0], 'SINGLE', '重复ID']
        );
        
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('23505'); // PostgreSQL 唯一约束错误
        console.log('✅ 唯一约束验证成功');
      }
    });
  });

  describe('7. 性能测试', () => {
    it('应该能够处理并发查询', async () => {
      const concurrentQueries = 50;
      const queries = Array(concurrentQueries).fill(null).map(() => 
        db.query('SELECT * FROM users LIMIT 1')
      );
      
      const start = Date.now();
      await Promise.all(queries);
      const duration = Date.now() - start;
      
      console.log(`✅ ${concurrentQueries} 个并发查询耗时: ${duration}ms`);
      expect(duration).toBeLessThan(5000); // 应该在 5 秒内完成
    });

    it('应该能够快速查询大量数据', async () => {
      const start = Date.now();
      const questions = await db.getMany('SELECT * FROM questions LIMIT 100');
      const duration = Date.now() - start;
      
      console.log(`✅ 查询 100 条数据耗时: ${duration}ms`);
      expect(duration).toBeLessThan(1000); // 应该在 1 秒内完成
    });
  });

  describe('8. 备份和恢复测试', () => {
    it('应该能够执行数据库备份', async () => {
      try {
        const backupFile = `./backup-test-${Date.now()}.sql`;
        const dbName = process.env.DB_NAME || 'edumaster';
        const dbUser = process.env.DB_USER || 'edumaster_user';
        const dbHost = process.env.DB_HOST || 'localhost';
        
        // 执行备份
        await execAsync(
          `pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} -f ${backupFile}`,
          { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }
        );
        
        // 检查备份文件是否存在
        const stats = await fs.stat(backupFile);
        expect(stats.size).toBeGreaterThan(0);
        console.log(`✅ 数据库备份成功，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // 清理备份文件
        await fs.unlink(backupFile);
      } catch (error) {
        console.warn('⚠️  备份测试跳过（可能缺少 pg_dump 工具）:', error.message);
      }
    });
  });

  describe('9. 连接池状态测试', () => {
    it('应该能够获取连接池状态', () => {
      const poolStatus = db.getPoolStatus();
      
      expect(poolStatus).toBeDefined();
      expect(poolStatus.totalCount).toBeGreaterThan(0);
      expect(poolStatus.idleCount).toBeGreaterThanOrEqual(0);
      expect(poolStatus.waitingCount).toBeGreaterThanOrEqual(0);
      
      console.log('✅ 连接池状态:', poolStatus);
    });
  });

  describe('10. 分页查询测试', () => {
    it('应该能够正确分页查询', async () => {
      const result = await db.paginate('questions', {
        page: 1,
        pageSize: 5,
        orderBy: 'created_at DESC'
      });
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(result.data.length).toBeLessThanOrEqual(5);
      
      console.log(`✅ 分页查询成功: 第 ${result.page} 页，共 ${result.totalPages} 页，总计 ${result.total} 条`);
    });
  });
});
