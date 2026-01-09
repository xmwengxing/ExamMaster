// 填空题答案验证辅助函数

/**
 * 验证填空题答案
 * @param {Array} blanks - 填空配置数组
 * @param {Object} userAnswers - 用户答案对象 {blankId: answer}
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
function checkBlankAnswer(userAnswer, blank) {
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

// CommonJS导出（用于Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateFillInBlankAnswers,
    checkBlankAnswer
  };
}
