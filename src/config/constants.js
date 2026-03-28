// 应用常量定义

// ==================== 服务器配置 ====================

// 服务器端口
export const PORT = process.env.PORT || 3001;

// 请求体大小限制
export const MAX_REQUEST_SIZE = '50mb';

// ==================== 时间相关常量 ====================

// 在线状态阈值（5分钟）
export const ONLINE_THRESHOLD = 5 * 60 * 1000; // 毫秒

// 登录历史保留数量
export const MAX_LOGIN_HISTORY = 100;

// ==================== 数据库相关常量 ====================

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 20;

// 最大分页大小
export const MAX_PAGE_SIZE = 100;

// 批量导入每批处理数量
export const BATCH_IMPORT_SIZE = 100;

// ==================== 用户相关常量 ====================

// 密码最小长度
export const MIN_PASSWORD_LENGTH = 4;

// 默认每日目标题数
export const DEFAULT_DAILY_GOAL = 20;

// ==================== 题目相关常量 ====================

// 题目类型
export const QUESTION_TYPES = {
  SINGLE: 'SINGLE',           // 单选题
  MULTIPLE: 'MULTIPLE',       // 多选题
  JUDGE: 'JUDGE',             // 判断题
  FILL_IN_BLANK: 'FILL_IN_BLANK', // 填空题
  SHORT_ANSWER: 'SHORT_ANSWER',   // 简答题
};

// 默认分值配置
export const DEFAULT_SCORE_CONFIG = {
  SINGLE: 1,
  MULTIPLE: 2,
  JUDGE: 1,
  FILL_IN_BLANK: 2,
  SHORT_ANSWER: 5,
};

// 题目内容最大长度（防止过大的 base64 图片）
export const MAX_QUESTION_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB

// ==================== 练习相关常量 ====================

// 练习模式
export const PRACTICE_MODES = {
  PRACTICE: 'PRACTICE',   // 练习模式
  EXAM: 'EXAM',           // 考试模式
};

// 练习类型
export const PRACTICE_TYPES = {
  RANDOM: 'RANDOM',       // 随机练习
  SEQUENTIAL: 'SEQUENTIAL', // 顺序练习
  MISTAKE: 'MISTAKE',     // 错题练习
  FAVORITE: 'FAVORITE',   // 收藏练习
  CHAPTER: 'CHAPTER',     // 章节练习
};

// ==================== SRS 相关常量 ====================

// SRS 难度等级
export const SRS_LEVELS = {
  HARD: 'HARD',   // 很难/重来
  GOOD: 'GOOD',   // 一般
  EASY: 'EASY',   // 简单
};

// SRS 默认参数
export const SRS_DEFAULTS = {
  EASE_FACTOR: 2.5,           // 默认难度系数
  MIN_EASE_FACTOR: 1.3,       // 最小难度系数
  EASE_FACTOR_DECREASE: 0.2,  // 难度系数减少量
  EASE_FACTOR_INCREASE: 0.15, // 难度系数增加量
};

// ==================== 角色相关常量 ====================

// 用户角色
export const USER_ROLES = {
  ADMIN: 'ADMIN',     // 管理员
  STUDENT: 'STUDENT', // 学员
};

// ==================== HTTP 状态码 ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ==================== 错误代码 ====================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
};

// ==================== 日志级别 ====================

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// ==================== 环境变量 ====================

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';
