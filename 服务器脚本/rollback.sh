#!/bin/bash

################################################################################
# EduMaster 回滚脚本
# 
# 功能：
# - 回滚到指定的备份版本
# - 恢复 .env 文件
# - 恢复 Git commit
# - 重新构建和启动服务
#
# 使用方法：
#   ./scripts/rollback.sh [backup_timestamp]
#
# 参数：
#   backup_timestamp: 备份时间戳（可选，默认为最新备份）
#
# 环境变量：
#   SERVER_HOST: 服务器地址
#   SERVER_USER: 服务器用户名
#   DEPLOY_PATH: 部署路径
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取备份时间戳
BACKUP_TIMESTAMP=${1:-""}

log_info "开始回滚操作..."

# 检查必需的环境变量
if [ -z "$SERVER_HOST" ]; then
    log_error "未设置 SERVER_HOST 环境变量"
    exit 1
fi

if [ -z "$SERVER_USER" ]; then
    log_error "未设置 SERVER_USER 环境变量"
    exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
    log_error "未设置 DEPLOY_PATH 环境变量"
    exit 1
fi

log_info "服务器: ${SERVER_USER}@${SERVER_HOST}"
log_info "部署路径: ${DEPLOY_PATH}"

# 在服务器上执行回滚
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
set -e

# 进入部署目录
cd ${DEPLOY_PATH}

echo "========================================="
echo "步骤 1: 查找备份"
echo "========================================="

# 如果未指定备份时间戳，使用最新的备份
if [ -z "${BACKUP_TIMESTAMP}" ]; then
    BACKUP_DIR=\$(ls -t backups/ | grep "deploy_" | head -1)
    if [ -z "\$BACKUP_DIR" ]; then
        echo "❌ 错误：未找到备份"
        exit 1
    fi
    BACKUP_DIR="backups/\$BACKUP_DIR"
else
    BACKUP_DIR="backups/deploy_${BACKUP_TIMESTAMP}"
    if [ ! -d "\$BACKUP_DIR" ]; then
        echo "❌ 错误：备份不存在: \$BACKUP_DIR"
        exit 1
    fi
fi

echo "✅ 找到备份: \$BACKUP_DIR"

# 显示备份信息
if [ -f "\$BACKUP_DIR/git_commit.txt" ]; then
    echo "Git commit: \$(cat \$BACKUP_DIR/git_commit.txt)"
fi

echo ""
echo "========================================="
echo "步骤 2: 确认回滚"
echo "========================================="

echo "⚠️  警告：即将回滚到备份 \$BACKUP_DIR"
echo "当前 Git commit: \$(git rev-parse --short HEAD)"
echo ""
read -p "确认回滚？(yes/no): " confirm

if [ "\$confirm" != "yes" ]; then
    echo "❌ 回滚已取消"
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 3: 停止当前服务"
echo "========================================="

echo "正在停止当前服务..."
docker-compose down
echo "✅ 当前服务已停止"

echo ""
echo "========================================="
echo "步骤 4: 恢复代码"
echo "========================================="

# 恢复 Git commit
if [ -f "\$BACKUP_DIR/git_commit.txt" ]; then
    old_commit=\$(cat \$BACKUP_DIR/git_commit.txt)
    echo "正在恢复到 Git commit: \$old_commit"
    git checkout \$old_commit
    echo "✅ 代码已恢复"
else
    echo "⚠️  警告：未找到 Git commit 信息，跳过代码恢复"
fi

# 恢复 .env 文件
if [ -f "\$BACKUP_DIR/.env" ]; then
    echo "正在恢复 .env 文件..."
    cp \$BACKUP_DIR/.env .env
    echo "✅ .env 文件已恢复"
else
    echo "⚠️  警告：未找到 .env 备份，使用当前 .env 文件"
fi

echo ""
echo "========================================="
echo "步骤 5: 重新构建镜像"
echo "========================================="

echo "正在重新构建 Docker 镜像..."
docker-compose build

if [ \$? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 6: 启动服务"
echo "========================================="

echo "正在启动服务..."
docker-compose up -d

if [ \$? -eq 0 ]; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败"
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 7: 健康检查"
echo "========================================="

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查容器状态
echo "检查容器状态..."
docker-compose ps

# 检查是否有容器异常退出
if docker-compose ps | grep -q "Exit"; then
    echo "❌ 检测到容器异常退出"
    docker-compose logs --tail=50
    exit 1
fi

# 检查 API 健康状态
echo "检查 API 健康状态..."
max_retries=30
retry_count=0

while [ \$retry_count -lt \$max_retries ]; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ API 健康检查通过"
        break
    else
        retry_count=\$((retry_count + 1))
        echo "等待 API 启动... (\$retry_count/\$max_retries)"
        sleep 2
    fi
done

if [ \$retry_count -eq \$max_retries ]; then
    echo "❌ API 健康检查失败"
    docker-compose logs api --tail=50
    exit 1
fi

echo ""
echo "========================================="
echo "回滚完成！"
echo "========================================="
echo "备份: \$BACKUP_DIR"
echo "Git commit: \$(git rev-parse --short HEAD)"
echo ""
echo "服务状态："
docker-compose ps
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
echo "========================================="

EOF

# 检查回滚结果
if [ $? -eq 0 ]; then
    log_success "回滚成功完成！"
    
    # 验证回滚
    log_info "验证回滚..."
    sleep 5
    
    if curl -f https://exammaster.zzzjl.com/api/health > /dev/null 2>&1; then
        log_success "回滚验证通过"
    else
        log_warning "回滚验证失败，请手动检查"
    fi
    
    exit 0
else
    log_error "回滚失败！"
    exit 1
fi
