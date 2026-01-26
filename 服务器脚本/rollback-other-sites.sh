#!/bin/bash
# 回滚其他网站的配置，只保留 exammaster 的修改

echo "=== 回滚其他网站配置 ==="
echo ""

# 1. 删除我们创建的 zzzjl.com 配置
echo "1. 删除 zzzjl.com 配置..."
if [ -f /www/server/panel/vhost/nginx/zzzjl.com.conf ]; then
    mv /www/server/panel/vhost/nginx/zzzjl.com.conf /tmp/zzzjl.com.conf.backup
    echo "  已移除 zzzjl.com 配置"
else
    echo "  zzzjl.com 配置不存在"
fi

# 2. 测试 Nginx 配置
echo ""
echo "2. 测试 Nginx 配置..."
nginx -t

if [ $? -ne 0 ]; then
    echo "错误: Nginx 配置测试失败"
    exit 1
fi

# 3. 重新加载 Nginx
echo ""
echo "3. 重新加载 Nginx..."
nginx -s reload

# 4. 检查各网站状态
echo ""
echo "4. 检查网站状态..."
echo ""
echo "exammaster.zzzjl.com:"
curl -I http://exammaster.zzzjl.com 2>/dev/null | head -3
echo ""
echo "edu.zzzjl.com:"
curl -I http://edu.zzzjl.com 2>/dev/null | head -3
echo ""
echo "e.zzzjl.com:"
curl -I http://e.zzzjl.com 2>/dev/null | head -3

echo ""
echo "=== 回滚完成 ==="
echo ""
echo "说明:"
echo "  - exammaster.zzzjl.com: 保持当前配置（已修复选项显示问题）"
echo "  - edu.zzzjl.com: 恢复原配置"
echo "  - e.zzzjl.com: 恢复原配置"
echo "  - zzzjl.com: 配置已移除（需要重新配置或恢复备份）"
echo ""
echo "如需恢复 zzzjl.com，请："
echo "  1. 在宝塔面板中重新创建网站"
echo "  2. 或从备份恢复: /www/backup/site/edu.zzzjl.com_mWKfTm.tar.gz"
