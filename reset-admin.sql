-- 删除旧的admin用户
DELETE FROM users WHERE phone='admin';

-- 插入新的admin用户
-- 密码: admin (bcrypt哈希)
INSERT INTO users (id, phone, password, role, nickname, real_name, created_at) 
VALUES (
  'admin-1', 
  'admin', 
  '$2b$10$aggygGRHMatAD636B38pze03OkOj9hmLVEH1WAdZ9bqXRjNuqaChm',
  'ADMIN', 
  'Super Admin', 
  'System Administrator', 
  CURRENT_TIMESTAMP
);

-- 验证
SELECT id, phone, role, nickname FROM users WHERE phone='admin';
