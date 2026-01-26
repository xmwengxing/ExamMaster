#!/bin/bash
# 修复 Nginx 路由问题 - 恢复其他网站的访问

echo "=== 修复 Nginx 路由问题 ==="
echo ""

# 1. 备份当前配置
echo "1. 备份当前配置..."
cp /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf.backup.$(date +%Y%m%d_%H%M%S)

# 2. 检查配置文件加载顺序
echo ""
echo "2. 当前配置文件加载顺序（按字母排序）："
ls /www/server/panel/vhost/nginx/*.conf | grep zzzjl

# 3. 测试 Nginx 配置
echo ""
echo "3. 测试 Nginx 配置..."
nginx -t

if [ $? -ne 0 ]; then
    echo "错误: Nginx 配置测试失败"
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

echo ""
echo "5. 检查网站访问..."
echo "测试 exammaster.zzzjl.com:"
curl -I http://exammaster.zzzjl.com 2>/dev/null | head -5

echo ""
echo "测试 e.zzzjl.com:"
curl -I http://e.zzzjl.com 2>/dev/null | head -5

echo ""
echo "测试 exam.zzzjl.com:"
curl -I http://exam.zzzjl.com 2>/dev/null | head -5

echo ""
echo "=== 修复完成 ==="
echo ""
echo "如果问题仍然存在，可能需要："
echo "1. 检查 DNS 解析是否正确"
echo "2. 检查域名是否指向正确的服务器"
echo "3. 在宝塔面板中重新配置网站"
