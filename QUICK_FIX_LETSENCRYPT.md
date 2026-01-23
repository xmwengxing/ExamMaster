# Let's Encrypt 快速修复指南

## 问题：dig 命令未找到

你遇到的错误是因为服务器上没有安装 `dig` 命令，但这不影响证书获取。

## 解决方案 1：使用简化版脚本（推荐）

我创建了一个更简单的脚本，跳过了不必要的检查。

### 操作步骤

```bash
# 1. 上传新脚本到服务器
scp scripts/get-cert-simple.sh root@47.104.173.139:/root/

# 2. SSH 连接到服务器
ssh root@47.104.173.139

# 3. 运行脚本
chmod +x /root/get-cert-simple.sh
sudo bash /root/get-cert-simple.sh
```

这个脚本会：
- ✅ 跳过域名解析检查（你已经确认域名有解析）
- ✅ 直接获取证书
- ✅ 自动复制到项目目录
- ✅ 配置自动续期

## 解决方案 2：手动操作（最简单）

如果脚本还有问题，直接手动操作：

### 步骤 1：确保 Nginx 配置正确

检查你的 Nginx 配置中是否有 `.well-known` 路径：

```bash
# 查找配置文件
grep -r "exammaster.zzzjl.com" /etc/nginx/

# 编辑配置文件（替换为实际路径）
vi /etc/nginx/conf.d/exammaster.conf
```

确保有这个配置：

```nginx
server {
    listen 80;
    server_name exammaster.zzzjl.com;
    
    # Let's Encrypt 验证路径
    location ^~ /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
        allow all;
    }
    
    # 其他配置...
}
```

### 步骤 2：重载 Nginx

```bash
nginx -t
systemctl reload nginx
```

### 步骤 3：创建 webroot 目录

```bash
mkdir -p /usr/share/nginx/html/.well-known/acme-challenge
chmod -R 755 /usr/share/nginx/html/.well-known
```

### 步骤 4：获取证书

```bash
certbot certonly \
  --webroot \
  -w /usr/share/nginx/html \
  --email admin@zzzjl.com \
  --agree-tos \
  --no-eff-email \
  -d exammaster.zzzjl.com
```

### 步骤 5：复制证书

```bash
# 复制证书到项目
cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem

cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem \
   /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem

# 设置权限
chmod 644 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem
chmod 600 /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem
```

### 步骤 6：验证证书

```bash
openssl x509 -in /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem \
  -noout -subject -dates
```

### 步骤 7：配置自动续期

```bash
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

chmod +x /etc/cron.daily/certbot-renew
```

## 常见问题

### Q: 如果 certbot 命令失败怎么办？

查看详细错误信息：

```bash
certbot certonly \
  --webroot \
  -w /usr/share/nginx/html \
  --email admin@zzzjl.com \
  --agree-tos \
  -d exammaster.zzzjl.com \
  --verbose
```

### Q: 如何测试 webroot 是否可访问？

```bash
# 创建测试文件
echo "test" > /usr/share/nginx/html/.well-known/acme-challenge/test.txt

# 测试访问
curl http://exammaster.zzzjl.com/.well-known/acme-challenge/test.txt

# 应该返回 "test"
```

### Q: 如何检查防火墙？

```bash
# 查看防火墙状态
firewall-cmd --list-all

# 确保 80 端口开放
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

## 推荐操作顺序

1. **使用简化版脚本**（最快）
   ```bash
   bash /root/get-cert-simple.sh
   ```

2. **如果脚本失败，手动操作**（最可靠）
   - 按照上面的步骤 1-7 操作

3. **验证证书**
   ```bash
   ls -la /www/wwwroot/exammaster.zzzjl.com/nginx/ssl/
   ```

## 成功标志

当你看到以下内容时，说明成功了：

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem
```

然后证书文件应该在：
- `/www/wwwroot/exammaster.zzzjl.com/nginx/ssl/cert.pem`
- `/www/wwwroot/exammaster.zzzjl.com/nginx/ssl/key.pem`

## 需要帮助？

如果遇到任何问题，请提供：
1. 完整的错误信息
2. `nginx -t` 的输出
3. `ls -la /usr/share/nginx/html/.well-known/` 的输出
