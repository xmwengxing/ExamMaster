// 配置模块入口文件
// 统一导出所有配置

// CORS 配置
export { corsOptions, allowedOrigins } from './cors.js';

// JWT 配置
export { 
  JWT_SECRET, 
  JWT_EXPIRES_IN, 
  jwtConfig,
  getJwtSignOptions,
  getJwtVerifyOptions 
} from './jwt.js';

// 常量定义
export {
  // 服务器配置
  PORT,
  MAX_REQUEST_SIZE,
  
  // 时间相关
  ONLINE_THRESHOLD,
  MAX_LOGIN_HISTORY,
  
  // 数据库相关
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  BATCH_IMPORT_SIZE,
  
  // 用户相关
  MIN_PASSWORD_LENGTH,
  DEFAULT_DAILY_GOAL,
  
  // 题目相关
  QUESTION_TYPES,
  DEFAULT_SCORE_CONFIG,
  MAX_QUESTION_CONTENT_SIZE,
  
  // 练习相关
  PRACTICE_MODES,
  PRACTICE_TYPES,
  
  // SRS 相关
  SRS_LEVELS,
  SRS_DEFAULTS,
  
  // 角色相关
  USER_ROLES,
  
  // HTTP 状态码
  HTTP_STATUS,
  
  // 错误代码
  ERROR_CODES,
  
  // 日志级别
  LOG_LEVELS,
  
  // 环境变量
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
} from './constants.js';

// 默认导出所有配置
export default {
  cors: { corsOptions, allowedOrigins },
  jwt: { JWT_SECRET, JWT_EXPIRES_IN, jwtConfig },
  constants: {
    PORT,
    MAX_REQUEST_SIZE,
    ONLINE_THRESHOLD,
    MAX_LOGIN_HISTORY,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    BATCH_IMPORT_SIZE,
    MIN_PASSWORD_LENGTH,
    DEFAULT_DAILY_GOAL,
    QUESTION_TYPES,
    DEFAULT_SCORE_CONFIG,
    MAX_QUESTION_CONTENT_SIZE,
    PRACTICE_MODES,
    PRACTICE_TYPES,
    SRS_LEVELS,
    SRS_DEFAULTS,
    USER_ROLES,
    HTTP_STATUS,
    ERROR_CODES,
    LOG_LEVELS,
    NODE_ENV,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_TEST,
  },
};
