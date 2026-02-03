import React, { useState, useEffect } from 'react';
import { getCacheStats, clearAllCache, removeCachedData, removeCachedDataByPrefix, CACHE_KEYS } from '../utils/cache';
import { useAppStore } from '../store';

const CacheManager: React.FC = () => {
  const store = useAppStore();
  const [stats, setStats] = useState<ReturnType<typeof getCacheStats> | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // 加载缓存统计
  const loadStats = () => {
    const cacheStats = getCacheStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 格式化时间
  const formatAge = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return `${seconds} 秒前`;
  };

  // 清除所有缓存
  const handleClearAll = () => {
    if (!confirm('确定清除所有缓存吗？\n\n清除后需要重新加载数据，可能会有短暂的加载时间。')) {
      return;
    }

    clearAllCache();
    loadStats();
    alert('✓ 所有缓存已清除');
  };

  // 刷新所有缓存
  const handleRefreshAll = async () => {
    if (!confirm('确定刷新所有缓存吗？\n\n系统将清除旧缓存并重新加载最新数据。')) {
      return;
    }

    setRefreshing('all');
    try {
      clearAllCache();
      // 重新加载核心数据
      await Promise.all([
        store.fetchTags(true),
        store.fetchDiscussions({}, true),
      ]);
      loadStats();
      alert('✓ 所有缓存已刷新');
    } catch (error) {
      console.error('[CacheManager] 刷新失败:', error);
      alert('刷新失败，请查看控制台');
    } finally {
      setRefreshing(null);
    }
  };

  // 清除指定类型的缓存
  const handleClearCache = (key: string, label: string) => {
    if (!confirm(`确定清除${label}缓存吗？`)) {
      return;
    }

    // 如果是参数化缓存（如讨论），使用前缀清除
    if (key === CACHE_KEYS.DISCUSSIONS) {
      removeCachedDataByPrefix(key);
    } else {
      removeCachedData(key);
    }
    
    loadStats();
    alert(`✓ ${label}缓存已清除`);
  };

  // 刷新指定类型的缓存
  const handleRefreshCache = async (key: string, label: string) => {
    if (!confirm(`确定刷新${label}缓存吗？\n\n系统将清除旧缓存并重新加载最新数据。`)) {
      return;
    }

    setRefreshing(key);
    try {
      // 清除缓存
      if (key === CACHE_KEYS.DISCUSSIONS) {
        removeCachedDataByPrefix(key);
      } else {
        removeCachedData(key);
      }

      // 重新加载数据
      switch (key) {
        case CACHE_KEYS.TAGS:
          await store.fetchTags(true);
          break;
        case CACHE_KEYS.DISCUSSIONS:
          await store.fetchDiscussions({}, true);
          break;
        case CACHE_KEYS.BANKS:
        case CACHE_KEYS.CONFIG:
        case CACHE_KEYS.USER_PROFILE:
          // 这些数据在 refreshAll 中加载，这里只清除缓存
          break;
      }

      loadStats();
      alert(`✓ ${label}缓存已刷新`);
    } catch (error) {
      console.error(`[CacheManager] 刷新${label}失败:`, error);
      alert(`刷新失败：${error}`);
    } finally {
      setRefreshing(null);
    }
  };

  // 缓存类型配置
  const cacheTypes = [
    { key: CACHE_KEYS.BANKS, label: '题库缓存', icon: 'fa-database', color: 'indigo' },
    { key: CACHE_KEYS.CONFIG, label: '系统配置', icon: 'fa-cog', color: 'purple' },
    { key: CACHE_KEYS.USER_PROFILE, label: '用户资料', icon: 'fa-user', color: 'blue' },
    { key: CACHE_KEYS.DISCUSSIONS, label: '讨论缓存', icon: 'fa-comments', color: 'emerald' },
    { key: CACHE_KEYS.TAGS, label: '标签缓存', icon: 'fa-tags', color: 'amber' },
    { key: CACHE_KEYS.PRACTICE_RECORDS, label: '练习记录', icon: 'fa-clipboard-list', color: 'rose' },
    { key: CACHE_KEYS.FAVORITES, label: '收藏题目', icon: 'fa-heart', color: 'pink' },
    { key: CACHE_KEYS.EXAMS, label: '考试数据', icon: 'fa-file-alt', color: 'teal' },
  ];

  // 获取指定缓存的大小
  const getCacheSize = (key: string): number => {
    if (!stats) return 0;
    
    // 对于参数化缓存（如讨论），需要累加所有匹配的项
    if (key === CACHE_KEYS.DISCUSSIONS) {
      return stats.items
        .filter(item => item.key.startsWith(key))
        .reduce((sum, item) => sum + item.size, 0);
    }
    
    const item = stats.items.find(item => item.key === key);
    return item ? item.size : 0;
  };

  // 获取指定缓存的更新时间
  const getCacheAge = (key: string): number => {
    if (!stats) return 0;
    
    // 对于参数化缓存，返回最新的时间
    if (key === CACHE_KEYS.DISCUSSIONS) {
      const items = stats.items.filter(item => item.key.startsWith(key));
      if (items.length === 0) return 0;
      return Math.min(...items.map(item => item.age));
    }
    
    const item = stats.items.find(item => item.key === key);
    return item ? item.age : 0;
  };

  return (
    <div className="space-y-6">
      {/* 缓存统计 */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-8 rounded-3xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-chart-pie text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black">缓存统计</h3>
            <p className="text-sm text-white/80 font-medium">系统缓存使用情况</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            <div className="text-3xl font-black mb-1">{stats?.count || 0}</div>
            <div className="text-sm text-white/80 font-medium">缓存项数量</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            <div className="text-3xl font-black mb-1">{formatSize(stats?.totalSize || 0)}</div>
            <div className="text-sm text-white/80 font-medium">总占用空间</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            <div className="text-3xl font-black mb-1">
              {stats && stats.totalSize > 0 ? Math.round((stats.totalSize / (5 * 1024 * 1024)) * 100) : 0}%
            </div>
            <div className="text-sm text-white/80 font-medium">空间使用率</div>
            <div className="text-xs text-white/60 font-medium mt-1">限制 5MB</div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-bolt text-amber-500"></i>
          快速操作
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing === 'all'}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
          >
            <i className={`fa-solid fa-sync ${refreshing === 'all' ? 'animate-spin' : ''}`}></i>
            {refreshing === 'all' ? '刷新中...' : '刷新所有缓存'}
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
          >
            <i className="fa-solid fa-trash-can"></i>
            清除所有缓存
          </button>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            <i className="fa-solid fa-rotate"></i>
            刷新统计
          </button>
        </div>

        <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-info text-blue-600 mt-0.5"></i>
            <div className="flex-1">
              <p className="text-xs text-blue-700 font-bold mb-1">操作说明</p>
              <ul className="text-[10px] text-blue-600 font-medium space-y-1 leading-relaxed">
                <li>• <strong>刷新缓存</strong>：清除旧缓存并重新加载最新数据</li>
                <li>• <strong>清除缓存</strong>：仅删除缓存，下次访问时自动加载</li>
                <li>• <strong>多管理员协作</strong>：其他管理员修改数据后，建议刷新缓存</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 分类管理 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-purple-500"></i>
          分类管理
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cacheTypes.map((type) => {
            const size = getCacheSize(type.key);
            const age = getCacheAge(type.key);
            const hasCache = size > 0;

            return (
              <div
                key={type.key}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  hasCache
                    ? 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${type.color}-100 rounded-xl flex items-center justify-center`}>
                      <i className={`fa-solid ${type.icon} text-${type.color}-600`}></i>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{type.label}</div>
                      <div className="text-xs text-gray-400 font-medium">
                        {hasCache ? (
                          <>
                            {formatSize(size)} · {formatAge(age)}
                          </>
                        ) : (
                          '无缓存'
                        )}
                      </div>
                    </div>
                  </div>
                  {hasCache && (
                    <div className={`px-2 py-1 bg-${type.color}-100 text-${type.color}-600 rounded-lg text-[10px] font-bold`}>
                      已缓存
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefreshCache(type.key, type.label)}
                    disabled={refreshing === type.key || !hasCache}
                    className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      hasCache
                        ? `bg-${type.color}-100 text-${type.color}-600 hover:bg-${type.color}-200`
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <i className={`fa-solid fa-sync mr-1 ${refreshing === type.key ? 'animate-spin' : ''}`}></i>
                    {refreshing === type.key ? '刷新中' : '刷新'}
                  </button>
                  <button
                    onClick={() => handleClearCache(type.key, type.label)}
                    disabled={!hasCache}
                    className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      hasCache
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <i className="fa-solid fa-trash-can mr-1"></i>
                    清除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 缓存详情 */}
      {stats && stats.items.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list text-gray-500"></i>
            缓存详情
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-4 font-black text-gray-600 text-xs uppercase">缓存键</th>
                  <th className="text-right py-3 px-4 font-black text-gray-600 text-xs uppercase">大小</th>
                  <th className="text-right py-3 px-4 font-black text-gray-600 text-xs uppercase">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {stats.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{item.key}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-600">{formatSize(item.size)}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{formatAge(item.age)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheManager;
