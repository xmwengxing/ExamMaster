// SRS (间隔重复系统) 服务层
// 处理 SRS 复习记录的管理和算法

/**
 * 获取用户的 SRS 记录列表
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} SRS 记录列表
 */
export async function getSRSRecords(db, userId) {
  const rows = await db.getMany(
    'SELECT * FROM srs_records WHERE user_id = $1',
    [userId]
  );
  
  return rows || [];
}

/**
 * 获取用户的单个 SRS 记录
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @param {string} questionId - 题目 ID
 * @returns {Promise<Object|null>} SRS 记录对象
 */
export async function getSRSRecord(db, userId, questionId) {
  const record = await db.getOne(
    'SELECT * FROM srs_records WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  
  return record;
}

/**
 * 更新 SRS 记录（根据用户反馈调整复习间隔）
 * @param {Object} db - 数据库实例
 * @param {string} userId - 用户 ID
 * @param {string} questionId - 题目 ID
 * @param {string} level - 难度级别 (HARD/GOOD/EASY)
 * @returns {Promise<Object>} 更新后的 SRS 记录
 */
export async function updateSRSRecord(db, userId, questionId, level) {
  if (!questionId || !level) {
    throw new Error('questionId 和 level 是必需的');
  }
  
  // 获取现有记录
  const existing = await getSRSRecord(db, userId, questionId);
  
  // 计算新的复习参数
  const srsParams = calculateSRSParameters(level, existing);
  
  // 计算下次复习日期
  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + srsParams.intervalDays * 24 * 60 * 60 * 1000);
  
  // 验证日期有效性
  if (isNaN(nextReviewDate.getTime())) {
    throw new Error('日期计算错误');
  }
  
  const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];
  const id = existing?.id || `srs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // 使用 UPSERT 语法
  await db.execute(
    `INSERT INTO srs_records 
     (id, user_id, question_id, interval, ease_factor, repetitions, next_review_date, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, question_id) DO UPDATE SET
       interval = EXCLUDED.interval,
       ease_factor = EXCLUDED.ease_factor,
       repetitions = EXCLUDED.repetitions,
       next_review_date = EXCLUDED.next_review_date,
       status = EXCLUDED.status`,
    [
      id,
      userId,
      questionId,
      srsParams.intervalDays,
      srsParams.easeFactor,
      srsParams.repetitions,
      nextReviewDateStr,
      'active'
    ]
  );
  
  return {
    id,
    userId,
    questionId,
    interval: srsParams.intervalDays,
    easeFactor: srsParams.easeFactor,
    repetitions: srsParams.repetitions,
    nextReviewDate: nextReviewDateStr,
    status: 'active'
  };
}

/**
 * 计算 SRS 参数（基于 SM-2 算法）
 * @param {string} level - 难度级别 (HARD/GOOD/EASY)
 * @param {Object|null} existing - 现有的 SRS 记录
 * @returns {Object} 新的 SRS 参数
 */
function calculateSRSParameters(level, existing) {
  let intervalDays = 1;
  let easeFactor = 2.5;
  let repetitions = 0;
  
  if (existing) {
    repetitions = existing.repetitions || 0;
    easeFactor = existing.ease_factor || 2.5;
  }
  
  // 根据难度级别更新参数
  if (level === 'HARD') {
    // "很难/重来"：保持在今天的复习列表中
    intervalDays = 0; // 设置为 0 天，表示今天仍需复习
    repetitions = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (level === 'GOOD') {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round((existing?.interval || 6) * easeFactor);
    }
  } else if (level === 'EASY') {
    easeFactor = Math.max(1.3, easeFactor + 0.15);
    repetitions += 1;
    const baseInterval = existing?.interval_days || 1;
    intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(baseInterval * easeFactor);
  }
  
  // 验证计算结果（注意：0 是有效值，表示今天仍需复习）
  if (intervalDays === null || intervalDays === undefined || isNaN(intervalDays) || !isFinite(intervalDays)) {
    intervalDays = 1; // 使用默认值
  }
  
  return {
    intervalDays,
    easeFactor,
    repetitions
  };
}

