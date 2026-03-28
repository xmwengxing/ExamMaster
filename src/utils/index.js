// 工具函数模块统一入口

// 导出数据解析工具
export {
  parseOptionsField,
  parseAnswerField,
  normalizeArrayField,
  parseJsonbField,
  snakeToCamel,
  camelToSnake,
  parseDateField,
  parseBooleanField,
  parseIntField,
  parseFloatField
} from './parsers.js';

// 导出数据验证工具
export {
  validateFillInBlankAnswers,
  checkBlankAnswer,
  isValidEmail,
  isValidPhone,
  validatePassword,
  validateUsername,
  validateQuestionOptions,
  validateQuestionAnswer,
  isValidScore,
  isValidId
} from './validators.js';

// 导出辅助函数
export {
  generateRandomString,
  delay,
  deepClone,
  safeJsonParse,
  safeJsonStringify,
  removeEmptyValues,
  randomSelect,
  shuffleArray,
  getPagination,
  formatFileSize,
  formatRelativeTime,
  truncateString,
  debounce,
  throttle,
  retry,
  batchProcess,
  average,
  median,
  uniqueByKey,
  groupBy,
  flattenArray
} from './helpers.js';
