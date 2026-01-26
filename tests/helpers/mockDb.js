// 数据库 Mock 辅助函数
import { vi } from 'vitest';

/**
 * 创建数据库 mock 对象
 */
export function createMockDb() {
  return {
    execute: vi.fn(),
    getOne: vi.fn(),
    getMany: vi.fn(),
    paginate: vi.fn(),
    transaction: vi.fn(),
    getPoolStatus: vi.fn(() => ({
      total: 10,
      idle: 5,
      waiting: 0
    }))
  };
}

/**
 * 创建用户数据 mock
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    phone: '13800138000',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // bcrypt hash
    role: 'STUDENT',
    nickname: '测试用户',
    avatar: '',
    gender: '',
    school: '',
    major: '',
    company: '',
    accuracy: 0,
    real_name: '张三',
    id_card: '',
    education_type: '',
    education_level: '',
    class_name: '',
    student_perms: [],
    allowed_bank_ids: [],
    last_login: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    login_history: [],
    deepseek_api_key: '',
    total_online_time: 0,
    custom_fields: {},
    mistake_count: 0,
    daily_goal: 20,
    ...overrides
  };
}

/**
 * 创建题库数据 mock
 */
export function createMockBank(overrides = {}) {
  return {
    id: 'bank-123',
    name: '测试题库',
    category: '计算机',
    level: '初级',
    description: '这是一个测试题库',
    question_count: 100,
    score_config: { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 },
    usage_count: 0,
    ...overrides
  };
}

/**
 * 创建题目数据 mock
 */
export function createMockQuestion(overrides = {}) {
  return {
    id: 'q-123',
    bank_id: 'bank-123',
    type: 'SINGLE',
    content: '这是一道测试题目？',
    options: ['选项A', '选项B', '选项C', '选项D'],
    answer: 'A',
    explanation: '这是解析',
    chapter: '第一章',
    blanks: null,
    reference_answer: null,
    ai_grading_enabled: false,
    tags: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * 创建练习记录 mock
 */
export function createMockPracticeRecord(overrides = {}) {
  return {
    id: 'practice-123',
    user_id: 'user-123',
    bank_id: 'bank-123',
    bank_name: '测试题库',
    type: 'RANDOM',
    question_type_filter: null,
    mode: 'PRACTICE',
    count: 20,
    date: new Date().toISOString(),
    current_index: 0,
    user_answers: {},
    is_custom: false,
    ...overrides
  };
}

/**
 * 创建考试记录 mock
 */
export function createMockExam(overrides = {}) {
  return {
    id: 'exam-123',
    title: '测试考试',
    bank_id: 'bank-123',
    duration: 60,
    total_score: 100,
    pass_score: 60,
    pass_score_percent: 60,
    selected_question_ids: [],
    is_visible: true,
    single_count: 10,
    multiple_count: 5,
    judge_count: 5,
    fill_blank_count: 0,
    short_answer_count: 0,
    start_time: null,
    end_time: null,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Mock 数据库事务
 */
export function mockTransaction(db, callback) {
  db.transaction.mockImplementation(async (fn) => {
    const mockClient = {
      query: vi.fn(),
      execute: vi.fn()
    };
    await fn(mockClient);
    if (callback) callback(mockClient);
  });
}
