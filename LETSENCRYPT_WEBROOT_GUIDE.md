# Let's Encrypt 证书获取指南（Webroot 模式）

## 问题说明

错误 `Problem binding to port 80: Could not bind to IPv4 or IPv6` 表示：
- 服务器上已有服务（通常是 Nginx）占用了 80 端口
- certbot 的 Standalone 模式无法使用

## 解决方案：使用 Webroot 模式

Webroot 模式的优点：
- ✅ 不需要停止现有 Nginx 服务
- ✅ 不影响其他网站
- ✅ 可以在服务运行时获取证书

## 快速操作步骤

### 步骤 1：上传脚本到服务器

```bash
# 在本地项目目录
scp scripts/get-letsencrypt-cert-safe.sh root@47.104.173.139:/root/

# 或者在服务器上直接创建
ssh root@47.104.173.139
cd /root
# 然后复制脚本内容
```

### 步骤 2：运行脚本

```bash
# SSH 连接到服务器
ssh root@47.104.173.139

# 赋予执行权限
chmod +x /root/get-letsencrypt-cert-safe.sh

# 运行脚本
sudo bash /root/get-letsencrypt-cert-safe.sh
```

脚本会自动：
1. 检查域名解析
2. 检查 Nginx 状态
3. 配置 Nginx 支持 Let's Encrypt 验证
4. 获取证书
5. 复制证书到项目目录
6. 配置自动续期


## 手动操作步骤（如果脚本失败）

### 1. 检查当前 Nginx 配置

```bash
# 查看 Nginx 配置文件位置
nginx -t

# 查找域名配置
grep -r "exammaster.zzzjl.com" /etc/nginx/
```

### 2. 添加 Let's Encrypt 验证路径

编辑你的域名配置文件（通常在 `/etc/nginx/conf.d/` 或 `/etc/nginx/sites-enabled/`）：

```nginx
server {
    listen 80;
    server_name exammaster.zzzjl.com;
    
    # Let's Encrypt 验证路径（添加这部分）
    location ^~ /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
        allow all;
    }
    
    # 其他配置...
}
```

### 3. 测试并重载 Nginx

```bash
# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

### 4. 创建 webroot 目录

```bash
mkdir -p /usr/share/nginx/html/.well-known/acme-challenge
chmod -R 755 /usr/share/nginx/html/.well-known
```

### 5. 测试访问

```bash
# 创建测试文件
echo "test" > /usr/share/nginx/html/.well-known/acme-challenge/test.txt

# 测试访问
curl http://exammaster.zzzjl.com/.well-known/acme-challenge/test.txt

# 应该返回 "test"
```

### 6. 获取证书

```bash
certbot certonly \
  --webroot \
  -w /usr/share/nginx/html \
  --email admin@zzzjl.com \
  --agree-tos \
  --no-eff-email \
  -d exammaster.zzzjl.com
```

### 7. 复制证书到项目

```bash
# 复制证书
cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem

cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem

# 设置权限
chmod 644 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem
chmod 600 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem
```

## 常见问题

### Q1: 如果服务器上有多个网站怎么办？

A: Webroot 模式不会影响其他网站，只需要：
1. 确保 exammaster.zzzjl.com 的 Nginx 配置中有 `.well-known` 路径
2. 其他网站的配置保持不变

### Q2: webroot 目录应该设置在哪里？

A: 取决于你的 Nginx 配置：
- 如果使用默认配置：`/usr/share/nginx/html`
- 如果有自定义 root：使用你配置的 root 目录
- 查看方法：`grep -r "root" /etc/nginx/conf.d/exammaster*`

### Q3: 如何验证证书获取成功？

```bash
# 查看证书文件
ls -la /etc/letsencrypt/live/exammaster.zzzjl.com/

# 查看证书信息
openssl x509 -in /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem \
  -noout -text
```

### Q4: 如何配置自动续期？

```bash
# 创建续期脚本
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# 赋予执行权限
chmod +x /etc/cron.daily/certbot-renew

# 测试续期
certbot renew --dry-run
```

## 故障排查

### 问题 1: 验证失败 - Connection refused

**原因**: 防火墙阻止了 80 端口

**解决**:
```bash
# 检查防火墙
firewall-cmd --list-all

# 开放 80 端口
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

### 问题 2: 验证失败 - 404 Not Found

**原因**: Nginx 配置中没有 `.well-known` 路径

**解决**: 按照上面的步骤 2 添加配置

### 问题 3: 域名解析不正确

**检查**:
```bash
# 查看域名解析
dig +short exammaster.zzzjl.com

# 查看服务器 IP
curl ifconfig.me
```

**解决**: 确保域名 A 记录指向服务器 IP

## 完整示例

```bash
# 1. SSH 连接
ssh root@47.104.173.139

# 2. 检查 Nginx
systemctl status nginx

# 3. 添加 .well-known 配置（如果需要）
# 编辑配置文件...

# 4. 重载 Nginx
nginx -t && systemctl reload nginx

# 5. 获取证书
certbot certonly --webroot \
  -w /usr/share/nginx/html \
  --email admin@zzzjl.com \
  --agree-tos \
  -d exammaster.zzzjl.com

# 6. 复制证书
cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem

# 7. 设置权限
chmod 644 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem
chmod 600 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem

# 8. 验证证书
openssl x509 -in /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem \
  -noout -dates
```

## 总结

使用 Webroot 模式的关键点：
1. ✅ 不需要停止 Nginx
2. ✅ 不影响其他网站
3. ✅ 需要在 Nginx 配置中添加 `.well-known` 路径
4. ✅ 需要确保 80 端口可访问
5. ✅ 需要域名正确解析

推荐使用提供的自动化脚本 `get-letsencrypt-cert-safe.sh`，它会自动处理所有配置！
