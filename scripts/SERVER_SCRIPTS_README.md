# 服务器准备脚本使用说明

本目录包含用于准备服务器环境的自动化脚本。

## 快速开始

### Windows 用户（推荐）

双击运行批处理文件：

```
scripts\prepare-server.bat
```

或在 PowerShell 中运行：

```powershell
.\scripts\prepare-server.bat
```

### Linux/Mac 用户（推荐）

```bash
# 添加执行权限
chmod +x scripts/prepare-server.sh

# 运行脚本
./scripts/prepare-server.sh
```

## 脚本说明

### 1. 环境检查脚本

#### `check-server-environment.sh` (Linux/Mac)

检查服务器环境是否满足部署要求。

**使用方法**:

```bash
# 方法 1: 通过 SSH 远程执行
ssh root@47.104.173.139 'bash -s' < scripts/check-server-environment.sh

# 方法 2: 上传到服务器后执行
scp scripts/check-server-environment.sh root@47.104.173.139:/tmp/
ssh root@47.104.173.139
chmod +x /tmp/check-server-environment.sh
/tmp/check-server-environment.sh
```

**检查项目**:
- ✅ 系统信息（操作系统、内核、IP）
- ✅ Docker 安装和运行状态
- ✅ Docker Compose 安装
- ✅ Git 安装
- ✅ 端口占用（80, 443, 5432）
- ✅ 目录权限（/www/wwwroot）
- ✅ 防火墙配置
- ✅ 磁盘空间和内存

#### `check-server-environment.ps1` (Windows)

Windows PowerShell 版本的环境检查脚本。

**使用方法**:

```powershell
# 使用默认服务器地址
.\scripts\check-server-environment.ps1

# 指定服务器地址和用户名
.\scripts\check-server-environment.ps1 -ServerIP "47.104.173.139" -Username "root"
```

### 2. 依赖安装脚本

#### `install-server-dependencies.sh`

自动安装服务器所需的所有依赖。

**使用方法**:

```bash
# 方法 1: 上传到服务器后执行（推荐）
scp scripts/install-server-dependencies.sh root@47.104.173.139:/tmp/
ssh root@47.104.173.139
chmod +x /tmp/install-server-dependencies.sh
sudo /tmp/install-server-dependencies.sh

# 方法 2: 通过 SSH 管道执行
ssh root@47.104.173.139 'bash -s' < scripts/install-server-dependencies.sh
```

**安装内容**:
- ✅ Git
- ✅ Docker CE
- ✅ Docker Compose
- ✅ 启动 Docker 服务
- ✅ 配置防火墙（开放 80, 443 端口）
- ✅ 创建部署目录

**支持的操作系统**:
- CentOS 7/8
- RHEL 7/8
- Ubuntu 18.04/20.04/22.04
- Debian 10/11

### 3. 一键准备脚本

#### `prepare-server.sh` (Linux/Mac)

交互式服务器准备向导。

**使用方法**:

```bash
chmod +x scripts/prepare-server.sh
./scripts/prepare-server.sh
```

**功能**:
1. 询问服务器 IP 和用户名
2. 测试 SSH 连接
3. 检查服务器环境
4. 检测缺失的依赖
5. 询问是否自动安装
6. 执行安装并验证结果

#### `prepare-server.bat` (Windows)

Windows 批处理版本的准备向导。

**使用方法**:

```
双击运行 scripts\prepare-server.bat
```

或在命令提示符中：

```cmd
scripts\prepare-server.bat
```

**操作选项**:
1. 仅检查服务器环境
2. 检查并自动安装缺失的依赖
3. 查看帮助文档

## 使用场景

### 场景 1: 首次部署

如果是第一次在服务器上部署，推荐使用一键准备脚本：

```bash
# Linux/Mac
./scripts/prepare-server.sh

# Windows
scripts\prepare-server.bat
```

脚本会自动检查环境并安装缺失的依赖。

### 场景 2: 验证环境

如果只想检查服务器环境是否满足要求：

```bash
# Linux/Mac
ssh root@47.104.173.139 'bash -s' < scripts/check-server-environment.sh

# Windows
.\scripts\check-server-environment.ps1
```

### 场景 3: 手动安装

如果自动化脚本失败，可以手动执行安装：

1. 参考 `SERVER_PREPARATION_GUIDE.md` 文档
2. 按步骤手动安装每个依赖
3. 使用检查脚本验证安装结果

### 场景 4: CI/CD 集成

在 CI/CD 流程中自动准备服务器：

```bash
# 在 CI/CD 脚本中
ssh root@47.104.173.139 'bash -s' < scripts/install-server-dependencies.sh
```

## 前置要求

### 本地环境

**Linux/Mac**:
- Bash shell
- SSH 客户端
- 网络连接

**Windows**:
- PowerShell 5.0+
- OpenSSH 客户端（或 PuTTY）
- 网络连接

### 服务器要求

- 操作系统: CentOS 7.8+ / Ubuntu 18.04+ / Debian 10+
- 内存: 至少 2GB
- 磁盘空间: 至少 10GB 可用
- 网络: 可以访问互联网（用于下载依赖）
- SSH 访问: 需要 root 权限或 sudo 权限

## 常见问题

### 1. SSH 连接失败

**错误**: `ssh: connect to host 47.104.173.139 port 22: Connection refused`

**解决方案**:
- 检查服务器 IP 是否正确
- 检查服务器是否在线
- 检查 SSH 端口是否开放（默认 22）
- 检查防火墙是否阻止了 SSH 连接

### 2. 权限不足

**错误**: `Permission denied`

**解决方案**:
- 使用 root 用户登录
- 或使用 `sudo` 执行脚本
- 或将当前用户加入 docker 组：`sudo usermod -aG docker $USER`

### 3. Docker 安装失败

**错误**: `Error: Package: docker-ce-xxx requires containerd.io >= 1.x.x`

**解决方案**:
脚本会自动处理这个问题。如果仍然失败，可以手动安装：

```bash
# CentOS 7
yum install -y https://download.docker.com/linux/centos/7/x86_64/stable/Packages/containerd.io-1.6.9-3.1.el7.x86_64.rpm
yum install -y docker-ce docker-ce-cli
```

### 4. 下载速度慢

**问题**: GitHub 或 Docker Hub 下载速度很慢

**解决方案**:
脚本会自动尝试使用国内镜像：
- Docker Compose: DaoCloud 镜像
- Docker: 阿里云镜像（需要手动配置）

### 5. 端口被占用

**警告**: `端口 80 已被占用`

**处理方式**:
1. 检查占用端口的进程：`lsof -i :80`
2. 如果是其他网站，考虑使用不同的端口
3. 或停止占用端口的服务：`systemctl stop nginx`

### 6. Windows 上 SSH 不可用

**错误**: `'ssh' 不是内部或外部命令`

**解决方案**:
安装 OpenSSH 客户端：
1. 打开"设置" → "应用" → "可选功能"
2. 点击"添加功能"
3. 搜索并安装"OpenSSH 客户端"

或使用 PuTTY 等 SSH 工具手动连接。

## 输出示例

### 成功的检查输出

```
==========================================
EduMaster 服务器环境检查
==========================================

1. 系统信息检查
----------------------------------------
操作系统: CentOS Linux 7 (Core)
内核版本: 3.10.0-1160.el7.x86_64
主机名: iZ2ze...
IP 地址: 47.104.173.139

2. Docker 检查
----------------------------------------
✓ Docker 已安装 (版本: 24.0.7)
✓ Docker 服务正在运行
✓ Docker 权限正常

3. Docker Compose 检查
----------------------------------------
✓ Docker Compose 已安装 (版本: 2.24.0)

4. Git 检查
----------------------------------------
✓ Git 已安装 (版本: 2.43.0)

5. 端口检查
----------------------------------------
✓ 端口 80 可用
✓ 端口 443 可用
✓ 端口 5432 可用

6. 目录权限检查
----------------------------------------
✓ 目录 /www/wwwroot 存在
✓ 目录 /www/wwwroot 可写

7. 防火墙检查
----------------------------------------
✓ firewalld 正在运行
✓ 防火墙已开放端口 80
✓ 防火墙已开放端口 443

8. 磁盘空间检查
----------------------------------------
根分区使用率: 45%
可用空间: 25G
✓ 磁盘空间充足

==========================================
检查结果汇总
==========================================
通过: 15
警告: 0
失败: 0

✓ 服务器环境检查完成，可以继续部署
```

### 成功的安装输出

```
==========================================
EduMaster 服务器依赖安装
==========================================

检测操作系统...
操作系统: CentOS Linux 7 (Core)

==========================================
1. 安装 Git
==========================================
✓ Git 已安装 (版本: 2.43.0)

==========================================
2. 安装 Docker
==========================================
正在安装 Docker...
移除旧版本 Docker...
安装依赖...
添加 Docker 仓库...
安装 Docker...
✓ Docker 安装成功 (版本: 24.0.7)
启动 Docker 服务...
✓ Docker 服务已启动

==========================================
3. 安装 Docker Compose
==========================================
正在安装 Docker Compose...
下载 Docker Compose v2.24.0...
✓ 下载成功
✓ Docker Compose 安装成功 (版本: 2.24.0)

==========================================
4. 配置防火墙
==========================================
配置 firewalld...
✓ 已开放端口 80
✓ 已开放端口 443
✓ 防火墙规则已重载

==========================================
5. 创建部署目录
==========================================
✓ 目录 /www/wwwroot 已存在
✓ 目录权限已设置

==========================================
6. 验证安装
==========================================
Git 版本: git version 2.43.0
Docker 版本: Docker version 24.0.7, build afdd53b
Docker Compose 版本: Docker Compose version v2.24.0

==========================================
✓ 所有依赖安装完成！
==========================================

下一步操作:
1. 克隆项目代码到 /www/wwwroot
2. 配置环境变量 (.env 文件)
3. 执行数据迁移
4. 启动 Docker 服务
```

## 相关文档

- [服务器准备指南](../SERVER_PREPARATION_GUIDE.md) - 详细的手动操作步骤
- [Docker 部署指南](../DOCKER_DEPLOYMENT_GUIDE.md) - Docker 部署说明
- [任务列表](../.kiro/specs/postgresql-migration-deployment/tasks.md) - 完整的任务列表

## 技术支持

如果遇到问题：

1. 查看 [常见问题](#常见问题) 部分
2. 参考 [服务器准备指南](../SERVER_PREPARATION_GUIDE.md)
3. 查看脚本输出的错误信息
4. 检查服务器日志：`journalctl -xe`

## 贡献

欢迎提交问题和改进建议！
