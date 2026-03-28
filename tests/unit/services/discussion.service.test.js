/**
 * 讨论服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as discussionService from '../../../src/services/discussion.service.js';
import db from '../../../db.js';

// Mock db 模块
vi.mock('../../../db.js', () => ({
  default: {
    getOne: vi.fn(),
    getMany: vi.fn(),
    execute: vi.fn()
  }
}));

describe('讨论服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDiscussions', () => {
    it('应该返回讨论列表（学员）', async () => {
      db.getOne.mockResolvedValue({ total: 10 });
      db.getMany.mockResolvedValue([
        {
          id: 'disc-1',
          title: '讨论1',
          is_pinned: false,
          is_hidden: false
        }
      ]);

      const result = await discussionService.getDiscussions({
        page: 1,
        limit: 20,
        isAdmin: false
      });

      expect(result.discussions).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
    });

    it('应该支持按题目筛选', async () => {
      db.getOne.mockResolvedValue({ total: 5 });
      db.getMany.mockResolvedValue([]);

      await discussionService.getDiscussions({
        page: 1,
        limit: 20,
        questionId: 'q-1',
        isAdmin: false
      });

      expect(db.getOne).toHaveBeenCalledWith(
        expect.stringContaining('question_id = $1'),
        ['q-1']
      );
    });

    it('应该支持不同排序方式', async () => {
      db.getOne.mockResolvedValue({ total: 0 });
      db.getMany.mockResolvedValue([]);

      await discussionService.getDiscussions({
        page: 1,
        limit: 20,
        sortBy: 'popular',
        isAdmin: false
      });

      expect(db.getMany).toHaveBeenCalledWith(
        expect.stringContaining('like_count DESC'),
        expect.any(Array)
      );
    });
  });

  describe('getDiscussionById', () => {
    it('应该返回讨论详情', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        title: '讨论1',
        is_pinned: false,
        is_hidden: false
      };
      db.getOne.mockResolvedValue(mockDiscussion);
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.getDiscussionById('disc-1', false);

      expect(result.id).toBe('disc-1');
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('view_count'),
        ['disc-1']
      );
    });

    it('应该在讨论不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);

      await expect(
        discussionService.getDiscussionById('disc-999', false)
      ).rejects.toThrow('讨论不存在');
    });

    it('应该阻止学员查看隐藏讨论', async () => {
      db.getOne.mockResolvedValue({ id: 'disc-1', is_hidden: true });

      await expect(
        discussionService.getDiscussionById('disc-1', false)
      ).rejects.toThrow('讨论不存在');
    });
  });

  describe('createDiscussion', () => {
    it('应该创建讨论', async () => {
      db.getOne.mockResolvedValue({ nickname: '测试用户', real_name: null });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const discussionData = {
        title: '新讨论',
        content: '讨论内容'
      };

      const result = await discussionService.createDiscussion(discussionData, 'user-1');

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^disc-\d+$/);
      expect(result.discussion.title).toBe('新讨论');
    });

    it('应该在标题为空时抛出错误', async () => {
      await expect(
        discussionService.createDiscussion({ title: '', content: '内容' }, 'user-1')
      ).rejects.toThrow('标题不能为空');
    });

    it('应该在内容为空时抛出错误', async () => {
      await expect(
        discussionService.createDiscussion({ title: '标题', content: '' }, 'user-1')
      ).rejects.toThrow('内容不能为空');
    });
  });

  describe('updateDiscussion', () => {
    it('应该更新讨论', async () => {
      db.getOne.mockResolvedValue({ author_id: 'user-1' });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.updateDiscussion(
        'disc-1',
        { title: '更新的标题' },
        'user-1',
        false
      );

      expect(result.success).toBe(true);
    });

    it('应该在讨论不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);

      await expect(
        discussionService.updateDiscussion('disc-999', { title: '标题' }, 'user-1', false)
      ).rejects.toThrow('讨论不存在');
    });

    it('应该在无权限时抛出错误', async () => {
      db.getOne.mockResolvedValue({ author_id: 'user-2' });

      await expect(
        discussionService.updateDiscussion('disc-1', { title: '标题' }, 'user-1', false)
      ).rejects.toThrow('无权限编辑此讨论');
    });

    it('应该允许管理员编辑任何讨论', async () => {
      db.getOne.mockResolvedValue({ author_id: 'user-2' });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.updateDiscussion(
        'disc-1',
        { title: '更新的标题' },
        'admin-1',
        true
      );

      expect(result.success).toBe(true);
    });
  });

  describe('deleteDiscussion', () => {
    it('应该删除讨论', async () => {
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.deleteDiscussion('disc-1');

      expect(result.success).toBe(true);
    });

    it('应该在讨论不存在时抛出错误', async () => {
      db.execute.mockResolvedValue({ rowCount: 0 });

      await expect(
        discussionService.deleteDiscussion('disc-999')
      ).rejects.toThrow('讨论不存在');
    });
  });

  describe('toggleDiscussionVisibility', () => {
    it('应该切换讨论可见性', async () => {
      db.getOne.mockResolvedValue({ is_hidden: false });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleDiscussionVisibility('disc-1');

      expect(result.success).toBe(true);
      expect(result.isHidden).toBe(true);
    });
  });

  describe('toggleDiscussionPin', () => {
    it('应该切换讨论置顶', async () => {
      db.getOne.mockResolvedValue({ is_pinned: false });
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleDiscussionPin('disc-1');

      expect(result.success).toBe(true);
      expect(result.isPinned).toBe(true);
    });
  });

  describe('getQuestionDiscussions', () => {
    it('应该返回题目相关讨论', async () => {
      db.getMany.mockResolvedValue([
        { id: 'disc-1', is_pinned: false, is_hidden: false }
      ]);

      const result = await discussionService.getQuestionDiscussions('q-1', false);

      expect(result).toHaveLength(1);
      expect(db.getMany).toHaveBeenCalledWith(
        expect.stringContaining('question_id = $1'),
        ['q-1']
      );
    });
  });

  describe('getComments', () => {
    it('应该返回评论列表', async () => {
      db.getMany.mockResolvedValue([
        { id: 'comment-1', is_deleted: false }
      ]);

      const result = await discussionService.getComments('disc-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('createComment', () => {
    it('应该创建评论', async () => {
      db.getOne
        .mockResolvedValueOnce({ id: 'disc-1', is_hidden: false }) // 讨论
        .mockResolvedValueOnce({ nickname: '测试用户' }); // 用户
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.createComment(
        'disc-1',
        { content: '评论内容' },
        'user-1',
        false
      );

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^comment-\d+$/);
    });

    it('应该在评论内容为空时抛出错误', async () => {
      await expect(
        discussionService.createComment('disc-1', { content: '' }, 'user-1', false)
      ).rejects.toThrow('评论内容不能为空');
    });

    it('应该在讨论不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);

      await expect(
        discussionService.createComment('disc-999', { content: '内容' }, 'user-1', false)
      ).rejects.toThrow('讨论不存在');
    });
  });

  describe('deleteComment', () => {
    it('应该删除评论', async () => {
      db.getOne.mockResolvedValue({
        id: 'comment-1',
        author_id: 'user-1',
        discussion_id: 'disc-1'
      });
      db.getMany.mockResolvedValue([]); // 无子评论
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.deleteComment('comment-1', 'user-1', false);

      expect(result.success).toBe(true);
    });

    it('应该在评论不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);

      await expect(
        discussionService.deleteComment('comment-999', 'user-1', false)
      ).rejects.toThrow('评论不存在');
    });

    it('应该在无权限时抛出错误', async () => {
      db.getOne.mockResolvedValue({ author_id: 'user-2' });

      await expect(
        discussionService.deleteComment('comment-1', 'user-1', false)
      ).rejects.toThrow('无权限删除此评论');
    });
  });

  describe('toggleDiscussionLike', () => {
    it('应该添加点赞', async () => {
      db.getOne.mockResolvedValue(null); // 未点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleDiscussionLike('disc-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.liked).toBe(true);
    });

    it('应该取消点赞', async () => {
      db.getOne.mockResolvedValue({ user_id: 'user-1' }); // 已点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleDiscussionLike('disc-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.liked).toBe(false);
    });
  });

  describe('toggleCommentLike', () => {
    it('应该添加点赞', async () => {
      db.getOne
        .mockResolvedValueOnce({ id: 'comment-1' }) // 评论存在
        .mockResolvedValueOnce(null); // 未点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleCommentLike('comment-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.liked).toBe(true);
    });

    it('应该取消点赞', async () => {
      db.getOne
        .mockResolvedValueOnce({ id: 'comment-1' }) // 评论存在
        .mockResolvedValueOnce({ user_id: 'user-1' }); // 已点赞
      db.execute.mockResolvedValue({ rowCount: 1 });

      const result = await discussionService.toggleCommentLike('comment-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.liked).toBe(false);
    });

    it('应该在评论不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);

      await expect(
        discussionService.toggleCommentLike('comment-999', 'user-1')
      ).rejects.toThrow('评论不存在');
    });
  });
});
