/**
 * 图片处理服务 - 属性测试
 * 
 * **验证需求: 1.1, 1.2, 1.3**
 * 
 * 属性 1: 图片大小决定存储方式
 * - 小于100KB的图片应该使用Base64编码
 * - 大于等于100KB的图片应该使用URL存储
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { ImageProcessorService } from '../../../src/services/image-processor.service';
import sharp from 'sharp';

describe('ImageProcessorService - 属性测试', () => {
  let service: ImageProcessorService;

  beforeAll(async () => {
    service = new ImageProcessorService();
    await service.initialize();
  });

  /**
   * 属性 1: 图片大小决定存储方式
   * **验证需求: 1.1, 1.2, 1.3**
   */
  it('属性1: 图片大小决定存储方式 - 小于100KB使用Base64，大于等于100KB使用URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成不同大小的图片
        fc.record({
          width: fc.integer({ min: 10, max: 2000 }),
          height: fc.integer({ min: 10, max: 2000 }),
          quality: fc.integer({ min: 1, max: 100 })
        }),
        async ({ width, height, quality }) => {
          // 生成测试图片
          const buffer = await sharp({
            create: {
              width,
              height,
              channels: 3,
              background: { r: 255, g: 0, b: 0 }
            }
          })
            .jpeg({ quality })
            .toBuffer();

          const size = buffer.length;
          const threshold = 100 * 1024; // 100KB

          // 处理图片
          const result = await service.processImage(buffer, 'file');

          // 验证属性: 大小决定存储方式
          if (size < threshold) {
            // 小图片应该使用Base64
            expect(result.type).toBe('base64');
            expect(result.data).toMatch(/^data:image\//);
          } else {
            // 大图片应该使用URL
            expect(result.type).toBe('url');
            expect(result.data).toMatch(/^\/uploads\/images\//);
          }

          // 验证返回的大小信息正确
          expect(result.size).toBe(size);
          expect(result.format).toBeTruthy();
        }
      ),
      { numRuns: 50 } // 运行50次测试
    );
  });

  /**
   * 属性 2: Base64验证的正确性
   * **验证需求: 8.2**
   */
  it('属性2: Base64验证应该正确识别有效和无效的Base64字符串', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // 生成有效的Base64格式
          fc.constantFrom(
            'data:image/png;base64,',
            'data:image/jpg;base64,',
            'data:image/jpeg;base64,',
            'data:image/gif;base64,',
            'data:image/webp;base64,'
          ).chain(prefix =>
            fc.string({ minLength: 10, maxLength: 100 }).map(str => 
              prefix + Buffer.from(str).toString('base64')
            )
          ),
          // 生成无效的格式
          fc.string({ minLength: 1, maxLength: 100 })
        ),
        (input) => {
          const isValid = service.validateBase64(input);
          const shouldBeValid = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/.test(input);
          
          // 验证属性: 验证结果应该与正则表达式匹配结果一致
          expect(isValid).toBe(shouldBeValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 3: 图片格式检测的一致性
   * **验证需求: 1.1**
   */
  it('属性3: 处理后的图片格式应该与原始格式一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 200 }),
          height: fc.integer({ min: 50, max: 200 })
        }),
        async ({ width, height }) => {
          // 生成小图片（确保使用Base64）
          const buffer = await sharp({
            create: {
              width,
              height,
              channels: 3,
              background: { r: 0, g: 255, b: 0 }
            }
          })
            .jpeg({ quality: 80 })
            .toBuffer();

          const result = await service.processImage(buffer, 'file');

          // 验证属性: 格式应该被正确检测
          expect(result.format).toBe('jpeg');
          expect(result.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 30 }
    );
  });
});
