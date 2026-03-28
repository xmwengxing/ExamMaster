// 考试 API 集成测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import examRoutes from '../../src/routes/exam.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { generateTestToken, generateAdminToken } from '../helpers/testUtils.js';

// 创建测试应用
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // 模拟数据库中间件
  app.use((req, res, next) => {
    req.db = mockDb;
    next();
  });
  
  // 挂载路由
  app.use('/api/exams', examRoutes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}

let mockDb;
let app;
let validToken;
let adminToken;

describe('考试 API 集成测试', () => {
  beforeEach(() => {
    // 重置 mock 数据库
    mockDb = {
      getMany: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn(),
      paginate: vi.fn()
    };
    
    // 生成测试 token
    validToken = generateTestToken();
    adminToken = generateAdminToken();
    
    app = createTestApp();
  });

  describe('GET /api/exams', () => {
    it('应该返回所有考试列表（不分页）', async () => {
      const mockExams = [
        {
          id: 'exam-1',
          bank_id: 'bank-1',
          title: '期末考试',
          duration: 120,
          total_score: 100,
          pass_score: 60,
          pass_score_percent: 60,
          strategy: 'FIXED',
          selected_question_ids: ['q1', 'q2'],
          status: 'ACTIVE',
          is_visible: true,
          start_time: '2024-01-01',
          end_time: '2024-01-31',
          single_count: 10,
          multiple_count: 5,
          judge_count: 5,
          fill_blank_count: 0,
          short_answer_count: 0
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockExams);
      
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('exam-1');
      expect(response.body[0].title).toBe('期末考试');
    });

    it('应该返回分页的考试列表', async () => {
      const mockPaginateResult = {
        data: [
          {
            id: 'exam-1',
            bank_id: 'bank-1',
            title: '期末考试',
            duration: 120,
            total_score: 100,
            pass_score: 60,
            pass_score_percent: 60,
            strategy: 'FIXED',
            selected_question_ids: [],
            status: 'ACTIVE',
            is_visible: true,
            start_time: null,
            end_time: null,
            single_count: 10,
            multiple_count: 5,
            judge_count: 5,
            fill_blank_count: 0,
            short_answer_count: 0
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };
      
      mockDb.paginate.mockResolvedValue(mockPaginateResult);
      
      const response = await request(app)
        .get('/api/exams?page=1&pageSize=20')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('应该在未认证时返回 401', async () => {
      await request(app)
        .get('/api/exams')
        .expect(401);
    });
  });

  describe('GET /api/exams/:id', () => {
    it('应该返回指定的考试', async () => {
      const mockExam = {
        id: 'exam-1',
        bank_id: 'bank-1',
        title: '期末考试',
        duration: 120,
        total_score: 100,
        pass_score: 60,
        pass_score_percent: 60,
        strategy: 'FIXED',
        selected_question_ids: ['q1', 'q2'],
        status: 'ACTIVE',
        is_visible: true,
        start_time: '2024-01-01',
        end_time: '2024-01-31',
        single_count: 10,
        multiple_count: 5,
        judge_count: 5,
        fill_blank_count: 0,
        short_answer_count: 0
      };
      
      mockDb.getOne.mockResolvedValue(mockExam);
      
      const response = await request(app)
        .get('/api/exams/exam-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.id).toBe('exam-1');
      expect(response.body.title).toBe('期末考试');
    });

    it('应该在考试不存在时返回 404', async () => {
      mockDb.getOne.mockResolvedValue(null);
      
      await request(app)
        .get('/api/exams/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/exams', () => {
    it('应该创建新考试（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankId: 'bank-1',
          title: '期末考试',
          duration: 120,
          totalScore: 100,
          passScore: 60,
          strategy: 'FIXED'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^exam-\d+$/);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '新考试' })
        .expect(403);
    });
  });

  describe('PUT /api/exams/:id', () => {
    it('应该更新考试（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/exams/exam-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '更新后的标题',
          duration: 150
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .put('/api/exams/exam-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '更新' })
        .expect(403);
    });
  });

  describe('DELETE /api/exams/:id', () => {
    it('应该删除考试（管理员）', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .delete('/api/exams/exam-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .delete('/api/exams/exam-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('POST /api/exams/:id/toggle-visibility', () => {
    it('应该切换考试可见性（管理员）', async () => {
      mockDb.getOne.mockResolvedValue({ is_visible: false });
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/exams/exam-1/toggle-visibility')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.isVisible).toBe(true);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .post('/api/exams/exam-1/toggle-visibility')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('GET /api/exams/history/my', () => {
    it('应该返回用户的考试历史记录', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          user_id: 'test-user',
          exam_id: 'exam-1',
          exam_title: '期末考试',
          score: 85,
          total_score: 100,
          pass_score: 60,
          time_used: 90,
          submit_time: '2024-01-15',
          bank_id: 'bank-1',
          wrong_question_ids: ['q1', 'q2'],
          user_answers: { 'q1': 'A', 'q2': 'B' },
          passed: true,
          current_index: 20,
          is_finished: true,
          exam_config: { duration: 120 },
          ordered_question_ids: ['q1', 'q2', 'q3']
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockHistory);
      
      const response = await request(app)
        .get('/api/exams/history/my')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('history-1');
      expect(response.body[0].userId).toBe('test-user');
    });
  });

  describe('GET /api/exams/history/all', () => {
    it('应该返回所有考试历史记录（管理员）', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          user_id: 'user-1',
          exam_id: 'exam-1',
          exam_title: '期末考试',
          score: 85,
          total_score: 100,
          pass_score: 60,
          time_used: 90,
          submit_time: '2024-01-15',
          bank_id: 'bank-1',
          wrong_question_ids: [],
          user_answers: {},
          passed: true,
          current_index: 20,
          is_finished: true,
          exam_config: null,
          ordered_question_ids: []
        }
      ];
      
      mockDb.getMany.mockResolvedValue(mockHistory);
      
      const response = await request(app)
        .get('/api/exams/history/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
    });

    it('应该在非管理员时返回 403', async () => {
      await request(app)
        .get('/api/exams/history/all')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('POST /api/exams/history', () => {
    it('应该创建考试历史记录', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .post('/api/exams/history')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          examId: 'exam-1',
          examTitle: '期末考试',
          score: 85,
          totalScore: 100,
          passScore: 60,
          timeUsed: 90,
          bankId: 'bank-1',
          passed: true,
          isFinished: true
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toMatch(/^exam-\d+$/);
    });
  });

  describe('PUT /api/exams/history/:id', () => {
    it('应该更新考试历史记录', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .put('/api/exams/history/history-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          score: 90,
          totalScore: 100,
          passScore: 60,
          isFinished: true
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/exams/history/:id', () => {
    it('应该删除考试历史记录', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 1 });
      
      const response = await request(app)
        .delete('/api/exams/history/history-1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
