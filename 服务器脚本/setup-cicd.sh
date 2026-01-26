#!/bin/bash

################################################################################
# CI/CD 快速设置脚本
# 
# 功能：
# - 生成 SSH 密钥对
# - 配置 GitHub Secrets 说明
# - 验证配置
#
# 使用方法：
#   ./scripts/setup-cicd.sh
################################################################################

set -e

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

echo "========================================="
echo "CI/CD 快速设置向导"
echo "========================================="
echo ""

# 步骤 1：生成 SSH 密钥对
log_info "步骤 1: 生成 SSH 密钥对"
echo ""

SSH_KEY_PATH="$HOME/.ssh/github_actions_edumaster"

if [ -f "$SSH_KEY_PATH" ]; then
    log_warning "SSH 密钥已存在: $SSH_KEY_PATH"
    read -p "是否重新生成？(yes/no): " regenerate
    if [ "$regenerate" != "yes" ]; then
        log_info "跳过 SSH 密钥生成"
    else
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
        ssh-keygen -t ed25519 -C "github-actions-edumaster" -f "$SSH_KEY_PATH" -N ""
        log_success "SSH 密钥已重新生成"
    fi
else
    ssh-keygen -t ed25519 -C "github-actions-edumaster" -f "$SSH_KEY_PATH" -N ""
    log_success "SSH 密钥已生成"
fi

echo ""
log_info "SSH 私钥路径: $SSH_KEY_PATH"
log_info "SSH 公钥路径: $SSH_KEY_PATH.pub"
echo ""

# 步骤 2：显示公钥
log_info "步骤 2: 添加公钥到服务器"
echo ""
echo "请将以下公钥添加到服务器的 ~/.ssh/authorized_keys 文件："
echo ""
echo "----------------------------------------"
cat "$SSH_KEY_PATH.pub"
echo "----------------------------------------"
echo ""

read -p "服务器 IP 地址: " server_host
read -p "服务器用户名 (默认 root): " server_user
server_user=${server_user:-root}

echo ""
log_info "尝试添加公钥到服务器..."
ssh-copy-id -i "$SSH_KEY_PATH.pub" "$server_user@$server_host" || {
    log_warning "自动添加失败，请手动添加"
    echo ""
    echo "手动添加命令："
    echo "  ssh $server_user@$server_host"
    echo "  mkdir -p ~/.ssh"
    echo "  echo '$(cat $SSH_KEY_PATH.pub)' >> ~/.ssh/authorized_keys"
    echo "  chmod 600 ~/.ssh/authorized_keys"
    echo ""
}

# 步骤 3：测试 SSH 连接
echo ""
log_info "步骤 3: 测试 SSH 连接"
echo ""

if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$server_user@$server_host" "echo 'SSH 连接成功'"; then
    log_success "SSH 连接测试通过"
else
    log_error "SSH 连接测试失败"
    exit 1
fi

# 步骤 4：配置 GitHub Secrets
echo ""
log_info "步骤 4: 配置 GitHub Secrets"
echo ""

echo "请在 GitHub 仓库中配置以下 Secrets："
echo "(Settings → Secrets and variables → Actions → New repository secret)"
echo ""

echo "1. SSH_PRIVATE_KEY"
echo "   值："
echo "----------------------------------------"
cat "$SSH_KEY_PATH"
echo "----------------------------------------"
echo ""

echo "2. SERVER_HOST"
echo "   值: $server_host"
echo ""

echo "3. SERVER_USER"
echo "   值: $server_user"
echo ""

read -p "部署路径 (默认 /www/wwwroot/exammaster.zzzjl.com): " deploy_path
deploy_path=${deploy_path:-/www/wwwroot/exammaster.zzzjl.com}

echo "4. DEPLOY_PATH"
echo "   值: $deploy_path"
echo ""

# 步骤 5：生成配置摘要
echo ""
log_info "步骤 5: 配置摘要"
echo ""

cat > cicd-config.txt << EOF
CI/CD 配置摘要
生成时间: $(date)

SSH 密钥：
  私钥路径: $SSH_KEY_PATH
  公钥路径: $SSH_KEY_PATH.pub

服务器信息：
  主机: $server_host
  用户: $server_user
  部署路径: $deploy_path

GitHub Secrets 配置：
  SSH_PRIVATE_KEY: (见 $SSH_KEY_PATH)
  SERVER_HOST: $server_host
  SERVER_USER: $server_user
  DEPLOY_PATH: $deploy_path

下一步：
1. 在 GitHub 仓库中配置上述 Secrets
2. 推送代码到 main 分支触发自动部署
3. 在 GitHub Actions 页面查看部署进度

参考文档：
- GitHub Actions 配置: .github/README.md
- 部署指南: scripts/DEPLOYMENT_GUIDE.md
EOF

log_success "配置摘要已保存到 cicd-config.txt"
echo ""

# 步骤 6：验证配置
echo ""
log_info "步骤 6: 验证配置"
echo ""

log_info "检查 GitHub Actions 工作流文件..."
if [ -f ".github/workflows/ci-cd.yml" ]; then
    log_success "CI/CD 工作流文件存在"
else
    log_error "CI/CD 工作流文件不存在"
fi

if [ -f ".github/workflows/health-check.yml" ]; then
    log_success "健康检查工作流文件存在"
else
    log_warning "健康检查工作流文件不存在"
fi

log_info "检查部署脚本..."
if [ -f "scripts/deploy.sh" ]; then
    log_success "部署脚本存在"
    if [ -x "scripts/deploy.sh" ]; then
        log_success "部署脚本有执行权限"
    else
        log_warning "部署脚本没有执行权限，正在添加..."
        chmod +x scripts/deploy.sh
    fi
else
    log_error "部署脚本不存在"
fi

echo ""
echo "========================================="
echo "CI/CD 设置完成！"
echo "========================================="
echo ""
echo "配置文件已保存到: cicd-config.txt"
echo ""
echo "下一步："
echo "1. 在 GitHub 仓库中配置 Secrets"
echo "2. 推送代码到 main 分支"
echo "3. 在 GitHub Actions 页面查看部署进度"
echo ""
echo "参考文档："
echo "- .github/README.md"
echo "- scripts/DEPLOYMENT_GUIDE.md"
echo ""
