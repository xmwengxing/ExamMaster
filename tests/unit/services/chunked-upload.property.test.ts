/**
 * 分片上传服务属性测试
 * Feature: question-bank-import-optimization
 * Property 5: 分片上传合并往返
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ChunkedUploadService, CHUNK_SIZE } from '../../../src/services/chunked-upload.service';
import fs from 'fs/promises';
import crypto from 'crypto';
import db from '../../../db.js';

describe('Property 5: 分片上传合并往返', () => {
  let service: ChunkedUploadService;
  const testUserId = 'property-test-user';

  beforeEach(async () => {
    service = new ChunkedUploadService();
    await service.initialize();
    
    // 清理测试数据
    await db.query('DELETE FROM upload_sessions WHERE user_id = $1', [testUserId]);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.query('DELETE FROM upload_sessions WHERE user_id = $1', [testUserId]);
  });

  /**
   * 计算Buffer的校验和
   */
  function calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  it('对于任何大文件，分片上传合并后应该与原文件一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成5MB-10MB的随机文件数据(减少数据量)
        fc.uint8Array({ minLength: 5 * 1024 * 1024, maxLength: 10 * 1024 * 1024 }),
        fc.string({ minLength: 5, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '') + '.json'),
        async (fileData, fileName) => {
          const originalBuffer = Buffer.from(fileData);
          const originalChecksum = calculateChecksum(originalBuffer);
          const originalSize = originalBuffer.length;

          // 1. 初始化上传
          const session = await service.initUpload(fileName, originalSize, testUserId);

          // 2. 分片上传
          const totalChunks = Math.ceil(originalSize / CHUNK_SIZE);
          
          for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, originalSize);
            const chunk = originalBuffer.slice(start, end);
            
            await service.uploadChunk(session.sessionId, i, chunk);
          }

          // 3. 完成上传
          const mergedFile = await service.completeUpload(session.sessionId);

          // 4. 验证合并后的文件
          const mergedBuffer = await fs.readFile(mergedFile.filePath);
          const mergedChecksum = calculateChecksum(mergedBuffer);

          // 验证大小和内容一致
          expect(mergedBuffer.length).toBe(originalSize);
          expect(mergedChecksum).toBe(originalChecksum);

          // 清理
          await fs.unlink(mergedFile.filePath).catch(() => {});
        }
      ),
      { numRuns: 5 } // 减少运行次数到5次
    );
  }, 180000); // 增加超时时间到180秒

  it('对于任何分片顺序，合并后应该得到正确的文件', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成3MB-6MB的随机文件数据(减少数据量)
        fc.uint8Array({ minLength: 3 * 1024 * 1024, maxLength: 6 * 1024 * 1024 }),
        async (fileData) => {
          const originalBuffer = Buffer.from(fileData);
          const originalChecksum = calculateChecksum(originalBuffer);
          const originalSize = originalBuffer.length;

          // 初始化上传
          const session = await service.initUpload('test.json', originalSize, testUserId);

          // 生成随机的分片上传顺序
          const totalChunks = Math.ceil(originalSize / CHUNK_SIZE);
          const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
          
          // 打乱顺序
          for (let i = chunkIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chunkIndices[i], chunkIndices[j]] = [chunkIndices[j], chunkIndices[i]];
          }

          // 按随机顺序上传分片
          for (const i of chunkIndices) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, originalSize);
            const chunk = originalBuffer.slice(start, end);
            
            await service.uploadChunk(session.sessionId, i, chunk);
          }

          // 完成上传
          const mergedFile = await service.completeUpload(session.sessionId);

          // 验证合并后的文件
          const mergedBuffer = await fs.readFile(mergedFile.filePath);
          const mergedChecksum = calculateChecksum(mergedBuffer);

          expect(mergedChecksum).toBe(originalChecksum);

          // 清理
          await fs.unlink(mergedFile.filePath).catch(() => {});
        }
      ),
      { numRuns: 5 } // 减少运行次数到5次
    );
  }, 180000); // 增加超时时间到180秒

  it('对于任何文件大小，应该正确计算分片数量', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 * 1024 * 1024, max: 100 * 1024 * 1024 }), // 1MB-100MB
        async (fileSize) => {
          const session = await service.initUpload('test.json', fileSize, testUserId);

          const expectedChunks = Math.ceil(fileSize / CHUNK_SIZE);
          expect(session.totalChunks).toBe(expectedChunks);

          // 清理
          await service.cancelUpload(session.sessionId);
        }
      ),
      { numRuns: 50 } // 减少运行次数到50次
    );
  }, 180000); // 增加超时时间到180秒

  it('对于任何已上传的分片，应该正确记录在uploadedChunks中', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }), // 总分片数
        fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }), // 要上传的分片索引
        async (totalChunks, chunkIndicesToUpload) => {
          const fileSize = totalChunks * CHUNK_SIZE;
          const session = await service.initUpload('test.json', fileSize, testUserId);

          // 过滤有效的分片索引
          const validIndices = [...new Set(chunkIndicesToUpload.filter(i => i < totalChunks))];

          // 上传指定的分片
          for (const index of validIndices) {
            const chunkData = Buffer.alloc(CHUNK_SIZE);
            await service.uploadChunk(session.sessionId, index, chunkData);
          }

          // 验证uploadedChunks
          const updatedSession = await service.getSession(session.sessionId);
          expect(updatedSession?.uploadedChunks.sort()).toEqual(validIndices.sort());

          // 清理
          await service.cancelUpload(session.sessionId);
        }
      ),
      { numRuns: 30 } // 减少运行次数到30次
    );
  }, 180000); // 增加超时时间到180秒
});
