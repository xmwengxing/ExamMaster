#!/bin/bash
# 简化的 Docker 安装脚本

echo "安装 Docker..."

# 1. 安装 Docker（不包含 compose plugin）
yum install -y docker-ce docker-ce-cli containerd.io --skip-broken --nogpgcheck

# 2. 启动 Docker
systemctl start docker
systemctl enable docker

# 3. 验证
docker --version

# 4. 手动安装 Docker Compose
echo ""
echo "安装 Docker Compose..."
curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 5. 验证
docker-compose --version

# 6. 配置防火墙
echo ""
echo "配置防火墙..."
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    echo "✓ 防火墙已配置"
fi

# 7. 创建目录
mkdir -p /www/wwwroot
chmod 755 /www/wwwroot

echo ""
echo "=========================================="
echo "✓ 安装完成！"
echo "=========================================="
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Git: $(git --version)"
