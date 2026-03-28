-- ============================================================
-- JSONB 字段优化脚本
-- 为 JSONB 字段创建 GIN 索引以加速查询
-- ============================================================

-- 1. questions 表 - options 字段（用于选项搜索）
CREATE INDEX IF NOT EXISTS idx_questions_options ON questions USING GIN(options);

-- 2. questions 表 - answer 字段（用于答案搜索）
CREATE INDEX IF NOT EXISTS idx_questions_answer ON questions USING GIN(answer);

-- 3. questions 表 - blanks 字段（用于填空题搜索）
CREATE INDEX IF NOT EXISTS idx_questions_blanks ON questions USING GIN(blanks);

-- 4. users 表 - student_perms 字段（用于权限查询）
CREATE INDEX IF NOT EXISTS idx_users_student_perms ON users USING GIN(student_perms);

-- 5. users 表 - allowed_bank_ids 字段（用于题库权限查询）
CREATE INDEX IF NOT EXISTS idx_users_allowed_bank_ids ON users USING GIN(allowed_bank_ids);

-- 6. users 表 - custom_fields 字段（用于自定义字段查询）
CREATE INDEX IF NOT EXISTS idx_users_custom_fields ON users USING GIN(custom_fields);

-- 7. banks 表 - score_config 字段（用于分数配置查询）
CREATE INDEX IF NOT EXISTS idx_banks_score_config ON banks USING GIN(score_config);

-- 8. practice_records 表 - user_answers 字段（用于答案查询）
CREATE INDEX IF NOT EXISTS idx_practice_records_user_answers ON practice_records USING GIN(user_answers);

-- 9. exams 表 - selected_question_ids 字段（用于题目ID查询）
CREATE INDEX IF NOT EXISTS idx_exams_selected_question_ids ON exams USING GIN(selected_question_ids);

-- 10. exam_history 表 - user_answers 字段（用于答案查询）
CREATE INDEX IF NOT EXISTS idx_exam_history_user_answers ON exam_history USING GIN(user_answers);

-- 11. exam_history 表 - wrong_question_ids 字段（用于错题查询）
CREATE INDEX IF NOT EXISTS idx_exam_history_wrong_question_ids ON exam_history USING GIN(wrong_question_ids);

-- 12. exam_history 表 - ordered_question_ids 字段（用于题目顺序查询）
CREATE INDEX IF NOT EXISTS idx_exam_history_ordered_question_ids ON exam_history USING GIN(ordered_question_ids);

-- 13. exam_history 表 - exam_config 字段（用于考试配置查询）
CREATE INDEX IF NOT EXISTS idx_exam_history_exam_config ON exam_history USING GIN(exam_config);

-- 14. practical_tasks 表 - parts 字段（用于任务部分查询）
CREATE INDEX IF NOT EXISTS idx_practical_tasks_parts ON practical_tasks USING GIN(parts);

-- 15. practical_records 表 - answers 字段（用于答案查询）
CREATE INDEX IF NOT EXISTS idx_practical_records_answers ON practical_records USING GIN(answers);

-- 16. system_config 表 - data 字段（用于配置数据查询）
CREATE INDEX IF NOT EXISTS idx_system_config_data ON system_config USING GIN(data);

-- ============================================================
-- 查询性能分析
-- ============================================================

-- 分析所有表的统计信息
ANALYZE users;
ANALYZE banks;
ANALYZE questions;
ANALYZE practice_records;
ANALYZE exams;
ANALYZE exam_history;
ANALYZE practical_tasks;
ANALYZE practical_records;
ANALYZE system_config;

-- ============================================================
-- 完成通知
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ JSONB 索引优化完成！';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的 GIN 索引：';
  RAISE NOTICE '  1. questions.options - 选项搜索';
  RAISE NOTICE '  2. questions.answer - 答案搜索';
  RAISE NOTICE '  3. questions.blanks - 填空题搜索';
  RAISE NOTICE '  4. questions.tags - 标签搜索（已存在）';
  RAISE NOTICE '  5. users.student_perms - 权限查询';
  RAISE NOTICE '  6. users.allowed_bank_ids - 题库权限查询';
  RAISE NOTICE '  7. users.custom_fields - 自定义字段查询';
  RAISE NOTICE '  8. banks.score_config - 分数配置查询';
  RAISE NOTICE '  9. practice_records.user_answers - 练习答案查询';
  RAISE NOTICE '  10. exams.selected_question_ids - 考试题目查询';
  RAISE NOTICE '  11. exam_history.user_answers - 考试答案查询';
  RAISE NOTICE '  12. exam_history.wrong_question_ids - 错题查询';
  RAISE NOTICE '  13. exam_history.ordered_question_ids - 题目顺序查询';
  RAISE NOTICE '  14. exam_history.exam_config - 考试配置查询';
  RAISE NOTICE '  15. practical_tasks.parts - 任务部分查询';
  RAISE NOTICE '  16. practical_records.answers - 实操答案查询';
  RAISE NOTICE '  17. system_config.data - 配置数据查询';
  RAISE NOTICE '';
  RAISE NOTICE '所有表的统计信息已更新';
  RAISE NOTICE '';
  RAISE NOTICE '使用 EXPLAIN ANALYZE 分析查询计划：';
  RAISE NOTICE '  EXPLAIN ANALYZE SELECT * FROM questions WHERE tags @> ''["tag1"]''::jsonb;';
END $$;
