// 验证服务层
// 提供报名表单验证和业务规则验证功能

import logger from '../../utils/logger.js';

/**
 * 学历等级验证
 * 验证最高学历不能低于第一学历
 * 
 * @param {string} firstLevel - 第一学历
 * @param {string} highestLevel - 最高学历
 * @returns {Object} - {isValid: boolean, errorMessage: string|null}
 */
export function validateEducationLevel(firstLevel, highestLevel) {
  // 定义学历等级映射
  const levelMap = {
    "初中": 0,
    "高中": 1,
    "中专": 1,
    "技校": 1,
    "大专": 2,
    "本科": 3,
    "硕士研究生": 4,
    "博士研究生": 5
  };
  
  // 获取学历等级值
  const firstLevelValue = levelMap[firstLevel];
  const highestLevelValue = levelMap[highestLevel];
  
  // 验证学历是否在映射表中
  if (firstLevelValue === undefined || highestLevelValue === undefined) {
    logger.warn('学历等级验证失败：无效的学历选项', { firstLevel, highestLevel });
    return {
      isValid: false,
      errorMessage: '无效的学历选项'
    };
  }
  
  // 验证最高学历不能低于第一学历
  if (highestLevelValue < firstLevelValue) {
    logger.debug('学历等级验证失败：最高学历低于第一学历', { firstLevel, highestLevel });
    return {
      isValid: false,
      errorMessage: '请选择高于第一学历的选项'
    };
  }
  
  logger.debug('学历等级验证通过', { firstLevel, highestLevel });
  return {
    isValid: true,
    errorMessage: null
  };
}

/**
 * 升学预算和形式联动验证
 * 验证选择的升学形式是否与预算匹配
 * 
 * @param {string} budget - 升学预算
 * @param {string} form - 升学形式
 * @returns {Object} - {isValid: boolean, errorMessage: string|null}
 */
export function validateUpgradeForm(budget, form) {
  // 定义预算和形式的映射关系
  const budgetFormMap = {
    "5000-6000": ["函授"],
    "7000-10000": ["国家开放大学", "自学考试"],
    "12000+": ["单证硕士", "双证硕士", "硕升博"]
  };
  
  // 获取该预算允许的升学形式列表
  const allowedForms = budgetFormMap[budget];
  
  // 验证预算是否有效
  if (!allowedForms) {
    logger.warn('升学预算验证失败：无效的预算选项', { budget });
    return {
      isValid: false,
      errorMessage: '无效的预算选项'
    };
  }
  
  // 验证选择的升学形式是否在允许列表中
  if (!allowedForms.includes(form)) {
    logger.debug('升学形式验证失败：与预算不匹配', { budget, form, allowedForms });
    return {
      isValid: false,
      errorMessage: '所选升学形式与预算不匹配'
    };
  }
  
  logger.debug('升学预算和形式验证通过', { budget, form });
  return {
    isValid: true,
    errorMessage: null
  };
}

/**
 * 获取预算对应的允许升学形式列表
 * 
 * @param {string} budget - 升学预算
 * @returns {Array<string>} - 允许的升学形式列表
 */
export function getAllowedUpgradeForms(budget) {
  const budgetFormMap = {
    "5000-6000": ["函授"],
    "7000-10000": ["国家开放大学", "自学考试"],
    "12000+": ["单证硕士", "双证硕士", "硕升博"]
  };
  
  return budgetFormMap[budget] || [];
}

/**
 * 职业技能专业匹配验证
 * 判断专业是否符合四级或三级专业要求
 * 
 * @param {string} occupation - 申报认定职业
 * @param {string} major - 最高学历专业
 * @param {string} educationLevel - 最高学历
 * @param {Array} majorMappings - 专业对照表数据
 * @returns {Object} - {level4Match: boolean, level3Match: boolean}
 */
export function checkMajorCompatibility(occupation, major, educationLevel, majorMappings) {
  // 初始化匹配结果
  let level4Match = false;
  let level3Match = false;
  
  // 如果没有专业对照表数据，返回无匹配
  if (!majorMappings || majorMappings.length === 0) {
    logger.debug('专业匹配：无专业对照表数据', { occupation });
    return { level4Match: false, level3Match: false };
  }
  
  // 查询专业对照表（完全匹配职业和专业名称）
  const mapping = majorMappings.find(
    m => m.occupation === occupation && m.major_name === major
  );
  
  // 如果没有找到匹配的专业对照表，返回无匹配
  if (!mapping) {
    logger.debug('专业匹配：未找到匹配的专业对照', { occupation, major });
    return { level4Match: false, level3Match: false };
  }
  
  // 四级专业符合判断（中专、技校）
  if ((educationLevel === "中专" || educationLevel === "技校") && 
      mapping.level_4_compatible === true) {
    level4Match = true;
    logger.debug('专业匹配：四级专业符合', { occupation, major, educationLevel });
  }
  
  // 三级专业符合判断（大专及以上）
  const higherEducationLevels = ["大专", "本科", "硕士研究生", "博士研究生"];
  if (higherEducationLevels.includes(educationLevel) && 
      mapping.level_3_compatible === true) {
    level3Match = true;
    logger.debug('专业匹配：三级专业符合', { occupation, major, educationLevel });
  }
  
  return { level4Match, level3Match };
}

/**
 * 工作年限自动计算
 * 根据申报等级和专业匹配结果计算所需工作年限
 * 
 * @param {string} applyLevel - 申报等级（"四级" 或 "三级"）
 * @param {Object} majorMatch - 专业匹配结果 {level4Match, level3Match}
 * @returns {Object} - {workYears: number|null, isAutoFilled: boolean, message: string|null}
 */
export function calculateRequiredWorkYears(applyLevel, majorMatch) {
  // 四级专业符合规则
  if (majorMatch.level4Match === true && applyLevel === "四级") {
    logger.debug('工作年限计算：四级专业符合，年限为0', { applyLevel });
    return {
      workYears: 0,
      isAutoFilled: true,
      message: null
    };
  }
  
  // 三级专业符合规则
  if (majorMatch.level3Match === true && applyLevel === "三级") {
    logger.debug('工作年限计算：三级专业符合，年限为0', { applyLevel });
    return {
      workYears: 0,
      isAutoFilled: true,
      message: null
    };
  }
  
  // 无专业匹配，根据申报等级计算
  if (applyLevel === "四级") {
    logger.debug('工作年限计算：四级无专业匹配，年限为6年', { applyLevel });
    return {
      workYears: 6,
      isAutoFilled: true,
      message: '工作总年限不低于6年'
    };
  } else if (applyLevel === "三级") {
    logger.debug('工作年限计算：三级无专业匹配，年限为10年', { applyLevel });
    return {
      workYears: 10,
      isAutoFilled: true,
      message: '工作总年限不低于10年'
    };
  }
  
  // 其他等级不自动填写
  logger.debug('工作年限计算：其他等级，不自动填写', { applyLevel });
  return {
    workYears: null,
    isAutoFilled: false,
    message: null
  };
}

/**
 * 日期格式转换 - 出生年月
 * 将日期转换为 YYYY.MM 格式
 * 
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串（YYYY.MM）
 */
export function formatBirthDate(date) {
  try {
    // 处理 null、undefined 或空字符串
    if (!date) {
      return '';
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 验证日期有效性
    if (isNaN(dateObj.getTime())) {
      logger.warn('日期格式转换失败：无效的日期', { date });
      return '';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    
    const formatted = `${year}.${month}`;
    logger.debug('出生年月格式转换', { input: date, output: formatted });
    
    return formatted;
  } catch (error) {
    logger.error('日期格式转换异常', { date, error: error.message });
    return '';
  }
}

/**
 * 日期格式转换 - 毕业时间
 * 将日期转换为 YYYY年MM月 格式
 * 
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串（YYYY年MM月）
 */
export function formatGraduationDate(date) {
  try {
    // 处理 null、undefined 或空字符串
    if (!date) {
      return '';
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 验证日期有效性
    if (isNaN(dateObj.getTime())) {
      logger.warn('日期格式转换失败：无效的日期', { date });
      return '';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    
    const formatted = `${year}年${month}月`;
    logger.debug('毕业时间格式转换', { input: date, output: formatted });
    
    return formatted;
  } catch (error) {
    logger.error('日期格式转换异常', { date, error: error.message });
    return '';
  }
}

/**
 * 图片大小验证
 * 验证图片文件大小是否在限制范围内
 * 
 * @param {number} fileSize - 文件大小（字节）
 * @param {number} maxSize - 最大允许大小（字节），默认 200KB
 * @returns {Object} - {isValid: boolean, errorMessage: string|null}
 */
export function validateImageSize(fileSize, maxSize = 200 * 1024) {
  if (fileSize > maxSize) {
    const maxSizeKB = Math.floor(maxSize / 1024);
    const fileSizeKB = Math.floor(fileSize / 1024);
    
    logger.debug('图片大小验证失败', { fileSizeKB, maxSizeKB });
    
    return {
      isValid: false,
      errorMessage: `照片大小不能超过${maxSizeKB}KB，请压缩后重新上传`
    };
  }
  
  logger.debug('图片大小验证通过', { fileSize, maxSize });
  
  return {
    isValid: true,
    errorMessage: null
  };
}

// 默认导出
export default {
  validateEducationLevel,
  validateUpgradeForm,
  getAllowedUpgradeForms,
  checkMajorCompatibility,
  calculateRequiredWorkYears,
  formatBirthDate,
  formatGraduationDate,
  validateImageSize
};
