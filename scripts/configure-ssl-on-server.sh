#!/bin/bash

# 服务器端 SSL 证书配置脚本
# 用于在服务器上配置证书文件和权限

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"
SSL_DIR="$PROJECT_DIR/nginx/ssl"
DOMAIN="exammaster.zzzjl.com"

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

# 检查项目目录
check_project_dir() {
    print_step "检查项目目录..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "项目目录不存在: $PROJECT_DIR"
        print_info "请先部署项目代码"
        exit 1
    fi
    
    print_info "项目目录: $PROJECT_DIR"
}

# 创建 SSL 目录
create_ssl_dir() {
    print_step "创建 SSL 目录..."
    
    if [ ! -d "$SSL_DIR" ]; then
        mkdir -p "$SSL_DIR"
        print_info "已创建 SSL 目录: $SSL_DIR"
    else
        print_info "SSL 目录已存在: $SSL_DIR"
    fi
}

# 检查证书文件
check_cert_files() {
    print_step "检查证书文件..."
    
    local cert_exists=false
    local key_exists=false
    
    if [ -f "$SSL_DIR/cert.pem" ]; then
        print_info "证书文件存在: $SSL_DIR/cert.pem"
        cert_exists=true
    else
        print_warn "证书文件不存在: $SSL_DIR/cert.pem"
    fi
    
    if [ -f "$SSL_DIR/key.pem" ]; then
        print_info "私钥文件存在: $SSL_DIR/key.pem"
        key_exists=true
    else
        print_warn "私钥文件不存在: $SSL_DIR/key.pem"
    fi
    
    if [ "$cert_exists" = true ] && [ "$key_exists" = true ]; then
        return 0
    else
        return 1
    fi
}

# 从 Let's Encrypt 复制证书
copy_letsencrypt_certs() {
    print_step "从 Let's Encrypt 复制证书..."
    
    local le_dir="/etc/letsencrypt/live/$DOMAIN"
    
    if [ ! -d "$le_dir" ]; then
        print_error "Let's Encrypt 证书目录不存在: $le_dir"
        print_info "请先使用 certbot 获取证书"
        return 1
    fi
    
    # 复制证书文件
    cp "$le_dir/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "$le_dir/privkey.pem" "$SSL_DIR/key.pem"
    
    print_info "证书已复制到 $SSL_DIR"
    return 0
}

# 设置证书文件权限
set_cert_permissions() {
    print_step "设置证书文件权限..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_error "证书文件不存在，无法设置权限"
        return 1
    fi
    
    # 设置目录权限
    chmod 755 "$SSL_DIR"
    print_info "SSL 目录权限: 755"
    
    # 设置证书文件权限（可读）
    chmod 644 "$SSL_DIR/cert.pem"
    print_info "证书文件权限: 644 (可读)"
    
    # 设置私钥文件权限（仅所有者可读）
    chmod 600 "$SSL_DIR/key.pem"
    print_info "私钥文件权限: 600 (仅所有者可读)"
    
    # 设置所有者
    chown -R root:root "$SSL_DIR"
    print_info "文件所有者: root:root"
    
    return 0
}

# 验证证书
verify_cert() {
    print_step "验证证书..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_error "证书文件不存在"
        return 1
    fi
    
    # 检查 OpenSSL
    if ! command -v openssl &> /dev/null; then
        print_warn "OpenSSL 未安装，跳过证书验证"
        return 0
    fi
    
    # 验证证书格式
    if ! openssl x509 -in "$SSL_DIR/cert.pem" -noout -text &> /dev/null; then
        print_error "证书文件格式无效"
        return 1
    fi
    
    # 验证私钥格式
    if ! openssl rsa -in "$SSL_DIR/key.pem" -check -noout &> /dev/null 2>&1; then
        print_error "私钥文件格式无效"
        return 1
    fi
    
    # 检查证书和私钥是否匹配
    local cert_modulus=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        print_error "证书和私钥不匹配"
        return 1
    fi
    
    print_info "证书验证通过"
    
    # 显示证书信息
    echo ""
    print_info "证书信息:"
    echo "----------------------------------------"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -issuer -dates
    echo "----------------------------------------"
    echo ""
    
    return 0
}

# 更新 nginx 配置中的证书路径
update_nginx_config() {
    print_step "检查 Nginx 配置..."
    
    local nginx_conf="$PROJECT_DIR/nginx/nginx.conf"
    
    if [ ! -f "$nginx_conf" ]; then
        print_warn "Nginx 配置文件不存在: $nginx_conf"
        return 0
    fi
    
    # 检查证书路径配置
    if grep -q "ssl_certificate /etc/nginx/ssl/cert.pem" "$nginx_conf" && \
       grep -q "ssl_certificate_key /etc/nginx/ssl/key.pem" "$nginx_conf"; then
        print_info "Nginx 配置中的证书路径正确"
    else
        print_warn "Nginx 配置中的证书路径可能不正确"
        print_info "请确保配置文件中包含:"
        echo "  ssl_certificate /etc/nginx/ssl/cert.pem;"
        echo "  ssl_certificate_key /etc/nginx/ssl/key.pem;"
    fi
}

# 测试 Nginx 配置
test_nginx_config() {
    print_step "测试 Nginx 配置..."
    
    cd "$PROJECT_DIR"
    
    # 检查 Docker 是否运行
    if ! docker-compose ps | grep -q "nginx"; then
        print_warn "Nginx 容器未运行，跳过配置测试"
        return 0
    fi
    
    # 测试 Nginx 配置
    if docker-compose exec -T nginx nginx -t &> /dev/null; then
        print_info "Nginx 配置测试通过"
    else
        print_error "Nginx 配置测试失败"
        docker-compose exec -T nginx nginx -t
        return 1
    fi
}

# 重启 Nginx
restart_nginx() {
    print_step "重启 Nginx..."
    
    cd "$PROJECT_DIR"
    
    # 检查 Docker Compose 是否可用
    if ! command -v docker-compose &> /dev/null; then
        print_warn "docker-compose 未安装，跳过重启"
        return 0
    fi
    
    # 重启 Nginx 容器
    if docker-compose restart nginx; then
        print_info "Nginx 已重启"
        
        # 等待容器启动
        sleep 3
        
        # 检查容器状态
        if docker-compose ps | grep -q "nginx.*Up"; then
            print_info "Nginx 容器运行正常"
        else
            print_error "Nginx 容器启动失败"
            docker-compose logs nginx
            return 1
        fi
    else
        print_error "Nginx 重启失败"
        return 1
    fi
}

# 测试 HTTPS 访问
test_https() {
    print_step "测试 HTTPS 访问..."
    
    # 测试本地 HTTPS 连接
    if curl -k -I https://localhost &> /dev/null; then
        print_info "本地 HTTPS 访问正常"
    else
        print_warn "本地 HTTPS 访问失败"
    fi
    
    # 测试域名 HTTPS 连接
    if curl -I https://$DOMAIN &> /dev/null; then
        print_info "域名 HTTPS 访问正常"
    else
        print_warn "域名 HTTPS 访问失败"
        print_info "请检查防火墙和域名解析"
    fi
}

# 显示配置摘要
show_summary() {
    echo ""
    echo "========================================"
    echo "  SSL 证书配置完成"
    echo "========================================"
    echo ""
    echo "证书位置: $SSL_DIR"
    echo "证书文件: cert.pem (权限: 644)"
    echo "私钥文件: key.pem (权限: 600)"
    echo ""
    echo "下一步操作:"
    echo "1. 访问 https://$DOMAIN 测试 HTTPS"
    echo "2. 使用 SSL Labs 测试 SSL 配置:"
    echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo "3. 配置证书自动续期（如果使用 Let's Encrypt）"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  服务器端 SSL 证书配置脚本"
    echo "========================================"
    echo ""
    
    # 检查 root 权限
    check_root
    
    # 检查项目目录
    check_project_dir
    
    # 创建 SSL 目录
    create_ssl_dir
    
    # 检查证书文件
    if ! check_cert_files; then
        print_warn "证书文件不存在"
        
        # 询问是否从 Let's Encrypt 复制
        read -p "是否从 Let's Encrypt 复制证书? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! copy_letsencrypt_certs; then
                print_error "无法复制 Let's Encrypt 证书"
                print_info "请手动将证书文件放置到 $SSL_DIR"
                print_info "  - cert.pem (证书)"
                print_info "  - key.pem (私钥)"
                exit 1
            fi
        else
            print_info "请手动将证书文件放置到 $SSL_DIR"
            print_info "  - cert.pem (证书)"
            print_info "  - key.pem (私钥)"
            exit 1
        fi
    fi
    
    # 设置证书文件权限
    if ! set_cert_permissions; then
        print_error "设置权限失败"
        exit 1
    fi
    
    # 验证证书
    if ! verify_cert; then
        print_error "证书验证失败"
        exit 1
    fi
    
    # 更新 Nginx 配置
    update_nginx_config
    
    # 测试 Nginx 配置
    test_nginx_config
    
    # 询问是否重启 Nginx
    read -p "是否重启 Nginx 容器? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_nginx
        test_https
    fi
    
    # 显示配置摘要
    show_summary
}

# 运行主函数
main
