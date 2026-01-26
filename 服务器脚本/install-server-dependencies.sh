#!/bin/bash

# 服务器依赖安装脚本
# 用于在 CentOS 7.8 服务器上安装 Docker、Docker Compose 和 Git

set -e  # 遇到错误立即退出

echo "=========================================="
echo "EduMaster 服务器依赖安装"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ 请使用 root 用户或 sudo 运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}检测操作系统...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    echo "操作系统: $PRETTY_NAME"
else
    echo -e "${RED}✗ 无法检测操作系统${NC}"
    exit 1
fi
echo ""

# 1. 安装 Git
echo "=========================================="
echo "1. 安装 Git"
echo "=========================================="

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓ Git 已安装 (版本: $GIT_VERSION)${NC}"
else
    echo -e "${YELLOW}正在安装 Git...${NC}"
    
    if [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y git
    elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y git
    else
        echo -e "${RED}✗ 不支持的操作系统: $OS${NC}"
        exit 1
    fi
    
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        echo -e "${GREEN}✓ Git 安装成功 (版本: $GIT_VERSION)${NC}"
    else
        echo -e "${RED}✗ Git 安装失败${NC}"
        exit 1
    fi
fi
echo ""

# 2. 安装 Docker
echo "=========================================="
echo "2. 安装 Docker"
echo "=========================================="

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓ Docker 已安装 (版本: $DOCKER_VERSION)${NC}"
else
    echo -e "${YELLOW}正在安装 Docker...${NC}"
    
    if [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        # CentOS/RHEL 安装 Docker
        echo "移除旧版本 Docker..."
        yum remove -y docker docker-client docker-client-latest docker-common \
            docker-latest docker-latest-logrotate docker-logrotate docker-engine
        
        echo "安装依赖..."
        yum install -y yum-utils device-mapper-persistent-data lvm2
        
        echo "添加 Docker 仓库..."
        # 使用阿里云镜像（国内速度更快）
        yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
        
        echo "安装 Docker..."
        yum install -y docker-ce docker-ce-cli containerd.io
        
    elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        # Ubuntu/Debian 安装 Docker
        echo "移除旧版本 Docker..."
        apt-get remove -y docker docker-engine docker.io containerd runc
        
        echo "安装依赖..."
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        
        echo "添加 Docker GPG 密钥..."
        curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        echo "添加 Docker 仓库..."
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        echo "安装 Docker..."
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
    fi
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        echo -e "${GREEN}✓ Docker 安装成功 (版本: $DOCKER_VERSION)${NC}"
    else
        echo -e "${RED}✗ Docker 安装失败${NC}"
        exit 1
    fi
fi

# 启动 Docker 服务
echo -e "${YELLOW}启动 Docker 服务...${NC}"
systemctl start docker
systemctl enable docker

if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker 服务已启动${NC}"
else
    echo -e "${RED}✗ Docker 服务启动失败${NC}"
    exit 1
fi
echo ""

# 3. 安装 Docker Compose
echo "=========================================="
echo "3. 安装 Docker Compose"
echo "=========================================="

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓ Docker Compose 已安装 (版本: $COMPOSE_VERSION)${NC}"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo -e "${GREEN}✓ Docker Compose (插件) 已安装 (版本: $COMPOSE_VERSION)${NC}"
else
    echo -e "${YELLOW}正在安装 Docker Compose...${NC}"
    
    # 获取最新版本号
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    if [ -z "$COMPOSE_VERSION" ]; then
        echo -e "${YELLOW}⚠ 无法获取最新版本，使用默认版本 v2.24.0${NC}"
        COMPOSE_VERSION="v2.24.0"
    fi
    
    echo "下载 Docker Compose $COMPOSE_VERSION..."
    
    # 尝试从 GitHub 下载
    if curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose; then
        echo -e "${GREEN}✓ 下载成功${NC}"
    else
        echo -e "${YELLOW}⚠ GitHub 下载失败，尝试使用国内镜像...${NC}"
        # 使用 DaoCloud 镜像
        curl -L "https://get.daocloud.io/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    fi
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        echo -e "${GREEN}✓ Docker Compose 安装成功 (版本: $COMPOSE_VERSION)${NC}"
    else
        echo -e "${RED}✗ Docker Compose 安装失败${NC}"
        exit 1
    fi
fi
echo ""

# 4. 配置防火墙
echo "=========================================="
echo "4. 配置防火墙"
echo "=========================================="

if command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld; then
        echo -e "${YELLOW}配置 firewalld...${NC}"
        
        # 开放端口 80
        if firewall-cmd --list-ports | grep -q "80/tcp"; then
            echo -e "${GREEN}✓ 端口 80 已开放${NC}"
        else
            firewall-cmd --permanent --add-port=80/tcp
            echo -e "${GREEN}✓ 已开放端口 80${NC}"
        fi
        
        # 开放端口 443
        if firewall-cmd --list-ports | grep -q "443/tcp"; then
            echo -e "${GREEN}✓ 端口 443 已开放${NC}"
        else
            firewall-cmd --permanent --add-port=443/tcp
            echo -e "${GREEN}✓ 已开放端口 443${NC}"
        fi
        
        # 重载防火墙规则
        firewall-cmd --reload
        echo -e "${GREEN}✓ 防火墙规则已重载${NC}"
    else
        echo -e "${YELLOW}⚠ firewalld 未运行，跳过防火墙配置${NC}"
    fi
elif command -v ufw &> /dev/null; then
    echo -e "${YELLOW}配置 ufw...${NC}"
    
    # 开放端口 80
    ufw allow 80/tcp
    echo -e "${GREEN}✓ 已开放端口 80${NC}"
    
    # 开放端口 443
    ufw allow 443/tcp
    echo -e "${GREEN}✓ 已开放端口 443${NC}"
    
    # 如果 ufw 未激活，提示用户
    if ! ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}⚠ ufw 未激活，请手动执行: ufw enable${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未检测到防火墙管理工具${NC}"
fi
echo ""

# 5. 创建部署目录
echo "=========================================="
echo "5. 创建部署目录"
echo "=========================================="

TARGET_DIR="/www/wwwroot"

if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}创建目录 $TARGET_DIR...${NC}"
    mkdir -p "$TARGET_DIR"
    echo -e "${GREEN}✓ 目录创建成功${NC}"
else
    echo -e "${GREEN}✓ 目录 $TARGET_DIR 已存在${NC}"
fi

# 设置目录权限
chmod 755 "$TARGET_DIR"
echo -e "${GREEN}✓ 目录权限已设置${NC}"
echo ""

# 6. 验证安装
echo "=========================================="
echo "6. 验证安装"
echo "=========================================="

echo "Git 版本: $(git --version)"
echo "Docker 版本: $(docker --version)"
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose 版本: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    echo "Docker Compose 版本: $(docker compose version)"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✓ 所有依赖安装完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作:"
echo "1. 克隆项目代码到 $TARGET_DIR"
echo "2. 配置环境变量 (.env 文件)"
echo "3. 执行数据迁移"
echo "4. 启动 Docker 服务"
echo ""
