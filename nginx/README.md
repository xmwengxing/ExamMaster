# Nginx 配置说明

## 概述

本目录包含 EduMaster 刷题系统的 Nginx 配置文件，用于：
- HTTP 到 HTTPS 重定向
- HTTPS 服务器配置
- 静态文件服务（前端构建产物）
- API 反向代理
- Gzip 压缩
- 缓存策略
- 错误页面处理

## 目录结构

```
nginx/
├── nginx.conf          # 主配置文件
├── ssl/                # SSL 证书目录
│   ├── cert.pem       # SSL 证书文件（需要自行配置）
│   ├── key.pem        # SSL 私钥文件（需要自行配置）
│   └── README.md      # SSL 证书配置说明
├── error-pages/        # 错误页面
│   ├── 404.html       # 404 错误页面
│   └── 50x.html       # 50x 错误页面
└── README.md          # 本文件
```

## 配置文件说明

### nginx.conf

主配置文件包含三个 server 块：

#### 1. HTTP 重定向服务器（生产环境）

```nginx
server {
    listen 80;
    server_name exammaster.zzzjl.com;
    
    # 健康检查和 Let's Encrypt 验证不重定向
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

**功能**：
- 监听 80 端口
- 将所有 HTTP 请求重定向到 HTTPS
- 保留健康检查端点（不重定向）
- 保留 Let's Encrypt 验证路径（不重定向）

#### 2. HTTP 服务器（本地开发/测试）

```nginx
server {
    listen 80 default_server;
    server_name localhost _;
    
    # 静态文件和 API 代理配置
}
```

**功能**：
- 作为默认服务器（default_server）
- 用于本地开发和测试环境
- 不需要 SSL 证书
- 提供完整的静态文件服务和 API 代理

#### 3. HTTPS 服务器（生产环境）

```nginx
server {
    listen 443 ssl http2;
    server_name exammaster.zzzjl.com;
    
    # SSL 配置
    # 静态文件和 API 代理配置
}
```

**功能**：
- 监听 443 端口
- 启用 HTTP/2 协议
- 配置 SSL/TLS 加密
- 添加安全头部
- 提供完整的静态文件服务和 API 代理

## 主要功能配置

### 1. Gzip 压缩

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_types text/plain text/css text/xml text/javascript 
           application/json application/javascript ...;
```

**效果**：
- 压缩文本类型文件，减少传输大小
- 压缩级别 6（平衡压缩率和 CPU 使用）
- 只压缩大于 1KB 的文件

### 2. 缓存策略

#### 静态资源（JS、CSS、图片等）

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**效果**：
- 缓存 1 年
- 标记为不可变（immutable），浏览器不会重新验证
- 适用于带版本号或哈希的静态资源

#### HTML 文件

```nginx
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
}
```

**效果**：
- 不缓存 HTML 文件
- 确保用户总是获取最新版本

### 3. API 反向代理

```nginx
location /api/ {
    proxy_pass http://api:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
}
```

**功能**：
- 将 `/api/` 路径的请求代理到后端 API 服务器
- 支持 WebSocket 升级
- 传递客户端真实 IP 地址
- 设置合理的超时时间

### 4. SSL/TLS 配置

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:...';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

**安全特性**：
- 只支持 TLS 1.2 和 1.3
- 使用强加密套件
- 启用 OCSP Stapling
- 会话缓存优化性能

### 5. 安全头部

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

**安全保护**：
- HSTS：强制使用 HTTPS
- X-Frame-Options：防止点击劫持
- X-Content-Type-Options：防止 MIME 类型嗅探
- X-XSS-Protection：启用 XSS 过滤
- Referrer-Policy：控制 Referer 头部

### 6. 错误处理

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location @api_error {
    default_type application/json;
    return 503 '{"error": "服务暂时不可用，请稍后重试", "code": "SERVICE_UNAVAILABLE"}';
}
```

**功能**：
- 自定义 404 和 50x 错误页面
- API 错误返回 JSON 格式响应

## 部署步骤

### 本地开发/测试

1. **不需要 SSL 证书**，直接使用 HTTP 服务器：

```bash
# 启动 Docker 容器
docker-compose up -d

# 访问应用
# http://localhost
```

2. **测试配置**：

```bash
# 检查 Nginx 配置语法
docker-compose exec nginx nginx -t

# 重新加载配置
docker-compose exec nginx nginx -s reload

# 查看日志
docker-compose logs -f nginx
```

### 生产环境部署

1. **配置 SSL 证书**（参考 `ssl/README.md`）：

```bash
# 方法 1：使用 Let's Encrypt
sudo certbot certonly --webroot -w /usr/share/nginx/html -d exammaster.zzzjl.com
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem ./nginx/ssl/key.pem

# 方法 2：使用现有证书
cp /path/to/cert.pem ./nginx/ssl/cert.pem
cp /path/to/key.pem ./nginx/ssl/key.pem

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

2. **启动服务**：

```bash
# 启动所有容器
docker-compose up -d

# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

3. **验证部署**：

```bash
# 测试 HTTP 重定向
curl -I http://exammaster.zzzjl.com
# 应该返回 301 重定向到 HTTPS

# 测试 HTTPS
curl -I https://exammaster.zzzjl.com
# 应该返回 200 OK

# 测试 API 代理
curl https://exammaster.zzzjl.com/api/health
# 应该返回健康检查响应
```

## 性能优化建议

### 1. 启用 HTTP/2

已在配置中启用：
```nginx
listen 443 ssl http2;
```

### 2. 调整 Worker 进程

根据 CPU 核心数调整：
```nginx
worker_processes auto;  # 自动检测 CPU 核心数
```

### 3. 增加连接数

如果需要处理更多并发连接：
```nginx
events {
    worker_connections 2048;  # 默认 1024
}
```

### 4. 启用 Brotli 压缩（可选）

Brotli 压缩比 Gzip 更高效，但需要额外的 Nginx 模块。

## 故障排查

### 问题 1：Nginx 无法启动

**检查步骤**：
```bash
# 查看错误日志
docker-compose logs nginx

# 检查配置语法
docker-compose exec nginx nginx -t

# 检查端口占用
netstat -tlnp | grep -E '80|443'
```

### 问题 2：SSL 证书错误

**检查步骤**：
```bash
# 验证证书文件存在
ls -la nginx/ssl/

# 检查证书内容
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 验证证书和私钥匹配
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
```

### 问题 3：API 代理不工作

**检查步骤**：
```bash
# 检查 API 容器是否运行
docker-compose ps api

# 测试 API 容器健康状态
docker-compose exec api curl http://localhost:3001/api/health

# 检查网络连接
docker-compose exec nginx ping api
```

### 问题 4：静态文件 404

**检查步骤**：
```bash
# 检查前端构建产物是否存在
ls -la dist/

# 检查 Nginx 容器内的文件
docker-compose exec nginx ls -la /usr/share/nginx/html/

# 检查文件权限
docker-compose exec nginx ls -la /usr/share/nginx/html/index.html
```

## 监控和日志

### 访问日志

```bash
# 实时查看访问日志
docker-compose logs -f nginx

# 查看最近的访问记录
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

### 错误日志

```bash
# 查看错误日志
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

### 性能监控

```bash
# 查看 Nginx 状态（需要配置 stub_status 模块）
curl http://localhost/nginx_status
```

## 安全建议

1. **定期更新 SSL 证书**（Let's Encrypt 证书 90 天有效期）
2. **使用强密码保护私钥文件**
3. **定期检查安全头部配置**
4. **监控访问日志，检测异常流量**
5. **配置防火墙规则，限制访问**
6. **定期更新 Nginx 版本**

## 参考资源

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx 配置生成器](https://www.digitalocean.com/community/tools/nginx)
- [SSL Labs 测试工具](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL 配置生成器](https://ssl-config.mozilla.org/)
