#!/bin/bash

# Docker 安装脚本 - 使用阿里云镜像
# 适用于 CentOS 7

set -e

echo "=========================================="
echo "安装 Docker (使用阿里云镜像)"
echo "=========================================="
echo ""

# 1. 移除旧版本
echo "1. 移除旧版本 Docker..."
yum remove -y docker docker-client docker-client-latest docker-common \
    docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true

# 2. 安装依赖
echo ""
echo "2. 安装依赖包..."
yum install -y yum-utils device-mapper-persistent-data lvm2

# 3. 清理旧的 repo
echo ""
echo "3. 清理旧的 Docker 仓库..."
rm -f /etc/yum.repos.d/docker-ce.repo

# 4. 添加阿里云 Docker 仓库
echo ""
echo "4. 添加阿里云 Docker 仓库..."
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 5. 清理缓存
echo ""
echo "5. 清理 yum 缓存..."
yum clean all
yum makecache fast

# 6. 安装 Docker
echo ""
echo "6. 安装 Docker CE..."
yum install -y docker-ce docker-ce-cli containerd.io

# 7. 启动 Docker
echo ""
echo "7. 启动 Docker 服务..."
systemctl start docker
systemctl enable docker

# 8. 验证安装
echo ""
echo "8. 验证 Docker 安装..."
docker --version

echo ""
echo "=========================================="
echo "✓ Docker 安装完成！"
echo "=========================================="
echo ""

# 9. 安装 Docker Compose
echo "=========================================="
echo "安装 Docker Compose"
echo "=========================================="
echo ""

COMPOSE_VERSION="v2.24.0"

echo "下载 Docker Compose ${COMPOSE_VERSION}..."
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null || \
curl -L "https://get.daocloud.io/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo ""
echo "验证 Docker Compose 安装..."
docker-compose --version

echo ""
echo "=========================================="
echo "✓ Docker Compose 安装完成！"
echo "=========================================="
echo ""

# 10. 配置防火墙
echo "=========================================="
echo "配置防火墙"
echo "=========================================="
echo ""

if systemctl is-active --quiet firewalld; then
    echo "开放端口 80..."
    firewall-cmd --permanent --add-port=80/tcp
    
    echo "开放端口 443..."
    firewall-cmd --permanent --add-port=443/tcp
    
    echo "重载防火墙..."
    firewall-cmd --reload
    
    echo "✓ 防火墙配置完成"
else
    echo "⚠ firewalld 未运行，跳过防火墙配置"
fi

echo ""

# 11. 创建部署目录
echo "=========================================="
echo "创建部署目录"
echo "=========================================="
echo ""

mkdir -p /www/wwwroot
chmod 755 /www/wwwroot
echo "✓ 目录 /www/wwwroot 已创建"

echo ""
echo "=========================================="
echo "✓ 所有安装完成！"
echo "=========================================="
echo ""
echo "已安装："
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker-compose --version)"
echo "  - Git: $(git --version)"
echo ""
echo "下一步："
echo "  1. 配置 SSL 证书"
echo "  2. 部署应用"
echo ""
