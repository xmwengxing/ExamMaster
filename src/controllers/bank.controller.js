// 题库控制器
// 处理题库相关的 HTTP 请求

import * as bankService from '../services/bank.service.js';
import logger from '../../utils/logger.js';

/**
 * 获取所有题库
 * 学员只能看到授权的题库，管理员可以看到所有题库
 */
export async function getAllBanks(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const banks = await bankService.getAllBanks(req.db, { page, pageSize });
    
    // 如果是学员，只返回授权的题库
    if (req.user.role === 'STUDENT') {
      // 从数据库查询学员的授权题库列表
      const userRow = await req.db.getOne(
        'SELECT allowed_bank_ids FROM users WHERE id = $1',
        [req.user.id]
      );
      
      const allowedBankIds = userRow?.allowed_bank_ids || [];
      const filteredBanks = banks.filter(bank => allowedBankIds.includes(bank.id));
      
      logger.info('[Banks] 学员获取题库列表:', {
        userId: req.user.id,
        totalBanks: banks.length,
        allowedBanks: filteredBanks.length,
        allowedBankIds: allowedBankIds
      });
      
      return res.json(filteredBanks);
    }
    
    // 管理员返回所有题库
    logger.info('[Banks] 管理员获取题库列表:', {
      userId: req.user.id,
      totalBanks: banks.length
    });
    
    res.json(banks);
  } catch (error) {
    logger.error('[Banks] 获取题库列表失败:', error);
    next(error);
  }
}

/**
 * 根据 ID 获取题库
 */
export async function getBankById(req, res, next) {
  try {
    const bank = await bankService.getBankById(req.db, req.params.id);
    
    if (!bank) {
      return res.status(404).json({ error: '题库不存在' });
    }
    
    res.json(bank);
  } catch (error) {
    logger.error('[Banks] 获取题库失败:', error);
    next(error);
  }
}

/**
 * 创建题库（管理员）
 */
export async function createBank(req, res, next) {
  try {
    const bankData = {
      name: req.body.name,
      category: req.body.category,
      level: req.body.level,
      description: req.body.description,
      questionCount: 0,
      scoreConfig: req.body.scoreConfig || {},
      usageCount: 0
    };
    
    const bankId = await bankService.createBank(req.db, bankData);
    
    logger.info('[Banks] 题库创建成功:', { bankId, name: bankData.name });
    res.json({ success: true, id: bankId });
  } catch (error) {
    logger.error('[Banks] 创建题库失败:', error);
    next(error);
  }
}

/**
 * 更新题库（管理员）
 */
export async function updateBank(req, res, next) {
  try {
    const updates = {};
    
    // 只更新提供的字段
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.level !== undefined) updates.level = req.body.level;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.scoreConfig !== undefined) updates.score_config = req.body.scoreConfig;
    
    await bankService.updateBank(req.db, req.params.id, updates);
    
    logger.info('[Banks] 题库更新成功:', { bankId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Banks] 更新题库失败:', error);
    next(error);
  }
}

/**
 * 删除题库（管理员）
 */
export async function deleteBank(req, res, next) {
  try {
    await bankService.deleteBank(req.db, req.params.id);
    
    logger.info('[Banks] 题库删除成功:', { bankId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Banks] 删除题库失败:', error);
    next(error);
  }
}

/**
 * 更新题库分值配置（管理员）
 */
export async function updateBankScoreConfig(req, res, next) {
  try {
    const { scoreConfig } = req.body;
    
    await bankService.updateBankScoreConfig(req.db, req.params.id, scoreConfig);
    
    logger.info('[Banks] 分值配置更新成功:', { bankId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[Banks] 更新分值配置失败:', error);
    next(error);
  }
}

