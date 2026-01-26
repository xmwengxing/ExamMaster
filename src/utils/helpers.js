// 辅助工具函数
// 通用的辅助函数，不属于特定业务逻辑

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string}
 */
export function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 延迟函数（Promise 版本）
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深拷贝对象
 * @param {*} obj - 待拷贝的对象
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 安全的 JSON 解析
 * @param {string} str - JSON 字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*}
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 安全的 JSON 字符串化
 * @param {*} obj - 待字符串化的对象
 * @param {*} defaultValue - 失败时的默认值
 * @returns {string}
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 去除对象中的 undefined 和 null 值
 * @param {Object} obj - 对象
 * @param {boolean} removeNull - 是否也移除 null 值
 * @returns {Object}
 */
export function removeEmptyValues(obj, removeNull = false) {
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (value === undefined) {
        continue;
      }
      
      if (removeNull && value === null) {
        continue;
      }
      
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 从数组中随机选择 n 个元素
 * @param {Array} array - 源数组
 * @param {number} n - 选择数量
 * @returns {Array}
 */
export function randomSelect(array, n) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }
  
  if (n >= array.length) {
    return [...array];
  }
  
  const result = [];
  const used = new Set();
  
  while (result.length < n) {
    const index = Math.floor(Math.random() * array.length);
    if (!used.has(index)) {
      used.add(index);
      result.push(array[index]);
    }
  }
  
  return result;
}

/**
 * 打乱数组顺序（Fisher-Yates 算法）
 * @param {Array} array - 待打乱的数组
 * @returns {Array} 新数组
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * 分页辅助函数
 * @param {number} page - 页码（从 1 开始）
 * @param {number} pageSize - 每页数量
 * @returns {Object} - {offset, limit}
 */
export function getPagination(page = 1, pageSize = 10) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));
  
  return {
    offset: (p - 1) * size,
    limit: size,
    page: p,
    pageSize: size
  };
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化时间差（相对时间）
 * @param {Date|string} date - 日期
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour} 小时前`;
  } else if (diffDay < 30) {
    return `${diffDay} 天前`;
  } else {
    return target.toLocaleDateString('zh-CN');
  }
}

/**
 * 截断字符串
 * @param {string} str - 字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认 '...'）
 * @returns {string}
 */
export function truncateString(str, maxLength, suffix = '...') {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 防抖函数
 * @param {Function} func - 待防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 待节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 重试函数
 * @param {Function} fn - 待重试的异步函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试间隔（毫秒）
 * @returns {Promise}
 */
export async function retry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * 批量处理数组（分批执行）
 * @param {Array} items - 待处理的项目数组
 * @param {Function} processor - 处理函数
 * @param {number} batchSize - 批次大小
 * @returns {Promise<Array>}
 */
export async function batchProcess(items, processor, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 计算数组的平均值
 * @param {Array<number>} numbers - 数字数组
 * @returns {number}
 */
export function average(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }
  
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * 计算数组的中位数
 * @param {Array<number>} numbers - 数字数组
 * @returns {number}
 */
export function median(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * 对象数组去重
 * @param {Array} array - 对象数组
 * @param {string} key - 用于去重的键
 * @returns {Array}
 */
export function uniqueByKey(array, key) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * 按键分组
 * @param {Array} array - 对象数组
 * @param {string} key - 分组键
 * @returns {Object}
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) {
    return {};
  }
  
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * 扁平化嵌套数组
 * @param {Array} array - 嵌套数组
 * @param {number} depth - 扁平化深度（默认 Infinity）
 * @returns {Array}
 */
export function flattenArray(array, depth = Infinity) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  if (depth === 0) {
    return array;
  }
  
  return array.reduce((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...flattenArray(val, depth - 1));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
}
