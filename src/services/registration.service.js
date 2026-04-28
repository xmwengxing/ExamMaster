// 报名服务层
// 处理报名记录的核心业务逻辑

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger.js';
import validationService from './validation.service.js';
import documentGenerator from './document-generator.service.js';

/**
 * 创建报名记录
 * @param {Object} db - 数据库实例
 * @param {Object} data - 报名表单数据
 * @param {string} userId - 当前用户ID
 * @returns {Promise<Object>} 报名记录对象
 */
export async function createRegistration(db, data, userId) {
  try {
    // 步骤 1: 验证必填字段
    if (!data.name || !data.phone || !data.type) {
      throw new Error('姓名、联系电话和报名类型为必填字段');
    }
    
    // 验证报名类型
    const validTypes = ['EDUCATION', 'VOCATIONAL', 'K12'];
    if (!validTypes.includes(data.type)) {
      throw new Error('无效的报名类型');
    }
    
    // 步骤 2: 根据报名类型执行特定验证
    if (data.type === 'EDUCATION') {
      const validationResult = await validateEducationData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errorMessage);
      }
    } else if (data.type === 'VOCATIONAL') {
      const validationResult = await validateVocationalData(db, data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errorMessage);
      }
    }
    
    // 步骤 3: 生成唯一ID
    const registrationId = uuidv4();
    
    // 步骤 4: 准备数据库插入数据
    const insertData = {
      id: registrationId,
      type: data.type,
      status: 'PENDING',
      
      // 通用信息
      name: data.name,
      gender: data.gender || null,
      birth_date: data.birth_date || null,
      phone: data.phone,
      id_type: data.id_type || null,
      id_number: data.id_number || null,
      city: data.city || null,
      company: data.company || null,
      
      // 学历教育专用字段
      first_education: data.first_education || null,
      first_education_school: data.first_education_school || null,
      first_education_major: data.first_education_major || null,
      first_education_graduation_date: data.first_education_graduation_date || null,
      highest_education: data.highest_education || null,
      highest_education_school: data.highest_education_school || null,
      highest_education_major: data.highest_education_major || null,
      highest_education_graduation_date: data.highest_education_graduation_date || null,
      upgrade_type: data.upgrade_type || null,
      upgrade_budget: data.upgrade_budget || null,
      upgrade_form: data.upgrade_form || null,
      upgrade_major: data.upgrade_major || null,
      
      // 职业技能专用字段
      occupation: data.occupation || null,
      occupation_direction: data.occupation_direction || null,
      apply_level: data.apply_level || null,
      work_years: data.work_years || null,
      current_certificate: data.current_certificate || null,
certificate_level: data.certificate_level || null,
    certificate_code: data.certificate_code || null,
    certificate_date: data.certificate_date || null,
    // 过滤掉教育和工作经历中的空对象
    education_history: data.education_history 
      ? JSON.stringify(data.education_history.filter(item => item && item.level))
      : null,
    work_history: data.work_history 
      ? JSON.stringify(data.work_history.filter(item => item && item.period))
      : null,
    photo_url: data.photo_url || null,
      
      // 文档路径（稍后由文档生成服务填充）
      document_path: null,
      
      // 关联学员账户（稍后填充）
      user_id: null,
      
// 审计字段（匿名用户可以为 null）
  created_by: userId || null,
  created_at: new Date(),
  updated_at: new Date()
    };
    
    // 步骤 5: 保存到数据库
    const sql = `
      INSERT INTO registrations (
        id, type, status, name, gender, birth_date, phone, id_type, id_number, 
        city, company, first_education, first_education_school, first_education_major, 
        first_education_graduation_date, highest_education, highest_education_school, 
        highest_education_major, highest_education_graduation_date, upgrade_type, 
        upgrade_budget, upgrade_form, upgrade_major, occupation, occupation_direction, 
        apply_level, work_years, current_certificate, certificate_level, certificate_code, 
        certificate_date, education_history, work_history, photo_url, document_path, 
        user_id, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, 
        $33, $34, $35, $36, $37, $38, $39
      )
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      insertData.id, insertData.type, insertData.status, insertData.name, 
      insertData.gender, insertData.birth_date, insertData.phone, insertData.id_type, 
      insertData.id_number, insertData.city, insertData.company, insertData.first_education, 
      insertData.first_education_school, insertData.first_education_major, 
      insertData.first_education_graduation_date, insertData.highest_education, 
      insertData.highest_education_school, insertData.highest_education_major, 
      insertData.highest_education_graduation_date, insertData.upgrade_type, 
      insertData.upgrade_budget, insertData.upgrade_form, insertData.upgrade_major, 
      insertData.occupation, insertData.occupation_direction, insertData.apply_level, 
      insertData.work_years, insertData.current_certificate, insertData.certificate_level, 
      insertData.certificate_code, insertData.certificate_date, insertData.education_history, 
      insertData.work_history, insertData.photo_url, insertData.document_path, 
      insertData.user_id, insertData.created_by, insertData.created_at, insertData.updated_at
    ]);
    
    const registration = result.rows[0];
    
    // 步骤 6: 生成文档
    try {
      let documentPath = null;
      
      if (data.type === 'EDUCATION') {
        documentPath = await documentGenerator.generateEducationExcel(registration);
      } else if (data.type === 'VOCATIONAL') {
        documentPath = await documentGenerator.generateVocationalDocx(registration);
      }
      
      // 步骤 7: 更新文档路径
      if (documentPath) {
        await db.execute(
          'UPDATE registrations SET document_path = $1 WHERE id = $2',
          [documentPath, registrationId]
        );
        registration.document_path = documentPath;
      }
    } catch (docError) {
      // 文档生成失败不影响报名记录保存
      logger.error('文档生成失败', { 
        error: docError.message,
        registrationId 
      });
      // 继续返回报名记录，但标记文档生成失败
      registration.document_generation_failed = true;
    }
    
    logger.info('报名记录创建成功', { 
      registrationId, 
      type: data.type, 
      name: data.name 
    });
    
    return registration;
  } catch (error) {
    logger.error('创建报名记录失败', { 
      error: error.message, 
      data: { name: data.name, type: data.type } 
    });
    throw error;
  }
}

/**
 * 根据ID获取报名记录
 * @param {Object} db - 数据库实例
 * @param {string} id - 报名记录ID
 * @param {string} userId - 当前用户ID
 * @param {string} userRole - 用户角色
 * @returns {Promise<Object|null>} 报名记录对象或null
 */
export async function getRegistrationById(db, id, userId, userRole) {
  try {
    let sql = 'SELECT * FROM registrations WHERE id = $1';
    const params = [id];
    
    // 如果不是管理员，只能查看自己创建的报名记录
    if (userRole !== 'ADMIN') {
      sql += ' AND created_by = $2';
      params.push(userId);
    }
    
    const registration = await db.getOne(sql, params);
    
    if (!registration) {
      logger.warn('报名记录不存在或无权访问', { id, userId, userRole });
      return null;
    }
    
    logger.debug('获取报名记录成功', { id });
    return registration;
  } catch (error) {
    logger.error('获取报名记录失败', { error: error.message, id });
    throw error;
  }
}

/**
 * 查询报名记录列表
 * @param {Object} db - 数据库实例
 * @param {Object} filters - 查询过滤条件
 * @param {string} userId - 当前用户ID
 * @param {string} userRole - 用户角色
 * @returns {Promise<Object>} 分页结果
 */
export async function getRegistrations(db, filters, userId, userRole) {
  try {
    const {
      type,
      status,
      name,
      phone,
      page = 1,
      pageSize = 30
    } = filters;
    
    // 构建WHERE条件
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // 如果不是管理员，只能查看自己创建的报名记录
    if (userRole !== 'ADMIN') {
      conditions.push(`created_by = $${paramIndex++}`);
      params.push(userId);
    }
    
    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }
    
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (name) {
      conditions.push(`name ILIKE $${paramIndex++}`);
      params.push(`%${name}%`);
    }
    
    if (phone) {
      conditions.push(`phone ILIKE $${paramIndex++}`);
      params.push(`%${phone}%`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM registrations ${whereClause}`;
    const countResult = await db.getOne(countSql, params);
    const total = parseInt(countResult.total);
    
    // 计算分页
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    
    // 查询数据
    const dataSql = `
      SELECT * FROM registrations 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const data = await db.getMany(dataSql, [...params, pageSize, offset]);
    
    logger.debug('查询报名记录列表成功', { 
      total, 
      page, 
      pageSize, 
      filters 
    });
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    logger.error('查询报名记录列表失败', { error: error.message, filters });
    throw error;
  }
}

/**
 * 更新报名记录
 * @param {Object} db - 数据库实例
 * @param {string} id - 报名记录ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 当前用户ID
 * @param {string} userRole - 用户角色
 * @returns {Promise<Object>} 更新后的报名记录
 */
export async function updateRegistration(db, id, data, userId, userRole) {
  try {
    // 检查记录是否存在且有权限
    const existing = await getRegistrationById(db, id, userId, userRole);
    if (!existing) {
      throw new Error('报名记录不存在或无权访问');
    }
    
    // 构建更新字段
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    // 允许更新的字段列表
    const allowedFields = [
      'status', 'name', 'gender', 'birth_date', 'phone', 'id_type', 'id_number',
      'city', 'company', 'first_education', 'first_education_school', 
      'first_education_major', 'first_education_graduation_date', 'highest_education',
      'highest_education_school', 'highest_education_major', 
      'highest_education_graduation_date', 'upgrade_type', 'upgrade_budget',
      'upgrade_form', 'upgrade_major', 'occupation', 'occupation_direction',
      'apply_level', 'work_years', 'current_certificate', 'certificate_level',
      'certificate_code', 'certificate_date', 'education_history', 'work_history',
      'photo_url', 'document_path', 'user_id'
    ];
    
    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(data[field]);
      }
    }
    
    if (updates.length === 0) {
      return existing;
    }
    
    // 添加updated_at
    updates.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    
    // 添加ID参数
    params.push(id);
    
    const sql = `
      UPDATE registrations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.execute(sql, params);
    
    logger.info('报名记录更新成功', { id });
    return result.rows[0];
  } catch (error) {
    logger.error('更新报名记录失败', { error: error.message, id });
    throw error;
  }
}

/**
 * 删除报名记录
 * @param {Object} db - 数据库实例
 * @param {string} id - 报名记录ID
 * @param {string} userId - 当前用户ID
 * @param {string} userRole - 用户角色
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteRegistration(db, id, userId, userRole) {
  try {
    // 检查记录是否存在且有权限
    const existing = await getRegistrationById(db, id, userId, userRole);
    if (!existing) {
      throw new Error('报名记录不存在或无权访问');
    }
    
    const sql = 'DELETE FROM registrations WHERE id = $1';
    await db.execute(sql, [id]);
    
    logger.info('报名记录删除成功', { id });
    return true;
  } catch (error) {
    logger.error('删除报名记录失败', { error: error.message, id });
    throw error;
  }
}

/**
 * 验证学历教育数据
 * @param {Object} data - 报名数据
 * @returns {Object} {isValid: boolean, errorMessage: string|null}
 */
export async function validateEducationData(data) {
  try {
    // 验证必填字段
    const requiredFields = [
      'first_education', 'highest_education', 'upgrade_type', 
      'upgrade_budget', 'upgrade_form', 'upgrade_major'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          isValid: false,
          errorMessage: `学历教育报名缺少必填字段: ${field}`
        };
      }
    }
    
    // 验证学历等级
    const levelValidation = validationService.validateEducationLevel(
      data.first_education,
      data.highest_education
    );
    
    if (!levelValidation.isValid) {
      return levelValidation;
    }
    
    // 验证升学预算和形式联动
    const formValidation = validationService.validateUpgradeForm(
      data.upgrade_budget,
      data.upgrade_form
    );
    
    if (!formValidation.isValid) {
      return formValidation;
    }
    
    logger.debug('学历教育数据验证通过');
    return { isValid: true, errorMessage: null };
  } catch (error) {
    logger.error('学历教育数据验证失败', { error: error.message });
    return {
      isValid: false,
      errorMessage: error.message
    };
  }
}

/**
 * 验证职业技能数据
 * @param {Object} db - 数据库实例
 * @param {Object} data - 报名数据
 * @returns {Promise<Object>} {isValid: boolean, errorMessage: string|null}
 */
export async function validateVocationalData(db, data) {
  try {
    // 验证必填字段
    const requiredFields = ['occupation', 'apply_level'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          isValid: false,
          errorMessage: `职业技能报名缺少必填字段: ${field}`
        };
      }
    }
    
    // 验证照片大小（如果有照片）
    if (data.photo_size) {
      const sizeValidation = validationService.validateImageSize(data.photo_size);
      if (!sizeValidation.isValid) {
        return sizeValidation;
      }
    }
    
    logger.debug('职业技能数据验证通过');
    return { isValid: true, errorMessage: null };
  } catch (error) {
    logger.error('职业技能数据验证失败', { error: error.message });
    return {
      isValid: false,
      errorMessage: error.message
    };
  }
}

/**
 * 根据职业查询专业对照表
 * @param {Object} db - 数据库实例
 * @param {string} occupation - 职业名称
 * @returns {Promise<Array>} 专业对照表数组
 */
export async function getMajorMappingsByOccupation(db, occupation) {
  try {
    const sql = `
      SELECT * FROM major_mappings 
      WHERE occupation = $1
      ORDER BY major_name
    `;
    
    const mappings = await db.getMany(sql, [occupation]);
    
    logger.debug('查询专业对照表成功', { occupation, count: mappings.length });
    return mappings;
  } catch (error) {
    logger.error('查询专业对照表失败', { error: error.message, occupation });
    throw error;
  }
}

/**
 * 创建专业对照记录
 * @param {Object} db - 数据库实例
 * @param {Object} data - 专业对照数据
 * @returns {Promise<Object>} 创建的记录
 */
export async function createMajorMapping(db, data) {
  try {
    const id = uuidv4();
    
    const sql = `
      INSERT INTO major_mappings (
        id, occupation, major_name, level_4_compatible, level_3_compatible,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      id,
      data.occupation,
      data.major_name,
      data.level_4_compatible || false,
      data.level_3_compatible || false,
      new Date(),
      new Date()
    ]);
    
    logger.info('专业对照记录创建成功', { id, occupation: data.occupation });
    return result.rows[0];
  } catch (error) {
    logger.error('创建专业对照记录失败', { error: error.message, data });
    throw error;
  }
}

/**
 * 更新专业对照记录
 * @param {Object} db - 数据库实例
 * @param {string} id - 记录ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的记录
 */
export async function updateMajorMapping(db, id, data) {
  try {
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    const allowedFields = ['occupation', 'major_name', 'level_4_compatible', 'level_3_compatible'];
    
    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(data[field]);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('没有要更新的字段');
    }
    
    updates.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    params.push(id);
    
    const sql = `
      UPDATE major_mappings 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.execute(sql, params);
    
    if (result.rows.length === 0) {
      throw new Error('专业对照记录不存在');
    }
    
    logger.info('专业对照记录更新成功', { id });
    return result.rows[0];
  } catch (error) {
    logger.error('更新专业对照记录失败', { error: error.message, id });
    throw error;
  }
}

/**
 * 删除专业对照记录
 * @param {Object} db - 数据库实例
 * @param {string} id - 记录ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteMajorMapping(db, id) {
  try {
    const sql = 'DELETE FROM major_mappings WHERE id = $1';
    const result = await db.execute(sql, [id]);
    
    if (result.rowCount === 0) {
      throw new Error('专业对照记录不存在');
    }
    
    logger.info('专业对照记录删除成功', { id });
    return true;
  } catch (error) {
    logger.error('删除专业对照记录失败', { error: error.message, id });
    throw error;
  }
}

/**
 * 查询职业列表
 * @param {Object} db - 数据库实例
 * @param {string} searchKeyword - 搜索关键词（可选）
 * @returns {Promise<Array>} 职业列表
 */
export async function getOccupations(db, searchKeyword = null) {
  try {
    let sql = 'SELECT DISTINCT occupation FROM occupation_list';
    const params = [];
    
    if (searchKeyword) {
      sql += ' WHERE occupation ILIKE $1';
      params.push(`%${searchKeyword}%`);
    }
    
    sql += ' ORDER BY occupation';
    
    const result = await db.getMany(sql, params);
    
    logger.debug('查询职业列表成功', { count: result.length, searchKeyword });
    return result.map(row => row.occupation);
  } catch (error) {
    logger.error('查询职业列表失败', { error: error.message, searchKeyword });
    throw error;
  }
}

/**
 * 查询职业方向列表
 * @param {Object} db - 数据库实例
 * @param {string} occupation - 职业名称
 * @returns {Promise<Array>} 职业方向列表
 */
export async function getOccupationDirections(db, occupation) {
  try {
    const sql = `
      SELECT direction FROM occupation_list 
      WHERE occupation = $1 AND direction IS NOT NULL
      ORDER BY direction
    `;
    
    const result = await db.getMany(sql, [occupation]);
    
    logger.debug('查询职业方向列表成功', { occupation, count: result.length });
    return result.map(row => row.direction);
  } catch (error) {
    logger.error('查询职业方向列表失败', { error: error.message, occupation });
    throw error;
  }
}

/**
 * 检查专业匹配规则
 * @param {Object} db - 数据库实例
 * @param {string} occupation - 职业名称
 * @param {string} major - 专业名称
 * @param {string} education - 学历
 * @returns {Promise<Object>} 匹配结果 { level4Match: boolean, level3Match: boolean }
 */
export async function checkMajorMatch(db, occupation, major, education) {
  try {
    // 查询专业对照表
    const sql = `
      SELECT * FROM major_mappings 
      WHERE occupation = $1 AND major_name = $2
    `;
    
    const mapping = await db.getOne(sql, [occupation, major]);
    
    // 如果没有找到匹配的专业，返回都不匹配
    if (!mapping) {
      logger.debug('专业匹配检查：未找到匹配', { occupation, major, education });
      return { level4Match: false, level3Match: false };
    }
    
    // 四级专业符合：学历为中专或技校 且 专业对照表中标记为四级兼容
    const level4Educations = ['中专', '技校'];
    const level4Match = level4Educations.includes(education) && mapping.level_4_compatible === true;
    
    // 三级专业符合：学历为大专、本科、硕士研究生或博士研究生 且 专业对照表中标记为三级兼容
    const level3Educations = ['大专', '本科', '硕士研究生', '博士研究生'];
    const level3Match = level3Educations.includes(education) && mapping.level_3_compatible === true;
    
    logger.debug('专业匹配检查成功', { 
      occupation, 
      major, 
      education,
      mappingLevel4: mapping.level_4_compatible,
      mappingLevel3: mapping.level_3_compatible,
      level4Match, 
      level3Match 
    });
    
    return { level4Match, level3Match };
  } catch (error) {
    logger.error('专业匹配检查失败', { 
      error: error.message, 
      stack: error.stack,
      occupation, 
      major, 
      education 
    });
    throw error;
  }
}

/**
 * 从报名记录生成学员账户
 * @param {Object} db - 数据库实例
 * @param {string} registrationId - 报名记录ID
 * @param {string} operatorId - 操作员ID
 * @returns {Promise<Object>} 学员账户对象
 */
export async function createAccountFromRegistration(db, registrationId, operatorId) {
  try {
    // 步骤 1: 查询报名记录
    const registration = await db.getOne(
      'SELECT * FROM registrations WHERE id = $1',
      [registrationId]
    );
    
    if (!registration) {
      throw new Error('报名记录不存在');
    }
    
    if (!registration.name || !registration.phone) {
      throw new Error('报名记录缺少姓名或联系电话');
    }
    
    // 步骤 2: 检查是否已存在账户
    const existingUser = await db.getOne(
      'SELECT * FROM users WHERE phone = $1',
      [registration.phone]
    );
    
    if (existingUser) {
      // 关联现有账户
      await db.execute(
        'UPDATE registrations SET user_id = $1 WHERE id = $2',
        [existingUser.id, registrationId]
      );
      
      logger.info('报名记录关联到现有账户', { 
        registrationId, 
        userId: existingUser.id,
        phone: registration.phone
      });
      
      return {
        ...existingUser,
        isNew: false,
        message: '该手机号已存在账户，已自动关联'
      };
    }
    
    // 步骤 3: 生成新账户
    const userId = uuidv4();
    const password = registration.phone.substring(registration.phone.length - 6);
    const passwordHash = await bcrypt.hash(password, 10);
    
    const userSql = `
      INSERT INTO users (
        id, phone, password, real_name, role, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const userResult = await db.execute(userSql, [
      userId,
      registration.phone,
      passwordHash,
      registration.name,
      'STUDENT',
      new Date(),
      operatorId
    ]);
    
    const newUser = userResult.rows[0];
    
    // 步骤 4: 关联报名记录
    await db.execute(
      'UPDATE registrations SET user_id = $1 WHERE id = $2',
      [userId, registrationId]
    );
    
    logger.info('从报名记录生成学员账户成功', { 
      registrationId, 
      userId,
      phone: registration.phone
    });
    
    return {
      ...newUser,
      plainPassword: password,
      isNew: true,
      message: '账户创建成功'
    };
  } catch (error) {
    logger.error('从报名记录生成学员账户失败', { 
      error: error.message, 
      registrationId 
    });
    throw error;
  }
}

/**
 * 批量生成学员账户
 * @param {Object} db - 数据库实例
 * @param {Array<string>} registrationIds - 报名记录ID数组
 * @param {string} operatorId - 操作员ID
 * @returns {Promise<Object>} 批量生成结果
 */
export async function batchCreateAccounts(db, registrationIds, operatorId) {
  const results = {
    success: 0,
    failed: 0,
    accounts: [],
    errors: []
  };
  
  for (const registrationId of registrationIds) {
    try {
      const account = await createAccountFromRegistration(db, registrationId, operatorId);
      
      results.success++;
      results.accounts.push({
        registrationId,
        userId: account.id,
        phone: account.phone,
        password: account.plainPassword || '已存在',
        isNew: account.isNew,
        message: account.message
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        registrationId,
        error: error.message
      });
      
      logger.warn('批量生成账户：单个记录失败', { 
        registrationId, 
        error: error.message 
      });
    }
  }
  
  logger.info('批量生成学员账户完成', { 
    total: registrationIds.length,
    success: results.success,
    failed: results.failed
  });
  
  return results;
}

// 默认导出
export default {
  createRegistration,
  getRegistrationById,
  getRegistrations,
  updateRegistration,
  deleteRegistration,
  validateEducationData,
  validateVocationalData,
  getMajorMappingsByOccupation,
  createMajorMapping,
  updateMajorMapping,
  deleteMajorMapping,
  getOccupations,
  getOccupationDirections,
  checkMajorMatch,
  createAccountFromRegistration,
  batchCreateAccounts,
  importMajorMappingsFromExcel,
  importOccupationsFromExcel
};

/**
 * 从Excel导入专业对照表
 * @param {Object} db - 数据库实例
 * @param {string} filePath - Excel文件路径
 * @param {string} occupation - 职业名称
 * @returns {Promise<Object>} 导入结果统计
 */
export async function importMajorMappingsFromExcel(db, filePath, occupation) {
  try {
    // 动态导入 xlsx 模块
    const XLSX = await import('xlsx');
    const xlsx = XLSX.default || XLSX;
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        // 提取专业名称和兼容性标记
        const majorName = row['专业名称'] || row['major_name'];
        const level4Compatible = row['四级兼容'] || row['level_4_compatible'] || false;
        const level3Compatible = row['三级兼容'] || row['level_3_compatible'] || false;
        
        if (!majorName) {
          results.errors.push({ row, error: '缺少专业名称' });
          continue;
        }
        
        // 检查是否已存在
        const existing = await db.getOne(
          'SELECT * FROM major_mappings WHERE occupation = $1 AND major_name = $2',
          [occupation, majorName]
        );
        
        if (existing) {
          results.skipped++;
          continue;
        }
        
        // 插入新记录
        await createMajorMapping(db, {
          occupation,
          major_name: majorName,
          level_4_compatible: Boolean(level4Compatible),
          level_3_compatible: Boolean(level3Compatible)
        });
        
        results.imported++;
      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }
    
    logger.info('专业对照表导入完成', { 
      occupation,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length
    });
    
    return results;
  } catch (error) {
    logger.error('导入专业对照表失败', { error: error.message, filePath });
    throw error;
  }
}

/**
 * 从Excel导入职业工种清单
 * @param {Object} db - 数据库实例
 * @param {string} filePath - Excel文件路径
 * @returns {Promise<Object>} 导入结果统计
 */
export async function importOccupationsFromExcel(db, filePath) {
  try {
    // 动态导入 xlsx 模块
    const XLSX = await import('xlsx');
    const xlsx = XLSX.default || XLSX;
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        // 提取职业和工种方向
        const occupation = row['申报认定职业'] || row['occupation'];
        const direction = row['工种/职业方向名称'] || row['direction'] || null;
        
        if (!occupation) {
          results.errors.push({ row, error: '缺少申报认定职业' });
          continue;
        }
        
        // 检查是否已存在相同的职业和方向组合
        let existing;
        if (direction) {
          existing = await db.getOne(
            'SELECT * FROM occupation_list WHERE occupation = $1 AND direction = $2',
            [occupation, direction]
          );
        } else {
          existing = await db.getOne(
            'SELECT * FROM occupation_list WHERE occupation = $1 AND direction IS NULL',
            [occupation]
          );
        }
        
        if (existing) {
          results.skipped++;
          continue;
        }
        
        // 插入新记录
        const id = uuidv4();
        const sql = `
          INSERT INTO occupation_list (id, occupation, direction, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await db.execute(sql, [id, occupation, direction, new Date(), new Date()]);
        results.imported++;
      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }
    
    logger.info('职业工种清单导入完成', { 
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length
    });
    
    return results;
  } catch (error) {
    logger.error('导入职业工种清单失败', { error: error.message, filePath });
    throw error;
  }
}
