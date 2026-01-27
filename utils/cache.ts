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
} as const;

/**
 * 获取缓存数据
 * @param key 缓存键
 * @returns 缓存的数据，如果不存在或已过期则返回 null
 */
export function getCachedData<T>(key: string): T | null {
  try {
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
 * 设置缓存数据
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
    
    // 检查数据大小（localStorage 限制通常是 5-10MB）
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    if (sizeInMB > 5) {
      // 数据过大，不缓存（静默处理，不显示警告）
      // console.warn(`[Cache] 数据过大 (${sizeInMB.toFixed(2)}MB)，不缓存: ${key}`);
      return false;
    }
    
    localStorage.setItem(cacheKey, serialized);
    console.log(`[Cache] 缓存已保存: ${key} (${sizeInMB.toFixed(2)}MB)`);
    return true;
  } catch (error: any) {
    // 处理存储空间不足
    if (error.name === 'QuotaExceededError') {
      console.warn('[Cache] 存储空间不足，清理旧缓存');
      clearOldestCache();
      
      // 重试一次
      try {
        const cacheKey = CACHE_PREFIX + key;
        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          expiry,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        return true;
      } catch (retryError) {
        console.error('[Cache] 重试失败', retryError);
        return false;
      }
    }
    
    console.error(`[Cache] 保存缓存失败: ${key}`, error);
    return false;
  }
}

/**
 * 删除指定缓存
 * @param key 缓存键
 */
export function removeCachedData(key: string): void {
  try {
    const cacheKey = CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
    console.log(`[Cache] 缓存已删除: ${key}`);
  } catch (error) {
    console.warn(`[Cache] 删除缓存失败: ${key}`, error);
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
