-- ============================================================
-- 迁移脚本: 为 srs_records 表添加唯一约束
-- 日期: 2026-02-11
-- 说明: 修复 UPSERT 操作失败的问题
-- ============================================================

-- 添加唯一约束，确保每个用户对每个题目只有一条 SRS 记录
ALTER TABLE srs_records 
ADD CONSTRAINT unique_user_question 
UNIQUE (user_id, question_id);
