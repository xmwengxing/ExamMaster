# GitHub 上传文件说明

## ✅ 将要上传的文件

### 核心代码
- ✅ `*.tsx` - React 组件
- ✅ `*.ts` - TypeScript 文件
- ✅ `*.js` - JavaScript 文件
- ✅ `*.css` - 样式文件
- ✅ `*.html` - HTML 文件
- ✅ `server.js` - 后端服务器
- ✅ `store.ts` - 状态管理
- ✅ `types.ts` - 类型定义

### 配置文件
- ✅ `package.json` - 项目依赖
- ✅ `package-lock.json` - 依赖锁定
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `vite.config.ts` - Vite 配置
- ✅ `.env.example` - 环境变量模板
- ✅ `.gitignore` - Git 忽略规则

### 文档
- ✅ `README.md` - 项目说明
- ✅ `技术文档.md` - 技术文档
- ✅ `LICENSE` - 开源协议
- ✅ `智能复习功能优化说明.md` - 功能说明
- ✅ `docs/` - 文档目录

### 目录结构
- ✅ `pages/` - 页面组件
- ✅ `components/` - 公共组件
- ✅ `utils/` - 工具函数
- ✅ `scripts/` - 脚本文件（部分）

## ❌ 将被排除的文件

### 开发工具目录
- ❌ `.vscode/` - VS Code 配置
- ❌ `.kiro/` - Kiro IDE 配置
- ❌ `.github/` - GitHub Actions（如不需要）
- ❌ `.idea/` - IntelliJ IDEA 配置

### 数据库文件
- ❌ `*.db` - SQLite 数据库
- ❌ `*.db-journal` - 数据库日志
- ❌ `edumaster.db` - 主数据库
- ❌ `backups/` - 备份目录

### 环境变量
- ❌ `.env` - 环境变量（包含密钥）
- ❌ `.env.local` - 本地环境变量
- ❌ `.env.production` - 生产环境变量

### SSL 证书
- ❌ `*.pem` - SSL 证书
- ❌ `*.key` - SSL 密钥
- ❌ `*.crt` - SSL 证书
- ❌ `cloudflare-cert.pem`
- ❌ `cloudflare-key.pem`

### 测试文件
- ❌ `test-*.html` - 测试 HTML
- ❌ `test-*.js` - 测试脚本
- ❌ `check-*.js` - 检查脚本
- ❌ `create-*.js` - 创建脚本
- ❌ `fix-*.cjs` - 修复脚本

### 部署脚本
- ❌ `deploy*.bat` - Windows 部署脚本
- ❌ `deploy*.sh` - Linux 部署脚本
- ❌ `upload-*.sh` - 上传脚本
- ❌ `setup-*.bat` - 设置脚本
- ❌ `setup-*.sh` - 设置脚本
- ❌ `verify-*.sh` - 验证脚本
- ❌ `vps-*.sh` - VPS 脚本

### 服务器配置
- ❌ `nginx.conf` - Nginx 配置
- ❌ `nginx-ssl.conf` - Nginx SSL 配置
- ❌ `ecosystem.config.cjs` - PM2 配置
- ❌ `metadata.json` - 元数据

### 中文文档（部署相关）
- ❌ `SSH命令集合.txt`
- ❌ `VPS一键修复命令.txt`
- ❌ `在线部署命令.txt`
- ❌ `智能复习测试清单.txt`

### 构建产物
- ❌ `dist/` - 构建输出
- ❌ `node_modules/` - 依赖包
- ❌ `logs/` - 日志文件

### 临时文件
- ❌ `*.tmp` - 临时文件
- ❌ `*.temp` - 临时文件
- ❌ `.cache/` - 缓存目录

## 🔍 检查方法

### 方法 1：使用检查脚本（推荐）
```bash
# 运行检查脚本
git-clean-check.bat
```

### 方法 2：手动检查
```bash
# 查看将要提交的文件
git status

# 查看被忽略的文件
git status --ignored

# 查看所有文件（包括忽略的）
git ls-files --others --ignored --exclude-standard
```

## ⚠️ 重要提示

### 1. 敏感信息检查
确保以下文件**不会**被上传：
- ✅ `.env` 文件（包含 API Key）
- ✅ 数据库文件（包含用户数据）
- ✅ SSL 证书（安全凭证）
- ✅ 服务器配置（包含服务器信息）

### 2. 如果不小心上传了敏感文件
```bash
# 从 Git 历史中删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 文件路径" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin --force --all

# 更好的方法：使用 BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/
```

### 3. 验证 .gitignore 是否生效
```bash
# 测试文件是否会被忽略
git check-ignore -v 文件路径

# 例如：
git check-ignore -v .env
git check-ignore -v edumaster.db
git check-ignore -v .vscode/
```

## 📋 上传前清单

- [ ] 运行 `git-clean-check.bat` 检查
- [ ] 确认 `.env` 文件不在列表中
- [ ] 确认 `*.db` 文件不在列表中
- [ ] 确认 `.vscode/` 目录不在列表中
- [ ] 确认 `.kiro/` 目录不在列表中
- [ ] 确认 SSL 证书不在列表中
- [ ] 确认测试脚本不在列表中
- [ ] 确认部署脚本不在列表中
- [ ] 查看 `git status` 输出
- [ ] 确认所有敏感信息已排除

## 🚀 准备上传

检查完成后，按以下步骤操作：

1. **初始化仓库**
   ```bash
   git-init.bat
   ```

2. **查看将要提交的文件**
   ```bash
   git status
   ```

3. **确认无误后推送**
   ```bash
   git-push.bat
   ```

## 📚 相关文档

- [.gitignore](.gitignore) - 忽略规则配置
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - 详细操作指南
- [GITHUB_CHECKLIST.md](GITHUB_CHECKLIST.md) - 快速清单

---

**记住：永远不要上传敏感信息到公开仓库！** 🔒
