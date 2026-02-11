/**
 * 图片处理服务 - 单元测试
 * 
 * **验证需求: 8.2, 8.3**
 * 测试Base64格式验证、URL可访问性验证和边界情况
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ImageProcessorService } from '../../../src/services/image-processor.service';
import sharp from 'sharp';

describe('ImageProcessorService - 单元测试', () => {
  let service: ImageProcessorService;

  beforeAll(async () => {
    service = new ImageProcessorService();
    await service.initialize();
  });

  describe('Base64格式验证', () => {
    it('应该接受有效的PNG Base64格式', () => {
      const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(service.validateBase64(validBase64)).toBe(true);
    });

    it('应该接受有效的JPEG Base64格式', () => {
      const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
      expect(service.validateBase64(validBase64)).toBe(true);
    });

    it('应该接受有效的GIF Base64格式', () => {
      const validBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      expect(service.validateBase64(validBase64)).toBe(true);
    });

    it('应该接受有效的WebP Base64格式', () => {
      const validBase64 = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      expect(service.validateBase64(validBase64)).toBe(true);
    });

    it('应该拒绝无效的Base64格式 - 缺少前缀', () => {
      const invalidBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(service.validateBase64(invalidBase64)).toBe(false);
    });

    it('应该拒绝无效的Base64格式 - 错误的MIME类型', () => {
      const invalidBase64 = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
      expect(service.validateBase64(invalidBase64)).toBe(false);
    });

    it('应该拒绝无效的Base64格式 - 普通字符串', () => {
      const invalidBase64 = 'this is not a base64 string';
      expect(service.validateBase64(invalidBase64)).toBe(false);
    });

    it('应该拒绝空字符串', () => {
      expect(service.validateBase64('')).toBe(false);
    });
  });

  describe('图片大小边界测试', () => {
    it('边界情况: 99KB图片应该使用Base64', async () => {
      // 生成接近99KB的图片
      const buffer = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .jpeg({ quality: 50 })
        .toBuffer();

      // 确保大小小于100KB
      expect(buffer.length).toBeLessThan(100 * 1024);

      const result = await service.processImage(buffer, 'file');

      expect(result.type).toBe('base64');
      expect(result.data).toMatch(/^data:image\//);
      expect(result.size).toBe(buffer.length);
    });

    it('边界情况: 100KB图片应该使用URL', async () => {
      // 生成大于100KB的图片 - 使用PNG格式避免压缩
      const buffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 4,
          background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
      })
        .png({ compressionLevel: 0 }) // 不压缩
        .toBuffer();

      // 确保大小大于等于100KB
      expect(buffer.length).toBeGreaterThanOrEqual(100 * 1024);

      const result = await service.processImage(buffer, 'file');

      expect(result.type).toBe('url');
      expect(result.data).toMatch(/^\/uploads\/images\//);
      expect(result.size).toBe(buffer.length);
    });

    it('边界情况: 101KB图片应该使用URL', async () => {
      // 生成大于100KB的图片 - 使用PNG格式避免压缩
      const buffer = await sharp({
        create: {
          width: 550,
          height: 550,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 1 }
        }
      })
        .png({ compressionLevel: 0 }) // 不压缩
        .toBuffer();

      // 确保大小大于100KB
      expect(buffer.length).toBeGreaterThan(100 * 1024);

      const result = await service.processImage(buffer, 'file');

      expect(result.type).toBe('url');
      expect(result.data).toMatch(/^\/uploads\/images\//);
      expect(result.size).toBe(buffer.length);
    });
  });

  describe('图片格式检测', () => {
    it('应该正确检测JPEG格式', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .jpeg()
        .toBuffer();

      const result = await service.processImage(buffer, 'file');

      expect(result.format).toBe('jpeg');
    });

    it('应该正确检测PNG格式', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      const result = await service.processImage(buffer, 'file');

      expect(result.format).toBe('png');
    });

    it('应该正确检测WebP格式', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .webp()
        .toBuffer();

      const result = await service.processImage(buffer, 'file');

      expect(result.format).toBe('webp');
    });
  });

  describe('内容中的图片处理', () => {
    it('应该处理HTML内容中的Base64图片', async () => {
      const smallBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const content = `<p>这是一道题目</p><img src="${smallBase64}" alt="图片" />`;

      const result = await service.processImagesInContent(content);

      // 小图片应该保持Base64格式
      expect(result).toContain('data:image/png;base64');
    });

    it('应该保持没有图片的内容不变', async () => {
      const content = '<p>这是一道没有图片的题目</p>';

      const result = await service.processImagesInContent(content);

      expect(result).toBe(content);
    });
  });
});
