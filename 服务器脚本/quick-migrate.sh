#!/bin/bash
# ========================================
# EduMaster 快速迁移脚本
# 用于系统升级后快速恢复服务
# ========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EduMaster 快速迁移工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 检查系统版本
echo -e "${YELLOW}[1/8] 检查系统版本...${NC}"
if grep -q "Alibaba Cloud Linux" /etc/os-release; then
    echo -e "${GREEN}✅ 系统: Alibaba Cloud Linux${NC}"
else
    echo -e "${YELLOW}⚠️  警告: 非 Alibaba Cloud Linux 系统${NC}"
    read -p "是否继续? (y/n): " continue_install
    if [ "$continue_install" != "y" ]; then
        exit 0
    fi
fi

# 安装 Docker
echo -e "${YELLOW}[2/8] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    yum install -y yum-utils
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✅ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker 已安装: $(docker --version)${NC}"
fi

# 配置 Docker
echo -e "${YELLOW}[3/8] 配置 Docker...${NC}"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl daemon-reload
systemctl restart docker
echo -e "${GREEN}✅ Docker 配置完成${NC}"

# 安装 Node.js
echo -e "${YELLOW}[4/8] 安装 Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
    echo -e "${GREEN}✅ Node.js 安装完成: $(node --version)${NC}"
else
    echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"
fi

# 检查项目目录
PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"
echo -e "${YELLOW}[5/8] 检查项目目录...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 项目目录不存在: $PROJECT_DIR${NC}"
    echo "请先恢复网站数据"
    exit 1
fi
cd "$PROJECT_DIR"
echo -e "${GREEN}✅ 项目目录存在${NC}"

# 应用优化配置
echo -e "${YELLOW}[6/8] 应用优化配置...${NC}"

# 备份旧配置
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml "docker-compose.yml.backup.$(date +%s)"
fi
if [ -f ".env" ]; then
    cp .env ".env.backup.$(date +%s)"
fi

# 复制优化配置
if [ -f "服务器脚本/optimized-docker-compose.yml" ]; then
    cp 服务器脚本/optimized-docker-compose.yml docker-compose.yml
    echo -e "${GREEN}✅ Docker Compose 配置已更新${NC}"
else
    echo -e "${YELLOW}⚠️  优化配置文件不存在，使用现有配置${NC}"
fi

# 复制 PostgreSQL 优化配置
mkdir -p postgres
if [ -f "服务器脚本/postgresql-optimized.conf" ]; then
    cp 服务器脚本/postgresql-optimized.conf postgres/postgresql.conf
    echo -e "${GREEN}✅ PostgreSQL 配置已更新${NC}"
fi

# 创建数据目录
mkdir -p postgres_data
chown -R 999:999 postgres_data

echo -e "${GREEN}✅ 配置应用完成${NC}"

# 启动服务
echo -e "${YELLOW}[7/8] 启动服务...${NC}"
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo -e "${GREEN}✅ 服务已启动${NC}"
echo "等待服务就绪..."
sleep 30

# 验证服务
echo -e "${YELLOW}[8/8] 验证服务...${NC}"

# 检查容器状态
if docker ps | grep -q "edumaster_api"; then
    echo -e "${GREEN}✅ API 容器运行中${NC}"
else
    echo -e "${RED}❌ API 容器未运行${NC}"
    docker compose logs api --tail=20
    exit 1
fi

if docker ps | grep -q "edumaster_postgres"; then
    echo -e "${GREEN}✅ PostgreSQL 容器运行中${NC}"
else
    echo -e "${RED}❌ PostgreSQL 容器未运行${NC}"
    docker compose logs postgres --tail=20
    exit 1
fi

# 测试健康检查
if curl -s http://localhost:3001/api/health | grep -q "healthy\|ok"; then
    echo -e "${GREEN}✅ API 健康检查通过${NC}"
else
    echo -e "${RED}❌ API 健康检查失败${NC}"
    docker compose logs api --tail=20
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 迁移完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 服务状态:"
docker compose ps
echo ""
echo "🌐 访问地址: https://exammaster.zzzjl.com"
echo "🏥 健康检查: http://localhost:3001/api/health"
echo ""
echo "📊 查看日志:"
echo "  docker compose logs -f api"
echo "  docker compose logs -f postgres"
echo ""
echo "📈 监控资源:"
echo "  docker stats"
echo ""
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "1. 请更新宝塔 Nginx 配置（参考: 服务器脚本/宝塔Nginx优化配置.conf）"
echo "2. 测试所有功能是否正常"
echo "3. 监控性能指标"
echo "4. 配置定期备份"
echo ""
