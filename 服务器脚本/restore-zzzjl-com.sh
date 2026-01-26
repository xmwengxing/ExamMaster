#!/bin/bash
# 恢复主域名 zzzjl.com 的访问

echo "=== 恢复 zzzjl.com 网站 ==="
echo ""

# 1. 创建 Nginx 配置文件
echo "1. 创建 Nginx 配置..."
cat > /www/server/panel/vhost/nginx/zzzjl.com.conf << 'EOF'
server
{
    listen 80;
    server_name zzzjl.com www.zzzjl.com;
    index index.php index.html index.htm default.php default.htm default.html;
    root /www/wwwroot/备份;
    
    #SSL-START SSL相关配置
    #error_page 404/404.html;
    #SSL-END
    
    #ERROR-PAGE-START  错误页配置
    error_page 404 /404.html;
    #ERROR-PAGE-END
    
    #PHP-INFO-START  PHP引用配置
    include enable-php-72.conf;
    #PHP-INFO-END
    
    #REWRITE-START URL重写规则引用
    include /www/server/panel/vhost/rewrite/zzzjl.com.conf;
    #REWRITE-END
    
    #禁止访问的文件或目录
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md)
    {
        return 404;
    }
    
    #一键申请SSL证书验证目录相关设置
    location ~ \.well-known{
        allow all;
    }
    
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$
    {
        expires      30d;
        error_log /dev/null;
        access_log /dev/null;
    }
    
    location ~ .*\.(js|css)?$
    {
        expires      12h;
        error_log /dev/null;
        access_log /dev/null;
    }
    
    access_log  /www/wwwlogs/zzzjl.com.log;
    error_log  /www/wwwlogs/zzzjl.com.error.log;
}
EOF

echo "配置文件已创建"

# 2. 创建伪静态规则文件（如果不存在）
echo ""
echo "2. 创建伪静态规则文件..."
touch /www/server/panel/vhost/rewrite/zzzjl.com.conf

# 3. 测试 Nginx 配置
echo ""
echo "3. 测试 Nginx 配置..."
nginx -t

if [ $? -ne 0 ]; then
    echo "错误: Nginx 配置测试失败"
    echo "请检查配置文件: /www/server/panel/vhost/nginx/zzzjl.com.conf"
    exit 1
fi

# 4. 重新加载 Nginx
echo ""
echo "4. 重新加载 Nginx..."
nginx -s reload

if [ $? -ne 0 ]; then
    echo "错误: Nginx 重新加载失败"
    exit 1
fi

# 5. 测试访问
echo ""
echo "5. 测试网站访问..."
echo "HTTP 访问测试:"
curl -I http://zzzjl.com 2>/dev/null | head -5

echo ""
echo "=== 恢复完成 ==="
echo ""
echo "网站信息:"
echo "  域名: zzzjl.com, www.zzzjl.com"
echo "  目录: /www/wwwroot/备份"
echo "  PHP版本: 7.2"
echo "  日志: /www/wwwlogs/zzzjl.com.log"
echo ""
echo "后续操作:"
echo "  1. 访问 http://zzzjl.com 测试"
echo "  2. 如需 HTTPS，在宝塔面板中申请 SSL 证书"
echo "  3. 检查数据库连接配置"
