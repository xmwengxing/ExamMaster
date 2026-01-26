// 题库服务单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bankService from '../../../src/services/bank.service.js';

describe('题库服务 - getAllBanks', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getMany: vi.fn()
    };
  });

  it('应该返回所有题库列表（camelCase格式）', async () => {
    const mockBanks = [
      {
        id: 'bank-1',
        name: '题库1',
        category: '分类1',
        level: '初级',
        description: '描述1',
        question_count: 10,
        score_config: { SINGLE: 1, MULTIPLE: 2 },
        usage_count: 5
      },
      {
        id: 'bank-2',
        name: '题库2',
        category: '分类2',
        level: '中级',
        description: '描述2',
        question_count: 20,
        score_config: { SINGLE: 2, MULTIPLE: 3 },
        usage_count: 10
      }
    ];

    mockDb.getMany.mockResolvedValue(mockBanks);

    const result = await bankService.getAllBanks(mockDb);

    expect(mockDb.getMany).toHaveBeenCalledWith('SELECT * FROM banks');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'bank-1',
      name: '题库1',
      category: '分类1',
      level: '初级',
      description: '描述1',
      questionCount: 10,
      scoreConfig: { SINGLE: 1, MULTIPLE: 2 },
      usageCount: 5
    });
  });

  it('应该处理空结果', async () => {
    mockDb.getMany.mockResolvedValue(null);

    const result = await bankService.getAllBanks(mockDb);

    expect(result).toEqual([]);
  });

  it('应该使用默认值处理缺失字段', async () => {
    const mockBanks = [
      {
        id: 'bank-1',
        name: '题库1',
        category: null,
        level: null,
        description: null,
        question_count: null,
        score_config: null,
        usage_count: null
      }
    ];

    mockDb.getMany.mockResolvedValue(mockBanks);

    const result = await bankService.getAllBanks(mockDb);

    expect(result[0].questionCount).toBe(0);
    expect(result[0].scoreConfig).toEqual({ SINGLE: 1, MULTIPLE: 2, JUDGE: 1 });
    expect(result[0].usageCount).toBe(0);
  });
});

describe('题库服务 - getBankById', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      getOne: vi.fn()
    };
  });

  it('应该返回指定的题库', async () => {
    const mockBank = {
      id: 'bank-1',
      name: '题库1',
      category: '分类1',
      level: '初级',
      description: '描述1',
      question_count: 10,
      score_config: { SINGLE: 1, MULTIPLE: 2 },
      usage_count: 5
    };

    mockDb.getOne.mockResolvedValue(mockBank);

    const result = await bankService.getBankById(mockDb, 'bank-1');

    expect(mockDb.getOne).toHaveBeenCalledWith('SELECT * FROM banks WHERE id = $1', ['bank-1']);
    expect(result).toEqual({
      id: 'bank-1',
      name: '题库1',
      category: '分类1',
      level: '初级',
      description: '描述1',
      questionCount: 10,
      scoreConfig: { SINGLE: 1, MULTIPLE: 2 },
      usageCount: 5
    });
  });

  it('应该在题库不存在时返回null', async () => {
    mockDb.getOne.mockResolvedValue(null);

    const result = await bankService.getBankById(mockDb, 'non-existent');

    expect(result).toBeNull();
  });
});

describe('题库服务 - createBank', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功创建题库', async () => {
    const bankData = {
      name: '新题库',
      category: '分类',
      level: '初级',
      description: '描述',
      questionCount: 0,
      scoreConfig: { SINGLE: 1, MULTIPLE: 2 },
      usageCount: 0
    };

    const result = await bankService.createBank(mockDb, bankData);

    expect(result).toMatch(/^bank-\d+$/);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO banks'),
      expect.arrayContaining([
        expect.any(String),
        '新题库',
        '分类',
        '初级',
        '描述',
        0,
        '{"SINGLE":1,"MULTIPLE":2}',
        0
      ])
    );
  });

  it('应该使用提供的 ID', async () => {
    const bankData = {
      id: 'custom-bank-id',
      name: '新题库'
    };

    const result = await bankService.createBank(mockDb, bankData);

    expect(result).toBe('custom-bank-id');
  });

  it('应该使用默认值处理缺失字段', async () => {
    const bankData = {
      name: '新题库'
    };

    await bankService.createBank(mockDb, bankData);

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.any(String),
        '新题库',
        '',
        '',
        '',
        0,
        '{}',
        0
      ])
    );
  });
});

describe('题库服务 - updateBank', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新题库', async () => {
    const updates = {
      name: '更新后的名称',
      description: '更新后的描述'
    };

    await bankService.updateBank(mockDb, 'bank-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET name = $1, description = $2 WHERE id = $3',
      ['更新后的名称', '更新后的描述', 'bank-1']
    );
  });

  it('应该处理 JSON 对象字段', async () => {
    const updates = {
      score_config: { SINGLE: 2, MULTIPLE: 3 }
    };

    await bankService.updateBank(mockDb, 'bank-1', updates);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET score_config = $1 WHERE id = $2',
      ['{"SINGLE":2,"MULTIPLE":3}', 'bank-1']
    );
  });

  it('应该在没有更新字段时不执行查询', async () => {
    await bankService.updateBank(mockDb, 'bank-1', {});

    expect(mockDb.execute).not.toHaveBeenCalled();
  });
});

describe('题库服务 - deleteBank', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功删除题库', async () => {
    await bankService.deleteBank(mockDb, 'bank-1');

    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM banks WHERE id = $1',
      ['bank-1']
    );
  });
});

describe('题库服务 - updateBankScoreConfig', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该成功更新分值配置', async () => {
    const scoreConfig = { SINGLE: 2, MULTIPLE: 3, JUDGE: 1 };

    await bankService.updateBankScoreConfig(mockDb, 'bank-1', scoreConfig);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET score_config = $1::jsonb WHERE id = $2',
      ['{"SINGLE":2,"MULTIPLE":3,"JUDGE":1}', 'bank-1']
    );
  });

  it('应该在配置无效时抛出错误', async () => {
    await expect(
      bankService.updateBankScoreConfig(mockDb, 'bank-1', null)
    ).rejects.toThrow('无效的分值配置');

    await expect(
      bankService.updateBankScoreConfig(mockDb, 'bank-1', 'invalid')
    ).rejects.toThrow('无效的分值配置');
  });
});

describe('题库服务 - incrementBankQuestionCount', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该增加题目数量（默认为1）', async () => {
    await bankService.incrementBankQuestionCount(mockDb, 'bank-1');

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET question_count = COALESCE(question_count, 0) + $1 WHERE id = $2',
      [1, 'bank-1']
    );
  });

  it('应该增加指定数量的题目', async () => {
    await bankService.incrementBankQuestionCount(mockDb, 'bank-1', 5);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET question_count = COALESCE(question_count, 0) + $1 WHERE id = $2',
      [5, 'bank-1']
    );
  });
});

describe('题库服务 - decrementBankQuestionCount', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn()
    };
  });

  it('应该减少题目数量（默认为1）', async () => {
    await bankService.decrementBankQuestionCount(mockDb, 'bank-1');

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - $1, 0) WHERE id = $2',
      [1, 'bank-1']
    );
  });

  it('应该减少指定数量的题目', async () => {
    await bankService.decrementBankQuestionCount(mockDb, 'bank-1', 3);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE banks SET question_count = GREATEST(COALESCE(question_count, 0) - $1, 0) WHERE id = $2',
      [3, 'bank-1']
    );
  });
});
