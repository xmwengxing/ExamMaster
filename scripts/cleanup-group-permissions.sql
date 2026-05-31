-- ============================================================
-- 清理学员直接权限 + 删除所有分组
-- 执行前请确保已备份数据库！
-- ============================================================
BEGIN;

-- 1. 清理学员的直接权限（student_perms, allowed_bank_ids）
UPDATE users SET student_perms = NULL, allowed_bank_ids = NULL WHERE role = 'STUDENT';

-- 2. 清理学员的分组关联
UPDATE users SET group_id = NULL WHERE role = 'STUDENT';

-- 3. 删除所有分组（注意：如果有外键约束可能需要先删子表）
DELETE FROM user_groups;
-- 或者如果是严格的级联删除：
-- TRUNCATE TABLE user_groups CASCADE;

-- 4. 验证
SELECT '清理完成，当前学员数量:' AS info, COUNT(*) FROM users WHERE role = 'STUDENT';
SELECT '分组数量:' AS info, COUNT(*) FROM user_groups;

ROLLBACK; -- 生产环境先ROLLBACK测试，确认无误后改成COMMIT并重新执行
