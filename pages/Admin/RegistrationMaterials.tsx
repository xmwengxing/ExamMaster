import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// 报名记录类型定义
interface Registration {
  id: string;
  type: 'EDUCATION' | 'VOCATIONAL';
  status: string;
  name: string;
  phone: string;
  // 学历教育字段
  highest_education?: string;
  upgrade_type?: string;
  upgrade_budget?: string;
  // 职业技能字段
  occupation?: string;
  apply_level?: string;
  created_at: string;
  user_id?: string; // 关联的学员账户ID
}

// 账户生成结果类型
interface AccountResult {
  registrationId: string;
  userId?: string;
  name: string;
  phone: string;
  password?: string;
  success: boolean;
  error?: string;
  isExisting?: boolean; // 是否为已存在账户
}

/**
 * 报名材料管理页面
 * 显示学历教育和职业技能两个标签页
 */
const RegistrationMaterials: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'EDUCATION' | 'VOCATIONAL'>('EDUCATION');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

  // 选中状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  // 账户生成状态
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountResult | null>(null);
  const [showBatchAccountModal, setShowBatchAccountModal] = useState(false);
  const [batchAccountResults, setBatchAccountResults] = useState<AccountResult[]>([]);

  // 删除状态
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // 加载报名数据
  const loadRegistrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用正确的token键名
      const token = localStorage.getItem('edu_token');
      
      // 检查token是否存在
      if (!token) {
        setError('未登录，请先登录');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const response = await axios.get('/api/registrations', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          type: activeTab
        }
      });
      
      if (response.data.success) {
        setRegistrations(response.data.data || []);
      } else {
        setError(response.data.error || '加载失败');
      }
    } catch (err: any) {
      console.error('加载报名数据失败:', err);
      
      // 如果是401或403错误,说明token无效或过期
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('登录已过期，请重新登录');
        // 清除无效token
        localStorage.removeItem('edu_token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.error || '网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 切换标签页时重新加载数据
  useEffect(() => {
    loadRegistrations();
    setCurrentPage(1);
    setSearchTerm('');
    setSelectedIds(new Set()); // 清空选中状态
  }, [activeTab]);

  // 搜索过滤 - 支持多字段搜索
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return registrations;
    }
    
    return registrations.filter(r => {
      // 学历教育搜索字段
      if (activeTab === 'EDUCATION') {
        return (
          r.name?.toLowerCase().includes(term) ||
          r.phone?.includes(term) ||
          r.highest_education?.includes(term) ||
          r.upgrade_type?.includes(term) ||
          r.upgrade_budget?.includes(term)
        );
      }
      // 职业技能搜索字段
      else {
        return (
          r.name?.toLowerCase().includes(term) ||
          r.phone?.includes(term) ||
          r.occupation?.toLowerCase().includes(term) ||
          r.apply_level?.includes(term)
        );
      }
    });
  }, [registrations, searchTerm, activeTab]);

  // 分页计算
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => 
    filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  , [filtered, currentPage]);

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      // 取消全选
      setSelectedIds(new Set());
    } else {
      // 全选当前页
      setSelectedIds(new Set(paginated.map(r => r.id)));
    }
  };

  // 切换单个选中状态
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 下载文档
  const handleDownload = async () => {
    if (selectedIds.size === 0) {
      alert('请至少选择一条记录');
      return;
    }

    setDownloading(true);
    
    try {
      const token = localStorage.getItem('edu_token');
      const selectedArray = Array.from(selectedIds);

      if (activeTab === 'EDUCATION') {
        // 学历教育：多选下载总表 Excel
        const response = await axios.post(
          '/api/registrations/batch-download',
          { registrationIds: selectedArray, type: 'EDUCATION' },
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `学历教育报名总表_${new Date().getTime()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        alert('下载成功！');
      } else {
        // 职业技能：单选下载 Word，多选下载压缩包
        if (selectedArray.length === 1) {
          // 单个文档下载
          const response = await axios.get(
            `/api/registrations/${selectedArray[0]}/document`,
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          );

          // 从响应头获取文件名
          const contentDisposition = response.headers['content-disposition'];
          let filename = `职业技能认定申报表_${new Date().getTime()}.docx`;
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
            }
          }

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          alert('下载成功！');
        } else {
          // 批量下载压缩包
          const response = await axios.post(
            '/api/registrations/batch-download',
            { registrationIds: selectedArray, type: 'VOCATIONAL' },
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `职业技能认定申报表_${new Date().getTime()}.zip`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          alert('下载成功！');
        }
      }

      // 清空选中状态
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('下载失败:', err);
      if (err.response?.status === 404) {
        alert('文档不存在，请联系管理员');
      } else {
        alert(err.response?.data?.error || '下载失败，请稍后重试');
      }
    } finally {
      setDownloading(false);
    }
  };

  // 获取下载按钮文本
  const getDownloadButtonText = () => {
    if (downloading) return '下载中...';
    if (selectedIds.size === 0) return '下载文档';
    
    if (activeTab === 'EDUCATION') {
      return `下载总表 (${selectedIds.size}条)`;
    } else {
      if (selectedIds.size === 1) {
        return '下载申报表';
      } else {
        return `下载压缩包 (${selectedIds.size}个)`;
      }
    }
  };

  // 生成单个账户
  const handleCreateAccount = async (registrationId: string) => {
    setCreatingAccount(true);
    
    try {
      const token = localStorage.getItem('edu_token');
      const response = await axios.post(
        `/api/registrations/${registrationId}/create-account`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const result = response.data.data;
        
        // 查找对应的报名记录以获取姓名
        const registration = registrations.find(r => r.id === registrationId);
        
        setAccountResult({
          registrationId,
          userId: result.userId,
          name: registration?.name || '',
          phone: result.phone,
          password: result.password === '已存在' ? undefined : result.password,
          success: true,
          isExisting: !result.isNew
        });
        setShowAccountModal(true);
        
        // 刷新列表
        loadRegistrations();
      } else {
        alert(response.data.error || '生成账户失败');
      }
    } catch (err: any) {
      console.error('生成账户失败:', err);
      alert(err.response?.data?.error || '生成账户失败，请稍后重试');
    } finally {
      setCreatingAccount(false);
    }
  };

  // 批量生成账户
  const handleBatchCreateAccounts = async () => {
    if (selectedIds.size === 0) {
      alert('请至少选择一条记录');
      return;
    }

    setCreatingAccount(true);
    
    try {
      const token = localStorage.getItem('edu_token');
      const selectedArray = Array.from(selectedIds);
      
      const response = await axios.post(
        '/api/registrations/batch-create-accounts',
        { registrationIds: selectedArray },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        
        // 转换后端返回的数据格式为前端需要的格式
        const results: AccountResult[] = [];
        
        // 处理成功的账户
        if (data.accounts && Array.isArray(data.accounts)) {
          data.accounts.forEach((account: any) => {
            results.push({
              registrationId: account.registrationId,
              userId: account.userId,
              name: registrations.find(r => r.id === account.registrationId)?.name || '',
              phone: account.phone,
              password: account.password === '已存在' ? undefined : account.password,
              success: true,
              isExisting: !account.isNew
            });
          });
        }
        
        // 处理失败的记录
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: any) => {
            results.push({
              registrationId: error.registrationId,
              name: registrations.find(r => r.id === error.registrationId)?.name || '',
              phone: registrations.find(r => r.id === error.registrationId)?.phone || '',
              success: false,
              error: error.error
            });
          });
        }
        
        setBatchAccountResults(results);
        setShowBatchAccountModal(true);
        
        // 清空选中状态
        setSelectedIds(new Set());
        
        // 刷新列表
        loadRegistrations();
      } else {
        alert(response.data.error || '批量生成账户失败');
      }
    } catch (err: any) {
      console.error('批量生成账户失败:', err);
      alert(err.response?.data?.error || '批量生成账户失败，请稍后重试');
    } finally {
      setCreatingAccount(false);
    }
  };

  // 关闭单个账户弹窗
  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setAccountResult(null);
  };

  // 关闭批量账户弹窗
  const handleCloseBatchAccountModal = () => {
    setShowBatchAccountModal(false);
    setBatchAccountResults([]);
  };

  // 单个删除确认
  const handleDeleteConfirm = (id: string) => {
    setRecordToDelete(id);
    setShowDeleteConfirm(true);
  };

  // 取消单个删除
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  // 执行单个删除
  const handleDelete = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('edu_token');
      if (!token) throw new Error('未登录');

      const response = await axios.delete(`/api/registrations/${recordToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // 从列表中移除删除的记录
        setRegistrations(registrations.filter(r => r.id !== recordToDelete));
        // 从选中集合中移除
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.delete(recordToDelete);
        setSelectedIds(newSelectedIds);
      } else {
        alert(response.data.error || '删除失败');
      }
    } catch (err: any) {
      console.error('删除报名记录失败:', err);
      alert(err.response?.data?.error || '网络错误，请稍后重试');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  // 批量删除确认
  const handleBatchDeleteConfirm = () => {
    setShowBatchDeleteConfirm(true);
  };

  // 取消批量删除
  const handleBatchDeleteCancel = () => {
    setShowBatchDeleteConfirm(false);
  };

  // 执行批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('edu_token');
      if (!token) throw new Error('未登录');

      // 批量删除需要逐个调用API（或者如果后端支持批量删除API可以优化）
      const deletePromises = Array.from(selectedIds).map(id => 
        axios.delete(`/api/registrations/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);

      // 从列表中移除删除的记录
      setRegistrations(registrations.filter(r => !selectedIds.has(r.id)));
      // 清空选中状态
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('批量删除报名记录失败:', err);
      alert(err.response?.data?.error || '网络错误，请稍后重试');
    } finally {
      setDeleting(false);
      setShowBatchDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报名材料管理</h1>
      </div>

      {/* 标签页切换 */}
      <div className="bg-white rounded-3xl border shadow-sm p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('EDUCATION')}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'EDUCATION'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-graduation-cap mr-2"></i>
          学历教育
        </button>
        <button
          onClick={() => setActiveTab('VOCATIONAL')}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'VOCATIONAL'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-certificate mr-2"></i>
          职业技能
        </button>
      </div>

      {/* 搜索栏和操作按钮 */}
      <div className="bg-white p-4 rounded-3xl border shadow-sm space-y-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold" 
            placeholder="搜索姓名或手机号..." 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        
        {/* 操作按钮 */}
        {paginated.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              已选择 <span className="font-bold text-indigo-600">{selectedIds.size}</span> 条记录
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBatchDeleteConfirm}
                disabled={selectedIds.size === 0 || deleting}
                className="bg-rose-600 text-white px-6 py-2 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors flex items-center gap-2"
              >
                <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                批量删除
              </button>
              <button
                onClick={handleBatchCreateAccounts}
                disabled={selectedIds.size === 0 || creatingAccount}
                className="bg-green-600 text-white px-6 py-2 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <i className={`fa-solid ${creatingAccount ? 'fa-spinner fa-spin' : 'fa-user-plus'}`}></i>
                批量生成账户
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedIds.size === 0 || downloading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <i className={`fa-solid ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                {getDownloadButtonText()}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p className="text-gray-500 font-medium">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-circle text-4xl text-rose-500 mb-4"></i>
            <p className="text-gray-500 font-medium mb-4">{error}</p>
            <button
              onClick={loadRegistrations}
              className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold text-sm"
            >
              重新加载
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-400 font-medium">暂无报名记录</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">姓名</th>
                    <th className="px-6 py-4">联系电话</th>
                    {activeTab === 'EDUCATION' ? (
                      <>
                        <th className="px-6 py-4">最高学历</th>
                        <th className="px-6 py-4">升学类型</th>
                        <th className="px-6 py-4">升学预算</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4">申报认定职业</th>
                        <th className="px-6 py-4">申报等级</th>
                      </>
                    )}
                    <th className="px-6 py-4">提交时间</th>
                    <th className="px-6 py-4">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((record) => (
                    <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => handleToggleSelect(record.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{record.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{record.phone}</span>
                      </td>
                      {activeTab === 'EDUCATION' ? (
                        <>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-800">
                              {record.highest_education || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-indigo-600">
                              {record.upgrade_type || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {record.upgrade_budget || '--'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-800">
                              {record.occupation || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                              {record.apply_level || '--'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {record.user_id ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              <i className="fa-solid fa-check mr-1"></i>
                              已生成
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCreateAccount(record.id)}
                              disabled={creatingAccount}
                              className="bg-green-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                            >
                              <i className="fa-solid fa-user-plus mr-1"></i>
                              生成账户
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteConfirm(record.id)}
                            disabled={deleting}
                            className="bg-rose-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors flex items-center"
                          >
                            <i className="fa-solid fa-trash mr-1"></i>
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-xs font-bold text-gray-400">
                  共 {filtered.length} 条记录，当前第 {currentPage} / {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-colors"
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
                    className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 单个账户生成结果弹窗 */}
      {showAccountModal && accountResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {accountResult.isExisting ? '账户关联成功' : '账户生成成功'}
              </h2>
              <button
                onClick={handleCloseAccountModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
              {accountResult.isExisting ? (
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-info-circle text-green-600 text-xl mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-medium">
                      该手机号已存在账户，已自动关联
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-green-600 text-xl mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      学员账户已创建，请妥善保管以下信息
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 bg-white rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold">姓名</span>
                  <span className="text-sm font-bold text-gray-900">{accountResult.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold">账号</span>
                  <span className="text-sm font-mono font-bold text-indigo-600">{accountResult.phone}</span>
                </div>
                {!accountResult.isExisting && accountResult.password && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">密码</span>
                    <span className="text-sm font-mono font-bold text-rose-600">{accountResult.password}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCloseAccountModal}
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 单个删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">删除确认</h2>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-exclamation-circle text-yellow-500 text-xl mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">
                    确定要删除这条报名记录吗？此操作不可撤销。
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="px-6 py-2 rounded-2xl font-bold text-sm border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 rounded-2xl font-bold text-sm bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">批量删除确认</h2>
              <button
                onClick={handleBatchDeleteCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">
                    确定要删除选中的 <span className="text-rose-600 font-bold">{selectedIds.size}</span> 条报名记录吗？此操作不可撤销。
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleBatchDeleteCancel}
                  disabled={deleting}
                  className="px-6 py-2 rounded-2xl font-bold text-sm border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={deleting}
                  className="px-6 py-2 rounded-2xl font-bold text-sm bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量账户生成结果弹窗 */}
      {showBatchAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">批量生成账户结果</h2>
              <button
                onClick={handleCloseBatchAccountModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">
                    {batchAccountResults.length}
                  </div>
                  <div className="text-xs text-blue-600 font-bold mt-1">总数</div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-green-600">
                    {batchAccountResults.filter(r => r.success).length}
                  </div>
                  <div className="text-xs text-green-600 font-bold mt-1">成功</div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-rose-600">
                    {batchAccountResults.filter(r => !r.success).length}
                  </div>
                  <div className="text-xs text-rose-600 font-bold mt-1">失败</div>
                </div>
              </div>

              {/* 详细列表 */}
              <div className="border rounded-2xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="px-4 py-3">状态</th>
                        <th className="px-4 py-3">姓名</th>
                        <th className="px-4 py-3">账号</th>
                        <th className="px-4 py-3">密码</th>
                        <th className="px-4 py-3">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batchAccountResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {result.success ? (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <i className="fa-solid fa-check mr-1"></i>
                                成功
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                                <i className="fa-solid fa-times mr-1"></i>
                                失败
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-gray-900">{result.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-gray-600">{result.phone}</span>
                          </td>
                          <td className="px-4 py-3">
                            {result.success && !result.isExisting && result.password ? (
                              <span className="text-sm font-mono font-bold text-rose-600">{result.password}</span>
                            ) : (
                              <span className="text-xs text-gray-400">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {result.isExisting ? (
                              <span className="text-xs text-blue-600">已存在账户，已关联</span>
                            ) : result.error ? (
                              <span className="text-xs text-rose-600">{result.error}</span>
                            ) : (
                              <span className="text-xs text-green-600">新建账户</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={handleCloseBatchAccountModal}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationMaterials;
