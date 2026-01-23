# SSL 证书部署检查清单

## 概述

本文档提供 SSL 证书部署的快速检查清单，确保证书正确配置。

## 部署前检查

### 1. 域名解析

- [ ] 域名已解析到服务器 IP
- [ ] DNS 记录已生效（可能需要等待几分钟到几小时）
- [ ] 使用 `dig` 或 `nslookup` 验证解析

```bash
# 检查域名解析
dig +short exammaster.zzzjl.com

# 或使用 nslookup
nslookup exammaster.zzzjl.com
```

### 2. 防火墙配置

- [ ] 80 端口已开放（HTTP，用于 Let's Encrypt 验证）
- [ ] 443 端口已开放（HTTPS）
- [ ] 防火墙规则已保存

```bash
# CentOS/RHEL
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-service=https --permanent
sudo firewall-cmd --reload

# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 3. 服务器环境

- [ ] Docker 已安装
- [ ] Docker Compose 已安装
- [ ] OpenSSL 已安装（用于证书验证）
- [ ] 项目代码已部署到服务器

```bash
# 检查 Docker
docker --version

# 检查 Docker Compose
docker-compose --version

# 检查 OpenSSL
openssl version
```

## 证书获取（选择一种方式）

### 方式 1：Let's Encrypt（推荐）

#### 本地开发环境

```bash
# 1. 运行 SSL 配置脚本
bash scripts/setup-ssl.sh

# 2. 选择选项 1（Standalone）或 2（Webroot）

# 3. 等待证书获取完成
```

#### 生产服务器

```bash
# 1. SSH 连接到服务器
ssh root@47.104.173.139

# 2. 进入项目目录
cd /www/wwwroot/exammaster.zzzjl.com

# 3. 运行 SSL 配置脚本
bash scripts/setup-ssl.sh

# 4. 选择选项 1（Standalone）或 2（Webroot）

# 5. 配置自动续期（选项 6）
```

**检查清单**：
- [ ] certbot 已安装
- [ ] 证书获取成功
- [ ] 证书已复制到 `nginx/ssl/` 目录
- [ ] 证书权限已设置（cert.pem: 644, key.pem: 600）
- [ ] 自动续期已配置

### 方式 2：Cloudflare Origin Certificate

#### 步骤

1. **登录 Cloudflare 控制台**
   - [ ] 访问 https://dash.cloudflare.com/
   - [ ] 选择域名 `zzzjl.com`

2. **创建 Origin Certificate**
   - [ ] 进入 SSL/TLS → Origin Server
   - [ ] 点击 "Create Certificate"
   - [ ] 选择有效期：15 years
   - [ ] 主机名：`exammaster.zzzjl.com` 或 `*.zzzjl.com`
   - [ ] 点击 "Create"

3. **保存证书**
   - [ ] 复制证书内容（Origin Certificate）
   - [ ] 复制私钥内容（Private Key）

4. **上传到服务器**

   **方法 A：使用脚本（推荐）**
   ```bash
   # 在服务器上运行
   bash scripts/setup-ssl.sh
   # 选择选项 3
   # 粘贴证书和私钥内容
   ```

   **方法 B：手动创建文件**
   ```bash
   # 创建证书文件
   cat > nginx/ssl/cert.pem << 'EOF'
   -----BEGIN CERTIFICATE-----
   [粘贴证书内容]
   -----END CERTIFICATE-----
   EOF

   # 创建私钥文件
   cat > nginx/ssl/key.pem << 'EOF'
   -----BEGIN PRIVATE KEY-----
   [粘贴私钥内容]
   -----END PRIVATE KEY-----
   EOF

   # 设置权限
   chmod 644 nginx/ssl/cert.pem
   chmod 600 nginx/ssl/key.pem
   ```

5. **配置 Cloudflare SSL 模式**
   - [ ] 进入 SSL/TLS → Overview
   - [ ] 设置为 "Full (strict)"

**检查清单**：
- [ ] Origin Certificate 已创建
- [ ] 证书和私钥已保存到 `nginx/ssl/`
- [ ] 证书权限已设置
- [ ] Cloudflare SSL 模式设置为 "Full (strict)"

### 方式 3：自签名证书（仅测试）

```bash
# 运行脚本
bash scripts/setup-ssl.sh

# 选择选项 4
```

**检查清单**：
- [ ] 自签名证书已生成
- [ ] 了解浏览器会显示安全警告
- [ ] 仅用于本地开发测试

## 证书配置

### 1. 验证证书文件

```bash
# 检查文件是否存在
ls -la nginx/ssl/

# 应该看到：
# cert.pem (644)
# key.pem (600)
```

**检查清单**：
- [ ] `cert.pem` 文件存在
- [ ] `key.pem` 文件存在
- [ ] 文件权限正确（cert: 644, key: 600）

### 2. 验证证书有效性

```bash
# 查看证书信息
openssl x509 -in nginx/ssl/cert.pem -noout -text

# 查看证书过期时间
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 验证证书和私钥匹配
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
# 两个输出应该相同
```

**检查清单**：
- [ ] 证书格式有效
- [ ] 证书未过期
- [ ] 证书域名正确（CN=exammaster.zzzjl.com）
- [ ] 证书和私钥匹配

### 3. 验证 Nginx 配置

```bash
# 检查 nginx.conf 中的证书路径
grep -A 2 "ssl_certificate" nginx/nginx.conf

# 应该看到：
# ssl_certificate /etc/nginx/ssl/cert.pem;
# ssl_certificate_key /etc/nginx/ssl/key.pem;
```

**检查清单**：
- [ ] Nginx 配置中的证书路径正确
- [ ] SSL 协议配置正确（TLSv1.2, TLSv1.3）
- [ ] 加密套件配置正确

## 部署到服务器

### 1. 上传证书文件（如果在本地生成）

```bash
# 使用 SCP 上传证书
scp nginx/ssl/cert.pem root@47.104.173.139:/www/wwwroot/exammaster.zzzjl.com/nginx/ssl/
scp nginx/ssl/key.pem root@47.104.173.139:/www/wwwroot/exammaster.zzzjl.com/nginx/ssl/
```

**检查清单**：
- [ ] 证书文件已上传到服务器
- [ ] 文件路径正确

### 2. 在服务器上配置证书

```bash
# SSH 连接到服务器
ssh root@47.104.173.139

# 进入项目目录
cd /www/wwwroot/exammaster.zzzjl.com

# 运行配置脚本
bash scripts/configure-ssl-on-server.sh
```

**检查清单**：
- [ ] 证书文件权限已设置
- [ ] 证书验证通过
- [ ] Nginx 配置测试通过

### 3. 启动/重启服务

```bash
# 如果是首次部署
docker-compose up -d

# 如果服务已运行，只重启 Nginx
docker-compose restart nginx

# 检查容器状态
docker-compose ps

# 查看 Nginx 日志
docker-compose logs nginx
```

**检查清单**：
- [ ] 所有容器正常运行
- [ ] Nginx 容器状态为 "Up"
- [ ] 没有错误日志

## 测试验证

### 1. 本地测试

```bash
# 测试 HTTP 重定向
curl -I http://exammaster.zzzjl.com
# 应该返回 301 重定向到 HTTPS

# 测试 HTTPS 访问
curl -I https://exammaster.zzzjl.com
# 应该返回 200 OK

# 测试 SSL 握手
openssl s_client -connect exammaster.zzzjl.com:443 -servername exammaster.zzzjl.com
```

**检查清单**：
- [ ] HTTP 自动重定向到 HTTPS
- [ ] HTTPS 访问正常（200 OK）
- [ ] SSL 握手成功
- [ ] 证书链完整

### 2. 浏览器测试

访问 https://exammaster.zzzjl.com

**检查清单**：
- [ ] 页面正常加载
- [ ] 地址栏显示锁图标（安全连接）
- [ ] 没有证书警告
- [ ] 点击锁图标可查看证书信息

### 3. 在线测试

使用 SSL Labs 测试：
https://www.ssllabs.com/ssltest/analyze.html?d=exammaster.zzzjl.com

**检查清单**：
- [ ] 评级为 A 或 A+
- [ ] 证书有效
- [ ] 协议支持正确（TLS 1.2, 1.3）
- [ ] 没有安全漏洞

### 4. API 测试

```bash
# 测试 API 访问
curl -X POST https://exammaster.zzzjl.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"test","password":"test"}'

# 应该返回 JSON 响应（即使登录失败）
```

**检查清单**：
- [ ] API 通过 HTTPS 可访问
- [ ] API 响应正常
- [ ] 没有 SSL 错误

## 自动续期配置（Let's Encrypt）

### 1. 配置自动续期

```bash
# 在服务器上运行
bash scripts/setup-ssl.sh
# 选择选项 6
```

### 2. 测试续期

```bash
# 测试续期（不会实际续期）
sudo certbot renew --dry-run
```

**检查清单**：
- [ ] 自动续期脚本已创建
- [ ] Cron 任务已配置
- [ ] 续期测试通过

## 监控和维护

### 1. 证书过期监控

```bash
# 检查证书过期时间
openssl x509 -in nginx/ssl/cert.pem -noout -enddate

# 设置提醒（证书到期前 30 天）
```

**检查清单**：
- [ ] 知道证书过期时间
- [ ] 设置了过期提醒
- [ ] Let's Encrypt：90 天有效期，自动续期
- [ ] Cloudflare：15 年有效期，手动更新

### 2. 日志监控

```bash
# 查看 Nginx 访问日志
docker-compose logs nginx | grep "GET / HTTP"

# 查看 SSL 错误
docker-compose logs nginx | grep -i ssl
```

**检查清单**：
- [ ] 定期检查日志
- [ ] 没有 SSL 错误
- [ ] HTTPS 访问正常

### 3. 安全检查

```bash
# 定期运行 SSL Labs 测试
# https://www.ssllabs.com/ssltest/

# 检查证书链
openssl s_client -connect exammaster.zzzjl.com:443 -showcerts
```

**检查清单**：
- [ ] SSL Labs 评级保持 A 或 A+
- [ ] 证书链完整
- [ ] 没有安全漏洞

## 故障排查

### 常见问题

#### 1. Nginx 启动失败

**症状**：
```
nginx: [emerg] cannot load certificate
```

**解决方法**：
- [ ] 检查证书文件是否存在
- [ ] 检查文件权限
- [ ] 验证证书格式

```bash
ls -la nginx/ssl/
openssl x509 -in nginx/ssl/cert.pem -noout -text
```

#### 2. 浏览器显示证书无效

**症状**：浏览器显示"您的连接不是私密连接"

**解决方法**：
- [ ] 检查证书域名是否匹配
- [ ] 检查证书是否过期
- [ ] 检查是否使用自签名证书
- [ ] 检查证书链是否完整

```bash
openssl x509 -in nginx/ssl/cert.pem -noout -subject -dates
```

#### 3. Let's Encrypt 验证失败

**症状**：
```
Failed authorization procedure
```

**解决方法**：
- [ ] 检查域名解析
- [ ] 检查防火墙（80 端口）
- [ ] 检查 Nginx 配置（.well-known 路径）
- [ ] 使用 Webroot 模式而不是 Standalone

```bash
dig +short exammaster.zzzjl.com
curl -I http://exammaster.zzzjl.com/.well-known/acme-challenge/test
```

#### 4. HTTPS 无法访问

**症状**：无法通过 HTTPS 访问网站

**解决方法**：
- [ ] 检查防火墙（443 端口）
- [ ] 检查 Nginx 容器状态
- [ ] 检查 Nginx 日志
- [ ] 测试 Nginx 配置

```bash
sudo firewall-cmd --list-all
docker-compose ps
docker-compose logs nginx
docker-compose exec nginx nginx -t
```

## 完成检查

### 最终验证清单

- [ ] 证书已正确安装
- [ ] 证书权限已设置
- [ ] 证书验证通过
- [ ] Nginx 配置正确
- [ ] 服务正常运行
- [ ] HTTP 重定向到 HTTPS
- [ ] HTTPS 访问正常
- [ ] 浏览器显示安全连接
- [ ] API 通过 HTTPS 可访问
- [ ] SSL Labs 评级 A 或 A+
- [ ] 自动续期已配置（Let's Encrypt）
- [ ] 监控和维护计划已制定

## 快速命令参考

```bash
# 查看证书信息
openssl x509 -in nginx/ssl/cert.pem -noout -text

# 查看证书过期时间
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 验证证书和私钥匹配
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5

# 测试 SSL 连接
openssl s_client -connect exammaster.zzzjl.com:443

# 测试 Nginx 配置
docker-compose exec nginx nginx -t

# 重启 Nginx
docker-compose restart nginx

# 查看 Nginx 日志
docker-compose logs -f nginx

# 测试 HTTPS 访问
curl -I https://exammaster.zzzjl.com

# 续期 Let's Encrypt 证书
sudo certbot renew --dry-run
```

## 相关文档

- [SSL_CONFIGURATION_GUIDE.md](./SSL_CONFIGURATION_GUIDE.md) - 详细配置指南
- [nginx/ssl/README.md](./nginx/ssl/README.md) - SSL 目录说明
- [scripts/setup-ssl.sh](./scripts/setup-ssl.sh) - SSL 配置脚本
- [scripts/configure-ssl-on-server.sh](./scripts/configure-ssl-on-server.sh) - 服务器配置脚本

## 支持

如有问题，请参考：
- [故障排查](#故障排查)
- [SSL_CONFIGURATION_GUIDE.md](./SSL_CONFIGURATION_GUIDE.md)
- Let's Encrypt 文档: https://letsencrypt.org/docs/
- Cloudflare SSL 文档: https://developers.cloudflare.com/ssl/
