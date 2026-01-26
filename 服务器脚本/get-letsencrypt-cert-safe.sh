#!/bin/bash

# 安全获取 Let's Encrypt 证书脚本
# 使用 Webroot 模式，不影响现有 Nginx 服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="exammaster.zzzjl.com"
EMAIL="admin@zzzjl.com"
WEBROOT="/usr/share/nginx/html"
PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"
SSL_DIR="$PROJECT_DIR/nginx/ssl"

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否以 root 权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本"
        print_info "使用命令: sudo bash $0"
        exit 1
    fi
}

# 检查 certbot 是否已安装
check_certbot() {
    print_step "检查 certbot..."
    
    if command -v certbot &> /dev/null; then
        print_info "certbot 已安装"
        certbot --version
        return 0
    else
        print_error "certbot 未安装"
        return 1
    fi
}

# 检查域名解析
check_domain() {
    print_step "检查域名解析..."
    
    # 获取域名的 IP 地址（尝试多种方法）
    if command -v dig &> /dev/null; then
        DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    elif command -v nslookup &> /dev/null; then
        DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -n1)
    elif command -v host &> /dev/null; then
        DOMAIN_IP=$(host $DOMAIN | grep "has address" | awk '{print $4}' | head -n1)
    else
        print_warn "未找到 DNS 查询工具（dig/nslookup/host）"
        print_info "跳过域名解析检查"
        return 0
    fi
    
    if [ -z "$DOMAIN_IP" ]; then
        print_warn "无法获取域名 IP 地址"
        print_info "跳过域名解析检查"
        return 0
    fi
    
    # 获取服务器的公网 IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null)
    
    if [ -z "$SERVER_IP" ]; then
        print_warn "无法获取服务器公网 IP"
        print_info "跳过 IP 匹配检查"
        return 0
    fi
    
    print_info "域名 IP: $DOMAIN_IP"
    print_info "服务器 IP: $SERVER_IP"
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        print_warn "域名 IP 与服务器 IP 不匹配"
        print_warn "这可能导致验证失败"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_info "域名解析正确 ✓"
    fi
}

# 检查 Nginx 是否运行
check_nginx() {
    print_step "检查 Nginx 状态..."
    
    if systemctl is-active --quiet nginx; then
        print_info "系统 Nginx 正在运行"
        NGINX_TYPE="system"
        return 0
    elif docker ps | grep -q nginx; then
        print_info "Docker Nginx 正在运行"
        NGINX_TYPE="docker"
        return 0
    else
        print_warn "未检测到运行中的 Nginx"
        NGINX_TYPE="none"
        return 1
    fi
}

# 检查 80 端口
check_port_80() {
    print_step "检查 80 端口..."
    
    if netstat -tlnp | grep -q ":80 "; then
        print_info "80 端口已被占用（这是正常的）"
        netstat -tlnp | grep ":80 "
        return 0
    else
        print_warn "80 端口未被占用"
        return 1
    fi
}

# 配置 Nginx 以支持 Let's Encrypt 验证
configure_nginx_for_letsencrypt() {
    print_step "配置 Nginx 以支持 Let's Encrypt 验证..."
    
    # 检查是否为系统 Nginx
    if [ "$NGINX_TYPE" = "system" ]; then
        NGINX_CONF="/etc/nginx/nginx.conf"
        NGINX_SITES="/etc/nginx/conf.d"
    else
        print_info "使用 Docker Nginx，跳过系统 Nginx 配置"
        return 0
    fi
    
    # 创建 webroot 目录
    mkdir -p "$WEBROOT/.well-known/acme-challenge"
    chmod -R 755 "$WEBROOT/.well-known"
    
    print_info "Webroot 目录已创建: $WEBROOT/.well-known/acme-challenge"
    
    # 检查 Nginx 配置中是否已有 .well-known 配置
    if grep -r "\.well-known" /etc/nginx/ &> /dev/null; then
        print_info "Nginx 配置中已有 .well-known 路径配置"
    else
        print_warn "Nginx 配置中未找到 .well-known 路径配置"
        print_info "需要在 Nginx 配置中添加以下内容："
        echo ""
        echo "location ^~ /.well-known/acme-challenge/ {"
        echo "    root $WEBROOT;"
        echo "    allow all;"
        echo "}"
        echo ""
        read -p "是否自动添加配置? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            add_wellknown_config
        fi
    fi
}

# 添加 .well-known 配置到 Nginx
add_wellknown_config() {
    print_step "添加 .well-known 配置到 Nginx..."
    
    # 查找域名对应的配置文件
    local config_file=$(grep -rl "server_name.*$DOMAIN" /etc/nginx/ 2>/dev/null | head -n1)
    
    if [ -z "$config_file" ]; then
        print_warn "未找到域名 $DOMAIN 的 Nginx 配置文件"
        print_info "请手动添加配置"
        return 1
    fi
    
    print_info "找到配置文件: $config_file"
    
    # 备份配置文件
    cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "已备份配置文件"
    
    # 检查是否已有 .well-known 配置
    if grep -q "\.well-known" "$config_file"; then
        print_info "配置文件中已有 .well-known 配置"
        return 0
    fi
    
    # 在 server 块中添加 .well-known 配置
    # 查找 server { 后的第一个 location
    sed -i '/server {/a\    # Let'\''s Encrypt 验证路径\n    location ^~ /.well-known/acme-challenge/ {\n        root '"$WEBROOT"';\n        allow all;\n    }\n' "$config_file"
    
    print_info "已添加 .well-known 配置"
    
    # 测试 Nginx 配置
    if nginx -t; then
        print_info "Nginx 配置测试通过"
        # 重载 Nginx
        systemctl reload nginx
        print_info "Nginx 已重载"
    else
        print_error "Nginx 配置测试失败"
        # 恢复备份
        cp "$config_file.backup.$(date +%Y%m%d_%H%M%S)" "$config_file"
        print_info "已恢复配置文件"
        return 1
    fi
}

# 测试 webroot 访问
test_webroot_access() {
    print_step "测试 webroot 访问..."
    
    # 创建测试文件
    local test_file="$WEBROOT/.well-known/acme-challenge/test-$(date +%s).txt"
    echo "test" > "$test_file"
    
    # 测试访问
    local test_url="http://$DOMAIN/.well-known/acme-challenge/$(basename $test_file)"
    
    print_info "测试 URL: $test_url"
    
    if curl -f -s "$test_url" &> /dev/null; then
        print_info "Webroot 访问测试通过 ✓"
        rm -f "$test_file"
        return 0
    else
        print_error "Webroot 访问测试失败"
        print_info "请检查 Nginx 配置和防火墙设置"
        rm -f "$test_file"
        return 1
    fi
}

# 使用 Webroot 模式获取证书
get_certificate_webroot() {
    print_step "使用 Webroot 模式获取证书..."
    
    print_info "域名: $DOMAIN"
    print_info "Webroot: $WEBROOT"
    print_info "邮箱: $EMAIL"
    echo ""
    
    # 确认信息
    read -p "确认信息无误，继续获取证书? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "已取消"
        exit 0
    fi
    
    # 获取证书
    certbot certonly \
        --webroot \
        -w "$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        --verbose
    
    if [ $? -eq 0 ]; then
        print_info "证书获取成功 ✓"
        return 0
    else
        print_error "证书获取失败"
        return 1
    fi
}

# 复制证书到项目目录
copy_certificate() {
    print_step "复制证书到项目目录..."
    
    local cert_path="/etc/letsencrypt/live/$DOMAIN"
    
    if [ ! -d "$cert_path" ]; then
        print_error "证书目录不存在: $cert_path"
        return 1
    fi
    
    # 创建 SSL 目录
    mkdir -p "$SSL_DIR"
    
    # 复制证书文件
    cp "$cert_path/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "$cert_path/privkey.pem" "$SSL_DIR/key.pem"
    
    # 设置权限
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    print_info "证书已复制到: $SSL_DIR"
    
    # 显示证书信息
    print_info "证书信息:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -dates
}

# 配置自动续期
setup_auto_renew() {
    print_step "配置证书自动续期..."
    
    # 创建续期脚本
    cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
# Let's Encrypt 证书自动续期脚本

certbot renew --quiet --post-hook "systemctl reload nginx || (cd /www/wwwroot/exammaster.zzzjl.com && docker-compose restart nginx)"
EOF
    
    chmod +x /etc/cron.daily/certbot-renew
    
    print_info "自动续期已配置（每天检查一次）"
    
    # 测试续期
    print_info "测试续期配置..."
    if certbot renew --dry-run; then
        print_info "续期测试通过 ✓"
    else
        print_warn "续期测试失败，请检查配置"
    fi
}

# 显示摘要
show_summary() {
    echo ""
    echo "========================================"
    echo "  证书获取完成"
    echo "========================================"
    echo ""
    echo "证书位置: /etc/letsencrypt/live/$DOMAIN/"
    echo "项目证书: $SSL_DIR"
    echo ""
    echo "证书文件:"
    echo "  - cert.pem (证书)"
    echo "  - key.pem (私钥)"
    echo ""
    echo "下一步操作:"
    echo "1. 更新项目的 Nginx 配置以使用 HTTPS"
    echo "2. 重启项目的 Nginx 服务"
    echo "3. 访问 https://$DOMAIN 测试"
    echo ""
    echo "自动续期: 已配置（每天检查）"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  Let's Encrypt 证书获取脚本"
    echo "  (Webroot 模式 - 不影响现有服务)"
    echo "========================================"
    echo ""
    
    # 检查 root 权限
    check_root
    
    # 检查 certbot
    if ! check_certbot; then
        print_error "请先安装 certbot"
        exit 1
    fi
    
    # 检查域名解析
    check_domain
    
    # 检查 Nginx
    check_nginx
    
    # 检查 80 端口
    check_port_80
    
    # 配置 Nginx
    configure_nginx_for_letsencrypt
    
    # 测试 webroot 访问
    if ! test_webroot_access; then
        print_error "Webroot 访问测试失败，无法继续"
        print_info "请检查:"
        print_info "1. Nginx 配置中是否有 .well-known 路径配置"
        print_info "2. 防火墙是否开放 80 端口"
        print_info "3. 域名是否正确解析到服务器"
        exit 1
    fi
    
    # 获取证书
    if ! get_certificate_webroot; then
        print_error "证书获取失败"
        exit 1
    fi
    
    # 复制证书
    copy_certificate
    
    # 配置自动续期
    setup_auto_renew
    
    # 显示摘要
    show_summary
}

# 运行主函数
main
