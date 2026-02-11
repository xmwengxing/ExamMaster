# GitHub Actions CI/CD 配置说明

本项目使用 GitHub Actions 实现自动化构建和部署（已简化配置）。

## 工作流说明

### CI/CD Pipeline (`ci-cd.yml`)

简化后的持续集成和持续部署工作流，包含以下作业：

- **构建前端**：构建 React 前端应用
- **构建 Docker 镜像**：构建并推送 Docker 镜像到 GitHub Container Registry（仅 main 分支）
- **部署到生产环境**：自动部署到生产服务器（仅 main 分支）
- **部署到开发环境**：自动部署到开发服务器（仅 develop 分支）

#### 触发条件

- 推送到 `main` 或 `develop` 分支
- 创建针对 `main` 或 `develop` 分支的 Pull Request
- 手动触发

#### 简化说明

为了提高部署效率和减少构建失败，已移除以下功能：

- ❌ 自动化测试（需要配置测试数据库）
- ❌ 代码覆盖率报告
- ❌ 定期健康检查
- ❌ 备份验证
- ❌ 性能监控
- ❌ 模块化架构验证

如需这些功能，可以在项目稳定后逐步添加。

## 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets（Settings → Secrets and variables → Actions）：

### 生产环境 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SSH_PRIVATE_KEY` | SSH 私钥（用于连接生产服务器） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST` | 生产服务器 IP 或域名 | `47.104.173.139` |
| `SERVER_USER` | 服务器用户名 | `root` |
| `DEPLOY_PATH` | 部署路径 | `/www/wwwroot/exammaster.zzzjl.com` |

### 开发环境 Secrets（可选）

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SSH_PRIVATE_KEY_DEV` | SSH 私钥（用于连接开发服务器） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST_DEV` | 开发服务器 IP 或域名 | `dev.example.com` |
| `SERVER_USER_DEV` | 开发服务器用户名 | `deploy` |
| `DEPLOY_PATH_DEV` | 开发环境部署路径 | `/var/www/edumaster-dev` |

## 配置步骤

### 1. 生成 SSH 密钥对

在本地机器上生成 SSH 密钥对：

```bash
# 生成 SSH 密钥对（不设置密码）
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# 查看私钥（用于配置 GitHub Secret）
cat ~/.ssh/github_actions_key

# 查看公钥（用于添加到服务器）
cat ~/.ssh/github_actions_key.pub
```

### 2. 添加公钥到服务器

将公钥添加到服务器的 `~/.ssh/authorized_keys` 文件：

```bash
# 在服务器上执行
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 配置 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加上述所有必需的 Secrets

## 使用说明

### 自动部署

```bash
# 部署到生产环境
git add .
git commit -m "更新功能"
git push origin main

# 部署到开发环境
git push origin develop
```

### 手动触发工作流

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 "CI/CD Pipeline" 工作流
3. 点击 **Run workflow** 按钮
4. 选择分支并点击 **Run workflow**

## 监控和调试

### 查看工作流运行状态

1. 进入 GitHub 仓库的 **Actions** 页面
2. 查看最近的工作流运行记录
3. 点击具体的运行记录查看详细日志

### 常见问题

#### 1. SSH 连接失败

**错误信息**：`Permission denied (publickey)`

**解决方法**：
- 检查 SSH 私钥是否正确配置在 GitHub Secrets 中
- 检查服务器上的公钥是否正确添加到 `~/.ssh/authorized_keys`
- 确认服务器允许密钥登录（检查 `/etc/ssh/sshd_config`）

#### 2. Docker 镜像构建失败

**错误信息**：`Error response from daemon: ...`

**解决方法**：
- 检查 Dockerfile 语法
- 本地运行 `docker build -t edumaster:test .` 测试
- 查看详细的构建日志

#### 3. 部署脚本执行失败

**错误信息**：`deploy.sh: command not found`

**解决方法**：
- 确保 `scripts/deploy.sh` 文件存在
- 确保脚本有执行权限
- 检查脚本路径是否正确

#### 4. 前端构建失败

**错误信息**：`npm run build failed`

**解决方法**：
- 本地运行 `npm run build` 测试
- 检查 package.json 中的依赖
- 查看构建日志中的具体错误

## 安全建议

1. **定期更新 SSH 密钥**：建议每 6 个月更新一次
2. **使用最小权限原则**：为部署用户分配最小必要的权限
3. **启用双因素认证**：为 GitHub 账户启用 2FA
4. **定期审查 Secrets**：定期检查和更新 GitHub Secrets

## 后续优化（可选）

如果项目稳定后需要更完善的 CI/CD，可以考虑添加：

1. **自动化测试**：添加单元测试和集成测试
2. **代码质量检查**：集成 ESLint、Prettier
3. **性能监控**：添加 Lighthouse 性能测试
4. **通知集成**：集成钉钉、企业微信通知
5. **定期健康检查**：监控生产环境状态

## 参考资料

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [完整部署指南](../docs/完整部署指南.md)
