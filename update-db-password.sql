-- 更新 PostgreSQL 用户密码
-- 生成时间: 2026-01-23T07:08:43.992Z
-- 
-- 使用方法:
-- 1. 在 PostgreSQL 容器中执行此脚本
-- 2. docker exec -i edumaster_postgres psql -U postgres -d edumaster < update-db-password.sql

-- 更新密码
ALTER USER edumaster_user WITH PASSWORD 'Tkl@s,dla=~7Jsa.40a1ebEp9V)OS1>B';

-- 验证用户存在
SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename = 'edumaster_user';

-- 完成
\echo '✅ 密码更新成功'
