import React, { useState, useEffect } from 'react';
import { Discussion, Question } from '../types';
import { useAppStore } from '../store';

interface DiscussionFormProps {
  discussion?: Discussion;  // 如果提供，则为编辑模式
  questionId?: string;      // 可选：关联的题目ID
  onSubmit: (data: { title: string; content: string; questionId?: string }) => Promise<void>;
  onCancel: () => void;
}

const DiscussionForm: React.FC<DiscussionFormProps> = ({ 
  discussion, 
  questionId: initialQuestionId,
  onSubmit, 
  onCancel 
}) => {
  const store = useAppStore();
  const [title, setTitle] = useState(discussion?.title || '');
  const [content, setContent] = useState(discussion?.content || '');
  const [questionId, setQuestionId] = useState<string | undefined>(
    discussion?.questionId || initialQuestionId
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  const isEditMode = !!discussion;

  // 筛选题目
  const filteredQuestions = store.questions.filter(q => 
    q.content.toLowerCase().includes(questionSearch.toLowerCase())
  ).slice(0, 10); // 限制显示10个

  const selectedQuestion = questionId 
    ? store.questions.find(q => q.id === questionId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return alert('请输入讨论标题');
    }

    if (!content.trim()) {
      return alert('请输入讨论内容');
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        questionId
      });
    } catch (error: any) {
      console.error('[DiscussionForm] 提交失败:', error);
      alert('提交失败：' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100">
      <h2 className="text-2xl font-black text-gray-900 mb-6">
        {isEditMode ? '编辑讨论' : '发起新讨论'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 标题输入 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            讨论标题 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简明扼要地描述你的问题或话题"
            className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium outline-none"
            maxLength={100}
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {title.length}/100
          </div>
        </div>

        {/* 关联题目 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            关联题目 <span className="text-gray-400 font-normal">(可选)</span>
          </label>
          
          {selectedQuestion ? (
            <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-bold text-indigo-600 mb-1">已选择题目</div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {selectedQuestion.content}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuestionId(undefined)}
                  className="text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowQuestionSelector(!showQuestionSelector)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors font-medium"
            >
              <i className="fa-solid fa-link mr-2"></i>
              点击选择关联题目
            </button>
          )}

          {/* 题目选择器 */}
          {showQuestionSelector && !selectedQuestion && (
            <div className="mt-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="搜索题目..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-3"
              />
              
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  {questionSearch ? '未找到匹配的题目' : '暂无题目'}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredQuestions.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setQuestionId(q.id);
                        setShowQuestionSelector(false);
                        setQuestionSearch('');
                      }}
                      className="w-full p-3 text-left bg-white rounded-xl border-2 border-gray-100 hover:border-indigo-200 transition-colors"
                    >
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {q.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {q.type} · {q.bankId}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 内容输入 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            讨论内容 <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细描述你的问题、想法或观点..."
            className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            rows={10}
          />
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>支持换行，请详细描述</span>
            <span>{content.length} 字</span>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <><i className="fa-solid fa-spinner animate-spin mr-2"></i>提交中...</>
            ) : (
              <><i className="fa-solid fa-paper-plane mr-2"></i>{isEditMode ? '保存修改' : '发布讨论'}</>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiscussionForm;
