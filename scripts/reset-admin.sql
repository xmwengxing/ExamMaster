-- 删除旧的admin用户
DELETE FROM users WHERE phone='admin';

-- 插入新的admin用户
-- 密码: admin (bcrypt哈希)
INSERT INTO users (id, phone, password, role, nickname, real_name, created_at) 
VALUES (
  'admin-1', 
  'admin', 
  '$2b$10$Mx3AHIOiYHLdC94wMBJpSe/5W9j9A9hHgZogrl.qnkABg6sKggOgq',
  'ADMIN', 
  'Super Admin', 
  'System Administrator', 
  CURRENT_TIMESTAMP
);

-- 验证
SELECT id, phone, role, nickname FROM users WHERE phone='admin';
