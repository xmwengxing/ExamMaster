# SSL 证书配置说明

## 概述

此目录用于存放 SSL/TLS 证书文件，用于 HTTPS 配置。

## 证书文件要求

需要以下两个文件：

1. **cert.pem** - SSL 证书文件（公钥）
2. **key.pem** - SSL 私钥文件

## 获取 SSL 证书的方法

### 方法 1：使用 Let's Encrypt（推荐，免费）

```bash
# 安装 certbot
sudo yum install certbot python3-certbot-nginx -y

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d exammaster.zzzjl.com

# 或者手动获取证书
sudo certbot certonly --webroot -w /usr/share/nginx/html -d exammaster.zzzjl.com

# 证书文件位置
# 证书: /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem
# 私钥: /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem

# 复制到项目目录
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem ./nginx/ssl/key.pem
```

### 方法 2：使用 Cloudflare Origin Certificate

1. 登录 Cloudflare 控制台
2. 选择域名 → SSL/TLS → Origin Server
3. 点击 "Create Certificate"
4. 选择证书有效期（推荐 15 年）
5. 下载证书和私钥
6. 将证书内容保存为 `cert.pem`
7. 将私钥内容保存为 `key.pem`

### 方法 3：使用现有证书

如果已有 SSL 证书文件，请确保：

1. 证书文件格式为 PEM 格式
2. 证书文件包含完整的证书链
3. 私钥文件未加密（或在 Nginx 配置中提供密码）

```bash
# 复制证书文件
cp /path/to/your/certificate.crt ./nginx/ssl/cert.pem
cp /path/to/your/private.key ./nginx/ssl/key.pem
```

## 文件权限设置

为了安全，请设置正确的文件权限：

```bash
# 设置证书文件权限（只读）
chmod 644 nginx/ssl/cert.pem

# 设置私钥文件权限（仅所有者可读）
chmod 600 nginx/ssl/key.pem

# 设置目录权限
chmod 700 nginx/ssl
```

## 测试证书配置

### 本地测试（使用自签名证书）

如果只是本地测试，可以生成自签名证书：

```bash
# 生成自签名证书（仅用于测试）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=EduMaster/CN=localhost"
```

**注意**：自签名证书会在浏览器中显示安全警告，仅用于开发测试。

### 验证证书

```bash
# 检查证书信息
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 检查证书和私钥是否匹配
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
# 两个命令的输出应该相同

# 验证证书链
openssl verify -CAfile /path/to/ca-bundle.crt nginx/ssl/cert.pem
```

## 证书自动续期

### Let's Encrypt 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 设置自动续期（添加到 crontab）
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet --post-hook "docker-compose restart nginx"
```

## Docker 部署注意事项

在 `docker-compose.yml` 中，SSL 证书目录已经挂载：

```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

确保证书文件存在后再启动容器：

```bash
# 检查证书文件
ls -la nginx/ssl/

# 应该看到：
# cert.pem
# key.pem

# 启动容器
docker-compose up -d
```

## 故障排查

### 问题 1：Nginx 启动失败，提示证书文件不存在

**解决方法**：
- 确保 `cert.pem` 和 `key.pem` 文件存在于 `nginx/ssl/` 目录
- 检查文件权限
- 如果是本地测试，可以生成自签名证书

### 问题 2：浏览器显示证书无效

**可能原因**：
- 使用了自签名证书（仅用于测试）
- 证书域名与访问域名不匹配
- 证书已过期
- 证书链不完整

**解决方法**：
- 使用 Let's Encrypt 或其他 CA 签发的证书
- 确保证书域名与 `server_name` 配置一致
- 检查证书有效期
- 确保证书文件包含完整的证书链

### 问题 3：HTTPS 无法访问

**检查步骤**：
1. 确认防火墙开放了 443 端口
2. 确认 Nginx 监听了 443 端口：`netstat -tlnp | grep 443`
3. 检查 Nginx 错误日志：`docker-compose logs nginx`
4. 验证证书配置：`nginx -t`

## 安全建议

1. **永远不要将私钥文件提交到版本控制系统**
2. 定期更新证书（Let's Encrypt 证书有效期 90 天）
3. 使用强加密套件（已在 nginx.conf 中配置）
4. 启用 HSTS（已在 nginx.conf 中配置）
5. 定期检查证书过期时间

## 参考资源

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Cloudflare SSL 文档](https://developers.cloudflare.com/ssl/)
- [Nginx SSL 配置指南](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs 测试工具](https://www.ssllabs.com/ssltest/)
