#!/bin/bash

# 简化版 Let's Encrypt 证书获取脚本
# 使用 Webroot 模式，不影响现有 Nginx 服务

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Let's Encrypt 证书获取（简化版）${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 配置变量
DOMAIN="exammaster.zzzjl.com"
EMAIL="admin@zzzjl.com"
WEBROOT="/usr/share/nginx/html"
PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"
SSL_DIR="$PROJECT_DIR/nginx/ssl"

echo "域名: $DOMAIN"
echo "Webroot: $WEBROOT"
echo "项目目录: $PROJECT_DIR"
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[错误] 请使用 root 权限运行${NC}"
    echo "使用命令: sudo bash $0"
    exit 1
fi

# 检查 certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${RED}[错误] certbot 未安装${NC}"
    echo "安装命令: yum install -y certbot"
    exit 1
fi

echo -e "${GREEN}[1/6] 创建 webroot 目录...${NC}"
mkdir -p "$WEBROOT/.well-known/acme-challenge"
chmod -R 755 "$WEBROOT/.well-known"
echo "✓ Webroot 目录已创建"
echo ""

echo -e "${GREEN}[2/6] 测试 webroot 访问...${NC}"
# 创建测试文件
TEST_FILE="$WEBROOT/.well-known/acme-challenge/test-$(date +%s).txt"
echo "test" > "$TEST_FILE"

# 测试访问
if curl -f -s "http://$DOMAIN/.well-known/acme-challenge/$(basename $TEST_FILE)" &> /dev/null; then
    echo "✓ Webroot 访问正常"
    rm -f "$TEST_FILE"
else
    echo -e "${YELLOW}⚠ Webroot 访问测试失败${NC}"
    echo "这可能不影响证书获取，继续..."
    rm -f "$TEST_FILE"
fi
echo ""

echo -e "${GREEN}[3/6] 获取 Let's Encrypt 证书...${NC}"
echo "这可能需要几分钟，请耐心等待..."
echo ""

# 获取证书
certbot certonly \
    --webroot \
    -w "$WEBROOT" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    --non-interactive

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[错误] 证书获取失败${NC}"
    echo ""
    echo "可能的原因："
    echo "1. 域名未正确解析到服务器"
    echo "2. 防火墙阻止了 80 端口"
    echo "3. Nginx 配置中缺少 .well-known 路径"
    echo ""
    echo "请检查后重试"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ 证书获取成功！${NC}"
echo ""

echo -e "${GREEN}[4/6] 复制证书到项目目录...${NC}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -d "$CERT_PATH" ]; then
    echo -e "${RED}[错误] 证书目录不存在: $CERT_PATH${NC}"
    exit 1
fi

# 创建 SSL 目录
mkdir -p "$SSL_DIR"

# 复制证书文件
cp "$CERT_PATH/fullchain.pem" "$SSL_DIR/cert.pem"
cp "$CERT_PATH/privkey.pem" "$SSL_DIR/key.pem"

# 设置权限
chmod 644 "$SSL_DIR/cert.pem"
chmod 600 "$SSL_DIR/key.pem"

echo "✓ 证书已复制到: $SSL_DIR"
echo ""

echo -e "${GREEN}[5/6] 验证证书...${NC}"
openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -dates
echo ""

echo -e "${GREEN}[6/6] 配置自动续期...${NC}"
# 创建续期脚本
cat > /etc/cron.daily/certbot-renew << 'EOFSCRIPT'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx 2>/dev/null || (cd /www/wwwroot/exammaster.zzzjl.com && docker-compose restart nginx 2>/dev/null) || true"
EOFSCRIPT

chmod +x /etc/cron.daily/certbot-renew
echo "✓ 自动续期已配置（每天检查）"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  证书配置完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "证书位置:"
echo "  系统: /etc/letsencrypt/live/$DOMAIN/"
echo "  项目: $SSL_DIR"
echo ""
echo "证书文件:"
echo "  - cert.pem (权限: 644)"
echo "  - key.pem (权限: 600)"
echo ""
echo "下一步:"
echo "1. 更新项目 Nginx 配置使用 HTTPS"
echo "2. 重启项目 Nginx: cd $PROJECT_DIR && docker-compose restart nginx"
echo "3. 访问 https://$DOMAIN 测试"
echo ""
echo "自动续期: 已配置 ✓"
echo ""
