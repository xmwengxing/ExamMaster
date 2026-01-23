-- PostgreSQL 数据库初始化脚本
-- 用于创建 edumaster 数据库和用户

-- 1. 创建数据库（如果不存在）
SELECT 'CREATE DATABASE edumaster'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'edumaster')\gexec

-- 2. 连接到 edumaster 数据库
\c edumaster

-- 3. 创建用户（如果不存在）
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'edumaster_user') THEN
    CREATE USER edumaster_user WITH PASSWORD 'edumaster_password_2024';
  END IF;
END
$$;

-- 4. 授予权限
GRANT ALL PRIVILEGES ON DATABASE edumaster TO edumaster_user;
GRANT ALL ON SCHEMA public TO edumaster_user;

-- 5. 设置默认权限（确保新创建的表也有权限）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edumaster_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edumaster_user;

-- 6. 显示结果
\echo '✅ 数据库设置完成！'
\echo ''
\echo '数据库信息:'
\echo '  数据库名: edumaster'
\echo '  用户名: edumaster_user'
\echo '  密码: edumaster_password_2024'
\echo ''
\echo '请更新 .env 文件中的数据库配置:'
\echo '  DB_HOST=localhost'
\echo '  DB_PORT=5433'
\echo '  DB_NAME=edumaster'
\echo '  DB_USER=edumaster_user'
\echo '  DB_PASSWORD=edumaster_password_2024'
