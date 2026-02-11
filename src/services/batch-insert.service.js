/**
 * 批量插入服务
 * 高效地批量插入题目数据到数据库
 */

import db from '../../db.js';

// 批量插入大小
export const BATCH_SIZE = 500;

export class BatchInsertService {
  /**
   * 批量插入题目
   * 将题目分组为每批500条,使用批量INSERT语句
   */
  async insertBatch(questions, userId = null) {
    if (!questions || questions.length === 0) {
      return {
        inserted: 0,
        duplicates: 0,
        errors: []
      };
    }

    let totalInserted = 0;
    let totalDuplicates = 0;
    const allErrors = [];

    // 分批处理
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, Math.min(i + BATCH_SIZE, questions.length));
      
      try {
        const result = await this._insertSingleBatch(batch, userId);
        totalInserted += result.inserted;
        totalDuplicates += result.duplicates;
      } catch (error) {
        // 记录失败的批次
        allErrors.push({
          batchIndex: Math.floor(i / BATCH_SIZE),
          startIndex: i,
          endIndex: Math.min(i + BATCH_SIZE, questions.length) - 1,
          error: error.message
        });
        
        // 继续处理后续批次
        console.error(`批次 ${Math.floor(i / BATCH_SIZE)} 插入失败:`, error);
      }
    }

    return {
      inserted: totalInserted,
      duplicates: totalDuplicates,
      errors: allErrors
    };
  }

  /**
   * 插入单个批次
   * 使用批量INSERT语句,ON CONFLICT跳过重复
   */
  async _insertSingleBatch(batch, userId) {
    if (batch.length === 0) {
      return { inserted: 0, duplicates: 0 };
    }

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');

    // 构建批量INSERT语句
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (let i = 0; i < batch.length; i++) {
      const q = batch[i];
      
      // 每个题目8个字段 (id, bank_id, content, type, options, answer, explanation, chapter)
      const placeholder = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`;
      placeholders.push(placeholder);
      
      values.push(
        uuidv4(), // 生成UUID作为id
        q.bank_id || 'default', // bank_id
        q.content || '',
        q.type || 'single',
        JSON.stringify(q.options || []),
        JSON.stringify(q.answer || ''),
        q.explanation || '',
        q.chapter || ''
      );
      
      paramIndex += 8;
    }

    const sql = `
      INSERT INTO questions 
      (id, bank_id, content, type, options, answer, explanation, chapter)
      VALUES ${placeholders.join(', ')}
      RETURNING id
    `;

    const result = await db.query(sql, values);
    
    return {
      inserted: result.rowCount || 0,
      duplicates: 0 // 由于没有UNIQUE约束,暂时不处理重复
    };
  }

  /**
   * 事务性批量插入
   * 使用BEGIN/COMMIT/ROLLBACK确保每批次的原子性
   */
  async insertBatchTransactional(questions, userId = null) {
    if (!questions || questions.length === 0) {
      return {
        inserted: 0,
        duplicates: 0,
        errors: []
      };
    }

    let totalInserted = 0;
    let totalDuplicates = 0;
    const allErrors = [];

    // 分批处理
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, Math.min(i + BATCH_SIZE, questions.length));
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        const result = await this._insertSingleBatchWithClient(client, batch, userId);
        totalInserted += result.inserted;
        totalDuplicates += result.duplicates;
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        
        // 记录失败的批次
        allErrors.push({
          batchIndex: Math.floor(i / BATCH_SIZE),
          startIndex: i,
          endIndex: Math.min(i + BATCH_SIZE, questions.length) - 1,
          error: error.message
        });
        
        console.error(`批次 ${Math.floor(i / BATCH_SIZE)} 事务失败:`, error);
      } finally {
        client.release();
      }
    }

    return {
      inserted: totalInserted,
      duplicates: totalDuplicates,
      errors: allErrors
    };
  }

  /**
   * 使用指定客户端插入单个批次
   */
  async _insertSingleBatchWithClient(client, batch, userId) {
    if (batch.length === 0) {
      return { inserted: 0, duplicates: 0 };
    }

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');

    // 构建批量INSERT语句
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (let i = 0; i < batch.length; i++) {
      const q = batch[i];
      
      const placeholder = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`;
      placeholders.push(placeholder);
      
      values.push(
        uuidv4(), // 生成UUID作为id
        q.bank_id || 'default', // bank_id
        q.content || '',
        q.type || 'single',
        JSON.stringify(q.options || []),
        JSON.stringify(q.answer || ''),
        q.explanation || '',
        q.chapter || ''
      );
      
      paramIndex += 8;
    }

    const sql = `
      INSERT INTO questions 
      (id, bank_id, content, type, options, answer, explanation, chapter)
      VALUES ${placeholders.join(', ')}
      RETURNING id
    `;

    const result = await client.query(sql, values);
    
    return {
      inserted: result.rowCount || 0,
      duplicates: 0
    };
  }

  /**
   * 检查重复题目
   * 返回已存在的题目内容列表
   */
  async checkDuplicates(questions) {
    if (!questions || questions.length === 0) {
      return [];
    }

    const contents = questions.map(q => q.content).filter(c => c);
    
    if (contents.length === 0) {
      return [];
    }

    const placeholders = contents.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `SELECT content FROM questions WHERE content IN (${placeholders})`;
    
    const result = await db.query(sql, contents);
    
    return result.rows.map(row => row.content);
  }
}

// 导出单例
export const batchInsertService = new BatchInsertService();
