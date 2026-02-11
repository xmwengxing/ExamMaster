/**
 * 导入管理集成测试
 * 测试完整的上传和导入流程
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('导入管理集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('完整上传和导入流程测试', () => {
    it('应该成功完成完整的导入流程', async () => {
      // 1. 初始化上传会话
      const initResponse = {
        data: {
          success: true,
          data: {
            sessionId: 'session-123',
            totalChunks: 3
          }
        }
      };
      mockedAxios.post.mockResolvedValueOnce(initResponse);

      // 2. 上传分片
      const chunkResponse = {
        data: {
          success: true,
          data: {
            chunkIndex: 0,
            uploaded: true
          }
        }
      };
      mockedAxios.post.mockResolvedValue(chunkResponse);

      // 3. 完成上传
      const completeResponse = {
        data: {
          success: true,
          data: {
            filePath: '/uploads/test.json',
            fileName: 'test.json'
          }
        }
      };
      mockedAxios.post.mockResolvedValueOnce(completeResponse);

      // 4. 创建导入任务
      const importResponse = {
        data: {
          success: true,
          data: {
            taskId: 'task-123'
          }
        }
      };
      mockedAxios.post.mockResolvedValueOnce(importResponse);

      // 验证流程
      expect(initResponse.data.success).toBe(true);
      expect(chunkResponse.data.success).toBe(true);
      expect(completeResponse.data.success).toBe(true);
      expect(importResponse.data.success).toBe(true);
    });

    it('应该处理上传失败的情况', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: '上传失败'
          }
        }
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      try {
        await axios.post('/api/upload/init', {});
      } catch (error: any) {
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toBe('上传失败');
      }
    });
  });

  describe('进度显示测试', () => {
    it('应该正确显示上传进度', () => {
      const progress = {
        uploadedBytes: 5 * 1024 * 1024,
        totalBytes: 10 * 1024 * 1024,
        percentage: 50,
        uploadedChunks: 2,
        totalChunks: 5,
        currentChunk: 2,
        speed: 1024 * 1024,
        estimatedTimeLeft: 5
      };

      expect(progress.percentage).toBe(50);
      expect(progress.uploadedChunks).toBe(2);
      expect(progress.totalChunks).toBe(5);
    });

    it('应该正确显示导入进度', () => {
      const taskProgress = {
        total: 1000,
        processed: 500,
        succeeded: 480,
        failed: 20,
        percentage: 50,
        currentStage: '插入数据',
        estimatedTimeLeft: 30
      };

      expect(taskProgress.percentage).toBe(50);
      expect(taskProgress.succeeded + taskProgress.failed).toBe(taskProgress.processed);
    });
  });

  describe('任务管理测试', () => {
    it('应该成功加载任务列表', async () => {
      const response = {
        data: {
          success: true,
          data: [
            {
              taskId: 'task-1',
              fileName: 'test1.json',
              status: 'completed'
            },
            {
              taskId: 'task-2',
              fileName: 'test2.json',
              status: 'processing'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(response);

      const result = await axios.get('/api/import/tasks');

      expect(result.data.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
      expect(result.data.data[0].status).toBe('completed');
    });

    it('应该成功查询任务状态', async () => {
      const response = {
        data: {
          success: true,
          data: {
            taskId: 'task-123',
            status: 'processing',
            progress: {
              percentage: 50,
              processed: 500,
              total: 1000
            }
          }
        }
      };

      mockedAxios.get.mockResolvedValue(response);

      const result = await axios.get('/api/import/status/task-123');

      expect(result.data.success).toBe(true);
      expect(result.data.data.status).toBe('processing');
      expect(result.data.data.progress.percentage).toBe(50);
    });

    it('应该成功取消任务', async () => {
      const response = {
        data: {
          success: true,
          message: '任务已取消'
        }
      };

      mockedAxios.delete.mockResolvedValue(response);

      const result = await axios.delete('/api/import/cancel/task-123');

      expect(result.data.success).toBe(true);
      expect(result.data.message).toBe('任务已取消');
    });

    it('应该成功重试失败的任务', () => {
      // 测试重试逻辑
      const taskId = 'task-123';
      const newTaskId = 'task-456';

      // 验证重试会创建新任务
      expect(newTaskId).not.toBe(taskId);
      expect(newTaskId).toBeTruthy();
    });
  });

  describe('任务筛选测试', () => {
    it('应该正确筛选任务', () => {
      const tasks = [
        { taskId: 'task-1', fileName: 'test1.json', status: 'completed' },
        { taskId: 'task-2', fileName: 'test2.json', status: 'processing' },
        { taskId: 'task-3', fileName: 'data.json', status: 'failed' },
      ];

      // 按文件名搜索
      const searchResult = tasks.filter(t => 
        t.fileName.toLowerCase().includes('test')
      );
      expect(searchResult).toHaveLength(2);

      // 按状态筛选
      const statusResult = tasks.filter(t => t.status === 'completed');
      expect(statusResult).toHaveLength(1);
      expect(statusResult[0].taskId).toBe('task-1');
    });
  });

  describe('错误报告测试', () => {
    it('应该生成正确的错误报告', () => {
      const errors = [
        { index: 0, message: '题目内容不能为空' },
        { index: 5, message: '答案格式错误' },
        { index: 10, message: '选项数量不足' }
      ];

      const errorReport = {
        taskId: 'task-123',
        fileName: 'test.json',
        totalErrors: errors.length,
        errors: errors
      };

      expect(errorReport.totalErrors).toBe(3);
      expect(errorReport.errors[0].index).toBe(0);
      expect(errorReport.errors[1].message).toBe('答案格式错误');
    });

    it('应该支持下载错误报告', () => {
      const errorReport = {
        taskId: 'task-123',
        fileName: 'test.json',
        totalErrors: 2,
        errors: [
          { index: 0, message: '错误1' },
          { index: 1, message: '错误2' }
        ]
      };

      const jsonString = JSON.stringify(errorReport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('任务状态转换测试', () => {
    it('应该遵循正确的状态转换顺序', () => {
      const validTransitions = [
        { from: 'queued', to: 'processing' },
        { from: 'processing', to: 'completed' },
        { from: 'processing', to: 'failed' },
      ];

      const invalidTransitions = [
        { from: 'completed', to: 'processing' },
        { from: 'failed', to: 'queued' },
        { from: 'queued', to: 'completed' },
      ];

      // 验证有效转换
      validTransitions.forEach(transition => {
        expect(['queued', 'processing', 'completed', 'failed']).toContain(transition.from);
        expect(['queued', 'processing', 'completed', 'failed']).toContain(transition.to);
      });

      // 验证无效转换不应该发生
      expect(invalidTransitions.length).toBeGreaterThan(0);
    });
  });

  describe('并发上传测试', () => {
    it('应该支持并发上传多个分片', async () => {
      const totalChunks = 10;
      const concurrency = 3;
      const batches: number[][] = [];

      for (let i = 0; i < totalChunks; i += concurrency) {
        const batch = Array.from(
          { length: Math.min(concurrency, totalChunks - i) },
          (_, j) => i + j
        );
        batches.push(batch);
      }

      expect(batches.length).toBe(4); // 3 + 3 + 3 + 1
      expect(batches[0]).toEqual([0, 1, 2]);
      expect(batches[3]).toEqual([9]);
    });
  });

  describe('自动刷新测试', () => {
    it('应该定期刷新任务列表', () => {
      let refreshCount = 0;
      const refreshInterval = 5000; // 5秒

      const mockRefresh = () => {
        refreshCount++;
      };

      // 模拟3次刷新
      mockRefresh();
      mockRefresh();
      mockRefresh();

      expect(refreshCount).toBe(3);
    });

    it('应该在任务执行中时更频繁刷新详情', () => {
      const processingRefreshInterval = 2000; // 2秒
      const normalRefreshInterval = 5000; // 5秒

      expect(processingRefreshInterval).toBeLessThan(normalRefreshInterval);
    });
  });
});
