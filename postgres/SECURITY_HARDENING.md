# PostgreSQL 数据库安全加固指南

## 概述

本文档描述了 EduMaster 系统 PostgreSQL 数据库的安全加固措施，确保数据库符合生产环境的安全要求。

## 安全措施清单

### ✅ 1. 强密码策略

#### 要求
- 密码长度：至少 16 位
- 密码复杂度：必须包含大小写字母、数字、特殊字符
- 密码更换：建议每 90 天更换一次

#### 实施步骤

1. **生成强密码**
```bash
# 使用密码生成工具
node scripts/generate-secure-passwords.js
```

2. **更新 .env 文件**
```bash
# 编辑 .env 文件
nano .env

# 更新以下配置
DB_PASSWORD=<生成的强密码>
JWT_SECRET=<生成的JWT密钥>
```

3. **设置文件权限**
```bash
# 确保 .env 文件仅所有者可读写
chmod 600 .env

# 验证权限
ls -la .env
# 应该显示: -rw------- 1 user user ... .env
```

#### 密码强度验证

使用以下脚本验证密码强度：

```javascript
// 密码强度检查
function validatePassword(password) {
  const checks = {
    length: password.length >= 16,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };
  
  return Object.values(checks).every(check => check);
}
```

### ✅ 2. 限制远程访问

#### 配置说明

PostgreSQL 配置为仅允许本地和 Docker 内部网络访问，拒绝所有外部连接。

#### 实施措施

1. **Docker 网络隔离**
   - PostgreSQL 容器不暴露端口到主机
   - 仅通过 Docker 内部网络访问
   - API 服务器通过容器名称 `postgres` 连接

2. **pg_hba.conf 配置**
```conf
# 仅允许本地连接
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# Docker 内部网络
host    all             all             172.18.0.0/16           scram-sha-256

# 拒绝所有其他连接（隐式规则）
```

3. **postgresql.conf 配置**
```conf
# 监听地址（Docker 环境）
listen_addresses = '*'

# 注意：虽然监听所有接口，但 pg_hba.conf 限制了访问
```

#### 验证访问限制

```bash
# 从外部尝试连接（应该失败）
psql -h <服务器IP> -U edumaster_user -d edumaster
# 预期结果: 连接被拒绝

# 从 Docker 内部连接（应该成功）
docker exec -it edumaster_api psql -h postgres -U edumaster_user -d edumaster
# 预期结果: 连接成功
```

### ✅ 3. 加密认证

#### 配置说明

使用 `scram-sha-256` 加密认证方法，这是 PostgreSQL 最安全的认证方式。

#### 实施措施

1. **postgresql.conf 配置**
```conf
# 密码加密方法
password_encryption = scram-sha-256
```

2. **pg_hba.conf 配置**
```conf
# 所有连接使用 scram-sha-256 认证
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             172.18.0.0/16           scram-sha-256
```

3. **更新现有用户密码**
```sql
-- 连接到数据库
\c edumaster

-- 更新用户密码（使用 scram-sha-256 加密）
ALTER USER edumaster_user WITH PASSWORD '<新密码>';
```

### ✅ 4. 连接数限制

#### 配置说明

限制最大连接数，防止资源耗尽攻击。

#### postgresql.conf 配置

```conf
# 最大连接数
max_connections = 100

# 超级用户保留连接数
superuser_reserved_connections = 3
```

#### 监控连接数

```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看每个数据库的连接数
SELECT datname, count(*) 
FROM pg_stat_activity 
GROUP BY datname;

-- 查看每个用户的连接数
SELECT usename, count(*) 
FROM pg_stat_activity 
GROUP BY usename;
```

### ✅ 5. 查询超时设置

#### 配置说明

设置查询超时，防止长时间运行的查询占用资源。

#### postgresql.conf 配置

```conf
# 语句超时（5 分钟）
statement_timeout = 300000

# 锁超时（30 秒）
lock_timeout = 30000

# 空闲事务超时（10 分钟）
idle_in_transaction_session_timeout = 600000
```

### ✅ 6. 审计日志

#### 配置说明

启用详细的审计日志，记录所有连接、断开连接和慢查询。

#### postgresql.conf 配置

```conf
# 日志配置
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'

# 记录连接和断开连接
log_connections = on
log_disconnections = on

# 记录慢查询（超过 1 秒）
log_min_duration_statement = 1000

# 日志行前缀
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# 记录 DDL 语句
log_statement = 'ddl'
```

#### 查看日志

```bash
# 进入 PostgreSQL 容器
docker exec -it edumaster_postgres sh

# 查看日志目录
cd /var/lib/postgresql/data/log

# 查看最新日志
tail -f postgresql-*.log

# 搜索特定事件
grep "connection authorized" postgresql-*.log
grep "connection received" postgresql-*.log
grep "disconnection" postgresql-*.log
```

### ✅ 7. SSL/TLS 加密（可选）

#### 配置说明

如果需要加密数据库连接，可以启用 SSL/TLS。

#### 实施步骤

1. **生成 SSL 证书**
```bash
# 生成自签名证书（仅用于测试）
openssl req -new -x509 -days 365 -nodes -text \
  -out postgres/ssl/server.crt \
  -keyout postgres/ssl/server.key \
  -subj "/CN=postgres"

# 设置权限
chmod 600 postgres/ssl/server.key
chmod 644 postgres/ssl/server.crt
```

2. **更新 postgresql.conf**
```conf
# 启用 SSL
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
```

3. **更新 docker-compose.yml**
```yaml
postgres:
  volumes:
    - ./postgres/ssl/server.crt:/etc/ssl/certs/server.crt:ro
    - ./postgres/ssl/server.key:/etc/ssl/private/server.key:ro
```

4. **更新客户端连接**
```javascript
// db.js
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'edumaster',
  user: 'edumaster_user',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false  // 自签名证书
  }
});
```

## 安全检查清单

在部署到生产环境之前，请确认以下检查项：

- [ ] 已生成并配置强密码（至少 16 位，包含大小写字母、数字、特殊字符）
- [ ] .env 文件权限设置为 600
- [ ] .env 文件已添加到 .gitignore
- [ ] PostgreSQL 端口未暴露到公网
- [ ] pg_hba.conf 配置正确，仅允许必要的连接
- [ ] 使用 scram-sha-256 加密认证
- [ ] 设置了连接数限制
- [ ] 设置了查询超时
- [ ] 启用了审计日志
- [ ] 定期备份数据库
- [ ] 定期审查日志文件
- [ ] 定期更新 PostgreSQL 版本

## 安全最佳实践

### 1. 密码管理

- ✅ 使用密码管理器存储密码
- ✅ 不要在代码中硬编码密码
- ✅ 不要通过不安全的渠道传输密码
- ✅ 定期更换密码（建议每 90 天）
- ✅ 不要在多个系统中使用相同的密码

### 2. 访问控制

- ✅ 遵循最小权限原则
- ✅ 为不同的应用使用不同的数据库用户
- ✅ 定期审查用户权限
- ✅ 禁用不需要的用户账户
- ✅ 使用强认证方法（scram-sha-256）

### 3. 网络安全

- ✅ 使用防火墙限制访问
- ✅ 不要将数据库端口暴露到公网
- ✅ 使用 VPN 或 SSH 隧道进行远程管理
- ✅ 启用 SSL/TLS 加密连接（如果需要）
- ✅ 定期审查网络配置

### 4. 监控和审计

- ✅ 启用详细的审计日志
- ✅ 定期审查日志文件
- ✅ 监控异常连接和查询
- ✅ 设置告警机制
- ✅ 定期进行安全审计

### 5. 备份和恢复

- ✅ 定期备份数据库
- ✅ 测试备份恢复流程
- ✅ 加密备份文件
- ✅ 安全存储备份文件
- ✅ 定期清理旧备份

### 6. 更新和补丁

- ✅ 定期更新 PostgreSQL 版本
- ✅ 及时应用安全补丁
- ✅ 订阅安全公告
- ✅ 在测试环境中验证更新
- ✅ 制定更新计划

## 故障排查

### 连接被拒绝

**问题**: 无法连接到数据库

**解决方案**:
1. 检查 pg_hba.conf 配置
2. 检查 PostgreSQL 是否正在运行
3. 检查网络连接
4. 检查防火墙规则

```bash
# 检查 PostgreSQL 状态
docker ps | grep postgres

# 查看 PostgreSQL 日志
docker logs edumaster_postgres

# 测试连接
docker exec -it edumaster_api psql -h postgres -U edumaster_user -d edumaster
```

### 认证失败

**问题**: 密码认证失败

**解决方案**:
1. 检查密码是否正确
2. 检查 .env 文件配置
3. 检查 pg_hba.conf 认证方法
4. 重置用户密码

```bash
# 重置密码
docker exec -it edumaster_postgres psql -U postgres -d edumaster
ALTER USER edumaster_user WITH PASSWORD '<新密码>';
```

### 连接数耗尽

**问题**: 达到最大连接数限制

**解决方案**:
1. 检查当前连接数
2. 关闭空闲连接
3. 增加最大连接数（如果需要）
4. 优化应用连接池配置

```sql
-- 查看当前连接
SELECT * FROM pg_stat_activity;

-- 终止空闲连接
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < now() - interval '10 minutes';
```

## 参考资源

- [PostgreSQL 安全文档](https://www.postgresql.org/docs/current/security.html)
- [PostgreSQL 认证方法](https://www.postgresql.org/docs/current/auth-methods.html)
- [PostgreSQL 配置参数](https://www.postgresql.org/docs/current/runtime-config.html)
- [OWASP 数据库安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)

## 联系支持

如有安全问题或疑虑，请联系系统管理员。

---

**最后更新**: 2026-01-23  
**版本**: 1.0
