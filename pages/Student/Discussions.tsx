import React, { useState } from 'react';
import { Discussion } from '../../types';
import { useAppStore } from '../../store';
import DiscussionList from '../../components/DiscussionList';
import DiscussionDetail from '../../components/DiscussionDetail';
import DiscussionForm from '../../components/DiscussionForm';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

interface DiscussionsProps {
  questionId?: string;  // 可选：如果从题目页面进入，可以预设题目ID
}

const Discussions: React.FC<DiscussionsProps> = ({ questionId }) => {
  const store = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);

  const handleSelectDiscussion = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setViewMode('detail');
  };

  const handleCreateNew = () => {
    setViewMode('create');
  };

  const handleEdit = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDiscussion(null);
    setEditingDiscussion(null);
  };

  const handleCreateSubmit = async (data: { 
    title: string; 
    content: string; 
    questionId?: string;
  }) => {
    await store.createDiscussion(data);
    alert('✓ 讨论发布成功');
    setViewMode('list');
  };

  const handleEditSubmit = async (data: { 
    title: string; 
    content: string; 
    questionId?: string;
  }) => {
    if (!editingDiscussion) return;
    await store.updateDiscussion(editingDiscussion.id, {
      title: data.title,
      content: data.content
    });
    alert('✓ 讨论更新成功');
    setViewMode('list');
    setEditingDiscussion(null);
  };

  const handleDelete = (discussionId: string) => {
    // 删除后返回列表
    setViewMode('list');
    setSelectedDiscussion(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <DiscussionList
            questionId={questionId}
            onSelectDiscussion={handleSelectDiscussion}
            onCreateNew={handleCreateNew}
          />
        );

      case 'detail':
        return selectedDiscussion ? (
          <DiscussionDetail
            discussionId={selectedDiscussion.id}
            onBack={handleBackToList}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUserId={store.currentUser?.id}
            isAdmin={store.currentUser?.role === 'ADMIN'}
          />
        ) : null;

      case 'create':
        return (
          <DiscussionForm
            questionId={questionId}
            onSubmit={handleCreateSubmit}
            onCancel={handleBackToList}
          />
        );

      case 'edit':
        return editingDiscussion ? (
          <DiscussionForm
            discussion={editingDiscussion}
            onSubmit={handleEditSubmit}
            onCancel={handleBackToList}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {renderContent()}
    </div>
  );
};

export default Discussions;
