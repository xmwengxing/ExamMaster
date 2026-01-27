/**
 * 系统配置路由
 */

import express from 'express';
import * as configController from '../controllers/config.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 获取系统配置（公开接口，无需认证）
router.get('/', configController.getSystemConfig);

// 更新系统配置（管理员）
// 注意：必须先使用 auth 验证 JWT token，再使用 adminAuth 验证管理员权限
router.put('/', auth, adminAuth, configController.updateSystemConfig);

// 自定义字段管理（管理员）
router.post('/custom-fields', auth, adminAuth, configController.addCustomField);
router.delete('/custom-fields/:name', auth, adminAuth, configController.removeCustomField);

export default router;
