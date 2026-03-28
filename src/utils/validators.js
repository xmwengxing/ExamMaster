// 数据验证工具函数
// 用于验证用户输入和业务逻辑

/**
 * 验证填空题答案
 * @param {Array} blanks - 填空配置数组
 * @param {Object} userAnswers - 用户答案对象 {blankId: answer}
 * @param {number} totalScore - 总分（默认 100）
 * @returns {Object} - {correct: number, total: number, score: number, details: Array}
 */
export function validateFillInBlankAnswers(blanks, userAnswers, totalScore = 100) {
  if (!blanks || !Array.isArray(blanks) || blanks.length === 0) {
    return { correct: 0, total: 0, score: 0, details: [] };
  }
  
  let correctCount = 0;
  const details = [];
  
  for (const blank of blanks) {
    const userAnswer = userAnswers[blank.id] || '';
    const isCorrect = checkBlankAnswer(userAnswer, blank);
    
    if (isCorrect) {
      correctCount++;
    }
    
    details.push({
      blankId: blank.id,
      userAnswer,
      isCorrect,
      acceptedAnswers: blank.acceptedAnswers
    });
  }
  
  // 计算得分：按比例分配
  const score = (correctCount / blanks.length) * totalScore;
  
  return {
    correct: correctCount,
    total: blanks.length,
    score: Math.round(score * 100) / 100, // 保留两位小数
    details
  };
}

/**
 * 检查单个空白的答案是否正确
 * @param {string} userAnswer - 用户答案
 * @param {Object} blank - 空白配置
 * @returns {boolean}
 */
export function checkBlankAnswer(userAnswer, blank) {
  if (!userAnswer || !blank.acceptedAnswers || blank.acceptedAnswers.length === 0) {
    return false;
  }
  
  // 去除前后空格
  const trimmedAnswer = String(userAnswer).trim();
  
  // 检查是否匹配任一可接受答案
  for (const acceptedAnswer of blank.acceptedAnswers) {
    const trimmedAccepted = String(acceptedAnswer).trim();
    
    // 根据配置决定是否区分大小写
    if (blank.caseSensitive) {
      if (trimmedAnswer === trimmedAccepted) {
        return true;
      }
    } else {
      if (trimmedAnswer.toLowerCase() === trimmedAccepted.toLowerCase()) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // 基本的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // 中国大陆手机号格式：1开头，第二位是3-9，共11位
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {Object} options - 验证选项
 * @returns {Object} - {valid: boolean, message: string}
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    maxLength = 50,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false
  } = options;
  
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' };
  }
  
  if (password.length < minLength) {
    return { valid: false, message: `密码长度不能少于 ${minLength} 位` };
  }
  
  if (password.length > maxLength) {
    return { valid: false, message: `密码长度不能超过 ${maxLength} 位` };
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  
  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  
  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符' };
  }
  
  return { valid: true, message: '密码格式正确' };
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @param {Object} options - 验证选项
 * @returns {Object} - {valid: boolean, message: string}
 */
export function validateUsername(username, options = {}) {
  const {
    minLength = 3,
    maxLength = 20,
    allowSpecialChars = false
  } = options;
  
  if (!username || typeof username !== 'string') {
    return { valid: false, message: '用户名不能为空' };
  }
  
  if (username.length < minLength) {
    return { valid: false, message: `用户名长度不能少于 ${minLength} 位` };
  }
  
  if (username.length > maxLength) {
    return { valid: false, message: `用户名长度不能超过 ${maxLength} 位` };
  }
  
  // 只允许字母、数字、下划线和中文
  const regex = allowSpecialChars 
    ? /^[\w\u4e00-\u9fa5]+$/ 
    : /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
  
  if (!regex.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
  }
  
  return { valid: true, message: '用户名格式正确' };
}

/**
 * 验证题目选项
 * @param {Array} options - 选项数组
 * @param {string} questionType - 题目类型
 * @returns {Object} - {valid: boolean, message: string}
 */
export function validateQuestionOptions(options, questionType) {
  if (!Array.isArray(options)) {
    return { valid: false, message: '选项必须是数组' };
  }
  
  // 判断题不需要选项
  if (questionType === 'true_false') {
    return { valid: true, message: '判断题不需要选项' };
  }
  
  // 填空题不需要选项
  if (questionType === 'fill_in_blank') {
    return { valid: true, message: '填空题不需要选项' };
  }
  
  // 选择题至少需要 2 个选项
  if (options.length < 2) {
    return { valid: false, message: '选择题至少需要 2 个选项' };
  }
  
  // 检查选项是否为空
  for (let i = 0; i < options.length; i++) {
    if (!options[i] || String(options[i]).trim() === '') {
      return { valid: false, message: `选项 ${i + 1} 不能为空` };
    }
  }
  
  return { valid: true, message: '选项格式正确' };
}

/**
 * 验证题目答案
 * @param {*} answer - 答案
 * @param {string} questionType - 题目类型
 * @param {Array} options - 选项数组（用于验证答案是否在选项中）
 * @returns {Object} - {valid: boolean, message: string}
 */
export function validateQuestionAnswer(answer, questionType, options = []) {
  if (answer === undefined || answer === null || answer === '') {
    return { valid: false, message: '答案不能为空' };
  }
  
  switch (questionType) {
    case 'single_choice':
      // 单选题答案应该是字符串（如 'A', 'B', 'C'）
      if (typeof answer !== 'string') {
        return { valid: false, message: '单选题答案必须是字符串' };
      }
      break;
      
    case 'multiple_choice':
      // 多选题答案应该是数组
      if (!Array.isArray(answer)) {
        return { valid: false, message: '多选题答案必须是数组' };
      }
      if (answer.length === 0) {
        return { valid: false, message: '多选题答案不能为空' };
      }
      break;
      
    case 'true_false':
      // 判断题答案应该是布尔值或字符串 'true'/'false'
      if (typeof answer !== 'boolean' && answer !== 'true' && answer !== 'false') {
        return { valid: false, message: '判断题答案必须是布尔值或 "true"/"false"' };
      }
      break;
      
    case 'fill_in_blank':
      // 填空题答案应该是对象或数组
      if (typeof answer !== 'object') {
        return { valid: false, message: '填空题答案必须是对象或数组' };
      }
      break;
      
    default:
      return { valid: false, message: '未知的题目类型' };
  }
  
  return { valid: true, message: '答案格式正确' };
}

/**
 * 验证分数范围
 * @param {number} score - 分数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean}
 */
export function isValidScore(score, min = 0, max = 100) {
  if (typeof score !== 'number' || isNaN(score)) {
    return false;
  }
  return score >= min && score <= max;
}

/**
 * 验证 ID 格式
 * @param {*} id - ID
 * @returns {boolean}
 */
export function isValidId(id) {
  if (!id) return false;
  
  // 支持数字 ID 和字符串 ID
  if (typeof id === 'number') {
    return id > 0 && Number.isInteger(id);
  }
  
  if (typeof id === 'string') {
    // 数字字符串
    if (/^\d+$/.test(id)) {
      return parseInt(id, 10) > 0;
    }
    // UUID 格式
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return true;
    }
    // 其他字符串 ID（如 'bank-123'）
    return id.length > 0;
  }
  
  return false;
}
