/**
 * 日志管理页面
 * 显示登录日志和审计日志
 */

import React, { useState, useMemo } from 'react';
import { LoginLog, AuditLog } from '../../types';

interface LogManagementProps {
  loginLogs: LoginLog[];
  auditLogs: AuditLog[];
}

const LogManagement: React.FC<LogManagementProps> = ({ loginLogs, auditLogs }) => {
  const [tab, setTab] = useState<'login' | 'audit'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // 格式化时间
  const formatTime = (time: string) => {
    if (!time) return '--';
    try {
      const date = new Date(time);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return time;
    }
  };

  // 过滤登录日志
  const filteredLoginLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return loginLogs.filter(log => 
      log.phone?.toLowerCase().includes(term) ||
      log.ip?.toLowerCase().includes(term) ||
      log.role?.toLowerCase().includes(term)
    );
  }, [loginLogs, searchTerm]);

  // 过滤审计日志
  const filteredAuditLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return auditLogs.filter(log =>
      log.operatorName?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.target?.toLowerCase().includes(term)
    );
  }, [auditLogs, searchTerm]);

  // 分页
  const currentLogs = tab === 'login' ? filteredLoginLogs : filteredAuditLogs;
  const totalPages = Math.ceil(currentLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentLogs.slice(start, start + pageSize);
  }, [currentLogs, currentPage]);

  // 切换标签时重置页码
  const handleTabChange = (newTab: 'login' | 'audit') => {
    setTab(newTab);
    setCurrentPage(1);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">日志管理</h2>
        <p className="text-sm text-gray-500 font-medium">查看系统登录日志和审计日志</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold opacity-90 mb-2">登录日志总数</div>
              <div className="text-4xl font-black">{loginLogs.length}</div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-right-to-bracket text-3xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold opacity-90 mb-2">审计日志总数</div>
              <div className="text-4xl font-black">{auditLogs.length}</div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-3xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* 标签页和搜索 */}
        <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('login')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <i className="fa-solid fa-right-to-bracket mr-2"></i>
              登录日志 ({loginLogs.length})
            </button>
            <button
              onClick={() => handleTabChange('audit')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                tab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <i className="fa-solid fa-shield-halved mr-2"></i>
              审计日志 ({auditLogs.length})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder={tab === 'login' ? '搜索手机号、IP...' : '搜索操作员、操作...'}
              className="w-full bg-gray-50 border-none rounded-2xl pl-9 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* 表格内容 */}
        <div className="overflow-x-auto">
          {tab === 'login' ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">登录时间</th>
                  <th className="px-6 py-4">用户ID</th>
                  <th className="px-6 py-4">手机号</th>
                  <th className="px-6 py-4">角色</th>
                  <th className="px-6 py-4">IP地址</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.length > 0 ? (
                  (paginatedLogs as LoginLog[]).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {formatTime(log.time)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {log.userId}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {log.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          log.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {log.role === 'ADMIN' ? '管理员' : '学员'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">
                        {log.ip}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <i className="fa-solid fa-inbox text-4xl mb-2 opacity-20"></i>
                      <p className="text-sm font-medium">暂无登录日志</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">操作时间</th>
                  <th className="px-6 py-4">操作员</th>
                  <th className="px-6 py-4">操作类型</th>
                  <th className="px-6 py-4">目标对象</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.length > 0 ? (
                  (paginatedLogs as AuditLog[]).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {log.operatorName || log.operatorId || '系统'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          log.action?.includes('删除')
                            ? 'bg-rose-50 text-rose-600'
                            : log.action?.includes('创建') || log.action?.includes('新增')
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.target || '--'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <i className="fa-solid fa-inbox text-4xl mb-2 opacity-20"></i>
                      <p className="text-sm font-medium">暂无审计日志</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页控制 */}
        {totalPages > 1 && (
          <div className="p-6 bg-gray-50/30 border-t flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400">
              共 {currentLogs.length} 条记录，每页 {pageSize} 条，当前第 {currentPage} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogManagement;
