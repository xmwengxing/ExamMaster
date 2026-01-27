# Git 同步使用指南

## 可用的同步脚本

项目提供了三个 Git 同步脚本，根据你的需求选择使用：

### 1. GitHub同步.ps1 (推荐)
**PowerShell 版本 - 最佳中文支持**

```powershell
# 右键点击文件 -> 使用 PowerShell 运行
# 或在 PowerShell 中执行：
.\GitHub同步.ps1
```

**优点：**
- ✅ 完美支持中文文件名
- ✅ 彩色输出，界面友好
- ✅ 更好的错误处理
- ✅ 自动处理编码问题

**适用场景：**
- Windows 10/11 系统
- 有大量中文文件名的项目
- 需要更好的交互体验

### 2. GitHub同步-改进版.bat
**批处理改进版 - 功能增强**

```cmd
双击运行 GitHub同步-改进版.bat
```

**优点：**
- ✅ 快捷提交信息选项
- ✅ 自动处理中文文件名
- ✅ 显示更改统计
- ✅ 智能拉取远程更新

**适用场景：**
- 快速提交常见类型的更改
- 不想手动输入提交信息
- 需要批量处理文件

### 3. GitHub一键同步.bat
**原版批处理 - 简单直接**

```cmd
双击运行 GitHub一键同步.bat
```

**优点：**
- ✅ 简单易用
- ✅ 交互式操作
- ✅ 适合小规模更改

**适用场景：**
- 简单的提交和推送
- 文件数量较少
- 不需要复杂功能

## 使用步骤

### 基本流程

1. **运行脚本**
   - PowerShell: 右键 -> 使用 PowerShell 运行
   - 批处理: 双击运行

2. **查看更改**
   - 脚本会显示所有未提交的文件
   - 确认更改内容

3. **提交更改**
   - 选择提交信息类型（改进版）
   - 或输入自定义提交信息
   - 确认提交

4. **推送到远程**
   - 选择是否推送
   - 自动处理远程更新
   - 完成同步

## 常见问题

### Q1: 推送失败，提示"需要先拉取"

**原因：** 远程仓库有新的提交，本地落后于远程。

**解决方案：**
```bash
# 方案1：使用脚本自动处理
# 脚本会提示是否先拉取，选择 y

# 方案2：手动拉取
git pull origin <分支名> --rebase
git push origin <分支名>
```

### Q2: 中文文件名显示乱码

**原因：** Git 默认对中文文件名进行转义。

**解决方案：**
```bash
# 设置 Git 不转义中文
git config core.quotepath false

# 或使用 PowerShell 版本脚本（自动处理）
```

### Q3: 提示"没有推送权限"

**原因：** 
- 没有配置 GitHub 认证
- 使用 HTTPS 但没有保存凭据
- 使用 SSH 但没有配置密钥

**解决方案：**

**方案1：配置 Git 凭据管理器**
```bash
# Windows
git config --global credential.helper wincred

# 下次推送时会提示输入用户名和密码（或 Personal Access Token）
```

**方案2：使用 SSH**
```bash
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 添加公钥到 GitHub
# 复制 ~/.ssh/id_ed25519.pub 内容到 GitHub Settings -> SSH Keys

# 3. 修改远程仓库 URL
git remote set-url origin git@github.com:xmwengxing/EduMaster_postgresql.git
```

**方案3：使用 Personal Access Token (推荐)**
```bash
# 1. 在 GitHub 生成 Token
# Settings -> Developer settings -> Personal access tokens -> Generate new token

# 2. 推送时使用 Token 作为密码
# 用户名：你的 GitHub 用户名
# 密码：生成的 Token
```

### Q4: 有冲突需要解决

**原因：** 本地和远程的同一文件有不同的修改。

**解决方案：**
```bash
# 1. 查看冲突文件
git status

# 2. 手动编辑冲突文件，解决冲突标记
# <<<<<<< HEAD
# 你的更改
# =======
# 远程的更改
# >>>>>>> origin/branch

# 3. 标记冲突已解决
git add <冲突文件>

# 4. 继续 rebase
git rebase --continue

# 5. 推送
git push origin <分支名>
```

### Q5: 文件太多，提交很慢

**原因：** 有大量文件需要提交。

**解决方案：**
```bash
# 1. 检查是否有不需要提交的文件
git status

# 2. 添加到 .gitignore
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore

# 3. 清理已跟踪的不需要的文件
git rm -r --cached node_modules/
git rm -r --cached dist/

# 4. 提交 .gitignore 更改
git add .gitignore
git commit -m "更新 .gitignore"
```

## 最佳实践

### 1. 提交前检查

```bash
# 查看更改的文件
git status

# 查看具体更改内容
git diff

# 查看暂存区的更改
git diff --cached
```

### 2. 编写好的提交信息

**格式：**
```
<类型>: <简短描述>

<详细描述>（可选）

<相关问题>（可选）
```

**类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**
```
fix: 修复 AI 解析接口认证问题

- 在 adminAuth 之前添加 auth 中间件
- 修改 nginx 配置传递 Authorization 头
- 更新相关文档

Fixes #123
```

### 3. 定期同步

```bash
# 每天开始工作前
git pull origin <分支名>

# 每天结束工作后
# 运行同步脚本提交和推送
```

### 4. 分支管理

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 完成后合并到主分支
git checkout main
git merge feature/new-feature

# 删除功能分支
git branch -d feature/new-feature
```

## 快捷命令

### 查看状态
```bash
git status          # 查看工作区状态
git log --oneline   # 查看提交历史
git branch          # 查看分支列表
```

### 撤销操作
```bash
git restore <file>              # 撤销工作区的更改
git restore --staged <file>     # 取消暂存
git reset HEAD~1                # 撤销最后一次提交（保留更改）
git reset --hard HEAD~1         # 撤销最后一次提交（丢弃更改）
```

### 远程操作
```bash
git fetch origin                # 获取远程更新
git pull origin <branch>        # 拉取并合并
git push origin <branch>        # 推送到远程
git push origin --tags          # 推送标签
```

## 故障排除

### 重置到远程状态

如果本地状态混乱，想要重置到远程状态：

```bash
# ⚠️ 警告：这会丢失所有本地更改！

# 1. 备份重要文件

# 2. 重置到远程状态
git fetch origin
git reset --hard origin/<分支名>

# 3. 清理未跟踪的文件
git clean -fd
```

### 查看详细错误

```bash
# 启用详细输出
git config --global core.verbose true

# 查看 Git 配置
git config --list

# 测试远程连接
git ls-remote origin
```

## 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助文档](https://docs.github.com/)
- [Pro Git 中文版](https://git-scm.com/book/zh/v2)

## 技术支持

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 查看 Git 错误信息
3. 搜索相关错误信息
4. 在项目 Issues 中提问
