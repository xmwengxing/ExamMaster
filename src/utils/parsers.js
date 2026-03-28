// 数据解析工具函数
// 用于处理数据库字段和 API 响应的数据转换

/**
 * 解析选项字段（兼容旧格式）
 * PostgreSQL JSONB 字段会被自动解析为 JavaScript 对象
 * 但需要兼容旧的管道符分隔格式
 * 
 * @param {*} val - 待解析的值
 * @returns {Array} 解析后的选项数组
 */
export function parseOptionsField(val) {
  if (!val) return [];
  
  // PostgreSQL JSONB 字段会被自动解析为 JavaScript 对象
  if (Array.isArray(val)) return val;
  
  // 如果是字符串，尝试解析 JSON
  if (typeof val === 'string') {
    try { 
      const parsed = JSON.parse(val); 
      return Array.isArray(parsed) ? parsed : []; 
    } catch (e) {
      // 支持旧格式：管道符分隔的选项
      return val.includes('|') ? val.split('|') : [val];
    }
  }
  
  return [];
}

/**
 * 解析答案字段
 * 支持字符串、数组、对象等多种格式
 * 
 * @param {*} val - 待解析的值
 * @returns {*} 解析后的答案
 */
export function parseAnswerField(val) {
  if (val === undefined || val === null) return '';
  
  // PostgreSQL JSONB 字段会被自动解析为 JavaScript 对象
  if (typeof val === 'object') return val;
  
  // 如果是字符串，尝试解析 JSON
  if (typeof val === 'string') {
    try { 
      return JSON.parse(val); 
    } catch (e) { 
      return val; 
    }
  }
  
  return val;
}

/**
 * 规范化数组字段
 * 处理可能被双重 JSON 编码的数组字段
 * 
 * @param {*} v - 待规范化的值
 * @returns {Array} 规范化后的数组
 */
export function normalizeArrayField(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p;
      
      // 处理双重编码的情况
      if (typeof p === 'string') {
        try {
          const q = JSON.parse(p);
          if (Array.isArray(q)) return q;
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (e) {
      // 尝试匹配特定格式（如 bank-123）
      const match = v.match(/bank-[0-9]+/g);
      if (match) return match;
      return [];
    }
  }
  
  return [];
}

/**
 * 解析 JSONB 字段
 * 通用的 JSONB 字段解析函数
 * 
 * @param {*} val - 待解析的值
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析后的值
 */
export function parseJsonbField(val, defaultValue = null) {
  if (val === undefined || val === null) return defaultValue;
  
  // 如果已经是对象，直接返回
  if (typeof val === 'object') return val;
  
  // 如果是字符串，尝试解析
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * 转换数据库字段名为 camelCase
 * 用于 API 响应
 * 
 * @param {Object} obj - 数据库对象
 * @returns {Object} 转换后的对象
 */
export function snakeToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 将 snake_case 转换为 camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    }
  }
  
  return result;
}

/**
 * 转换 camelCase 字段名为 snake_case
 * 用于数据库操作
 * 
 * @param {Object} obj - camelCase 对象
 * @returns {Object} 转换后的对象
 */
export function camelToSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 将 camelCase 转换为 snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
  }
  
  return result;
}

/**
 * 解析日期字段
 * 
 * @param {*} val - 待解析的日期值
 * @returns {Date|null} 解析后的日期对象
 */
export function parseDateField(val) {
  if (!val) return null;
  
  try {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

/**
 * 解析布尔字段
 * 
 * @param {*} val - 待解析的布尔值
 * @returns {boolean} 解析后的布尔值
 */
export function parseBooleanField(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true' || val === '1';
  }
  if (typeof val === 'number') {
    return val !== 0;
  }
  return Boolean(val);
}

/**
 * 解析整数字段
 * 
 * @param {*} val - 待解析的整数值
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的整数
 */
export function parseIntField(val, defaultValue = 0) {
  if (val === undefined || val === null) return defaultValue;
  
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 解析浮点数字段
 * 
 * @param {*} val - 待解析的浮点数值
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的浮点数
 */
export function parseFloatField(val, defaultValue = 0) {
  if (val === undefined || val === null) return defaultValue;
  
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultValue : parsed;
}
