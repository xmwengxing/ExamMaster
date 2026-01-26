#!/bin/bash

# 数据库表结构修复脚本
# 用于修复 PostgreSQL 迁移过程中缺失的字段和约束

set -e  # 遇到错误立即退出

echo "========================================"
echo "数据库表结构修复工具"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 步骤 1: 检查 Docker 容器状态
echo "[1/5] 检查 Docker 容器状态..."
if ! docker ps | grep -q edumaster_postgres; then
    echo -e "${YELLOW}⚠️  PostgreSQL 容器未运行，正在启动...${NC}"
    docker compose up -d postgres
    sleep 5
fi
echo -e "${GREEN}✅ PostgreSQL 容器运行中${NC}"
echo ""

# 步骤 2: 备份当前数据库
echo "[2/5] 备份当前数据库..."
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pre-fix-backup_$TIMESTAMP.sql"

docker exec edumaster_postgres pg_dump -U edumaster_user edumaster > "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✅ 备份完成: ${BACKUP_FILE}.gz${NC}"
else
    echo -e "${RED}❌ 备份失败${NC}"
    exit 1
fi
echo ""

# 步骤 3: 检查修复脚本是否存在
echo "[3/5] 检查修复脚本..."
if [ ! -f "postgres/fix-missing-columns.sql" ]; then
    echo -e "${RED}❌ 修复脚本不存在: postgres/fix-missing-columns.sql${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 修复脚本存在${NC}"
echo ""

# 步骤 4: 执行修复脚本
echo "[4/5] 执行修复脚本..."
echo -e "${YELLOW}正在修复数据库表结构...${NC}"

docker exec -i edumaster_postgres psql -U edumaster_user -d edumaster < postgres/fix-missing-columns.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 修复脚本执行成功${NC}"
else
    echo -e "${RED}❌ 修复失败${NC}"
    echo -e "${YELLOW}可以使用备份恢复: ${BACKUP_FILE}.gz${NC}"
    exit 1
fi
echo ""

# 步骤 5: 重启 API 服务器
echo "[5/5] 重启 API 服务器..."
docker compose restart api

# 等待服务启动
echo "等待服务启动..."
sleep 3

# 检查服务状态
if docker ps | grep -q edumaster_api; then
    echo -e "${GREEN}✅ API 服务器已重启${NC}"
else
    echo -e "${RED}❌ API 服务器启动失败${NC}"
    exit 1
fi
echo ""

# 完成
echo "========================================"
echo -e "${GREEN}✅ 修复完成！${NC}"
echo "========================================"
echo ""
echo "下一步："
echo "  1. 访问网站测试功能"
echo "  2. 检查错误日志: docker logs edumaster_api"
echo "  3. 检查数据库日志: docker logs edumaster_postgres"
echo ""
echo "如有问题，可使用备份恢复："
echo "  ./服务器脚本/restore.sh ${BACKUP_FILE}.gz"
echo ""
