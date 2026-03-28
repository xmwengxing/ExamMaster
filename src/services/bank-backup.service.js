/**
 * 题库备份和恢复服务
 * 
 * 功能：
 * - 导出题库为 SQL 格式
 * - 导入 SQL 文件恢复题库
 * - 支持完整的题目数据（包括图片等富文本）
 */

import { query, transaction } from '../../db.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';

/**
 * 导出题库为 SQL 格式
 * @param {string} bankId - 题库ID
 * @returns {Promise<string>} SQL 内容
 */
export async function exportBankToSQL(bankId) {
  try {
    // 1. 获取题库信息
    const bankResult = await query(
      'SELECT * FROM banks WHERE id = $1',
      [bankId]
    );
    
    if (bankResult.rows.length === 0) {
      throw new Error('题库不存在');
    }
    
    const bank = bankResult.rows[0];
    
    // 2. 获取题库的所有题目
    const questionsResult = await query(
      'SELECT * FROM questions WHERE bank_id = $1 ORDER BY sort_order, id',
      [bankId]
    );
    
    const questions = questionsResult.rows;
    
    // 3. 获取题目关联的标签
    const questionIds = questions.map(q => q.id);
    let tags = [];
    let questionTags = [];
    
    if (questionIds.length > 0) {
      // 获取标签关联
      const questionTagsResult = await query(
        `SELECT qt.*, t.name, t.color 
         FROM question_tags qt
         JOIN tags t ON qt.tag_id = t.id
         WHERE qt.question_id = ANY($1)`,
        [questionIds]
      );
      
      questionTags = questionTagsResult.rows;
      
      // 获取唯一的标签列表
      const tagMap = new Map();
      questionTags.forEach(qt => {
        if (!tagMap.has(qt.tag_id)) {
          tagMap.set(qt.tag_id, {
            id: qt.tag_id,
            name: qt.name,
            color: qt.color
          });
        }
      });
      tags = Array.from(tagMap.values());
    }
    
    // 4. 生成 SQL 内容
    const sqlLines = [];
    
    // SQL 文件头部
    sqlLines.push('-- ============================================================');
    sqlLines.push(`-- 题库备份文件: ${bank.name}`);
    sqlLines.push(`-- 备份时间: ${new Date().toISOString()}`);
    sqlLines.push(`-- 题目数量: ${questions.length}`);
    sqlLines.push(`-- 标签数量: ${tags.length}`);
    sqlLines.push('-- ============================================================');
    sqlLines.push('');
    sqlLines.push('-- 使用事务确保数据一致性');
    sqlLines.push('BEGIN;');
    sqlLines.push('');
    
    // 插入题库
    sqlLines.push('-- 1. 插入题库信息');
    sqlLines.push(generateInsertSQL('banks', bank));
    sqlLines.push('');
    
    // 插入标签
    if (tags.length > 0) {
      sqlLines.push('-- 2. 插入标签');
      tags.forEach(tag => {
        sqlLines.push(generateInsertSQL('tags', {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          created_at: new Date().toISOString(),
          usage_count: 0
        }));
      });
      sqlLines.push('');
    }
    
    // 插入题目
    if (questions.length > 0) {
      sqlLines.push('-- 3. 插入题目');
      questions.forEach((question, index) => {
        sqlLines.push(`-- 题目 ${index + 1}/${questions.length}`);
        sqlLines.push(generateInsertSQL('questions', question));
      });
      sqlLines.push('');
    }
    
    // 插入题目-标签关联
    if (questionTags.length > 0) {
      sqlLines.push('-- 4. 插入题目-标签关联');
      questionTags.forEach(qt => {
        sqlLines.push(generateInsertSQL('question_tags', {
          question_id: qt.question_id,
          tag_id: qt.tag_id,
          created_at: new Date().toISOString()
        }));
      });
      sqlLines.push('');
    }
    
    // 提交事务
    sqlLines.push('COMMIT;');
    sqlLines.push('');
    sqlLines.push('-- 备份完成');
    
    const sqlContent = sqlLines.join('\n');
    
    logger.info('题库导出成功', {
      bankId,
      bankName: bank.name,
      questionCount: questions.length,
      tagCount: tags.length
    });
    
    return sqlContent;
  } catch (error) {
    logger.error('题库导出失败', { bankId, error: error.message });
    throw error;
  }
}

/**
 * 生成 INSERT SQL 语句
 * @param {string} tableName - 表名
 * @param {Object} data - 数据对象
 * @returns {string} INSERT SQL 语句
 */
function generateInsertSQL(tableName, data) {
  const columns = Object.keys(data);
  const values = columns.map(col => {
    const value = data[col];
    
    // NULL 值
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    // 布尔值
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // 数字
    if (typeof value === 'number') {
      return value;
    }
    
    // JSON 对象或数组
    if (typeof value === 'object' && !(value instanceof Date)) {
      return `'${escapeSQLString(JSON.stringify(value))}'::jsonb`;
    }
    
    // 时间戳字段（created_at, updated_at 等）
    if (col.endsWith('_at') || col.includes('date') || col.includes('time')) {
      // 检查是否是有效的日期字符串
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        return `'${dateValue.toISOString()}'::timestamp`;
      }
    }
    
    // 字符串
    return `'${escapeSQLString(String(value))}'`;
  });
  
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')};`;
}

/**
 * 转义 SQL 字符串中的特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeSQLString(str) {
  return str
    .replace(/\\/g, '\\\\')   // 反斜杠
    .replace(/'/g, "''")      // 单引号
    .replace(/\n/g, '\\n')    // 换行符
    .replace(/\r/g, '\\r')    // 回车符
    .replace(/\t/g, '\\t');   // 制表符
}

/**
 * 从 SQL 文件导入题库
 * @param {string} sqlContent - SQL 文件内容
 * @param {Object} options - 导入选项
 * @param {boolean} options.generateNewIds - 是否生成新的ID（避免冲突）
 * @param {string} options.newBankName - 新题库名称（可选）
 * @returns {Promise<Object>} 导入结果
 */
export async function importBankFromSQL(sqlContent, options = {}) {
  const { generateNewIds = false, newBankName = null } = options;
  
  try {
    // 如果需要生成新ID，先解析SQL并替换ID
    let processedSQL = sqlContent;
    let oldBankId = null;
    let newBankId = null;
    const idMapping = new Map(); // 旧ID -> 新ID 映射
    
    if (generateNewIds) {
      // 提取原始题库ID
      const bankIdMatch = sqlContent.match(/INSERT INTO banks \([^)]+\) VALUES \('([^']+)'/);
      if (bankIdMatch) {
        oldBankId = bankIdMatch[1];
        newBankId = uuidv4();
        idMapping.set(oldBankId, newBankId);
        
        // 替换题库ID
        processedSQL = processedSQL.replace(
          new RegExp(`'${oldBankId}'`, 'g'),
          `'${newBankId}'`
        );
      }
      
      // 提取并替换所有题目ID
      const questionIdMatches = [...sqlContent.matchAll(/INSERT INTO questions \([^)]+\) VALUES \('([^']+)'/g)];
      questionIdMatches.forEach(match => {
        const oldQuestionId = match[1];
        const newQuestionId = uuidv4();
        idMapping.set(oldQuestionId, newQuestionId);
        
        // 替换题目ID
        processedSQL = processedSQL.replace(
          new RegExp(`'${oldQuestionId}'`, 'g'),
          `'${newQuestionId}'`
        );
      });
      
      // 提取并替换所有标签ID
      const tagIdMatches = [...sqlContent.matchAll(/INSERT INTO tags \([^)]+\) VALUES \('([^']+)'/g)];
      tagIdMatches.forEach(match => {
        const oldTagId = match[1];
        const newTagId = uuidv4();
        idMapping.set(oldTagId, newTagId);
        
        // 替换标签ID
        processedSQL = processedSQL.replace(
          new RegExp(`'${oldTagId}'`, 'g'),
          `'${newTagId}'`
        );
      });
    }
    
    // 如果指定了新题库名称，替换题库名称
    if (newBankName) {
      processedSQL = processedSQL.replace(
        /INSERT INTO banks \(([^)]+)\) VALUES \('([^']+)', '([^']+)'/,
        (match, columns, id, oldName) => {
          return `INSERT INTO banks (${columns}) VALUES ('${id}', '${escapeSQLString(newBankName)}'`;
        }
      );
    }
    
    // 在事务中执行 SQL
    const result = await transaction(async (client) => {
      // 执行 SQL（移除 BEGIN 和 COMMIT，因为已经在事务中）
      const sqlToExecute = processedSQL
        .replace(/^BEGIN;/m, '')
        .replace(/COMMIT;$/m, '');
      
      await client.query(sqlToExecute);
      
      // 获取导入的题库信息
      const bankId = newBankId || oldBankId;
      const bankResult = await client.query(
        'SELECT * FROM banks WHERE id = $1',
        [bankId]
      );
      
      if (bankResult.rows.length === 0) {
        throw new Error('导入失败：未找到题库');
      }
      
      const bank = bankResult.rows[0];
      
      // 获取题目数量
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM questions WHERE bank_id = $1',
        [bankId]
      );
      
      const questionCount = parseInt(countResult.rows[0].count);
      
      // 更新题库的题目数量
      await client.query(
        'UPDATE banks SET question_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [questionCount, bankId]
      );
      
      return {
        bankId,
        bankName: bank.name,
        questionCount,
        idMapping: generateNewIds ? Object.fromEntries(idMapping) : null
      };
    });
    
    logger.info('题库导入成功', result);
    
    return result;
  } catch (error) {
    logger.error('题库导入失败', { error: error.message });
    throw error;
  }
}

/**
 * 验证 SQL 文件格式
 * @param {string} sqlContent - SQL 文件内容
 * @returns {Object} 验证结果
 */
export function validateSQLFile(sqlContent) {
  try {
    // 检查是否包含必要的表
    const hasBanks = sqlContent.includes('INSERT INTO banks');
    const hasQuestions = sqlContent.includes('INSERT INTO questions');
    
    if (!hasBanks) {
      return {
        valid: false,
        error: 'SQL 文件缺少题库信息'
      };
    }
    
    if (!hasQuestions) {
      return {
        valid: false,
        error: 'SQL 文件缺少题目信息'
      };
    }
    
    // 提取题库名称
    const bankNameMatch = sqlContent.match(/-- 题库备份文件: (.+)/);
    const bankName = bankNameMatch ? bankNameMatch[1] : '未知';
    
    // 提取题目数量
    const questionCountMatch = sqlContent.match(/-- 题目数量: (\d+)/);
    const questionCount = questionCountMatch ? parseInt(questionCountMatch[1]) : 0;
    
    // 提取备份时间
    const backupTimeMatch = sqlContent.match(/-- 备份时间: (.+)/);
    const backupTime = backupTimeMatch ? backupTimeMatch[1] : '未知';
    
    return {
      valid: true,
      info: {
        bankName,
        questionCount,
        backupTime
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

export default {
  exportBankToSQL,
  importBankFromSQL,
  validateSQLFile
};
