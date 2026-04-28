import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 专业对照记录类型定义
interface MajorMapping {
  id: string;
  occupation: string;
  major_name: string;
  level_4_compatible: boolean;
  level_3_compatible: boolean;
  created_at: string;
  updated_at: string;
}

// 职业列表项类型
interface Occupation {
  occupation: string;
}

/**
 * 专业表单管理页面
 * 管理职业专业对照表
 */
const MajorForms: React.FC = () => {
  // 状态管理
  const [mappings, setMappings] = useState<MajorMapping[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MajorMapping | null>(null);
  const [formData, setFormData] = useState({
    major_name: '',
    level_4_compatible: false,
    level_3_compatible: false
  });

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLevel4, setBatchLevel4] = useState(false);
  const [batchLevel3, setBatchLevel3] = useState(false);

  // 导入状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

  // 加载职业列表
  const loadOccupations = async () => {
    try {
      const token = localStorage.getItem('edu_token');
      const response = await axios.get('/api/occupations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // API 返回的是字符串数组,直接转换为对象数组
        const occupationList = response.data.data.map((occupation: string) => ({ 
          occupation 
        }));
        setOccupations(occupationList as Occupation[]);
      }
    } catch (err: any) {
      console.error('加载职业列表失败:', err);
    }
  };

  // 加载专业对照表
  const loadMappings = async (occupation: string) => {
    if (!occupation) {
      setMappings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('edu_token');
      const response = await axios.get('/api/major-mappings', {
        headers: { Authorization: `Bearer ${token}` },
        params: { occupation }
      });

      if (response.data.success) {
        setMappings(response.data.data || []);
      } else {
        setError(response.data.error || '加载失败');
      }
    } catch (err: any) {
      console.error('加载专业对照表失败:', err);
      setError(err.response?.data?.error || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载职业列表
  useEffect(() => {
    loadOccupations();
  }, []);

  // 职业变化时加载对应的专业对照表
  useEffect(() => {
    loadMappings(selectedOccupation);
    setCurrentPage(1);
  }, [selectedOccupation]);

  // 打开新增弹窗
  const handleAdd = () => {
    if (!selectedOccupation) {
      alert('请先选择职业');
      return;
    }
    setEditingMapping(null);
    setFormData({
      major_name: '',
      level_4_compatible: false,
      level_3_compatible: false
    });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (mapping: MajorMapping) => {
    setEditingMapping(mapping);
    setFormData({
      major_name: mapping.major_name,
      level_4_compatible: mapping.level_4_compatible,
      level_3_compatible: mapping.level_3_compatible
    });
    setShowModal(true);
  };

  // 保存专业对照记录(支持批量添加)
  const handleSave = async () => {
    if (!formData.major_name.trim()) {
      alert('请输入专业名称');
      return;
    }

    if (!formData.level_4_compatible && !formData.level_3_compatible) {
      alert('请至少选择一个兼容等级');
      return;
    }

    try {
      const token = localStorage.getItem('edu_token');
      
      if (editingMapping) {
        // 更新单个专业
        await axios.put(
          `/api/major-mappings/${editingMapping.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('更新成功！');
      } else {
        // 批量创建:支持用逗号、分号、换行符分隔多个专业名称
        const majorNames = formData.major_name
          .split(/[,，;；\n]/)
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (majorNames.length === 0) {
          alert('请输入有效的专业名称');
          return;
        }

        // 批量创建专业
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const majorName of majorNames) {
          try {
            await axios.post(
              '/api/major-mappings',
              {
                occupation: selectedOccupation,
                major_name: majorName,
                level_4_compatible: formData.level_4_compatible,
                level_3_compatible: formData.level_3_compatible
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            successCount++;
          } catch (err: any) {
            failCount++;
            errors.push(`${majorName}: ${err.response?.data?.error || '添加失败'}`);
          }
        }

        // 显示结果
        if (failCount === 0) {
          alert(`批量添加成功！共添加 ${successCount} 个专业`);
        } else {
          alert(`添加完成：成功 ${successCount} 个，失败 ${failCount} 个\n\n失败详情:\n${errors.join('\n')}`);
        }
      }

      setShowModal(false);
      loadMappings(selectedOccupation);
    } catch (err: any) {
      console.error('保存失败:', err);
      alert(err.response?.data?.error || '保存失败，请稍后重试');
    }
  };

  // 删除专业对照记录
  const handleDelete = async (id: string, majorName: string) => {
    if (!confirm(`确定要删除专业"${majorName}"吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('edu_token');
      await axios.delete(`/api/major-mappings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('删除成功！');
      loadMappings(selectedOccupation);
    } catch (err: any) {
      console.error('删除失败:', err);
      alert(err.response?.data?.error || '删除失败，请稍后重试');
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedMappings.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // 打开批量修改弹窗
  const handleBatchEdit = () => {
    if (selectedIds.length === 0) {
      alert('请先选择要修改的专业');
      return;
    }
    setBatchLevel4(false);
    setBatchLevel3(false);
    setShowBatchModal(true);
  };

  // 批量修改兼容等级
  const handleBatchSave = async () => {
    if (!batchLevel4 && !batchLevel3) {
      alert('请至少选择一个兼容等级');
      return;
    }

    try {
      const token = localStorage.getItem('edu_token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.put(
            `/api/major-mappings/${id}`,
            {
              level_4_compatible: batchLevel4,
              level_3_compatible: batchLevel3
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          successCount++;
        } catch (err) {
          failCount++;
        }
      }

      alert(`批量修改完成：成功 ${successCount} 个，失败 ${failCount} 个`);
      setShowBatchModal(false);
      setSelectedIds([]);
      loadMappings(selectedOccupation);
    } catch (err: any) {
      console.error('批量修改失败:', err);
      alert('批量修改失败，请稍后重试');
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('请上传 Excel 文件（.xlsx 或 .xls）');
        return;
      }
      setImportFile(file);
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (!selectedOccupation) {
      alert('请先选择职业');
      return;
    }

    if (!importFile) {
      alert('请选择要导入的文件');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('edu_token');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('occupation', selectedOccupation);

      const response = await axios.post(
        '/api/major-mappings/import',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setImportResult(response.data.data);
        loadMappings(selectedOccupation);
      } else {
        alert(response.data.error || '导入失败');
      }
    } catch (err: any) {
      console.error('导入失败:', err);
      alert(err.response?.data?.error || '导入失败，请稍后重试');
    } finally {
      setImporting(false);
    }
  };

  // 关闭导入弹窗
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  // 分页计算
  const totalPages = Math.ceil(mappings.length / pageSize);
  const paginatedMappings = mappings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">专业表单管理</h1>
      </div>

      {/* 职业筛选和操作按钮 */}
      <div className="bg-white p-4 rounded-3xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 职业筛选下拉框 */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              选择职业
            </label>
            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
            >
              <option value="">-- 请选择职业 --</option>
              {occupations.map((occ) => (
                <option key={occ.occupation} value={occ.occupation}>
                  {occ.occupation}
                </option>
              ))}
            </select>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 items-end">
            <button
              onClick={handleAdd}
              disabled={!selectedOccupation}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              添加专业
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!selectedOccupation}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-file-import"></i>
              Excel 导入
            </button>
            <button
              onClick={handleBatchEdit}
              disabled={selectedIds.length === 0}
              className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-edit"></i>
              批量修改({selectedIds.length})
            </button>
          </div>
        </div>

        {selectedOccupation && (
          <div className="text-sm text-gray-500">
            当前职业：<span className="font-bold text-indigo-600">{selectedOccupation}</span>
            {' '}·{' '}
            共 <span className="font-bold text-indigo-600">{mappings.length}</span> 条专业对照记录
            {selectedIds.length > 0 && (
              <>
                {' '}·{' '}
                已选择 <span className="font-bold text-orange-600">{selectedIds.length}</span> 条
              </>
            )}
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {!selectedOccupation ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-hand-pointer text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-400 font-medium">请先选择职业</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p className="text-gray-500 font-medium">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-circle text-4xl text-rose-500 mb-4"></i>
            <p className="text-gray-500 font-medium mb-4">{error}</p>
            <button
              onClick={() => loadMappings(selectedOccupation)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold text-sm"
            >
              重新加载
            </button>
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-400 font-medium mb-2">暂无专业对照记录</p>
            <p className="text-xs text-gray-400">点击"添加专业"或"Excel 导入"添加记录</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedMappings.length && paginatedMappings.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4">职业</th>
                    <th className="px-6 py-4">专业名称</th>
                    <th className="px-6 py-4 text-center">四级兼容</th>
                    <th className="px-6 py-4 text-center">三级兼容</th>
                    <th className="px-6 py-4">创建时间</th>
                    <th className="px-6 py-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(mapping.id)}
                          onChange={(e) => handleSelectOne(mapping.id, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-800">
                          {mapping.occupation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-indigo-600">
                          {mapping.major_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {mapping.level_4_compatible ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            <i className="fa-solid fa-check mr-1"></i>
                            兼容
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                            <i className="fa-solid fa-times mr-1"></i>
                            不兼容
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {mapping.level_3_compatible ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            <i className="fa-solid fa-check mr-1"></i>
                            兼容
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                            <i className="fa-solid fa-times mr-1"></i>
                            不兼容
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">
                          {new Date(mapping.created_at).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(mapping)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors"
                          >
                            <i className="fa-solid fa-edit mr-1"></i>
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(mapping.id, mapping.major_name)}
                            className="bg-rose-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors"
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
                  共 {mappings.length} 条记录，当前第 {currentPage} / {totalPages} 页
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

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMapping ? '编辑专业对照' : '添加专业对照'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* 职业名称（只读） */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  职业名称
                </label>
                <input
                  type="text"
                  value={selectedOccupation}
                  disabled
                  className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 outline-none font-bold text-gray-600"
                />
              </div>

              {/* 专业名称 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  专业名称 <span className="text-rose-500">*</span>
                </label>
                {editingMapping ? (
                  <input
                    type="text"
                    value={formData.major_name}
                    onChange={(e) => setFormData({ ...formData, major_name: e.target.value })}
                    placeholder="请输入专业名称"
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
                  />
                ) : (
                  <>
                    <textarea
                      value={formData.major_name}
                      onChange={(e) => setFormData({ ...formData, major_name: e.target.value })}
                      placeholder="请输入专业名称（支持批量添加，用逗号、分号或换行分隔）&#10;例如：日语,小学教育"
                      rows={3}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold resize-none"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      <i className="fa-solid fa-info-circle mr-1"></i>
                      支持批量添加：用逗号、分号或换行分隔多个专业名称
                    </div>
                  </>
                )}
              </div>

              {/* 兼容等级 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  兼容等级 <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.level_4_compatible}
                      onChange={(e) => setFormData({ ...formData, level_4_compatible: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">四级兼容</div>
                      <div className="text-xs text-gray-500">中专、技校学历专业符合</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.level_3_compatible}
                      onChange={(e) => setFormData({ ...formData, level_3_compatible: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">三级兼容</div>
                      <div className="text-xs text-gray-500">大专及以上学历专业符合</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量修改弹窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">批量修改兼容等级</h2>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-info-circle text-blue-600 text-xl mt-0.5"></i>
                <div className="flex-1 text-sm text-blue-800">
                  <p className="font-bold mb-1">批量修改说明：</p>
                  <p className="text-xs">
                    已选择 <span className="font-bold">{selectedIds.length}</span> 个专业，
                    将统一设置为以下兼容等级
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* 兼容等级 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  兼容等级 <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={batchLevel4}
                      onChange={(e) => setBatchLevel4(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">四级兼容</div>
                      <div className="text-xs text-gray-500">中专、技校学历专业符合</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={batchLevel3}
                      onChange={(e) => setBatchLevel3(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">三级兼容</div>
                      <div className="text-xs text-gray-500">大专及以上学历专业符合</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBatchSave}
                className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-bold hover:bg-orange-700 transition-colors"
              >
                <i className="fa-solid fa-check mr-2"></i>
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel 导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Excel 导入</h2>
              <button
                onClick={handleCloseImportModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {!importResult ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <i className="fa-solid fa-info-circle text-blue-600 text-xl mt-0.5"></i>
                    <div className="flex-1 text-sm text-blue-800">
                      <p className="font-bold mb-2">导入说明：</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Excel 文件需包含"专业名称"列</li>
                        <li>可选包含"四级兼容"和"三级兼容"列（是/否）</li>
                        <li>导入的专业将关联到当前选择的职业：<span className="font-bold">{selectedOccupation}</span></li>
                        <li>重复的专业对照记录将被跳过</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    选择文件
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className="flex items-center justify-center gap-3 p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <i className="fa-solid fa-file-excel text-3xl text-green-600"></i>
                      <div className="text-center">
                        {importFile ? (
                          <>
                            <div className="font-bold text-gray-900">{importFile.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {(importFile.size / 1024).toFixed(2)} KB
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-gray-700">点击选择文件</div>
                            <div className="text-xs text-gray-500 mt-1">支持 .xlsx 和 .xls 格式</div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCloseImportModal}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        导入中...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-file-import"></i>
                        开始导入
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 导入结果 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-green-600">
                        {importResult.imported || 0}
                      </div>
                      <div className="text-xs text-green-600 font-bold mt-1">成功</div>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-yellow-600">
                        {importResult.skipped || 0}
                      </div>
                      <div className="text-xs text-yellow-600 font-bold mt-1">跳过</div>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-rose-600">
                        {importResult.errors?.length || 0}
                      </div>
                      <div className="text-xs text-rose-600 font-bold mt-1">失败</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="border rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          错误详情
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                          {importResult.errors.map((error: any, index: number) => (
                            <div key={index} className="px-4 py-3 hover:bg-gray-50">
                              <div className="text-sm text-gray-900 font-medium">
                                行 {error.row || index + 1}
                              </div>
                              <div className="text-xs text-rose-600 mt-1">
                                {error.error || error.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCloseImportModal}
                  className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  完成
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorForms;
