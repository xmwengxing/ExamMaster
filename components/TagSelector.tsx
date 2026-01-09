import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { useAppStore } from '../store';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  allowCreate?: boolean;
  placeholder?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTagIds,
  onChange,
  allowCreate = true,
  placeholder = '搜索或创建标签...'
}) => {
  const store = useAppStore();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchTags();
      setAllTags(result);
    } catch (error: any) {
      console.error('[TagSelector] 加载标签失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchQuery.trim()) return;

    setIsCreating(true);
    try {
      const newTag = await store.createTag(searchQuery.trim());
      await loadTags();
      onChange([...selectedTagIds, newTag.id]);
      setSearchQuery('');
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('[TagSelector] 创建标签失败:', error);
      alert('创建标签失败：' + (error.message || '未知错误'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));
  
  const filteredTags = allTags.filter(tag => {
    if (!searchQuery) return !selectedTagIds.includes(tag.id);
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedTagIds.includes(tag.id);
  });

  const exactMatch = allTags.find(tag => tag.name.toLowerCase() === searchQuery.toLowerCase());
  const showCreateOption = allowCreate && searchQuery.trim() && !exactMatch && !isCreating;

  return (
    <div ref={containerRef} className="relative">
      {/* 选中的标签显示 */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="min-h-[48px] px-4 py-2 border-2 border-gray-100 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 cursor-text"
      >
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: tag.color || '#6366f1' }}
            >
              {tag.name}
              <button
                onClick={(e) => handleRemoveTag(tag.id, e)}
                className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent font-medium text-sm py-1"
          />
        </div>
      </div>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <i className="fa-solid fa-spinner animate-spin"></i>
            </div>
          ) : (
            <>
              {/* 创建新标签选项 */}
              {showCreateOption && (
                <button
                  onClick={handleCreateTag}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                >
                  <i className="fa-solid fa-plus text-indigo-600"></i>
                  <span className="font-bold text-indigo-600">
                    创建标签 "{searchQuery}"
                  </span>
                </button>
              )}

              {/* 标签列表 */}
              {filteredTags.length === 0 && !showCreateOption ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {searchQuery ? '未找到匹配的标签' : '所有标签已选中'}
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || '#6366f1' }}
                      />
                      <span className="font-bold text-gray-800">{tag.name}</span>
                      <span className="text-xs text-gray-400">({tag.usageCount})</span>
                    </div>
                    <i className="fa-solid fa-plus text-gray-300 group-hover:text-indigo-600 transition-colors"></i>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
