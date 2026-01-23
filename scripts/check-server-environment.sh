#!/bin/bash

# 服务器环境检查脚本
# 用于检查服务器是否满足部署要求

echo "=========================================="
echo "EduMaster 服务器环境检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN_COUNT++))
}

echo "1. 系统信息检查"
echo "----------------------------------------"
echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "内核版本: $(uname -r)"
echo "主机名: $(hostname)"
echo "IP 地址: $(hostname -I | awk '{print $1}')"
echo ""

echo "2. Docker 检查"
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    check_pass "Docker 已安装 (版本: $DOCKER_VERSION)"
    
    # 检查 Docker 服务状态
    if systemctl is-active --quiet docker; then
        check_pass "Docker 服务正在运行"
    else
        check_fail "Docker 服务未运行"
    fi
    
    # 检查 Docker 权限
    if docker ps &> /dev/null; then
        check_pass "Docker 权限正常"
    else
        check_warn "当前用户可能没有 Docker 权限，需要 sudo 或加入 docker 组"
    fi
else
    check_fail "Docker 未安装"
fi
echo ""

echo "3. Docker Compose 检查"
echo "----------------------------------------"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    check_pass "Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    check_pass "Docker Compose (插件) 已安装 (版本: $COMPOSE_VERSION)"
else
    check_fail "Docker Compose 未安装"
fi
echo ""

echo "4. Git 检查"
echo "----------------------------------------"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    check_pass "Git 已安装 (版本: $GIT_VERSION)"
else
    check_fail "Git 未安装"
fi
echo ""

echo "5. 端口检查"
echo "----------------------------------------"
# 检查端口 80
if netstat -tuln 2>/dev/null | grep -q ":80 " || ss -tuln 2>/dev/null | grep -q ":80 "; then
    check_warn "端口 80 已被占用"
    echo "   占用进程: $(lsof -i :80 2>/dev/null | tail -n +2 | awk '{print $1}' | uniq || echo '无法确定')"
else
    check_pass "端口 80 可用"
fi

# 检查端口 443
if netstat -tuln 2>/dev/null | grep -q ":443 " || ss -tuln 2>/dev/null | grep -q ":443 "; then
    check_warn "端口 443 已被占用"
    echo "   占用进程: $(lsof -i :443 2>/dev/null | tail -n +2 | awk '{print $1}' | uniq || echo '无法确定')"
else
    check_pass "端口 443 可用"
fi

# 检查端口 5432
if netstat -tuln 2>/dev/null | grep -q ":5432 " || ss -tuln 2>/dev/null | grep -q ":5432 "; then
    check_warn "端口 5432 已被占用"
    echo "   占用进程: $(lsof -i :5432 2>/dev/null | tail -n +2 | awk '{print $1}' | uniq || echo '无法确定')"
else
    check_pass "端口 5432 可用"
fi
echo ""

echo "6. 目录权限检查"
echo "----------------------------------------"
TARGET_DIR="/www/wwwroot"

if [ -d "$TARGET_DIR" ]; then
    check_pass "目录 $TARGET_DIR 存在"
    
    # 检查写权限
    if [ -w "$TARGET_DIR" ]; then
        check_pass "目录 $TARGET_DIR 可写"
    else
        check_warn "目录 $TARGET_DIR 不可写，可能需要 sudo 权限"
    fi
    
    # 显示目录信息
    echo "   所有者: $(stat -c '%U:%G' $TARGET_DIR 2>/dev/null || stat -f '%Su:%Sg' $TARGET_DIR 2>/dev/null)"
    echo "   权限: $(stat -c '%a' $TARGET_DIR 2>/dev/null || stat -f '%A' $TARGET_DIR 2>/dev/null)"
else
    check_fail "目录 $TARGET_DIR 不存在"
fi
echo ""

echo "7. 防火墙检查"
echo "----------------------------------------"
if command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld; then
        check_pass "firewalld 正在运行"
        
        # 检查端口是否开放
        if firewall-cmd --list-ports 2>/dev/null | grep -q "80/tcp"; then
            check_pass "防火墙已开放端口 80"
        else
            check_warn "防火墙未开放端口 80"
        fi
        
        if firewall-cmd --list-ports 2>/dev/null | grep -q "443/tcp"; then
            check_pass "防火墙已开放端口 443"
        else
            check_warn "防火墙未开放端口 443"
        fi
    else
        check_warn "firewalld 未运行"
    fi
elif command -v ufw &> /dev/null; then
    if ufw status 2>/dev/null | grep -q "Status: active"; then
        check_pass "ufw 正在运行"
        
        if ufw status 2>/dev/null | grep -q "80/tcp"; then
            check_pass "防火墙已开放端口 80"
        else
            check_warn "防火墙未开放端口 80"
        fi
        
        if ufw status 2>/dev/null | grep -q "443/tcp"; then
            check_pass "防火墙已开放端口 443"
        else
            check_warn "防火墙未开放端口 443"
        fi
    else
        check_warn "ufw 未激活"
    fi
else
    check_warn "未检测到防火墙管理工具 (firewalld/ufw)"
fi
echo ""

echo "8. 磁盘空间检查"
echo "----------------------------------------"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}')

echo "根分区使用率: ${DISK_USAGE}%"
echo "可用空间: ${DISK_AVAIL}"

if [ "$DISK_USAGE" -lt 80 ]; then
    check_pass "磁盘空间充足"
else
    check_warn "磁盘使用率较高 (${DISK_USAGE}%)"
fi
echo ""

echo "9. 内存检查"
echo "----------------------------------------"
TOTAL_MEM=$(free -h | grep Mem | awk '{print $2}')
AVAIL_MEM=$(free -h | grep Mem | awk '{print $7}')
echo "总内存: ${TOTAL_MEM}"
echo "可用内存: ${AVAIL_MEM}"
check_pass "内存信息已显示"
echo ""

echo "=========================================="
echo "检查结果汇总"
echo "=========================================="
echo -e "${GREEN}通过: ${PASS_COUNT}${NC}"
echo -e "${YELLOW}警告: ${WARN_COUNT}${NC}"
echo -e "${RED}失败: ${FAIL_COUNT}${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ 服务器环境检查完成，可以继续部署${NC}"
    exit 0
else
    echo -e "${RED}✗ 发现 ${FAIL_COUNT} 个问题，请先解决后再部署${NC}"
    exit 1
fi
