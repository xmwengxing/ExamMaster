// 报名路由
// 定义报名相关的 API 路由

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as registrationController from '../controllers/registration.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// ========== 文件上传配置 ==========

// 确保上传目录存在
const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 限制
  }
});

// ========== 频率限制中间件 ==========

// 简单的内存存储频率限制（生产环境建议使用 Redis）
const rateLimitStore = new Map();

/**
 * 报名提交频率限制中间件
 * 限制同一手机号1小时内最多提交3次报名
 */
function registrationRateLimit(req, res, next) {
  const phone = req.body.phone;
  
  if (!phone) {
    return next();
  }
  
  const key = `registration:${phone}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1小时
  const maxRequests = 3;
  
  // 获取该手机号的请求记录
  let requests = rateLimitStore.get(key) || [];
  
  // 清理过期的请求记录
  requests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // 检查是否超过限制
  if (requests.length >= maxRequests) {
    const oldestRequest = Math.min(...requests);
    const resetTime = new Date(oldestRequest + windowMs);
    
    logger.warn('[RateLimit] 报名提交频率超限', {
      phone,
      requests: requests.length,
      resetTime
    });
    
    return res.status(429).json({
      success: false,
      error: '提交过于频繁，请稍后再试',
      message: `同一手机号1小时内最多提交${maxRequests}次报名`,
      retryAfter: Math.ceil((oldestRequest + windowMs - now) / 1000)
    });
  }
  
  // 记录本次请求
  requests.push(now);
  rateLimitStore.set(key, requests);
  
  // 设置响应头
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
  res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
  
  next();
}

/**
 * API 请求频率限制中间件
 * 限制每个IP地址每分钟最多60次请求
 */
function apiRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `api:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟
  const maxRequests = 60;
  
  // 获取该IP的请求记录
  let requests = rateLimitStore.get(key) || [];
  
  // 清理过期的请求记录
  requests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // 检查是否超过限制
  if (requests.length >= maxRequests) {
    const oldestRequest = Math.min(...requests);
    const resetTime = new Date(oldestRequest + windowMs);
    
    logger.warn('[RateLimit] API请求频率超限', {
      ip,
      requests: requests.length,
      resetTime
    });
    
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((oldestRequest + windowMs - now) / 1000)
    });
  }
  
  // 记录本次请求
  requests.push(now);
  rateLimitStore.set(key, requests);
  
  // 设置响应头
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
  res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
  
  next();
}

// 定期清理过期的频率限制记录（每10分钟）
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1小时
  
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}, 10 * 60 * 1000);

// ========== 报名提交相关路由 ==========

  // 检查手机号是否已存在用户（公开访问，用于报名表单）- 必须在/:id 之前定义
  router.get('/users/check-phone', registrationController.checkPhoneExists);

  // 创建报名记录（公开访问，允许匿名提交）
  router.post('/registrations', registrationRateLimit, registrationController.createRegistration);

  // 搜索报名记录（公开访问，用于报名前搜索）
  router.get('/registrations/search', registrationController.searchRegistrations);

  // 获取单个报名记录（需要认证）
  router.get('/registrations/:id', auth, registrationController.getRegistrationById);

  // 查询报名记录列表（需要认证）
  router.get('/registrations', auth, registrationController.getRegistrations);

// 更新报名记录（需要认证）
router.put('/registrations/:id', auth, registrationController.updateRegistration);

// 删除报名记录（需要认证）
router.delete('/registrations/:id', auth, registrationController.deleteRegistration);

// ========== 文档生成和下载路由 ==========

// 下载单个报名文档（需要认证）
router.get('/registrations/:id/document', auth, registrationController.downloadDocument);

// 批量下载报名文档（需要认证）
router.post('/registrations/batch-download', auth, registrationController.batchDownloadDocuments);

// ========== 专业对照表管理路由 ==========

// 获取专业对照表（公开访问，用于报名表单和管理后台查询）
router.get('/major-mappings', registrationController.getMajorMappings);

// 创建专业对照记录（需要管理员权限）
router.post('/major-mappings', auth, adminAuth, registrationController.createMajorMapping);

// 更新专业对照记录（需要管理员权限）
router.put('/major-mappings/:id', auth, adminAuth, registrationController.updateMajorMapping);

// 删除专业对照记录（需要管理员权限）
router.delete('/major-mappings/:id', auth, adminAuth, registrationController.deleteMajorMapping);

// 导入专业对照表（需要管理员权限 + 文件上传）
router.post('/major-mappings/import', auth, adminAuth, upload.single('file'), registrationController.importMajorMappings);

// ========== 职业工种清单路由 ==========

// 获取职业工种清单（公开访问，用于报名表单）
router.get('/occupations', registrationController.getOccupations);

// 获取职业的工种方向列表（公开访问，用于报名表单）
router.get('/occupations/:occupation/directions', registrationController.getOccupationDirections);

// 检查专业匹配规则（公开访问，用于报名表单）
  router.post('/registrations/check-major-match', registrationController.checkMajorMatch);

  // 导入职业工种清单（需要管理员权限 + 文件上传）
router.post('/occupations/import', auth, adminAuth, upload.single('file'), registrationController.importOccupations);

// ========== 职业工种管理路由（CRUD）==========

// 获取职业工种列表（需要管理员权限）
router.get('/occupation-list', auth, adminAuth, registrationController.getOccupationList);

// 创建职业工种记录（需要管理员权限）
router.post('/occupation-list', auth, adminAuth, registrationController.createOccupation);

// 更新职业工种记录（需要管理员权限）
router.put('/occupation-list/:id', auth, adminAuth, registrationController.updateOccupation);

// 删除职业工种记录（需要管理员权限）
router.delete('/occupation-list/:id', auth, adminAuth, registrationController.deleteOccupation);

// ========== 账户生成路由 ==========

// 从单个报名记录生成学员账户（需要管理员权限）
router.post('/registrations/:id/create-account', auth, adminAuth, registrationController.createAccountFromRegistration);

// 批量生成学员账户（需要管理员权限）
router.post('/registrations/batch-create-accounts', auth, adminAuth, registrationController.batchCreateAccounts);

// ========== 应用全局 API 频率限制 ==========

// 对所有路由应用 API 频率限制
router.use(apiRateLimit);

export default router;
