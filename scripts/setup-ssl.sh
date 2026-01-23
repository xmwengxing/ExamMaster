#!/bin/bash

# SSL 证书配置脚本
# 用于获取和配置 SSL 证书

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="exammaster.zzzjl.com"
SSL_DIR="./nginx/ssl"
EMAIL="admin@zzzjl.com"  # 用于 Let's Encrypt 通知

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

# 检查是否以 root 权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本"
        print_info "使用命令: sudo bash $0"
        exit 1
    fi
}

# 检查域名解析
check_domain() {
    print_info "检查域名解析..."
    
    # 获取域名的 IP 地址
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    
    if [ -z "$DOMAIN_IP" ]; then
        print_error "域名 $DOMAIN 无法解析"
        print_warn "请确保域名已正确配置 DNS 记录"
        return 1
    fi
    
    # 获取服务器的公网 IP
    SERVER_IP=$(curl -s ifconfig.me)
    
    print_info "域名 IP: $DOMAIN_IP"
    print_info "服务器 IP: $SERVER_IP"
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        print_warn "域名 IP 与服务器 IP 不匹配"
        print_warn "这可能导致 Let's Encrypt 验证失败"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_info "域名解析正确"
    fi
}

# 安装 certbot
install_certbot() {
    print_info "检查 certbot 是否已安装..."
    
    if command -v certbot &> /dev/null; then
        print_info "certbot 已安装"
        certbot --version
        return 0
    fi
    
    print_info "安装 certbot..."
    
    # 检测操作系统
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot
    elif [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot
    else
        print_error "不支持的操作系统"
        exit 1
    fi
    
    print_info "certbot 安装完成"
}

# 使用 Let's Encrypt 获取证书（Standalone 模式）
get_letsencrypt_standalone() {
    print_info "使用 Let's Encrypt Standalone 模式获取证书..."
    
    # 停止可能占用 80 端口的服务
    print_info "停止 Docker 容器（如果正在运行）..."
    docker-compose down 2>/dev/null || true
    
    # 获取证书
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --preferred-challenges http
    
    if [ $? -eq 0 ]; then
        print_info "证书获取成功"
        copy_letsencrypt_certs
    else
        print_error "证书获取失败"
        exit 1
    fi
}

# 使用 Let's Encrypt 获取证书（Webroot 模式）
get_letsencrypt_webroot() {
    print_info "使用 Let's Encrypt Webroot 模式获取证书..."
    
    # 确保 webroot 目录存在
    WEBROOT="/usr/share/nginx/html"
    mkdir -p "$WEBROOT/.well-known/acme-challenge"
    
    # 获取证书
    certbot certonly --webroot \
        -w "$WEBROOT" \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN"
    
    if [ $? -eq 0 ]; then
        print_info "证书获取成功"
        copy_letsencrypt_certs
    else
        print_error "证书获取失败"
        exit 1
    fi
}

# 复制 Let's Encrypt 证书到项目目录
copy_letsencrypt_certs() {
    print_info "复制证书文件到项目目录..."
    
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
    
    if [ ! -d "$CERT_PATH" ]; then
        print_error "证书目录不存在: $CERT_PATH"
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
    
    print_info "证书文件已复制到 $SSL_DIR"
    
    # 显示证书信息
    print_info "证书信息:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -dates
}

# 生成自签名证书（仅用于测试）
generate_self_signed() {
    print_warn "生成自签名证书（仅用于测试）..."
    
    mkdir -p "$SSL_DIR"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=EduMaster/CN=$DOMAIN"
    
    # 设置权限
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    print_warn "自签名证书已生成"
    print_warn "注意: 浏览器会显示安全警告，仅用于开发测试"
}

# 使用 Cloudflare Origin Certificate
setup_cloudflare_cert() {
    print_info "配置 Cloudflare Origin Certificate..."
    print_info ""
    print_info "请按照以下步骤操作:"
    print_info "1. 登录 Cloudflare 控制台"
    print_info "2. 选择域名 → SSL/TLS → Origin Server"
    print_info "3. 点击 'Create Certificate'"
    print_info "4. 选择证书有效期（推荐 15 年）"
    print_info "5. 复制证书和私钥内容"
    print_info ""
    
    mkdir -p "$SSL_DIR"
    
    # 输入证书
    print_info "请粘贴证书内容（包含 -----BEGIN CERTIFICATE----- 和 -----END CERTIFICATE-----）"
    print_info "输入完成后按 Ctrl+D:"
    cat > "$SSL_DIR/cert.pem"
    
    # 输入私钥
    print_info "请粘贴私钥内容（包含 -----BEGIN PRIVATE KEY----- 和 -----END PRIVATE KEY-----）"
    print_info "输入完成后按 Ctrl+D:"
    cat > "$SSL_DIR/key.pem"
    
    # 设置权限
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    print_info "Cloudflare 证书配置完成"
    
    # 验证证书
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -text &> /dev/null; then
        print_info "证书验证成功"
        openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -dates
    else
        print_error "证书验证失败，请检查证书内容"
        exit 1
    fi
}

# 验证证书配置
verify_cert() {
    print_info "验证证书配置..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_error "证书文件不存在"
        return 1
    fi
    
    # 检查证书格式
    if ! openssl x509 -in "$SSL_DIR/cert.pem" -noout -text &> /dev/null; then
        print_error "证书文件格式无效"
        return 1
    fi
    
    # 检查私钥格式
    if ! openssl rsa -in "$SSL_DIR/key.pem" -check -noout &> /dev/null 2>&1; then
        print_error "私钥文件格式无效"
        return 1
    fi
    
    # 检查证书和私钥是否匹配
    CERT_MODULUS=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    KEY_MODULUS=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [ "$CERT_MODULUS" != "$KEY_MODULUS" ]; then
        print_error "证书和私钥不匹配"
        return 1
    fi
    
    print_info "证书配置验证通过"
    
    # 显示证书信息
    print_info "证书信息:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -issuer -dates
    
    return 0
}

# 配置自动续期
setup_auto_renew() {
    print_info "配置证书自动续期..."
    
    # 创建续期脚本
    cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
# Let's Encrypt 证书自动续期脚本

certbot renew --quiet --post-hook "cd /www/wwwroot/exammaster.zzzjl.com && docker-compose restart nginx"
EOF
    
    chmod +x /etc/cron.daily/certbot-renew
    
    print_info "自动续期已配置（每天检查一次）"
    
    # 测试续期
    print_info "测试续期配置..."
    certbot renew --dry-run
}

# 主菜单
show_menu() {
    echo ""
    echo "=========================================="
    echo "  SSL 证书配置工具"
    echo "=========================================="
    echo "1. 使用 Let's Encrypt（Standalone 模式）"
    echo "2. 使用 Let's Encrypt（Webroot 模式）"
    echo "3. 使用 Cloudflare Origin Certificate"
    echo "4. 生成自签名证书（仅测试）"
    echo "5. 验证现有证书"
    echo "6. 配置自动续期"
    echo "0. 退出"
    echo "=========================================="
    echo ""
}

# 主函数
main() {
    print_info "SSL 证书配置脚本"
    print_info "域名: $DOMAIN"
    print_info "SSL 目录: $SSL_DIR"
    echo ""
    
    while true; do
        show_menu
        read -p "请选择操作 [0-6]: " choice
        
        case $choice in
            1)
                check_root
                check_domain
                install_certbot
                get_letsencrypt_standalone
                setup_auto_renew
                verify_cert
                print_info "完成！现在可以启动 Docker 容器了"
                break
                ;;
            2)
                check_root
                check_domain
                install_certbot
                get_letsencrypt_webroot
                setup_auto_renew
                verify_cert
                break
                ;;
            3)
                setup_cloudflare_cert
                verify_cert
                break
                ;;
            4)
                generate_self_signed
                verify_cert
                break
                ;;
            5)
                verify_cert
                ;;
            6)
                check_root
                setup_auto_renew
                ;;
            0)
                print_info "退出"
                exit 0
                ;;
            *)
                print_error "无效的选择"
                ;;
        esac
    done
}

# 运行主函数
main
