/**
 * 分片上传API路由
 */

import express from 'express';
import multer from 'multer';
// 使用简化版服务（自动创建表）
import { simpleChunkedUploadService as chunkedUploadService } from '../services/chunked-upload-simple.service.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 配置multer用于处理分片上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 单个分片最大5MB
  }
});

/**
 * POST /api/upload/init
 * 初始化上传会话
 */
router.post('/init', auth, async (req, res) => {
  try {
    const { fileName, fileSize } = req.body;
    const userId = req.user?.id || 'anonymous';

    console.log('[Upload] 初始化上传会话:', { fileName, fileSize, userId });

    if (!fileName || !fileSize) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: fileName, fileSize'
      });
    }

    // 初始化上传会话
    const session = await chunkedUploadService.initUpload(
      fileName,
      parseInt(fileSize),
      userId
    );

    console.log('[Upload] 上传会话已创建:', session.sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        totalChunks: session.totalChunks,
        chunkSize: 2 * 1024 * 1024, // 2MB
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error('[Upload] 初始化上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '初始化上传失败'
    });
  }
});

/**
 * POST /api/upload/chunk
 * 上传单个分片
 */
router.post('/chunk', auth, upload.single('chunk'), async (req, res) => {
  try {
    const { sessionId, chunkIndex } = req.body;
    const chunkData = req.file?.buffer;

    console.log('[Upload] 上传分片:', { sessionId, chunkIndex, size: chunkData?.length });

    if (!sessionId || chunkIndex === undefined || !chunkData) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: sessionId, chunkIndex, chunk'
      });
    }

    // 上传分片
    const result = await chunkedUploadService.uploadChunk(
      sessionId,
      parseInt(chunkIndex),
      chunkData
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Upload] 上传分片失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '上传分片失败'
    });
  }
});

/**
 * POST /api/upload/complete
 * 完成上传（合并分片）
 */
router.post('/complete', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log('[Upload] 完成上传:', { sessionId });

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: sessionId'
      });
    }

    // 完成上传
    const result = await chunkedUploadService.completeUpload(sessionId);

    console.log('[Upload] 上传完成:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Upload] 完成上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '完成上传失败'
    });
  }
});

/**
 * DELETE /api/upload/cancel/:sessionId
 * 取消上传
 */
router.delete('/cancel/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: sessionId'
      });
    }

    // 取消上传
    await chunkedUploadService.cancelUpload(sessionId);

    res.json({
      success: true,
      message: '上传已取消'
    });
  } catch (error) {
    console.error('取消上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消上传失败'
    });
  }
});

/**
 * GET /api/upload/session/:sessionId
 * 获取上传会话信息
 */
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: sessionId'
      });
    }

    // 获取会话信息
    const session = await chunkedUploadService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '上传会话不存在'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('获取会话信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取会话信息失败'
    });
  }
});

export default router;
