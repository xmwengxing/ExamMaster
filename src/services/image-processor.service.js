/**
 * 图片处理服务
 * 根据图片大小自动选择Base64或URL存储方式
 */

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// 图片大小阈值: 100KB
const IMAGE_SIZE_THRESHOLD = 100 * 1024;

// 上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'images');

export class ImageProcessorService {
  /**
   * 初始化上传目录
   */
  async initialize() {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('创建上传目录失败:', error);
    }
  }

  /**
   * 处理图片并返回存储格式
   * @param imageData 图片数据(Buffer或URL字符串)
   * @param sourceType 来源类型('file'或'url')
   */
  async processImage(imageData, sourceType) {
    let buffer;

    // 1. 获取图片数据
    if (sourceType === 'url') {
      buffer = await this.downloadImage(imageData);
    } else {
      buffer = imageData;
    }

    // 2. 检测图片格式
    const metadata = await sharp(buffer).metadata();
    const format = metadata.format || 'jpg';

    // 3. 根据大小选择存储方式
    if (buffer.length < IMAGE_SIZE_THRESHOLD) {
      // 小图片: 转换为Base64
      const base64 = buffer.toString('base64');
      return {
        type: 'base64',
        data: `data:image/${format};base64,${base64}`,
        size: buffer.length,
        format
      };
    } else {
      // 大图片: 上传到文件服务器并返回URL
      const url = await this.uploadToStorage(buffer, format);
      return {
        type: 'url',
        data: url,
        size: buffer.length,
        format
      };
    }
  }

  /**
   * 验证Base64图片格式
   */
  validateBase64(base64String) {
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    return base64Regex.test(base64String);
  }

  /**
   * 验证URL图片可访问性
   */
  async validateImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      return false;
    }
  }

  /**
   * 从URL下载图片
   */
  async downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 上传图片到存储服务器
   */
  async uploadToStorage(buffer, format) {
    // 压缩图片
    const compressed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 生成唯一文件名
    const filename = `${uuidv4()}.${format}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 保存文件
    await fs.writeFile(filePath, compressed);

    // 返回URL (这里假设有一个静态文件服务)
    return `/uploads/images/${filename}`;
  }

  /**
   * 从题目内容中提取并处理图片
   */
  async processImagesInContent(content) {
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;
    let processedContent = content;

    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];

      // 如果是Base64且过大,转换为URL
      if (src.startsWith('data:image') && src.length > IMAGE_SIZE_THRESHOLD) {
        try {
          const base64Data = src.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const processed = await this.processImage(buffer, 'file');
          
          if (processed.type === 'url') {
            processedContent = processedContent.replace(src, processed.data);
          }
        } catch (error) {
          console.error('处理图片失败:', error);
        }
      }
    }

    return processedContent;
  }
}

// 导出单例
export const imageProcessorService = new ImageProcessorService();
