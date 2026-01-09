# 🚀 GitHub 上传快速指南

## 📋 三步上传

### 1️⃣ 检查文件
```bash
git-clean-check.bat
```
确认没有敏感文件

### 2️⃣ 初始化仓库
```bash
git-init.bat
```
按提示操作

### 3️⃣ 推送到 GitHub
```bash
git-push.bat
```
输入仓库地址

## ✅ 已排除的内容

### 目录
- `.vscode/` - VS Code 配置
- `.kiro/` - Kiro IDE 配置
- `.github/` - GitHub Actions
- `node_modules/` - 依赖包
- `dist/` - 构建产物
- `logs/` - 日志文件
- `backups/` - 备份文件

### 文件
- `.env*` - 环境变量
- `*.db` - 数据库
- `*.pem` - SSL 证书
- `test-*.js` - 测试脚本
- `deploy*.bat` - 部署脚本
- `nginx*.conf` - Nginx 配置
- `ecosystem.config.cjs` - PM2 配置

## 🔑 获取 Token

1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo`
4. 复制 Token

## 📝 推送时认证

- **Username**: GitHub 用户名
- **Password**: Token（不是密码）

## ❓ 遇到问题？

查看详细文档：
- [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md) - 上传说明
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - 完整指南
- [GITHUB_CHECKLIST.md](GITHUB_CHECKLIST.md) - 操作清单

---

**准备好了？运行 `git-clean-check.bat` 开始！** 🎉
