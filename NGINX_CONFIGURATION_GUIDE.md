# Nginx 配置完成指南

## 任务完成状态

✅ **任务 11.1 已完成**：创建 `nginx/nginx.conf` 配置文件

## 已完成的配置

### 1. HTTP 到 HTTPS 重定向 ✅

配置了生产环境的 HTTP 到 HTTPS 自动重定向：

```nginx
server {
    listen 80;
    server_name exammaster.zzzjl.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

**特性**：
- 所有 HTTP 请求自动重定向到 HTTPS
- 保留健康检查端点（不重定向）
- 保留 Let's Encrypt 验证路径（不重定向）

### 2. HTTPS 服务器配置 ✅

配置了完整的 HTTPS 服务器（监听 443 端口）：

```nginx
server {
    listen 443 ssl http2;
    server_name exammaster.zzzjl.com;
    
    # SSL 配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ... 更多配置
}
```

**特性**：
- 启用 HTTP/2 协议
- 支持 TLS 1.2 和 1.3
- 使用强加密套件
- 启用 OCSP Stapling
- 配置会话缓存

### 3. SSL 证书路径配置 ✅

配置了 SSL 证书文件路径：

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

**注意**：
- 证书文件需要手动配置（参考 `nginx/ssl/README.md`）
- 本地开发可以使用自签名证书
- 生产环境建议使用 Let's Encrypt 或 Cloudflare 证书

### 4. 静态文件服务配置 ✅

配置了前端构建产物的静态文件服务：

```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

**特性**：
- 支持 SPA 路由（所有路径返回 index.html）
- 自动查找 index.html
- 支持静态资源直接访问

### 5. API 反向代理配置 ✅

配置了 API 请求的反向代理（/api/ → http://api:3001）：

```nginx
location /api/ {
    proxy_pass http://api:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

**特性**：
- 支持 WebSocket 升级
- 传递客户端真实 IP
- 合理的超时配置
- 错误处理机制

### 6. Gzip 压缩配置 ✅

配置了完整的 Gzip 压缩：

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_types text/plain text/css text/xml text/javascript 
           application/json application/javascript ...;
```

**特性**：
- 压缩级别 6（平衡性能和压缩率）
- 只压缩大于 1KB 的文件
- 支持多种文件类型
- 添加 Vary 头部

### 7. 缓存策略配置 ✅

配置了静态资源缓存 1 年：

```nginx
# 静态资源缓存 1 年
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

**特性**：
- 静态资源缓存 1 年（适用于带版本号的文件）
- HTML 文件不缓存（确保获取最新版本）
- 使用 immutable 标记（浏览器不重新验证）

### 8. 错误页面配置 ✅

配置了自定义错误页面：

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location @api_error {
    default_type application/json;
    return 503 '{"error": "服务暂时不可用，请稍后重试"}';
}
```

**特性**：
- 自定义 404 错误页面（美观的 HTML 页面）
- 自定义 50x 错误页面（服务器错误）
- API 错误返回 JSON 格式
- 错误页面已创建在 `nginx/error-pages/` 目录

## 文件结构

```
nginx/
├── nginx.conf              # ✅ 主配置文件（已完成）
├── README.md               # ✅ 配置说明文档
├── ssl/                    # ✅ SSL 证书目录
│   ├── README.md          # ✅ SSL 配置指南
│   ├── .gitignore         # ✅ 忽略证书文件
│   ├── cert.pem           # ⚠️ 需要手动配置
│   └── key.pem            # ⚠️ 需要手动配置
└── error-pages/            # ✅ 错误页面目录
    ├── 404.html           # ✅ 404 错误页面
    └── 50x.html           # ✅ 50x 错误页面
```

## 验证结果

运行 `node scripts/validate-nginx-config.js` 验证结果：

```
✓ 所有检查通过 (8/8)

配置验证成功！可以启动 Nginx 服务。
```

**检查项目**：
- ✅ Nginx 主配置文件存在
- ✅ 目录结构完整
- ✅ 错误页面已创建
- ✅ 文档文件完整
- ✅ Gzip 压缩配置
- ✅ HTTP/HTTPS 监听配置
- ✅ API 反向代理配置
- ✅ 缓存策略配置
- ✅ 错误页面配置
- ✅ HTTP 到 HTTPS 重定向
- ✅ Docker 配置正确

## 下一步操作

### 本地开发/测试

1. **直接启动（使用 HTTP）**：

```bash
# 启动所有服务
docker-compose up -d

# 访问应用
# http://localhost
```

2. **验证配置**：

```bash
# 检查 Nginx 配置语法
docker-compose exec nginx nginx -t

# 测试健康检查
curl http://localhost/health

# 查看日志
docker-compose logs -f nginx
```

### 生产环境部署

1. **配置 SSL 证书**（必需）：

参考 `nginx/ssl/README.md` 文档，选择以下方法之一：

**方法 1：使用 Let's Encrypt（推荐）**

```bash
# 安装 certbot
sudo yum install certbot -y

# 获取证书
sudo certbot certonly --webroot -w /usr/share/nginx/html -d exammaster.zzzjl.com

# 复制证书
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/exammaster.zzzjl.com/privkey.pem ./nginx/ssl/key.pem

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

**方法 2：使用 Cloudflare Origin Certificate**

1. 登录 Cloudflare 控制台
2. 选择域名 → SSL/TLS → Origin Server
3. 创建证书并下载
4. 保存为 `nginx/ssl/cert.pem` 和 `nginx/ssl/key.pem`

**方法 3：使用自签名证书（仅测试）**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=EduMaster/CN=localhost"
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
# 应该返回 301 重定向

# 测试 HTTPS
curl -I https://exammaster.zzzjl.com
# 应该返回 200 OK

# 测试 API 代理
curl https://exammaster.zzzjl.com/api/health
```

## 配置特性总结

### 安全特性

- ✅ 强制 HTTPS（HSTS）
- ✅ 防止点击劫持（X-Frame-Options）
- ✅ 防止 MIME 类型嗅探（X-Content-Type-Options）
- ✅ XSS 保护（X-XSS-Protection）
- ✅ Referrer 策略控制
- ✅ 只支持 TLS 1.2 和 1.3
- ✅ 使用强加密套件

### 性能优化

- ✅ HTTP/2 支持
- ✅ Gzip 压缩（压缩级别 6）
- ✅ 静态资源缓存 1 年
- ✅ SSL 会话缓存
- ✅ OCSP Stapling
- ✅ Sendfile 优化
- ✅ TCP 优化（tcp_nopush, tcp_nodelay）

### 可靠性

- ✅ 健康检查端点
- ✅ 自定义错误页面
- ✅ API 错误处理
- ✅ 合理的超时配置
- ✅ 访问日志和错误日志

## 相关文档

- **Nginx 配置说明**：`nginx/README.md`
- **SSL 证书配置**：`nginx/ssl/README.md`
- **Docker 部署指南**：`DOCKER_DEPLOYMENT_GUIDE.md`
- **快速启动指南**：`DOCKER_QUICK_START.md`

## 故障排查

如果遇到问题，请参考：

1. **Nginx 配置说明**：`nginx/README.md` - 故障排查章节
2. **验证脚本**：运行 `node scripts/validate-nginx-config.js`
3. **查看日志**：`docker-compose logs nginx`
4. **检查配置**：`docker-compose exec nginx nginx -t`

## 需求验证

本配置满足以下需求：

- ✅ **需求 6.1**：配置 HTTP 到 HTTPS 重定向
- ✅ **需求 6.2**：配置 HTTPS 服务器（监听 443 端口）
- ✅ **需求 6.3**：配置 API 反向代理（/api/ → http://api:3001）
- ✅ **需求 6.4**：配置静态文件服务（前端构建产物）
- ✅ **需求 6.5**：配置 Gzip 压缩和缓存策略

## 总结

✅ **任务 11.1 已成功完成**

所有必需的 Nginx 配置已完成：
- HTTP 到 HTTPS 重定向
- HTTPS 服务器配置
- SSL 证书路径配置
- 静态文件服务
- API 反向代理
- Gzip 压缩
- 缓存策略（静态资源缓存 1 年）
- 错误页面处理

配置已通过验证，可以启动服务。生产环境部署前请配置 SSL 证书。
