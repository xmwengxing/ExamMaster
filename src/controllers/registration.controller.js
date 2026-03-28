// 报名控制器
// 处理报名相关的 HTTP 请求和响应

import registrationService from '../services/registration.service.js';
import documentGenerator from '../services/document-generator.service.js';
import validationService from '../services/validation.service.js';
import logger from '../../utils/logger.js';
import path from 'path';
import fs from 'fs';

/**
 * 创建报名记录
 */
export async function createRegistration(req, res, next) {
  try {
    logger.info('[Registration] 创建报名记录请求', {
      type: req.body.type,
      name: req.body.name
    });

    // 如果是匿名用户，created_by 为 null
    const createdById = req.user ? req.user.id : null;

    const registration = await registrationService.createRegistration(
      req.db,
      req.body,
      createdById
    );

    logger.info('[Registration] 报名记录创建成功', { 
      registrationId: registration.id 
    });

    res.status(201).json({
      success: true,
      data: registration,
      message: registration.document_generation_failed 
        ? '报名已提交，但文档生成失败，请联系管理员' 
        : '报名提交成功'
    });
  } catch (error) {
    logger.error('[Registration] 创建报名记录失败', { 
      error: error.message,
      body: req.body 
    });
    next(error);
  }
}

/**
 * 根据ID获取报名记录
 */
export async function getRegistrationById(req, res, next) {
  try {
    const { id } = req.params;

    logger.debug('[Registration] 获取报名记录', { id });

    const registration = await registrationService.getRegistrationById(
      req.db,
      id,
      req.user.id,
      req.user.role
    );

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        error: '报名记录不存在或无权访问' 
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    logger.error('[Registration] 获取报名记录失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 查询报名记录列表
 */
export async function getRegistrations(req, res, next) {
  try {
    logger.debug('[Registration] 查询报名记录列表', { query: req.query });

    const filters = {
      type: req.query.type,
      status: req.query.status,
      name: req.query.name,
      phone: req.query.phone,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 30
    };

    const result = await registrationService.getRegistrations(
      req.db,
      filters,
      req.user.id,
      req.user.role
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('[Registration] 查询报名记录列表失败', { 
      error: error.message,
      query: req.query 
    });
    next(error);
  }
}

/**
 * 更新报名记录
 */
export async function updateRegistration(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[Registration] 更新报名记录', { id });

    const registration = await registrationService.updateRegistration(
      req.db,
      id,
      req.body,
      req.user.id,
      req.user.role
    );

    logger.info('[Registration] 报名记录更新成功', { id });

    res.json({
      success: true,
      data: registration,
      message: '报名记录更新成功'
    });
  } catch (error) {
    logger.error('[Registration] 更新报名记录失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 删除报名记录
 */
export async function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[Registration] 删除报名记录', { id });

    await registrationService.deleteRegistration(
      req.db,
      id,
      req.user.id,
      req.user.role
    );

    logger.info('[Registration] 报名记录删除成功', { id });

    res.json({
      success: true,
      message: '报名记录删除成功'
    });
  } catch (error) {
    logger.error('[Registration] 删除报名记录失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 下载报名文档
 */
export async function downloadDocument(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[Registration] 下载报名文档', { id });

    // 获取报名记录
    const registration = await registrationService.getRegistrationById(
      req.db,
      id,
      req.user.id,
      req.user.role
    );

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        error: '报名记录不存在或无权访问' 
      });
    }

// 如果文档路径不存在，尝试重新生成
    let filePath = registration.document_path;
    
    if (!filePath) {
      logger.info('[Registration] 文档不存在，尝试重新生成', { id });
      try {
// 动态导入文档生成服务
      const documentGenerator = await import('../services/document-generator.service.js');
        let documentPath;
        
        if (registration.type === 'EDUCATION') {
          documentPath = await documentGenerator.default.generateEducationExcel(registration);
        } else if (registration.type === 'VOCATIONAL') {
          documentPath = await documentGenerator.default.generateVocationalDocx(registration);
        }
        
        if (documentPath) {
          // 更新数据库中的文档路径
          await req.db.execute(
            'UPDATE registrations SET document_path = $1 WHERE id = $2',
            [documentPath, id]
          );
          filePath = documentPath;
        } else {
          return res.status(500).json({
            success: false,
            error: '文档生成失败'
          });
        }
      } catch (genError) {
        logger.error('[Registration] 重新生成文档失败', {
          id,
          error: genError.message
        });
        return res.status(500).json({
          success: false,
          error: '文档生成失败：' + genError.message
        });
      }
    }

    // 构建文件路径
    const fullPath = path.join(process.cwd(), filePath.substring(1));

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      logger.error('[Registration] 文档文件不存在', {
        id,
        filePath
      });
      return res.status(404).json({
        success: false,
        error: '文档文件不存在'
      });
    }

// 设置响应头
    const fileName = path.basename(fullPath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    res.sendFile(fullPath, (err) => {
      if (err) {
        logger.error('[Registration] 文档下载失败', {
          error: err.message,
          id,
          filePath
        });
        next(err);
      } else {
        logger.info('[Registration] 文档下载成功', { id });
      }
    });
  } catch (error) {
    logger.error('[Registration] 下载报名文档失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 批量下载报名文档
 */
export async function batchDownloadDocuments(req, res, next) {
  try {
    const { registrationIds, type } = req.body;

    logger.info('[Registration] 批量下载报名文档', { 
      count: registrationIds?.length,
      type 
    });

    // 验证参数
    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '请提供报名记录ID数组' 
      });
    }

    if (!type || !['EDUCATION', 'VOCATIONAL'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: '请提供有效的报名类型' 
      });
    }

    // 限制批量操作数量
    if (registrationIds.length > 100) {
      return res.status(400).json({ 
        success: false,
        error: '单次最多下载100个文档' 
      });
    }

    // 生成批量文档压缩包
    const zipPath = await documentGenerator.generateBatchDocuments(
      req.db,
      registrationIds,
      type
    );

    // 构建文件路径
    const filePath = path.join(process.cwd(), zipPath.substring(1));

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      logger.error('[Registration] 压缩包文件不存在', { filePath });
      return res.status(404).json({ 
        success: false,
        error: '压缩包生成失败' 
      });
    }

    // 设置响应头
    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/zip');

    // 发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error('[Registration] 批量下载失败', { 
          error: err.message,
          filePath 
        });
        next(err);
      } else {
        logger.info('[Registration] 批量下载成功', { 
          count: registrationIds.length 
        });
        
        // 下载完成后删除临时文件
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              logger.debug('[Registration] 临时压缩包已删除', { filePath });
            }
          } catch (cleanupError) {
            logger.warn('[Registration] 清理临时文件失败', { 
              error: cleanupError.message,
              filePath 
            });
          }
        }, 5000);
      }
    });
  } catch (error) {
    logger.error('[Registration] 批量下载报名文档失败', { 
      error: error.message,
      body: req.body 
    });
    next(error);
  }
}

/**
 * 获取专业对照表
 */
export async function getMajorMappings(req, res, next) {
  try {
    const { occupation } = req.query;

    logger.debug('[MajorMapping] 获取专业对照表', { occupation });

    if (!occupation) {
      return res.status(400).json({ 
        success: false,
        error: '请提供职业名称' 
      });
    }

    const mappings = await registrationService.getMajorMappingsByOccupation(
      req.db,
      occupation
    );

    res.json({
      success: true,
      data: mappings
    });
  } catch (error) {
    logger.error('[MajorMapping] 获取专业对照表失败', { 
      error: error.message,
      occupation: req.query.occupation 
    });
    next(error);
  }
}

/**
 * 创建专业对照记录
 */
export async function createMajorMapping(req, res, next) {
  try {
    logger.info('[MajorMapping] 创建专业对照记录', { 
      occupation: req.body.occupation,
      major_name: req.body.major_name 
    });

    // 验证必填字段
    if (!req.body.occupation || !req.body.major_name) {
      return res.status(400).json({ 
        success: false,
        error: '职业名称和专业名称为必填字段' 
      });
    }

    const mapping = await registrationService.createMajorMapping(
      req.db,
      req.body
    );

    logger.info('[MajorMapping] 专业对照记录创建成功', { 
      id: mapping.id 
    });

    res.status(201).json({
      success: true,
      data: mapping,
      message: '专业对照记录创建成功'
    });
  } catch (error) {
    logger.error('[MajorMapping] 创建专业对照记录失败', { 
      error: error.message,
      body: req.body 
    });
    next(error);
  }
}

/**
 * 更新专业对照记录
 */
export async function updateMajorMapping(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[MajorMapping] 更新专业对照记录', { id });

    const mapping = await registrationService.updateMajorMapping(
      req.db,
      id,
      req.body
    );

    logger.info('[MajorMapping] 专业对照记录更新成功', { id });

    res.json({
      success: true,
      data: mapping,
      message: '专业对照记录更新成功'
    });
  } catch (error) {
    logger.error('[MajorMapping] 更新专业对照记录失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 删除专业对照记录
 */
export async function deleteMajorMapping(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[MajorMapping] 删除专业对照记录', { id });

    await registrationService.deleteMajorMapping(req.db, id);

    logger.info('[MajorMapping] 专业对照记录删除成功', { id });

    res.json({
      success: true,
      message: '专业对照记录删除成功'
    });
  } catch (error) {
    logger.error('[MajorMapping] 删除专业对照记录失败', { 
      error: error.message,
      id: req.params.id 
    });
    next(error);
  }
}

/**
 * 导入专业对照表
 */
export async function importMajorMappings(req, res, next) {
  try {
    const { occupation } = req.body;
    const file = req.file;

    logger.info('[MajorMapping] 导入专业对照表', { 
      occupation,
      fileName: file?.originalname 
    });

    // 验证参数
    if (!occupation) {
      return res.status(400).json({ 
        success: false,
        error: '请提供职业名称' 
      });
    }

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: '请上传Excel文件' 
      });
    }

    // 导入数据
    const result = await registrationService.importMajorMappingsFromExcel(
      req.db,
      file.path,
      occupation
    );

    // 删除临时文件
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (cleanupError) {
      logger.warn('[MajorMapping] 清理临时文件失败', { 
        error: cleanupError.message,
        filePath: file.path 
      });
    }

    logger.info('[MajorMapping] 专业对照表导入完成', { 
      occupation,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length 
    });

    res.json({
      success: true,
      data: result,
      message: `导入完成：成功${result.imported}条，跳过${result.skipped}条，失败${result.errors.length}条`
    });
  } catch (error) {
    logger.error('[MajorMapping] 导入专业对照表失败', { 
      error: error.message,
      occupation: req.body.occupation 
    });
    next(error);
  }
}

/**
 * 获取职业工种清单
 */
export async function getOccupations(req, res, next) {
  try {
    const { search } = req.query;

    logger.debug('[Occupation] 获取职业工种清单', { search });

    const occupations = await registrationService.getOccupations(
      req.db,
      search
    );

    res.json({
      success: true,
      data: occupations
    });
  } catch (error) {
    logger.error('[Occupation] 获取职业工种清单失败', { 
      error: error.message,
      search: req.query.search 
    });
    next(error);
  }
}

/**
 * 获取职业的工种方向列表
 */
export async function getOccupationDirections(req, res, next) {
  try {
    const { occupation } = req.params;

    logger.debug('[Occupation] 获取工种方向列表', { occupation });

    const directions = await registrationService.getOccupationDirections(
      req.db,
      occupation
    );

    res.json({
      success: true,
      data: directions
    });
  } catch (error) {
    logger.error('[Occupation] 获取工种方向列表失败', { 
      error: error.message,
      occupation: req.params.occupation 
    });
    next(error);
  }
}

/**
 * 检查专业匹配规则
 */
export async function checkMajorMatch(req, res, next) {
  try {
    const { occupation, major, education } = req.body;

    logger.debug('[MajorMatch] 检查专业匹配', { occupation, major, education });

    // 验证参数
    if (!occupation || !major || !education) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：occupation, major, education'
      });
    }

    // 调用服务层检查匹配
    const result = await registrationService.checkMajorMatch(
      req.db,
      occupation,
      major,
      education
    );

    res.json({
      success: true,
      level4Match: result.level4Match,
      level3Match: result.level3Match
    });
  } catch (error) {
    logger.error('[MajorMatch] 检查专业匹配失败', { 
      error: error.message,
      body: req.body 
    });
    next(error);
  }
}

/**
 * 导入职业工种清单
 */
export async function importOccupations(req, res, next) {
  try {
    const file = req.file;

    logger.info('[Occupation] 导入职业工种清单', { 
      fileName: file?.originalname 
    });

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: '请上传Excel文件' 
      });
    }

    // 导入数据
    const result = await registrationService.importOccupationsFromExcel(
      req.db,
      file.path
    );

    // 删除临时文件
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (cleanupError) {
      logger.warn('[Occupation] 清理临时文件失败', { 
        error: cleanupError.message,
        filePath: file.path 
      });
    }

    logger.info('[Occupation] 职业工种清单导入完成', { 
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length 
    });

    res.json({
      success: true,
      data: result,
      message: `导入完成：成功${result.imported}条，跳过${result.skipped}条，失败${result.errors.length}条`
    });
  } catch (error) {
    logger.error('[Occupation] 导入职业工种清单失败', { 
      error: error.message 
    });
    next(error);
  }
}

/**
 * 获取职业工种列表（管理后台用）
 */
export async function getOccupationList(req, res, next) {
  try {
    logger.debug('[Occupation] 获取职业工种列表');

    const sql = `
      SELECT id, occupation, direction, levels, created_at, updated_at
      FROM occupation_list
      ORDER BY occupation, direction
    `;
    
    const data = await req.db.getMany(sql);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('[Occupation] 获取职业工种列表失败', { error: error.message });
    next(error);
  }
}

/**
 * 创建职业工种记录
 */
export async function createOccupation(req, res, next) {
  try {
    const { occupation, direction, levels } = req.body;

    logger.info('[Occupation] 创建职业工种记录', { occupation, direction, levels });

    if (!occupation) {
      return res.status(400).json({
        success: false,
        error: '职业名称不能为空'
      });
    }

    // 检查是否已存在
    let existing;
    if (direction) {
      existing = await req.db.getOne(
        'SELECT * FROM occupation_list WHERE occupation = $1 AND direction = $2',
        [occupation, direction]
      );
    } else {
      existing = await req.db.getOne(
        'SELECT * FROM occupation_list WHERE occupation = $1 AND direction IS NULL',
        [occupation]
      );
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        error: '该职业工种记录已存在'
      });
    }

    // 创建记录
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    // 处理职业等级数组
    const levelsArray = levels && Array.isArray(levels) && levels.length > 0 
      ? levels 
      : ['五级', '四级', '三级', '二级', '一级'];

    const sql = `
      INSERT INTO occupation_list (id, occupation, direction, levels, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await req.db.getOne(sql, [id, occupation, direction || null, levelsArray, now, now]);

    res.json({
      success: true,
      data: result,
      message: '创建成功'
    });
  } catch (error) {
    logger.error('[Occupation] 创建职业工种记录失败', { error: error.message });
    next(error);
  }
}

/**
 * 更新职业工种记录
 */
export async function updateOccupation(req, res, next) {
  try {
    const { id } = req.params;
    const { occupation, direction, levels } = req.body;

    logger.info('[Occupation] 更新职业工种记录', { id, occupation, direction, levels });

    if (!occupation) {
      return res.status(400).json({
        success: false,
        error: '职业名称不能为空'
      });
    }

    const now = new Date().toISOString();

    // 处理职业等级数组
    const levelsArray = levels && Array.isArray(levels) && levels.length > 0 
      ? levels 
      : ['五级', '四级', '三级', '二级', '一级'];

    const sql = `
      UPDATE occupation_list
      SET occupation = $1, direction = $2, levels = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await req.db.getOne(sql, [occupation, direction || null, levelsArray, now, id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }

    res.json({
      success: true,
      data: result,
      message: '更新成功'
    });
  } catch (error) {
    logger.error('[Occupation] 更新职业工种记录失败', { error: error.message });
    next(error);
  }
}

/**
 * 删除职业工种记录
 */
export async function deleteOccupation(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[Occupation] 删除职业工种记录', { id });

    const sql = 'DELETE FROM occupation_list WHERE id = $1 RETURNING *';
    const result = await req.db.getOne(sql, [id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('[Occupation] 删除职业工种记录失败', { error: error.message });
    next(error);
  }
}

/**
 * 从报名记录生成学员账户
 */
export async function createAccountFromRegistration(req, res, next) {
  try {
    const { id } = req.params;

    logger.info('[Account] 从报名记录生成学员账户', { 
      registrationId: id 
    });

    const account = await registrationService.createAccountFromRegistration(
      req.db,
      id,
      req.user.id
    );

    logger.info('[Account] 学员账户生成成功', { 
      registrationId: id,
      userId: account.id,
      isNew: account.isNew 
    });

    res.json({
      success: true,
      data: {
        userId: account.id,
        phone: account.phone,
        password: account.plainPassword || '已存在',
        isNew: account.isNew
      },
      message: account.message
    });
  } catch (error) {
    logger.error('[Account] 从报名记录生成学员账户失败', { 
      error: error.message,
      registrationId: req.params.id 
    });
    next(error);
  }
}

/**
 * 批量生成学员账户
 */
export async function batchCreateAccounts(req, res, next) {
  try {
    const { registrationIds } = req.body;

    logger.info('[Account] 批量生成学员账户', { 
      count: registrationIds?.length 
    });

    // 验证参数
    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '请提供报名记录ID数组' 
      });
    }

    // 限制批量操作数量
    if (registrationIds.length > 100) {
      return res.status(400).json({ 
        success: false,
        error: '单次最多生成100个账户' 
      });
    }

    const result = await registrationService.batchCreateAccounts(
      req.db,
      registrationIds,
      req.user.id
    );

    logger.info('[Account] 批量生成学员账户完成', { 
      success: result.success,
      failed: result.failed 
    });

    res.json({
      success: true,
      data: result,
      message: `批量生成完成：成功${result.success}个，失败${result.failed}个`
    });
  } catch (error) {
    logger.error('[Account] 批量生成学员账户失败', { 
      error: error.message,
      body: req.body 
    });
    next(error);
  }
}

/**
 * 检查手机号是否已存在用户
 */
export async function checkPhoneExists(req, res) {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '请输入手机号'
      });
    }

    const sql = 'SELECT id FROM users WHERE phone = $1 LIMIT 1';
    const result = await req.db.query(sql, [phone]);
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });
  } catch (error) {
    logger.error('检查手机号失败', {
      error: error.message,
      phone: req.query.phone
    });
    
    res.status(500).json({
      success: false,
      error: '检查失败，请稍后重试'
    });
  }
}

/**
 * 搜索报名记录（公开访问）
 * 通过手机号或身份证号搜索
 */
export async function searchRegistrations(req, res, next) {
  try {
    const { phone, idNumber } = req.query;
    
    if (!phone && !idNumber) {
      return res.status(400).json({
        success: false,
        error: '请输入手机号或身份证号'
      });
    }

    const conditions = [];
    const params = [];
    
    if (phone) {
      conditions.push(`phone = $${params.length + 1}`);
      params.push(phone);
    }
    
    if (idNumber) {
      conditions.push(`id_number = $${params.length + 1}`);
      params.push(idNumber);
    }
    
    const whereClause = conditions.join(' OR ');
    const sql = `
      SELECT * FROM registrations 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await req.db.query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('搜索报名记录失败', {
      error: error.message,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: '搜索失败，请稍后重试'
    });
  }
}

// 默认导出
export default {
  createRegistration,
  getRegistrationById,
  getRegistrations,
  updateRegistration,
  deleteRegistration,
  downloadDocument,
  batchDownloadDocuments,
  getMajorMappings,
  createMajorMapping,
  updateMajorMapping,
  deleteMajorMapping,
  importMajorMappings,
  getOccupations,
  getOccupationDirections,
  checkMajorMatch,
  importOccupations,
  createAccountFromRegistration,
  batchCreateAccounts,
  searchRegistrations,
  checkPhoneExists
};
