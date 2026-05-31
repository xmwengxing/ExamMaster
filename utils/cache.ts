/**
 * 本地缓存工具模块
 * 
 * 功能：
 * - 使用 localStorage 缓存数据
 * - 支持过期时间
 * - 自动清理过期缓存
 * - 处理存储空间不足
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // 过期时间（毫秒）
}

// 缓存键前缀
const CACHE_PREFIX = 'edu_cache_';

// 默认缓存时间（30分钟）
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;

// 缓存键定义
export const CACHE_KEYS = {
  BANKS: 'banks',
  CONFIG: 'config',
  QUESTIONS: 'questions',
  EXAMS: 'exams',
  PRACTICE_RECORDS: 'practice_records',
  FAVORITES: 'favorites',
  USER_PROFILE: 'user_profile',
  DISCUSSIONS: 'discussions',
  TAGS: 'tags',
} as const;

/**
 * 获取缓存数据（智能选择普通缓存或分块缓存）
 * @param key 缓存键
 * @returns 缓存的数据，如果不存在或已过期则返回 null
 */
export function getCachedData<T>(key: string): T | null {
  try {
    // 先尝试读取分块缓存
    const metaKey = CACHE_PREFIX + key + '_meta';
    if (localStorage.getItem(metaKey)) {
      const chunkedData = getCachedDataChunked<T>(key);
      if (chunkedData) {
        return chunkedData;
      }
    }
    
    // 尝试读取普通缓存
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const cacheItem: CacheItem<T> = JSON.parse(cached);
    const now = Date.now();
    
    // 检查是否过期
    if (now - cacheItem.timestamp > cacheItem.expiry) {
      console.log(`[Cache] ${key} 已过期，清除缓存`);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`[Cache] 命中缓存: ${key}`);
    return cacheItem.data;
  } catch (error) {
    console.warn(`[Cache] 读取缓存失败: ${key}`, error);
    return null;
  }
}

/**
 * 分块缓存大数据
 * @param key 缓存键
 * @param data 要缓存的数据
 * @param expiry 过期时间（毫秒）
 */
function setCachedDataChunked<T>(
  key: string,
  data: T,
  expiry: number
): boolean {
  try {
    const serialized = JSON.stringify(data);
    const chunkSize = 512 * 1024; // 减小到 512KB per chunk（更安全）
    const chunks: string[] = [];
    
    // 分块
    for (let i = 0; i < serialized.length; i += chunkSize) {
      chunks.push(serialized.slice(i, i + chunkSize));
    }
    
    // 如果分块数量太多（超过 20 块），放弃缓存
    if (chunks.length > 20) {
      console.warn(`[Cache] 数据过大，分块数量 ${chunks.length} 超过限制，放弃缓存: ${key}`);
      return false;
    }
    
    // 保存元数据
    const metaKey = CACHE_PREFIX + key + '_meta';
    const meta = {
      chunks: chunks.length,
      timestamp: Date.now(),
      expiry,
    };
    
    try {
      localStorage.setItem(metaKey, JSON.stringify(meta));
    } catch (metaError: any) {
      if (metaError.name === 'QuotaExceededError') {
        console.warn(`[Cache] 存储空间不足，无法保存元数据: ${key}`);
        return false;
      }
      throw metaError;
    }
    
    // 保存每个分块
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const chunkKey = CACHE_PREFIX + key + '_chunk_' + index;
      
      try {
        localStorage.setItem(chunkKey, chunk);
      } catch (chunkError: any) {
        if (chunkError.name === 'QuotaExceededError') {
          console.warn(`[Cache] 存储空间不足，无法保存分块 ${index}/${chunks.length}: ${key}`);
          // 清理已保存的分块
          removeCachedDataChunked(key);
          return false;
        }
        throw chunkError;
      }
    }
    
    console.log(`[Cache] 分块缓存已保存: ${key} (${chunks.length} 块)`);
    return true;
  } catch (error) {
    console.error(`[Cache] 分块缓存失败: ${key}`, error);
    // 清理可能已保存的部分数据
    removeCachedDataChunked(key);
    return false;
  }
}

/**
 * 获取分块缓存的数据
 * @param key 缓存键
 */
function getCachedDataChunked<T>(key: string): T | null {
  try {
    const metaKey = CACHE_PREFIX + key + '_meta';
    const metaStr = localStorage.getItem(metaKey);
    
    if (!metaStr) {
      return null;
    }
    
    const meta = JSON.parse(metaStr);
    const now = Date.now();
    
    // 检查是否过期
    if (now - meta.timestamp > meta.expiry) {
      console.log(`[Cache] 分块缓存已过期: ${key}`);
      removeCachedDataChunked(key);
      return null;
    }
    
    // 读取所有分块
    const chunks: string[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      const chunkKey = CACHE_PREFIX + key + '_chunk_' + i;
      const chunk = localStorage.getItem(chunkKey);
      if (!chunk) {
        console.warn(`[Cache] 分块缺失: ${key} chunk ${i}`);
        removeCachedDataChunked(key);
        return null;
      }
      chunks.push(chunk);
    }
    
    // 合并分块
    const serialized = chunks.join('');
    const data = JSON.parse(serialized);
    
    console.log(`[Cache] 分块缓存命中: ${key} (${meta.chunks} 块)`);
    return data;
  } catch (error) {
    console.error(`[Cache] 读取分块缓存失败: ${key}`, error);
    removeCachedDataChunked(key);
    return null;
  }
}

/**
 * 删除分块缓存
 * @param key 缓存键
 */
function removeCachedDataChunked(key: string): void {
  try {
    const metaKey = CACHE_PREFIX + key + '_meta';
    const metaStr = localStorage.getItem(metaKey);
    
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      
      // 删除所有分块
      for (let i = 0; i < meta.chunks; i++) {
        const chunkKey = CACHE_PREFIX + key + '_chunk_' + i;
        localStorage.removeItem(chunkKey);
      }
      
      // 删除元数据
      localStorage.removeItem(metaKey);
    }
  } catch (error) {
    console.error(`[Cache] 删除分块缓存失败: ${key}`, error);
  }
}

/**
 * 设置缓存数据（智能选择普通缓存或分块缓存）
 * @param key 缓存键
 * @param data 要缓存的数据
 * @param expiry 过期时间（毫秒），默认 30 分钟
 */
export function setCachedData<T>(
  key: string, 
  data: T, 
  expiry: number = DEFAULT_CACHE_DURATION
): boolean {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry,
    };
    
    const serialized = JSON.stringify(cacheItem);
    
    // 检查数据大小
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    
    // 如果数据超过 2MB，使用分块缓存
    if (sizeInMB > 2) {
      console.log(`[Cache] 数据较大 (${sizeInMB.toFixed(2)}MB)，使用分块缓存: ${key}`);
      return setCachedDataChunked(key, data, expiry);
    }
    
    // 普通缓存
    localStorage.setItem(cacheKey, serialized);
    console.log(`[Cache] 缓存已保存: ${key} (${sizeInMB.toFixed(2)}MB)`);
    return true;
  } catch (error: any) {
    // 处理存储空间不足
    if (error.name === 'QuotaExceededError') {
      console.warn('[Cache] 存储空间不足，尝试分块缓存');
      
      // 尝试使用分块缓存
      try {
        return setCachedDataChunked(key, data, expiry);
      } catch (chunkError) {
        console.error('[Cache] 分块缓存也失败，清理旧缓存');
        clearOldestCache();
        
        // 最后重试一次
        try {
          return setCachedDataChunked(key, data, expiry);
        } catch (finalError) {
          console.error('[Cache] 最终缓存失败', finalError);
          return false;
        }
      }
    }
    
    console.error(`[Cache] 保存缓存失败: ${key}`, error);
    return false;
  }
}

/**
 * 删除指定缓存（包括分块缓存）
 * @param key 缓存键
 */
export function removeCachedData(key: string): void {
  try {
    // 删除普通缓存
    const cacheKey = CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
    
    // 删除分块缓存
    removeCachedDataChunked(key);
    
    console.log(`[Cache] 缓存已删除: ${key}`);
  } catch (error) {
    console.warn(`[Cache] 删除缓存失败: ${key}`, error);
  }
}

/**
 * 删除所有匹配前缀的缓存（用于清除参数化缓存）
 * @param keyPrefix 缓存键前缀
 */
export function removeCachedDataByPrefix(keyPrefix: string): void {
  try {
    const fullPrefix = CACHE_PREFIX + keyPrefix;
    const keys = Object.keys(localStorage);
    const matchingKeys = keys.filter(key => key.startsWith(fullPrefix));
    
    matchingKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[Cache] 已删除 ${matchingKeys.length} 个匹配 ${keyPrefix} 的缓存`);
  } catch (error) {
    console.warn(`[Cache] 删除缓存失败: ${keyPrefix}`, error);
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[Cache] 已清除 ${cacheKeys.length} 个缓存`);
  } catch (error) {
    console.error('[Cache] 清除缓存失败', error);
  }
}

/**
 * 清除最旧的缓存（用于释放空间）
 */
function clearOldestCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length === 0) {
      return;
    }
    
    // 找出最旧的缓存
    let oldestKey = cacheKeys[0];
    let oldestTime = Infinity;
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          if (cacheItem.timestamp < oldestTime) {
            oldestTime = cacheItem.timestamp;
            oldestKey = key;
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    });
    
    localStorage.removeItem(oldestKey);
    console.log(`[Cache] 已清除最旧的缓存: ${oldestKey}`);
  } catch (error) {
    console.error('[Cache] 清除最旧缓存失败', error);
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  count: number;
  totalSize: number;
  items: Array<{ key: string; size: number; age: number }>;
} {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
  
  let totalSize = 0;
  const items: Array<{ key: string; size: number; age: number }> = [];
  
  cacheKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;
        
        const cacheItem = JSON.parse(value);
        const age = Date.now() - cacheItem.timestamp;
        
        items.push({
          key: key.replace(CACHE_PREFIX, ''),
          size,
          age,
        });
      }
    } catch (e) {
      // 忽略错误
    }
  });
  
  return {
    count: cacheKeys.length,
    totalSize,
    items,
  };
}

/**
 * 清理过期缓存（建议在应用启动时调用）
 */
export function cleanExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let cleanedCount = 0;
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          const now = Date.now();
          
          if (now - cacheItem.timestamp > cacheItem.expiry) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (e) {
        // 如果解析失败，删除该缓存
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[Cache] 已清理 ${cleanedCount} 个过期缓存`);
    }
  } catch (error) {
    console.error('[Cache] 清理过期缓存失败', error);
  }
}

// 应用启动时自动清理过期缓存
if (typeof window !== 'undefined') {
  cleanExpiredCache();
}
