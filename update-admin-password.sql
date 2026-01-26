-- 更新管理员密码为 admin
-- 密码哈希: $2b$10$YxLiDBuVXiSLPXHTi9sjdeQR0c4jIKye3MlW1qEV8Hf6LeM7pTpL6

UPDATE users 
SET password = '$2b$10$YxLiDBuVXiSLPXHTi9sjdeQR0c4jIKye3MlW1qEV8Hf6LeM7pTpL6',
    updated_at = CURRENT_TIMESTAMP 
WHERE phone = 'admin';

-- 验证更新
SELECT id, phone, role, real_name, 
       substring(password, 1, 10) as pwd_prefix,
       length(password) as pwd_length
FROM users 
WHERE phone = 'admin';
