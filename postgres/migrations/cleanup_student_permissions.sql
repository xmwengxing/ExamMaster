-- Cleanup student direct permissions and delete all groups
-- This is part of the group permissions management refactor
UPDATE users SET student_perms = NULL, allowed_bank_ids = NULL, group_id = NULL WHERE role = 'STUDENT';
DELETE FROM user_groups;
