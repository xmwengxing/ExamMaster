#!/bin/bash

################################################################################
# EduMaster 自动部署脚本
# 
# 功能：
# - 自动拉取最新代码
# - 自动构建 Docker 镜像
# - 自动重启服务
# - 失败时自动回滚
#
# 使用方法：
#   ./scripts/deploy.sh [environment]
#
# 参数：
#   environment: 部署环境（production 或 development，默认为 production）
#
# 环境变量：
#   SERVER_HOST: 服务器地址
#   SERVER_USER: 服务器用户名
#   DEPLOY_PATH: 部署路径
#   ENVIRONMENT: 部署环境（可选，默认为 production）
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

# 获取部署环境
ENVIRONMENT=${ENVIRONMENT:-${1:-production}}

log_info "开始部署到 ${ENVIRONMENT} 环境..."

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

# 部署时间戳
DEPLOY_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/deploy_${DEPLOY_TIMESTAMP}"

log_info "部署时间戳: ${DEPLOY_TIMESTAMP}"
log_info "服务器: ${SERVER_USER}@${SERVER_HOST}"
log_info "部署路径: ${DEPLOY_PATH}"

# 在服务器上执行部署
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
set -e

# 进入部署目录
cd ${DEPLOY_PATH}

echo "========================================="
echo "步骤 1: 创建备份"
echo "========================================="

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 备份当前的 .env 文件
if [ -f .env ]; then
    cp .env ${BACKUP_DIR}/.env
    echo "✅ 已备份 .env 文件"
fi

# 备份当前的 Docker 镜像标签
if command -v docker &> /dev/null; then
    docker images --format "{{.Repository}}:{{.Tag}}" | grep edumaster > ${BACKUP_DIR}/docker_images.txt || true
    echo "✅ 已备份 Docker 镜像信息"
fi

# 记录当前的 Git commit
if [ -d .git ]; then
    git rev-parse HEAD > ${BACKUP_DIR}/git_commit.txt
    echo "✅ 已记录当前 Git commit"
fi

echo ""
echo "========================================="
echo "步骤 2: 拉取最新代码"
echo "========================================="

# 检查是否有未提交的更改
if [ -d .git ]; then
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  警告：检测到未提交的更改"
        git status
        # 暂存未提交的更改
        git stash save "Auto-stash before deploy ${DEPLOY_TIMESTAMP}"
        echo "✅ 已暂存未提交的更改"
    fi
    
    # 拉取最新代码
    echo "正在拉取最新代码..."
    git fetch origin
    
    # 根据环境切换分支
    if [ "${ENVIRONMENT}" = "production" ]; then
        git checkout main
        git pull origin main
    else
        git checkout develop
        git pull origin develop
    fi
    
    echo "✅ 代码更新完成"
    git log -1 --oneline
else
    echo "⚠️  警告：不是 Git 仓库，跳过代码拉取"
fi

echo ""
echo "========================================="
echo "步骤 3: 构建 Docker 镜像"
echo "========================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：Docker 未安装"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误：Docker Compose 未安装"
    exit 1
fi

# 构建新的 Docker 镜像
echo "正在构建 Docker 镜像..."
docker-compose build --no-cache

if [ \$? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 4: 停止旧服务"
echo "========================================="

# 检查服务是否正在运行
if docker-compose ps | grep -q "Up"; then
    echo "正在停止旧服务..."
    docker-compose down
    echo "✅ 旧服务已停止"
else
    echo "ℹ️  没有正在运行的服务"
fi

echo ""
echo "========================================="
echo "步骤 5: 启动新服务"
echo "========================================="

# 启动新服务
echo "正在启动新服务..."
docker-compose up -d

if [ \$? -eq 0 ]; then
    echo "✅ 新服务启动成功"
else
    echo "❌ 新服务启动失败，开始回滚..."
    
    # 回滚到之前的版本
    if [ -f ${BACKUP_DIR}/git_commit.txt ]; then
        old_commit=\$(cat ${BACKUP_DIR}/git_commit.txt)
        git checkout \$old_commit
        docker-compose build
        docker-compose up -d
        echo "✅ 已回滚到之前的版本"
    fi
    
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 6: 健康检查"
echo "========================================="

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查容器状态
echo "检查容器状态..."
docker-compose ps

# 检查所有容器是否都在运行
if docker-compose ps | grep -q "Exit"; then
    echo "❌ 检测到容器异常退出"
    docker-compose logs --tail=50
    
    # 回滚
    echo "开始回滚..."
    docker-compose down
    
    if [ -f ${BACKUP_DIR}/git_commit.txt ]; then
        old_commit=\$(cat ${BACKUP_DIR}/git_commit.txt)
        git checkout \$old_commit
        docker-compose build
        docker-compose up -d
        echo "✅ 已回滚到之前的版本"
    fi
    
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
    
    # 回滚
    echo "开始回滚..."
    docker-compose down
    
    if [ -f ${BACKUP_DIR}/git_commit.txt ]; then
        old_commit=\$(cat ${BACKUP_DIR}/git_commit.txt)
        git checkout \$old_commit
        docker-compose build
        docker-compose up -d
        echo "✅ 已回滚到之前的版本"
    fi
    
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 7: 清理旧镜像"
echo "========================================="

# 清理悬空的镜像
echo "清理悬空的 Docker 镜像..."
docker image prune -f

# 清理旧的备份（保留最近 5 次）
echo "清理旧的备份..."
cd backups
ls -t | tail -n +6 | xargs -r rm -rf
cd ..

echo "✅ 清理完成"

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo "部署时间: ${DEPLOY_TIMESTAMP}"
echo "环境: ${ENVIRONMENT}"
echo "Git commit: \$(git rev-parse --short HEAD)"
echo ""
echo "服务状态："
docker-compose ps
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
echo ""
echo "回滚命令（如需要）："
echo "  cd ${DEPLOY_PATH}"
echo "  git checkout \$(cat ${BACKUP_DIR}/git_commit.txt)"
echo "  docker-compose build && docker-compose up -d"
echo "========================================="

EOF

# 检查部署结果
if [ $? -eq 0 ]; then
    log_success "部署成功完成！"
    
    # 验证部署（如果是生产环境）
    if [ "${ENVIRONMENT}" = "production" ]; then
        log_info "验证生产环境部署..."
        sleep 5
        
        if curl -f https://exammaster.zzzjl.com/api/health > /dev/null 2>&1; then
            log_success "生产环境验证通过"
        else
            log_warning "生产环境验证失败，请手动检查"
        fi
    fi
    
    exit 0
else
    log_error "部署失败！"
    exit 1
fi
