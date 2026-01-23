#!/bin/bash

# SSL 证书验证脚本
# 用于验证 SSL 证书配置是否正确

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SSL_DIR="./nginx/ssl"
DOMAIN="exammaster.zzzjl.com"

# 计数器
PASSED=0
FAILED=0
WARNINGS=0

# 打印带颜色的消息
print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
}

# 检查证书文件是否存在
check_files_exist() {
    print_section "检查证书文件"
    
    if [ -f "$SSL_DIR/cert.pem" ]; then
        print_pass "证书文件存在: $SSL_DIR/cert.pem"
    else
        print_fail "证书文件不存在: $SSL_DIR/cert.pem"
        return 1
    fi
    
    if [ -f "$SSL_DIR/key.pem" ]; then
        print_pass "私钥文件存在: $SSL_DIR/key.pem"
    else
        print_fail "私钥文件不存在: $SSL_DIR/key.pem"
        return 1
    fi
    
    return 0
}

# 检查文件权限
check_permissions() {
    print_section "检查文件权限"
    
    # 检查证书文件权限
    local cert_perm=$(stat -c "%a" "$SSL_DIR/cert.pem" 2>/dev/null || stat -f "%A" "$SSL_DIR/cert.pem" 2>/dev/null)
    if [ "$cert_perm" = "644" ] || [ "$cert_perm" = "0644" ]; then
        print_pass "证书文件权限正确: $cert_perm"
    else
        print_warn "证书文件权限不是 644: $cert_perm"
        print_info "建议执行: chmod 644 $SSL_DIR/cert.pem"
    fi
    
    # 检查私钥文件权限
    local key_perm=$(stat -c "%a" "$SSL_DIR/key.pem" 2>/dev/null || stat -f "%A" "$SSL_DIR/key.pem" 2>/dev/null)
    if [ "$key_perm" = "600" ] || [ "$key_perm" = "0600" ]; then
        print_pass "私钥文件权限正确: $key_perm"
    else
        print_warn "私钥文件权限不是 600: $key_perm"
        print_info "建议执行: chmod 600 $SSL_DIR/key.pem"
    fi
}

# 检查 OpenSSL
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        print_warn "OpenSSL 未安装，跳过证书验证"
        return 1
    fi
    return 0
}

# 验证证书格式
check_cert_format() {
    print_section "验证证书格式"
    
    if ! check_openssl; then
        return 0
    fi
    
    # 验证证书格式
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -text &> /dev/null; then
        print_pass "证书文件格式有效"
    else
        print_fail "证书文件格式无效"
        return 1
    fi
    
    # 验证私钥格式
    if openssl rsa -in "$SSL_DIR/key.pem" -check -noout &> /dev/null 2>&1; then
        print_pass "私钥文件格式有效"
    else
        print_fail "私钥文件格式无效"
        return 1
    fi
    
    return 0
}

# 检查证书和私钥是否匹配
check_cert_key_match() {
    print_section "验证证书和私钥匹配"
    
    if ! check_openssl; then
        return 0
    fi
    
    local cert_modulus=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" 2>/dev/null | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" = "$key_modulus" ]; then
        print_pass "证书和私钥匹配"
    else
        print_fail "证书和私钥不匹配"
        print_info "证书 MD5: $cert_modulus"
        print_info "私钥 MD5: $key_modulus"
        return 1
    fi
    
    return 0
}

# 检查证书信息
check_cert_info() {
    print_section "证书信息"
    
    if ! check_openssl; then
        return 0
    fi
    
    # 获取证书信息
    local subject=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject 2>/dev/null | sed 's/subject=//')
    local issuer=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -issuer 2>/dev/null | sed 's/issuer=//')
    local not_before=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -startdate 2>/dev/null | sed 's/notBefore=//')
    local not_after=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -enddate 2>/dev/null | sed 's/notAfter=//')
    
    print_info "主题: $subject"
    print_info "颁发者: $issuer"
    print_info "生效时间: $not_before"
    print_info "过期时间: $not_after"
    
    # 检查证书是否过期
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -checkend 0 &> /dev/null; then
        print_pass "证书未过期"
    else
        print_fail "证书已过期"
        return 1
    fi
    
    # 检查证书是否即将过期（30天内）
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -checkend 2592000 &> /dev/null; then
        print_pass "证书有效期充足（超过 30 天）"
    else
        print_warn "证书即将过期（少于 30 天）"
    fi
    
    # 检查证书域名
    local cn=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject 2>/dev/null | grep -oP 'CN\s*=\s*\K[^,]+')
    if [ "$cn" = "$DOMAIN" ] || [ "$cn" = "localhost" ]; then
        print_pass "证书域名: $cn"
    else
        print_warn "证书域名 ($cn) 与配置域名 ($DOMAIN) 不匹配"
    fi
    
    # 检查是否为自签名证书
    if [ "$subject" = "$issuer" ]; then
        print_warn "这是一个自签名证书（仅用于测试）"
    else
        print_pass "证书由受信任的 CA 签发"
    fi
    
    return 0
}

# 检查证书链
check_cert_chain() {
    print_section "验证证书链"
    
    if ! check_openssl; then
        return 0
    fi
    
    # 计算证书数量
    local cert_count=$(grep -c "BEGIN CERTIFICATE" "$SSL_DIR/cert.pem")
    
    if [ "$cert_count" -gt 1 ]; then
        print_pass "证书链完整（包含 $cert_count 个证书）"
    else
        print_warn "证书链可能不完整（只有 $cert_count 个证书）"
        print_info "建议使用完整的证书链（fullchain.pem）"
    fi
}

# 检查 Nginx 配置
check_nginx_config() {
    print_section "检查 Nginx 配置"
    
    local nginx_conf="./nginx/nginx.conf"
    
    if [ ! -f "$nginx_conf" ]; then
        print_warn "Nginx 配置文件不存在: $nginx_conf"
        return 0
    fi
    
    # 检查证书路径配置
    if grep -q "ssl_certificate /etc/nginx/ssl/cert.pem" "$nginx_conf"; then
        print_pass "Nginx 配置中的证书路径正确"
    else
        print_warn "Nginx 配置中的证书路径可能不正确"
    fi
    
    if grep -q "ssl_certificate_key /etc/nginx/ssl/key.pem" "$nginx_conf"; then
        print_pass "Nginx 配置中的私钥路径正确"
    else
        print_warn "Nginx 配置中的私钥路径可能不正确"
    fi
    
    # 检查 SSL 协议配置
    if grep -q "ssl_protocols TLSv1.2 TLSv1.3" "$nginx_conf"; then
        print_pass "SSL 协议配置正确（TLSv1.2, TLSv1.3）"
    else
        print_warn "SSL 协议配置可能不正确"
    fi
    
    # 检查 HSTS 配置
    if grep -q "Strict-Transport-Security" "$nginx_conf"; then
        print_pass "HSTS 已启用"
    else
        print_warn "HSTS 未启用"
    fi
}

# 测试 Docker 配置
check_docker_config() {
    print_section "检查 Docker 配置"
    
    local compose_file="./docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        print_warn "docker-compose.yml 文件不存在"
        return 0
    fi
    
    # 检查 SSL 目录挂载
    if grep -q "./nginx/ssl:/etc/nginx/ssl" "$compose_file"; then
        print_pass "Docker Compose 中的 SSL 目录挂载正确"
    else
        print_warn "Docker Compose 中的 SSL 目录挂载可能不正确"
    fi
}

# 测试 SSL 连接（如果服务正在运行）
test_ssl_connection() {
    print_section "测试 SSL 连接"
    
    if ! check_openssl; then
        return 0
    fi
    
    # 检查 Docker 是否运行
    if ! command -v docker &> /dev/null; then
        print_info "Docker 未安装，跳过连接测试"
        return 0
    fi
    
    if ! docker-compose ps 2>/dev/null | grep -q "nginx.*Up"; then
        print_info "Nginx 容器未运行，跳过连接测试"
        return 0
    fi
    
    # 测试本地 HTTPS 连接
    if timeout 5 openssl s_client -connect localhost:443 -servername $DOMAIN </dev/null &> /dev/null; then
        print_pass "本地 SSL 连接测试通过"
    else
        print_warn "本地 SSL 连接测试失败"
    fi
    
    # 测试域名 HTTPS 连接
    if timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null &> /dev/null; then
        print_pass "域名 SSL 连接测试通过"
    else
        print_info "域名 SSL 连接测试失败（可能是域名未解析或防火墙限制）"
    fi
}

# 显示摘要
show_summary() {
    print_section "验证摘要"
    
    echo ""
    echo "通过: $PASSED"
    echo "失败: $FAILED"
    echo "警告: $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}✓ 所有检查通过！${NC}"
            echo ""
            echo "SSL 证书配置正确，可以部署到生产环境。"
        else
            echo -e "${YELLOW}⚠ 检查通过，但有 $WARNINGS 个警告${NC}"
            echo ""
            echo "建议修复警告后再部署到生产环境。"
        fi
        return 0
    else
        echo -e "${RED}✗ 有 $FAILED 个检查失败${NC}"
        echo ""
        echo "请修复失败的检查项后再部署。"
        return 1
    fi
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  SSL 证书验证脚本"
    echo "========================================"
    echo ""
    echo "域名: $DOMAIN"
    echo "SSL 目录: $SSL_DIR"
    echo ""
    
    # 执行所有检查
    check_files_exist || true
    check_permissions || true
    check_cert_format || true
    check_cert_key_match || true
    check_cert_info || true
    check_cert_chain || true
    check_nginx_config || true
    check_docker_config || true
    test_ssl_connection || true
    
    # 显示摘要
    show_summary
}

# 运行主函数
main
