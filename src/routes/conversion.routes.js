/**
 * 题库转换API路由
 */

import express from 'express';
import multer from 'multer';
import { webConversionService } from '../services/web-conversion.service.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// 配置文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式,请上传Excel或Word文件'));
    }
  }
});

/**
 * POST /api/convert/upload
 * 上传文件并转换
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }

    // 读取文件
    const fileBuffer = await fs.readFile(req.file.path);
    const file = new File([fileBuffer], req.file.originalname);

    // 解析文件
    const parsed = await webConversionService.parseFile(file);

    // 转换为JSON
    const json = webConversionService.convertToJSON(parsed);

    // 验证
    const validation = webConversionService.validateJSON(json);

    // 清理临时文件
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        questions: json.questions,
        metadata: json.metadata
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors
      }
    });
  } catch (error) {
    console.error('转换失败:', error);
    
    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // 忽略清理错误
      }
    }

    res.status(500).json({
      success: false,
      message: '转换失败',
      error: error.message
    });
  }
});

/**
 * POST /api/convert/download
 * 下载转换后的JSON
 */
router.post('/download', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目数据'
      });
    }

    const json = {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        totalQuestions: questions.length,
        source: 'web-converter'
      },
      questions
    };

    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.json');

    res.json(json);
  } catch (error) {
    console.error('下载失败:', error);
    res.status(500).json({
      success: false,
      message: '下载失败',
      error: error.message
    });
  }
});

/**
 * POST /api/convert/validate
 * 验证题目数据
 */
router.post('/validate', async (req, res) => {
  try {
    const json = req.body;

    const validation = webConversionService.validateJSON(json);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({
      success: false,
      message: '验证失败',
      error: error.message
    });
  }
});

export default router;