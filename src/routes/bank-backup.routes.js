/**
 * 题库备份和恢复路由
 */

import express from 'express';
import multer from 'multer';
import {
  exportBankToSQL,
  importBankFromSQL,
  validateSQLFile
} from '../services/bank-backup.service.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// 配置文件上传（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许 .sql 文件
    if (file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('只支持 .sql 文件'));
    }
  }
});

/**
 * 导出题库为 SQL 文件
 * GET /api/admin/banks/:bankId/export
 */
router.get('/:bankId/export', async (req, res) => {
  try {
    const { bankId } = req.params;
    
    logger.info('开始导出题库', { bankId, operatorId: req.user.id });
    
    // 生成 SQL 内容
    const sqlContent = await exportBankToSQL(bankId);
    
    // 设置响应头，触发下载
    const filename = `bank_${bankId}_${Date.now()}.sql`;
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(sqlContent, 'utf8'));
    
    res.send(sqlContent);
    
    logger.info('题库导出成功', { bankId, filename });
  } catch (error) {
    logger.error('题库导出失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * 验证 SQL 文件
 * POST /api/admin/banks/validate-sql
 */
router.post('/validate-sql', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传 SQL 文件' });
    }
    
    const sqlContent = req.file.buffer.toString('utf8');
    const validation = validateSQLFile(sqlContent);
    
    res.json(validation);
  } catch (error) {
    logger.error('SQL 文件验证失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * 导入题库从 SQL 文件
 * POST /api/admin/banks/import
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传 SQL 文件' });
    }
    
    const sqlContent = req.file.buffer.toString('utf8');
    const { generateNewIds, newBankName } = req.body;
    
    logger.info('开始导入题库', {
      operatorId: req.user.id,
      filename: req.file.originalname,
      generateNewIds: generateNewIds === 'true',
      newBankName
    });
    
    // 先验证文件
    const validation = validateSQLFile(sqlContent);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // 导入题库
    const result = await importBankFromSQL(sqlContent, {
      generateNewIds: generateNewIds === 'true',
      newBankName: newBankName || null
    });
    
    res.json({
      success: true,
      ...result
    });
    
    logger.info('题库导入成功', result);
  } catch (error) {
    logger.error('题库导入失败', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
