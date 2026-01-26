// 题目服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as questionService from '../../../src/services/question.service.js';

describe('题目服务 - getQuestions', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      paginate: vi.fn(),
      getMany: vi.fn()
    };
  });

  it('应该返回分页的题目列表', async () => {
    const mockResult = {
      data: [
        {
          id: 'q-1',
          bank_id: 'bank-1',
          type: 'SINGLE',
          content: '题目1',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: '解析1',
          chapter: null,
          blanks: null,
          reference_answer: null,
          ai_grading_enabled: false,
          tags: null,
          sort_order: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    };

    mockDb.paginate.mockResolvedValue(mockResult);

    const result = await questionService.getQuestions(mockDb, { page: 1, pageSize: 20 });

    expect(mockDb.paginate).toHaveBeenCalledWith('questions', {
      page: 1,
      pageSize: 20,
      where: '',
      params: [],
      orderBy: 'bank_id ASC, sort_order ASC, id ASC'
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].bankId).toBe('bank-1');
    expect(result.pagination.total).toBe(1);
  });

  it('应该支持按题库ID筛选', async () => {
    const mockResult = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    };

    mockDb.paginate.mockResolvedValue(mockResult);

    await questionService.getQuestions(mockDb, { bankId: 'bank-1', page: 1, pageSize: 20 });

    expect(mockDb.paginate).toHaveBeenCalledWith('questions', {
      page: 1,
      pageSize: 20,
      where: 'bank_id = $1',
      params: ['bank-1'],
      orderBy: 'sort_order ASC, id ASC'
    });
  });

  it('应该返回所有题目（不分页）', async () => {
    const mockQuestions = [
      {
        id: 'q-1',
        bank_id: 'bank-1',
        type: 'SINGLE',
        content: '题目1',
        options: ['A', 'B'],
        answer: 'A',
        explanation: '',
        chapter: null,
        blanks: null,
        reference_answer: null,
        ai_grading_enabled: false,
        tags: null,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    mockDb.getMany.mockResolvedValue(mockQuestions);

    const result = await questionService.getQuestions(mockDb, {});

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM questions ORDER BY bank_id ASC, sort_order ASC, id ASC'
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q-1');
  });

  it('应该支持按题库ID筛选（不分页）', async () => {
    mockDb.getMany.mockResolvedValue([]);

    await questionService.getQuestions(mockDb, { bankId: 'bank-1' });

    expect(mockDb.getMany).toHaveBeenCalledWith(
      'SELECT * FROM questions WHERE bank_id = $1 ORDER BY sort_order ASC, id ASC',
      ['bank-1']
    );
  });
});

describe('题目服务 - getQuestionById', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该返回指定的题目', async () => {
    const mockQuestion = {
      id: 'q-1',
      bank_id: 'bank-1',
      type: 'SINGLE',
      content: '题目1',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: '解析',
      chapter: '第一章',
      blanks: null,
      reference_answer: null,
      ai_grading_enabled: false,
      tags: ['tag1'],
      sort_order: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockDb.getOne.mockResolvedValue(mockQuestion);

    const result = await questionService.getQuestionById(mockDb, 'q-1');

    expect(mockDb.getOne).toHaveBeenCalledWith('SELECT * FROM questions WHERE id = $1', ['q-1']);
    expect(result.id).toBe('q-1');
    expect(result.bankId).toBe('bank-1');
  });

  it('应该在题目不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await questionService.getQuestionById(mockDb, 'non-existent');

    expect(result).toBeNull();
  });
});

describe('题目服务 - createQuestion', () => {
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
    mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback(mockClient);
      })
    };
  });

  it('应该成功创建单选题', async () => {
    const questionData = {
      bankId: 'bank-1',
      type: 'SINGLE',
      content: '题目内容',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: '解析'
    };

    const result = await questionService.createQuestion(mockDb, questionData);

    expect(result.id).toMatch(/^q-\d+$/);
    expect(result.bankId).toBe('bank-1');
    expect(result.type).toBe('SINGLE');
    expect(mockClient.query).toHaveBeenCalledTimes(2); // 插入题目 + 更新题库计数
  });

  it('应该验证填空题配置', async () => {
    const questionData = {
      type: 'FILL_IN_BLANK',
      content: '填空题',
      blanks: []
    };

    await expect(
      questionService.createQuestion(mockDb, questionData)
    ).rejects.toThrow('填空题必须配置空白项');
  });

  it('应该验证填空项配置完整性', async () => {
    const questionData = {
      type: 'FILL_IN_BLANK',
      content: '填空题',
      blanks: [{ id: 'blank1' }] // 缺少 acceptedAnswers
    };

    await expect(
      questionService.createQuestion(mockDb, questionData)
    ).rejects.toThrow('填空项配置不完整');
  });

  it('应该验证简答题参考答案', async () => {
    const questionData = {
      type: 'SHORT_ANSWER',
      content: '简答题',
      referenceAnswer: ''
    };

    await expect(
      questionService.createQuestion(mockDb, questionData)
    ).rejects.toThrow('简答题必须提供参考答案');
  });

  it('应该成功创建填空题', async () => {
    const questionData = {
      bankId: 'bank-1',
      type: 'FILL_IN_BLANK',
      content: '填空题',
      blanks: [
        { id: 'blank1', acceptedAnswers: ['答案1'] }
      ]
    };

    const result = await questionService.createQuestion(mockDb, questionData);

    expect(result.type).toBe('FILL_IN_BLANK');
    expect(result.blanks).toEqual([{ id: 'blank1', acceptedAnswers: ['答案1'] }]);
  });

  it('应该更新标签使用次数', async () => {
    const questionData = {
      bankId: 'bank-1',
      type: 'SINGLE',
      content: '题目',
      tags: ['tag1', 'tag2']
    };

    await questionService.createQuestion(mockDb, questionData);

    // 插入题目 + 更新题库 + 更新tag1 + 插入question_tags1 + 更新tag2 + 插入question_tags2
    expect(mockClient.query).toHaveBeenCalledTimes(6);
  });
});

describe('题目服务 - updateQuestion', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新题目', async () => {
    const updates = {
      content: '更新后的内容',
      explanation: '更新后的解析'
    };

    await questionService.updateQuestion(mockDb, 'q-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE questions SET content = $1, explanation = $2 WHERE id = $3',
      ['更新后的内容', '更新后的解析', 'q-1']
    );
  });

  it('应该处理 JSON 对象字段', async () => {
    const updates = {
      options: ['A', 'B', 'C']
    };

    await questionService.updateQuestion(mockDb, 'q-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE questions SET options = $1 WHERE id = $2',
      ['["A","B","C"]', 'q-1']
    );
  });

  it('应该在没有更新字段时不执行查询', async () => {
    await questionService.updateQuestion(mockDb, 'q-1', {});

    expect(mockDb.execute).not.toHaveBeenCalled();
  });
});

describe('题目服务 - deleteQuestion', () => {
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
    mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback(mockClient);
      })
    };
  });

  it('应该成功删除题目并更新题库计数', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ bank_id: 'bank-1' }] }) // 查询题目
      .mockResolvedValueOnce({ rowCount: 1 }) // 删除题目
      .mockResolvedValueOnce({ rowCount: 1 }); // 更新题库

    await questionService.deleteQuestion(mockDb, 'q-1');

    expect(mockClient.query).toHaveBeenCalledTimes(3);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT bank_id FROM questions WHERE id = $1',
      ['q-1']
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'DELETE FROM questions WHERE id = $1',
      ['q-1']
    );
  });

  it('应该处理题目不存在的情况', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    await questionService.deleteQuestion(mockDb, 'non-existent');

    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });
});

describe('题目服务 - batchDeleteQuestions', () => {
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
    mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback(mockClient);
      })
    };
  });

  it('应该批量删除题目并更新题库计数', async () => {
    const questionIds = ['q-1', 'q-2', 'q-3'];
    
    mockClient.query
      .mockResolvedValueOnce({ 
        rows: [
          { bank_id: 'bank-1' },
          { bank_id: 'bank-1' },
          { bank_id: 'bank-2' }
        ] 
      }) // 查询题目
      .mockResolvedValueOnce({ rowCount: 3 }) // 删除题目
      .mockResolvedValue({ rowCount: 1 }); // 更新题库

    const result = await questionService.batchDeleteQuestions(mockDb, questionIds);

    expect(result).toBe(3);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT bank_id FROM questions WHERE id IN ($1, $2, $3)',
      questionIds
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'DELETE FROM questions WHERE id IN ($1, $2, $3)',
      questionIds
    );
  });

  it('应该处理空数组', async () => {
    const result = await questionService.batchDeleteQuestions(mockDb, []);

    expect(result).toBe(0);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('应该处理 null 参数', async () => {
    const result = await questionService.batchDeleteQuestions(mockDb, null);

    expect(result).toBe(0);
  });
});

describe('题目服务 - batchImportQuestions', () => {
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
    mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback(mockClient);
      })
    };
  });

  it('应该批量导入题目', async () => {
    const questions = [
      { type: 'SINGLE', content: '题目1', options: ['A', 'B'], answer: 'A' },
      { type: 'MULTIPLE', content: '题目2', options: ['A', 'B'], answer: ['A', 'B'] }
    ];

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ max_order: 10 }] }) // 获取最大 sort_order
      .mockResolvedValueOnce({ rowCount: 2 }) // 批量插入
      .mockResolvedValueOnce({ rowCount: 1 }); // 更新题库

    const result = await questionService.batchImportQuestions(mockDb, 'bank-1', questions);

    expect(result.inserted).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('应该处理空数组', async () => {
    const result = await questionService.batchImportQuestions(mockDb, 'bank-1', []);

    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('应该处理批量插入失败并回退到逐条插入', async () => {
    const questions = [
      { type: 'SINGLE', content: '题目1', options: ['A'], answer: 'A' }
    ];

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ max_order: null }] }) // 获取最大 sort_order
      .mockRejectedValueOnce(new Error('批量插入失败')) // 批量插入失败
      .mockResolvedValueOnce({ rowCount: 1 }) // 逐条插入成功
      .mockResolvedValueOnce({ rowCount: 1 }); // 更新题库

    const result = await questionService.batchImportQuestions(mockDb, 'bank-1', questions);

    expect(result.inserted).toBe(1);
  });
});

describe('题目服务 - gradeFillInBlank', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该对填空题进行评分', async () => {
    const mockQuestion = {
      id: 'q-1',
      type: 'FILL_IN_BLANK',
      blanks: [
        { id: 'blank1', acceptedAnswers: ['答案1', '答案一'] },
        { id: 'blank2', acceptedAnswers: ['答案2'] }
      ]
    };

    mockDb.getOne.mockResolvedValue(mockQuestion);

    const userAnswers = {
      blank1: '答案1',
      blank2: '答案2'
    };

    const result = await questionService.gradeFillInBlank(mockDb, 'q-1', userAnswers);

    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
    expect(result.score).toBe(100);
    expect(result.isAllCorrect).toBe(true);
  });

  it('应该处理部分正确的情况', async () => {
    const mockQuestion = {
      id: 'q-1',
      type: 'FILL_IN_BLANK',
      blanks: [
        { id: 'blank1', acceptedAnswers: ['答案1'] },
        { id: 'blank2', acceptedAnswers: ['答案2'] }
      ]
    };

    mockDb.getOne.mockResolvedValue(mockQuestion);

    const userAnswers = {
      blank1: '答案1',
      blank2: '错误答案'
    };

    const result = await questionService.gradeFillInBlank(mockDb, 'q-1', userAnswers);

    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
    expect(result.score).toBe(50);
    expect(result.isAllCorrect).toBe(false);
  });

  it('应该在题目不存在时抛出错误', async () => {
    mockDb.getOne.mockResolvedValue(null);

    await expect(
      questionService.gradeFillInBlank(mockDb, 'non-existent', {})
    ).rejects.toThrow('题目不存在');
  });

  it('应该在题目类型不是填空题时抛出错误', async () => {
    mockDb.getOne.mockResolvedValue({ id: 'q-1', type: 'SINGLE' });

    await expect(
      questionService.gradeFillInBlank(mockDb, 'q-1', {})
    ).rejects.toThrow('该题目不是填空题');
  });

  it('应该在缺少参数时抛出错误', async () => {
    await expect(
      questionService.gradeFillInBlank(mockDb, null, {})
    ).rejects.toThrow('缺少必要参数');
  });
});

