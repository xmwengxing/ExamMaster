# SSL 证书配置指南

## 概述

本指南详细说明如何为 EduMaster 系统配置 SSL/TLS 证书，实现 HTTPS 安全访问。

## 目录

- [证书获取方式](#证书获取方式)
- [方法 1：Let's Encrypt（推荐）](#方法-1lets-encrypt推荐)
- [方法 2：Cloudflare Origin Certificate](#方法-2cloudflare-origin-certificate)
- [方法 3：自签名证书（仅测试）](#方法-3自签名证书仅测试)
- [证书配置](#证书配置)
- [验证和测试](#验证和测试)
- [自动续期](#自动续期)
- [故障排查](#故障排查)

## 证书获取方式

### 对比表

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Let's Encrypt | 免费、自动续期、受信任 | 需要域名解析、90天有效期 | 生产环境（推荐） |
| Cloudflare | 长期有效（15年）、简单 | 需要使用 Cloudflare DNS | 使用 Cloudflare 的生产环境 |
| 自签名证书 | 快速、无需域名 | 浏览器警告、不受信任 | 本地开发测试 |

## 方法 1：Let's Encrypt（推荐）

### 前提条件

1. 域名已解析到服务器 IP
2. 服务器 80 端口可访问
3. 具有 root 权限

### 使用自动化脚本（推荐）

#### Linux/Mac

```bash
# 赋予执行权限
chmod +x scripts/setup-ssl.sh

# 运行脚本
sudo bash scripts/setup-ssl.sh

# 选择选项 1 或 2
# 1. Standalone 模式（需要停止 Docker）
# 2. Webroot 模式（Docker 运行中）
```

#### 手动配置

**步骤 1：安装 certbot**

```bash
# CentOS/RHEL
sudo yum install -y epel-release
sudo yum install -y certbot

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y certbot
```

**步骤 2：获取证书（Standalone 模式）**

```bash
# 停止 Docker 容器（释放 80 端口）
docker-compose down

# 获取证书
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@zzzjl.com \
  -d exammaster.zzzjl.com

# 证书文件位置
# 证书: /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem
# 私钥: /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem
```

**步骤 3：复制证书到项目目录**

```bash
# 复制证书文件
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem ./nginx/ssl/key.pem

# 设置权限
sudo chmod 644 ./nginx/ssl/cert.pem
sudo chmod 600 ./nginx/ssl/key.pem
sudo chown $USER:$USER ./nginx/ssl/*.pem
```

**步骤 4：启动 Docker 容器**

```bash
docker-compose up -d
```

### Webroot 模式（推荐用于已运行的服务）

如果 Docker 容器已经在运行，使用 Webroot 模式：

```bash
# 获取证书
sudo certbot certonly --webroot \
  -w /usr/share/nginx/html \
  --non-interactive \
  --agree-tos \
  --email admin@zzzjl.com \
  -d exammaster.zzzjl.com

# 复制证书
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem ./nginx/ssl/key.pem

# 设置权限
sudo chmod 644 ./nginx/ssl/cert.pem
sudo chmod 600 ./nginx/ssl/key.pem

# 重启 Nginx
docker-compose restart nginx
```

## 方法 2：Cloudflare Origin Certificate

### 适用场景

- 域名使用 Cloudflare DNS
- 需要长期有效的证书（最长 15 年）
- 不需要自动续期

### 步骤

**步骤 1：登录 Cloudflare 控制台**

访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)

**步骤 2：创建 Origin Certificate**

1. 选择你的域名
2. 进入 **SSL/TLS** → **Origin Server**
3. 点击 **Create Certificate**
4. 选择证书类型：
   - **Let Cloudflare generate a private key and a CSR**（推荐）
5. 选择有效期：**15 years**（推荐）
6. 主机名：`exammaster.zzzjl.com` 或 `*.zzzjl.com`
7. 点击 **Create**

**步骤 3：保存证书**

复制证书内容并保存：

```bash
# 保存证书（Origin Certificate）
cat > nginx/ssl/cert.pem << 'EOF'
-----BEGIN CERTIFICATE-----
[粘贴证书内容]
-----END CERTIFICATE-----
EOF

# 保存私钥（Private Key）
cat > nginx/ssl/key.pem << 'EOF'
-----BEGIN PRIVATE KEY-----
[粘贴私钥内容]
-----END PRIVATE KEY-----
EOF

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

**步骤 4：配置 Cloudflare SSL 模式**

在 Cloudflare 控制台中：
1. 进入 **SSL/TLS** → **Overview**
2. 设置 SSL/TLS 加密模式为 **Full (strict)**

**步骤 5：启动服务**

```bash
docker-compose up -d
```

### Windows 用户

使用提供的批处理脚本：

```cmd
scripts\setup-ssl.bat
```

选择选项 1，然后按照提示操作。

## 方法 3：自签名证书（仅测试）

### 警告

⚠️ 自签名证书仅用于本地开发和测试，浏览器会显示安全警告。

### 使用脚本生成

#### Linux/Mac

```bash
bash scripts/setup-ssl.sh
# 选择选项 4
```

#### Windows

```cmd
scripts\setup-ssl.bat
# 选择选项 2
```

### 手动生成

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=EduMaster/CN=exammaster.zzzjl.com"

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

## 证书配置

### 文件结构

```
nginx/ssl/
├── cert.pem          # SSL 证书（公钥）
├── key.pem           # SSL 私钥
├── .gitignore        # 忽略证书文件
└── README.md         # 说明文档
```

### 权限设置

```bash
# 证书文件（可读）
chmod 644 nginx/ssl/cert.pem

# 私钥文件（仅所有者可读）
chmod 600 nginx/ssl/key.pem

# 目录权限
chmod 700 nginx/ssl
```

### Nginx 配置

证书路径已在 `nginx/nginx.conf` 中配置：

```nginx
server {
    listen 443 ssl http2;
    server_name exammaster.zzzjl.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL 协议和加密套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:...';
    ssl_prefer_server_ciphers off;

    # 其他配置...
}
```

### Docker 挂载

在 `docker-compose.yml` 中，SSL 目录已挂载：

```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

## 验证和测试

### 验证证书文件

```bash
# 使用脚本验证
bash scripts/setup-ssl.sh
# 选择选项 5

# 或手动验证
# 检查证书信息
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 检查证书和私钥是否匹配
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
# 两个命令的输出应该相同
```

### 测试 HTTPS 访问

```bash
# 启动服务
docker-compose up -d

# 检查容器状态
docker-compose ps

# 查看 Nginx 日志
docker-compose logs nginx

# 测试 HTTPS 连接
curl -I https://exammaster.zzzjl.com

# 测试 SSL 握手
openssl s_client -connect exammaster.zzzjl.com:443 -servername exammaster.zzzjl.com
```

### 在线测试工具

使用 SSL Labs 测试 SSL 配置：

https://www.ssllabs.com/ssltest/analyze.html?d=exammaster.zzzjl.com

## 自动续期

### Let's Encrypt 自动续期

Let's Encrypt 证书有效期为 90 天，需要定期续期。

#### 使用脚本配置

```bash
sudo bash scripts/setup-ssl.sh
# 选择选项 6
```

#### 手动配置

**方法 1：使用 cron（推荐）**

```bash
# 创建续期脚本
sudo cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "cd /www/wwwroot/exammaster.zzzjl.com && docker-compose restart nginx"
EOF

# 赋予执行权限
sudo chmod +x /etc/cron.daily/certbot-renew

# 测试续期
sudo certbot renew --dry-run
```

**方法 2：使用 systemd timer**

```bash
# 创建 systemd service
sudo cat > /etc/systemd/system/certbot-renew.service << 'EOF'
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --post-hook "cd /www/wwwroot/exammaster.zzzjl.com && docker-compose restart nginx"
EOF

# 创建 systemd timer
sudo cat > /etc/systemd/system/certbot-renew.timer << 'EOF'
[Unit]
Description=Certbot Renewal Timer

[Timer]
OnCalendar=daily
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 启用并启动 timer
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# 查看 timer 状态
sudo systemctl status certbot-renew.timer
```

### Cloudflare Origin Certificate

Cloudflare Origin Certificate 有效期最长 15 年，无需自动续期。

在证书到期前手动更新即可。

## 故障排查

### 问题 1：Nginx 启动失败

**错误信息**：
```
nginx: [emerg] cannot load certificate "/etc/nginx/ssl/cert.pem"
```

**解决方法**：
1. 检查证书文件是否存在：
   ```bash
   ls -la nginx/ssl/
   ```
2. 检查文件权限：
   ```bash
   chmod 644 nginx/ssl/cert.pem
   chmod 600 nginx/ssl/key.pem
   ```
3. 验证证书格式：
   ```bash
   openssl x509 -in nginx/ssl/cert.pem -noout -text
   ```

### 问题 2：浏览器显示证书无效

**可能原因**：
- 使用了自签名证书
- 证书域名与访问域名不匹配
- 证书已过期
- 证书链不完整

**解决方法**：
1. 检查证书信息：
   ```bash
   openssl x509 -in nginx/ssl/cert.pem -noout -subject -dates
   ```
2. 确保使用受信任的 CA 签发的证书（Let's Encrypt 或 Cloudflare）
3. 确保证书域名与 `server_name` 配置一致
4. 检查证书有效期

### 问题 3：Let's Encrypt 验证失败

**错误信息**：
```
Failed authorization procedure. exammaster.zzzjl.com (http-01): 
urn:ietf:params:acme:error:connection :: The server could not connect to the client
```

**解决方法**：
1. 检查域名解析：
   ```bash
   dig +short exammaster.zzzjl.com
   ```
2. 检查防火墙规则：
   ```bash
   sudo firewall-cmd --list-all
   sudo firewall-cmd --add-service=http --permanent
   sudo firewall-cmd --reload
   ```
3. 检查 80 端口是否可访问：
   ```bash
   curl -I http://exammaster.zzzjl.com
   ```
4. 使用 Webroot 模式而不是 Standalone 模式

### 问题 4：证书和私钥不匹配

**错误信息**：
```
nginx: [emerg] SSL_CTX_use_PrivateKey_file() failed
```

**解决方法**：
1. 验证证书和私钥是否匹配：
   ```bash
   openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
   openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
   ```
2. 如果不匹配，重新获取证书或使用正确的私钥

### 问题 5：HTTPS 无法访问

**检查步骤**：
1. 确认防火墙开放了 443 端口：
   ```bash
   sudo firewall-cmd --add-service=https --permanent
   sudo firewall-cmd --reload
   ```
2. 确认 Nginx 监听了 443 端口：
   ```bash
   docker-compose exec nginx netstat -tlnp | grep 443
   ```
3. 检查 Nginx 配置：
   ```bash
   docker-compose exec nginx nginx -t
   ```
4. 查看 Nginx 日志：
   ```bash
   docker-compose logs nginx
   ```

## 安全建议

1. **永远不要将私钥文件提交到版本控制系统**
   - 已在 `.gitignore` 中配置
   
2. **使用强加密套件**
   - 已在 `nginx.conf` 中配置
   
3. **启用 HSTS**
   - 已在 `nginx.conf` 中配置
   
4. **定期更新证书**
   - Let's Encrypt：90 天有效期，建议配置自动续期
   - Cloudflare：15 年有效期，到期前手动更新
   
5. **监控证书过期时间**
   ```bash
   # 检查证书过期时间
   openssl x509 -in nginx/ssl/cert.pem -noout -enddate
   ```

6. **使用 TLS 1.2 及以上版本**
   - 已在 `nginx.conf` 中配置

## 参考资源

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Cloudflare SSL 文档](https://developers.cloudflare.com/ssl/)
- [Nginx SSL 配置指南](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs 测试工具](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

## 快速参考

### 常用命令

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

# 重启 Nginx
docker-compose restart nginx

# 查看 Nginx 日志
docker-compose logs -f nginx

# 测试 Nginx 配置
docker-compose exec nginx nginx -t
```

### 证书文件位置

| 证书类型 | 证书位置 | 私钥位置 |
|---------|---------|---------|
| Let's Encrypt | `/etc/letsencrypt/live/域名/fullchain.pem` | `/etc/letsencrypt/live/域名/privkey.pem` |
| 项目目录 | `nginx/ssl/cert.pem` | `nginx/ssl/key.pem` |
| Docker 容器内 | `/etc/nginx/ssl/cert.pem` | `/etc/nginx/ssl/key.pem` |

## 总结

本指南提供了三种 SSL 证书配置方式：

1. **Let's Encrypt**：推荐用于生产环境，免费且自动续期
2. **Cloudflare Origin Certificate**：适合使用 Cloudflare 的用户，长期有效
3. **自签名证书**：仅用于本地开发测试

选择适合你的方式，按照步骤操作即可完成 SSL 证书配置。
