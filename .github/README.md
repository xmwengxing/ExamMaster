# GitHub Actions CI/CD 配置说明

本项目使用 GitHub Actions 实现自动化构建、测试和部署。

## 工作流说明

### 1. CI/CD Pipeline (`ci-cd.yml`)

主要的持续集成和持续部署工作流，包含以下作业：

- **测试和代码检查**：运行单元测试和属性测试
- **构建前端**：构建 React 前端应用
- **构建 Docker 镜像**：构建并推送 Docker 镜像到 GitHub Container Registry
- **部署到生产环境**：自动部署到生产服务器（仅 main 分支）
- **部署到开发环境**：自动部署到开发服务器（仅 develop 分支）

#### 触发条件

- 推送到 `main` 或 `develop` 分支
- 创建针对 `main` 或 `develop` 分支的 Pull Request
- 手动触发

### 2. 健康检查和备份验证 (`health-check.yml`)

定期执行的健康检查工作流，包含以下作业：

- **生产环境健康检查**：检查 API 和前端可访问性、SSL 证书有效期
- **验证数据库备份**：检查备份文件是否存在、是否及时更新
- **性能监控**：监控 API 响应时间和页面加载时间

#### 触发条件

- 每天 UTC 时间 00:00（北京时间 08:00）自动执行
- 手动触发

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

### 4. 配置 GitHub Environments（可选）

为了更好地控制部署流程，可以配置 GitHub Environments：

1. 进入 **Settings** → **Environments**
2. 创建 `production` 环境
   - 配置 **Required reviewers**（需要审批才能部署）
   - 配置 **Wait timer**（延迟部署时间）
   - 配置 **Deployment branches**（限制可部署的分支）
3. 创建 `development` 环境（可选）

## 测试工作流

### 本地测试

在推送代码前，可以在本地测试：

```bash
# 运行测试
npm test

# 构建前端
npm run build

# 构建 Docker 镜像
docker build -t edumaster:test .
```

### 手动触发工作流

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择要运行的工作流
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
- 检查 SSH 私钥是否正确配置
- 检查服务器上的公钥是否正确添加
- 检查服务器的 SSH 配置（`/etc/ssh/sshd_config`）

#### 2. Docker 镜像构建失败

**错误信息**：`Error response from daemon: ...`

**解决方法**：
- 检查 Dockerfile 语法
- 检查依赖是否正确安装
- 查看详细的构建日志

#### 3. 部署脚本执行失败

**错误信息**：`deploy.sh: command not found`

**解决方法**：
- 确保 `scripts/deploy.sh` 文件存在
- 确保脚本有执行权限（`chmod +x scripts/deploy.sh`）
- 检查脚本中的命令是否正确

## 安全建议

1. **定期更新 SSH 密钥**：建议每 6 个月更新一次 SSH 密钥
2. **限制 SSH 访问**：在服务器上配置防火墙，仅允许 GitHub Actions 的 IP 访问
3. **使用最小权限原则**：为部署用户分配最小必要的权限
4. **启用双因素认证**：为 GitHub 账户启用 2FA
5. **定期审查 Secrets**：定期检查和更新 GitHub Secrets

## 扩展功能

### 添加通知

可以集成 Slack、钉钉、企业微信等通知服务，在部署成功或失败时发送通知。

示例（Slack）：

```yaml
- name: 发送 Slack 通知
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "部署状态: ${{ job.status }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 添加代码质量检查

可以集成 ESLint、Prettier、SonarQube 等代码质量检查工具。

示例（ESLint）：

```yaml
- name: 运行 ESLint
  run: npm run lint
```

### 添加性能测试

可以集成 Lighthouse、WebPageTest 等性能测试工具。

示例（Lighthouse）：

```yaml
- name: 运行 Lighthouse
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://exammaster.zzzjl.com
    uploadArtifacts: true
```

## 参考资料

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
