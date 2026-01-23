# 服务器准备指南

本文档描述如何准备服务器环境以部署 EduMaster 系统。

## 服务器信息

- **IP 地址**: 47.104.173.139
- **操作系统**: CentOS 7.8
- **域名**: exammaster.zzzjl.com
- **部署目录**: /www/wwwroot/exammaster.zzzjl.com

## 任务 14.1: 连接到服务器并检查环境

### 方法 1: 使用自动检查脚本（推荐）

#### 在 Linux/Mac 上

```bash
# 1. 给脚本添加执行权限
chmod +x scripts/check-server-environment.sh

# 2. 通过 SSH 在服务器上执行检查
ssh root@47.104.173.139 'bash -s' < scripts/check-server-environment.sh
```

#### 在 Windows 上

```powershell
# 使用 PowerShell 脚本
.\scripts\check-server-environment.ps1 -ServerIP "47.104.173.139" -Username "root"
```

### 方法 2: 手动检查

#### 1. SSH 连接到服务器

```bash
ssh root@47.104.173.139
```

#### 2. 检查 Docker 是否已安装

```bash
docker --version
docker ps
```

**预期输出**: 显示 Docker 版本号（如 Docker version 20.10.x）

#### 3. 检查 Docker Compose 是否已安装

```bash
docker-compose --version
# 或
docker compose version
```

**预期输出**: 显示 Docker Compose 版本号（如 Docker Compose version v2.x.x）

#### 4. 检查 Git 是否已安装

```bash
git --version
```

**预期输出**: 显示 Git 版本号（如 git version 2.x.x）

#### 5. 检查端口是否可用

```bash
# 检查端口 80
ss -tuln | grep :80

# 检查端口 443
ss -tuln | grep :443

# 检查端口 5432
ss -tuln | grep :5432
```

**预期输出**: 
- 如果端口未被占用，不会有输出
- 如果端口被占用，会显示占用该端口的进程信息

**注意**: 如果端口 80 和 443 被占用，需要确认是否是其他网站服务。根据需求文档 7.1，部署不应影响服务器上的其他网站项目。

#### 6. 检查部署目录

```bash
# 检查目录是否存在
ls -la /www/wwwroot/

# 检查目录权限
stat /www/wwwroot/
```

**预期输出**: 
- 目录存在且当前用户有写权限
- 如果目录不存在，需要创建

#### 7. 检查防火墙状态

```bash
# CentOS 7 使用 firewalld
systemctl status firewalld

# 查看已开放的端口
firewall-cmd --list-ports
```

#### 8. 检查系统资源

```bash
# 检查磁盘空间
df -h

# 检查内存
free -h

# 检查 CPU
top -bn1 | head -20
```

### 检查结果示例

✅ **理想状态**:
- Docker 已安装并运行
- Docker Compose 已安装
- Git 已安装
- 端口 80, 443, 5432 可用（或仅被 Nginx 占用）
- /www/wwwroot 目录存在且可写
- 防火墙已开放 80 和 443 端口
- 磁盘空间充足（至少 10GB 可用）

⚠️ **需要处理的情况**:
- 缺少必要软件 → 执行任务 14.2 安装
- 端口被占用 → 需要停止占用端口的服务或修改配置
- 目录不存在 → 创建目录
- 防火墙未开放端口 → 配置防火墙规则

## 任务 14.2: 在服务器上安装必要的软件

### 方法 1: 使用自动安装脚本（推荐）

#### 1. 上传安装脚本到服务器

```bash
# 从本地上传脚本
scp scripts/install-server-dependencies.sh root@47.104.173.139:/tmp/

# 或者在服务器上直接下载
ssh root@47.104.173.139
curl -o /tmp/install-server-dependencies.sh https://raw.githubusercontent.com/xmwengxing/EduMaster_postgresql/main/scripts/install-server-dependencies.sh
```

#### 2. 在服务器上执行安装脚本

```bash
ssh root@47.104.173.139

# 添加执行权限
chmod +x /tmp/install-server-dependencies.sh

# 执行安装
/tmp/install-server-dependencies.sh
```

**脚本会自动完成**:
- ✅ 安装 Git
- ✅ 安装 Docker
- ✅ 安装 Docker Compose
- ✅ 启动 Docker 服务
- ✅ 配置防火墙（开放 80, 443 端口）
- ✅ 创建部署目录

### 方法 2: 手动安装

#### 1. 安装 Git

```bash
# CentOS 7
yum install -y git

# 验证安装
git --version
```

#### 2. 安装 Docker

```bash
# 移除旧版本
yum remove -y docker docker-client docker-client-latest docker-common \
    docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 仓库
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 如果官方源太慢，可以使用阿里云镜像
# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker
yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker ps
```

#### 3. 安装 Docker Compose

```bash
# 下载 Docker Compose（使用最新版本）
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 如果 GitHub 下载太慢，可以使用 DaoCloud 镜像
# curl -L "https://get.daocloud.io/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 创建软链接
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 4. 配置防火墙

```bash
# 检查防火墙状态
systemctl status firewalld

# 如果防火墙未运行，启动它
systemctl start firewalld
systemctl enable firewalld

# 开放端口 80 (HTTP)
firewall-cmd --permanent --add-port=80/tcp

# 开放端口 443 (HTTPS)
firewall-cmd --permanent --add-port=443/tcp

# 重载防火墙规则
firewall-cmd --reload

# 验证端口已开放
firewall-cmd --list-ports
```

#### 5. 创建部署目录

```bash
# 创建目录
mkdir -p /www/wwwroot

# 设置权限
chmod 755 /www/wwwroot

# 验证
ls -la /www/wwwroot
```

## 验证安装结果

安装完成后，再次运行检查脚本验证：

```bash
# Linux/Mac
ssh root@47.104.173.139 'bash -s' < scripts/check-server-environment.sh

# Windows PowerShell
.\scripts\check-server-environment.ps1 -ServerIP "47.104.173.139" -Username "root"
```

**预期结果**: 所有检查项都应该通过（绿色 ✓）

## 常见问题

### 1. SSH 连接失败

**问题**: `ssh: connect to host 47.104.173.139 port 22: Connection refused`

**解决方案**:
- 检查服务器 IP 是否正确
- 检查服务器是否在线
- 检查 SSH 端口是否开放（默认 22）
- 检查防火墙是否阻止了 SSH 连接

### 2. Docker 安装失败

**问题**: `Error: Package: docker-ce-xxx requires containerd.io >= 1.x.x`

**解决方案**:
```bash
# 先安装 containerd.io
yum install -y https://download.docker.com/linux/centos/7/x86_64/stable/Packages/containerd.io-1.6.9-3.1.el7.x86_64.rpm

# 然后再安装 Docker
yum install -y docker-ce docker-ce-cli
```

### 3. Docker Compose 下载慢

**问题**: GitHub 下载速度很慢或超时

**解决方案**: 使用国内镜像
```bash
# 使用 DaoCloud 镜像
curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 4. 端口被占用

**问题**: 端口 80 或 443 已被其他服务占用

**解决方案**:
```bash
# 查看占用端口的进程
lsof -i :80
lsof -i :443

# 如果是 Nginx 或 Apache，可以停止它们
systemctl stop nginx
systemctl stop httpd

# 或者修改 docker-compose.yml 使用其他端口
```

### 5. 权限问题

**问题**: `Permission denied` 错误

**解决方案**:
```bash
# 使用 root 用户或 sudo
sudo su -

# 或者将当前用户加入 docker 组
usermod -aG docker $USER
newgrp docker
```

## 下一步

完成服务器准备后，可以继续执行：
- **任务 15**: 配置 SSL 证书
- **任务 16**: 部署到服务器

## 相关文档

- [Docker 部署指南](DOCKER_DEPLOYMENT_GUIDE.md)
- [Nginx 配置指南](NGINX_CONFIGURATION_GUIDE.md)
- [任务列表](.kiro/specs/postgresql-migration-deployment/tasks.md)
