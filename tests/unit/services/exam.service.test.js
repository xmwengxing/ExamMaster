// 考试服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as examService from '../../../src/services/exam.service.js';

describe('考试服务 - getExams', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn(),
      paginate: vi.fn()
    };
  });

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

    const result = await examService.getExams(mockDb);

    expect(mockDb.getMany).toHaveBeenCalledWith('SELECT * FROM exams');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'exam-1',
      bankId: 'bank-1',
      title: '期末考试',
      duration: 120,
      totalScore: 100,
      passScore: 60,
      passScorePercent: 60,
      strategy: 'FIXED',
      selectedQuestionIds: ['q1', 'q2'],
      status: 'ACTIVE',
      isVisible: true,
      startTime: '2024-01-01',
      endTime: '2024-01-31',
      singleCount: 10,
      multipleCount: 5,
      judgeCount: 5,
      fillBlankCount: 0,
      shortAnswerCount: 0
    });
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

    const result = await examService.getExams(mockDb, { page: 1, pageSize: 20 });

    expect(mockDb.paginate).toHaveBeenCalledWith('exams', {
      page: 1,
      pageSize: 20,
      orderBy: 'created_at DESC'
    });
    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    });
  });

  it('应该处理空结果', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await examService.getExams(mockDb);

    expect(result).toEqual([]);
  });
});

describe('考试服务 - getExamById', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

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

    const result = await examService.getExamById(mockDb, 'exam-1');

    expect(mockDb.getOne).toHaveBeenCalledWith('SELECT * FROM exams WHERE id = $1', ['exam-1']);
    expect(result.id).toBe('exam-1');
    expect(result.title).toBe('期末考试');
  });

  it('应该在考试不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await examService.getExamById(mockDb, 'non-existent');

    expect(result).toBeNull();
  });
});

describe('考试服务 - createExam', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功创建考试', async () => {
    const examData = {
      bankId: 'bank-1',
      title: '期末考试',
      duration: 120,
      totalScore: 100,
      passScore: 60,
      passScorePercent: 60,
      strategy: 'FIXED',
      selectedQuestionIds: ['q1', 'q2'],
      status: 'ACTIVE',
      isVisible: true,
      startTime: '2024-01-01',
      endTime: '2024-01-31',
      singleCount: 10,
      multipleCount: 5,
      judgeCount: 5,
      fillBlankCount: 0,
      shortAnswerCount: 0
    };

    const result = await examService.createExam(mockDb, examData);

    expect(result).toMatch(/^exam-\d+$/);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exams'),
      expect.arrayContaining([
        expect.any(String),
        'bank-1',
        '期末考试',
        120,
        100,
        60,
        60,
        'FIXED',
        ['q1', 'q2'],
        'ACTIVE',
        true,
        '2024-01-01',
        '2024-01-31',
        10,
        5,
        5,
        0,
        0
      ])
    );
  });

  it('应该使用提供的 ID', async () => {
    const examData = {
      id: 'custom-exam-id',
      bankId: 'bank-1',
      title: '期末考试',
      duration: 120,
      totalScore: 100,
      passScore: 60
    };

    const result = await examService.createExam(mockDb, examData);

    expect(result).toBe('custom-exam-id');
  });

  it('应该使用默认值处理缺失字段', async () => {
    const examData = {
      bankId: 'bank-1',
      title: '期末考试',
      duration: 120,
      totalScore: 100,
      passScore: 60
    };

    await examService.createExam(mockDb, examData);

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.any(String),
        'bank-1',
        '期末考试',
        120,
        100,
        60,
        undefined,
        undefined,
        [],
        'PENDING',
        false,
        null,
        null,
        0,
        0,
        0,
        0,
        0
      ])
    );
  });
});

describe('考试服务 - updateExam', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新考试', async () => {
    const updates = {
      title: '更新后的标题',
      duration: 150,
      isVisible: true
    };

    await examService.updateExam(mockDb, 'exam-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE exams SET title = $1, duration = $2, is_visible = $3 WHERE id = $4',
      ['更新后的标题', 150, true, 'exam-1']
    );
  });

  it('应该在没有更新字段时不执行查询', async () => {
    await examService.updateExam(mockDb, 'exam-1', {});

    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('应该处理所有可更新字段', async () => {
    const updates = {
      bankId: 'bank-2',
      title: '新标题',
      duration: 150,
      totalScore: 120,
      passScore: 72,
      passScorePercent: 60,
      strategy: 'RANDOM',
      selectedQuestionIds: ['q3', 'q4'],
      status: 'COMPLETED',
      isVisible: false,
      startTime: '2024-02-01',
      endTime: '2024-02-28',
      singleCount: 15,
      multipleCount: 10,
      judgeCount: 10,
      fillBlankCount: 5,
      shortAnswerCount: 5
    };

    await examService.updateExam(mockDb, 'exam-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE exams SET'),
      expect.arrayContaining([
        'bank-2',
        '新标题',
        150,
        120,
        72,
        60,
        'RANDOM',
        ['q3', 'q4'],
        'COMPLETED',
        false,
        '2024-02-01',
        '2024-02-28',
        15,
        10,
        10,
        5,
        5,
        'exam-1'
      ])
    );
  });
});

describe('考试服务 - deleteExam', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功删除考试', async () => {
    await examService.deleteExam(mockDb, 'exam-1');

    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM exams WHERE id = $1',
      ['exam-1']
    );
  });
});

describe('考试服务 - toggleExamVisibility', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn(),
      execute: vi.fn()
    };
  });

  it('应该切换考试可见性（从不可见到可见）', async () => {
    mockDb.getOne.mockResolvedValue({ is_visible: false });

    const result = await examService.toggleExamVisibility(mockDb, 'exam-1');

    expect(result).toBe(true);
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE exams SET is_visible = $1 WHERE id = $2',
      [true, 'exam-1']
    );
  });

  it('应该切换考试可见性（从可见到不可见）', async () => {
    mockDb.getOne.mockResolvedValue({ is_visible: true });

    const result = await examService.toggleExamVisibility(mockDb, 'exam-1');

    expect(result).toBe(false);
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE exams SET is_visible = $1 WHERE id = $2',
      [false, 'exam-1']
    );
  });

  it('应该在考试不存在时抛出错误', async () => {
    mockDb.getOne.mockResolvedValue(null);

    await expect(
      examService.toggleExamVisibility(mockDb, 'non-existent')
    ).rejects.toThrow('考试不存在');
  });
});

describe('考试服务 - getExamHistory', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回用户的考试历史记录', async () => {
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

    const result = await examService.getExamHistory(mockDb, 'user-1');

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM exam_history WHERE user_id = $1',
      ['user-1']
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'history-1',
      userId: 'user-1',
      examId: 'exam-1',
      examTitle: '期末考试',
      score: 85,
      totalScore: 100,
      passScore: 60,
      timeUsed: 90,
      submitTime: '2024-01-15',
      bankId: 'bank-1',
      wrongQuestionIds: ['q1', 'q2'],
      userAnswers: { 'q1': 'A', 'q2': 'B' },
      passed: true,
      currentIndex: 20,
      isFinished: true,
      examConfig: { duration: 120 },
      orderedQuestionIds: ['q1', 'q2', 'q3']
    });
  });

  it('应该处理空结果', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await examService.getExamHistory(mockDb, 'user-1');

    expect(result).toEqual([]);
  });
});

describe('考试服务 - getAllExamHistory', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

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

    const result = await examService.getAllExamHistory(mockDb);

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM exam_history ORDER BY submit_time DESC'
    );
    expect(result).toHaveLength(1);
  });
});

describe('考试服务 - createOrUpdateExamHistory', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功创建考试历史记录', async () => {
    const recordData = {
      examId: 'exam-1',
      examTitle: '期末考试',
      score: 85,
      totalScore: 100,
      passScore: 60,
      timeUsed: 90,
      submitTime: '2024-01-15',
      bankId: 'bank-1',
      wrongQuestionIds: ['q1', 'q2'],
      userAnswers: { 'q1': 'A', 'q2': 'B' },
      passed: true,
      currentIndex: 20,
      isFinished: true,
      examConfig: { duration: 120 },
      orderedQuestionIds: ['q1', 'q2', 'q3']
    };

    const result = await examService.createOrUpdateExamHistory(mockDb, 'user-1', recordData);

    expect(result).toMatch(/^exam-\d+$/);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exam_history'),
      expect.arrayContaining([
        expect.any(String),
        'user-1',
        'exam-1',
        '期末考试',
        85,
        100,
        60,
        90,
        '2024-01-15',
        'bank-1',
        '["q1","q2"]',
        '{"q1":"A","q2":"B"}',
        true,
        20,
        true,
        '{"duration":120}',
        '["q1","q2","q3"]'
      ])
    );
  });

  it('应该处理随机模拟试卷（examId 为 null）', async () => {
    const recordData = {
      examId: null,
      examTitle: '随机模拟试卷',
      score: 75,
      totalScore: 100,
      passScore: 60,
      bankId: 'bank-1'
    };

    await examService.createOrUpdateExamHistory(mockDb, 'user-1', recordData);

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.any(String),
        'user-1',
        null, // examId 为 null
        '随机模拟试卷',
        75,
        100,
        60
      ])
    );
  });
});

describe('考试服务 - updateExamHistory', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新考试历史记录', async () => {
    const updates = {
      score: 90,
      totalScore: 100,
      passScore: 60,
      timeUsed: 100,
      submitTime: '2024-01-16',
      wrongQuestionIds: ['q1'],
      userAnswers: { 'q1': 'A', 'q2': 'B', 'q3': 'C' },
      passed: true,
      currentIndex: 20,
      isFinished: true,
      examConfig: { duration: 120 },
      orderedQuestionIds: ['q1', 'q2', 'q3']
    };

    await examService.updateExamHistory(mockDb, 'history-1', 'user-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE exam_history SET'),
      [
        90,
        100,
        60,
        100,
        '2024-01-16',
        '["q1"]',
        '{"q1":"A","q2":"B","q3":"C"}',
        true,
        20,
        true,
        '{"duration":120}',
        '["q1","q2","q3"]',
        'history-1',
        'user-1'
      ]
    );
  });
});

describe('考试服务 - deleteExamHistory', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功删除考试历史记录', async () => {
    await examService.deleteExamHistory(mockDb, 'history-1', 'user-1');

    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM exam_history WHERE id = $1 AND user_id = $2',
      ['history-1', 'user-1']
    );
  });
});
