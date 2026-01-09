import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { useAppStore } from '../store';

interface TagManagerProps {
  onClose?: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ onClose }) => {
  const store = useAppStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1'); // indigo-600
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  // 预设颜色
  const presetColors = [
    { name: '靛蓝', value: '#6366f1' },
    { name: '紫色', value: '#a855f7' },
    { name: '粉色', value: '#ec4899' },
    { name: '红色', value: '#ef4444' },
    { name: '橙色', value: '#f97316' },
    { name: '琥珀', value: '#f59e0b' },
    { name: '黄色', value: '#eab308' },
    { name: '绿色', value: '#22c55e' },
    { name: '翠绿', value: '#10b981' },
    { name: '青色', value: '#06b6d4' },
    { name: '蓝色', value: '#3b82f6' },
    { name: '灰色', value: '#6b7280' }
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchTags();
      setTags(result);
    } catch (error: any) {
      console.error('[TagManager] 加载标签失败:', error);
      alert('加载标签失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      return alert('请输入标签名称');
    }

    setIsCreating(true);
    try {
      await store.createTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor('#6366f1');
      await loadTags();
      alert('✓ 标签创建成功');
    } catch (error: any) {
      console.error('[TagManager] 创建标签失败:', error);
      alert('创建标签失败：' + (error.message || '未知错误'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag) return;
    if (!newTagName.trim()) {
      return alert('请输入标签名称');
    }

    try {
      await store.updateTag(editingTag.id, newTagName.trim(), newTagColor);
      setEditingTag(null);
      setNewTagName('');
      setNewTagColor('#6366f1');
      await loadTags();
      alert('✓ 标签更新成功');
    } catch (error: any) {
      console.error('[TagManager] 更新标签失败:', error);
      alert('更新标签失败：' + (error.message || '未知错误'));
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定删除标签"${tag.name}"吗？\n\n此操作将移除该标签与所有题目的关联关系。`)) {
      return;
    }

    try {
      await store.deleteTag(tag.id);
      await loadTags();
      alert('✓ 标签删除成功');
    } catch (error: any) {
      console.error('[TagManager] 删除标签失败:', error);
      alert('删除标签失败：' + (error.message || '未知错误'));
    }
  };

  const handleMerge = async () => {
    if (!mergeSourceId || !mergeTargetId) {
      return alert('请选择要合并的标签');
    }

    if (mergeSourceId === mergeTargetId) {
      return alert('不能将标签合并到自己');
    }

    const sourceTag = tags.find(t => t.id === mergeSourceId);
    const targetTag = tags.find(t => t.id === mergeTargetId);

    if (!confirm(`确定将标签"${sourceTag?.name}"合并到"${targetTag?.name}"吗？\n\n源标签将被删除，其所有关联将转移到目标标签。`)) {
      return;
    }

    try {
      await store.mergeTags(mergeSourceId, mergeTargetId);
      setIsMerging(false);
      setMergeSourceId('');
      setMergeTargetId('');
      await loadTags();
      alert('✓ 标签合并成功');
    } catch (error: any) {
      console.error('[TagManager] 合并标签失败:', error);
      alert('合并标签失败：' + (error.message || '未知错误'));
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color || '#6366f1');
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#6366f1');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <i className="fa-solid fa-spinner animate-spin text-3xl text-indigo-600"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">标签管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理题目标签，支持创建、编辑、删除和合并</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-gray-600"></i>
          </button>
        )}
      </div>

      {/* 创建/编辑标签表单 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="text-lg font-black text-gray-800 mb-4">
          {editingTag ? '编辑标签' : '创建新标签'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">标签名称</label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="例如：网络安全、数据库、前端开发"
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">标签颜色</label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setNewTagColor(color.value)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    newTagColor === color.value
                      ? 'ring-4 ring-offset-2 ring-gray-300 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            {editingTag ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-black hover:bg-indigo-700 transition-colors"
                >
                  保存修改
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <><i className="fa-solid fa-spinner animate-spin mr-2"></i>创建中...</>
                ) : (
                  <><i className="fa-solid fa-plus mr-2"></i>创建标签</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 标签合并 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-800">标签合并</h3>
          <button
            onClick={() => setIsMerging(!isMerging)}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            {isMerging ? '取消合并' : '开始合并'}
          </button>
        </div>
        {isMerging && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">源标签（将被删除）</label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl font-medium outline-none"
                >
                  <option value="">选择标签</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name} ({tag.usageCount}个题目)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">目标标签（保留）</label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl font-medium outline-none"
                >
                  <option value="">选择标签</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name} ({tag.usageCount}个题目)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleMerge}
              disabled={!mergeSourceId || !mergeTargetId}
              className="w-full bg-amber-600 text-white py-3 rounded-2xl font-black hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fa-solid fa-code-merge mr-2"></i>执行合并
            </button>
          </div>
        )}
      </div>

      {/* 标签列表 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-800">
            所有标签 <span className="text-sm font-normal text-gray-400">({tags.length})</span>
          </h3>
        </div>
        {tags.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fa-solid fa-tags text-4xl mb-3"></i>
            <p className="text-sm font-medium">暂无标签，创建第一个标签吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    />
                    <span className="font-black text-gray-800">{tag.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(tag)}
                      className="w-8 h-8 rounded-lg hover:bg-indigo-50 text-indigo-600 flex items-center justify-center"
                      title="编辑"
                    >
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(tag)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center"
                      title="删除"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  使用次数：<span className="font-bold">{tag.usageCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManager;
