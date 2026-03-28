# Git 工作流程

本文档描述项目的 Git 分支策略和工作流程。

## 分支策略

### 主要分支

- **main** - 主分支，包含稳定的生产代码
- **refactor/modularization** - 模块化重构分支

### 分支命名规范

- `feature/功能名` - 新功能开发
- `bugfix/问题描述` - Bug 修复
- `refactor/重构内容` - 代码重构
- `hotfix/紧急修复` - 生产环境紧急修复

## 当前重构工作流

### 1. 重构分支

当前正在 `refactor/modularization` 分支上进行模块化重构工作。

```bash
# 查看当前分支
git branch --show-current

# 切换到重构分支
git checkout refactor/modularization
```

### 2. 提交规范

提交信息应该清晰描述更改内容：

```bash
# 好的提交示例
git commit -m "提取认证中间件到 src/middleware/auth.js"
git commit -m "创建用户服务层并添加单元测试"
git commit -m "重构题库 API 路由"

# 避免的提交示例
git commit -m "更新代码"
git commit -m "修复bug"
```

### 3. 提交频率

- 完成一个小功能模块后立即提交
- 每个任务完成后提交
- 测试通过后提交
- 保持提交粒度适中，便于回滚

### 4. 合并策略

重构完成并测试通过后，将 `refactor/modularization` 合并回 `main`：

```bash
# 1. 确保重构分支是最新的
git checkout refactor/modularization
git pull origin refactor/modularization

# 2. 运行所有测试
npm test

# 3. 切换到 main 分支
git checkout main
git pull origin main

# 4. 合并重构分支
git merge refactor/modularization

# 5. 推送到远程
git push origin main
```

## 回滚策略

如果重构出现问题，可以快速回滚：

### 方式 1: 重置到特定提交

```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交
git reset --hard <commit-hash>
```

### 方式 2: 创建回滚提交

```bash
# 回滚最近的提交
git revert HEAD

# 回滚特定提交
git revert <commit-hash>
```

### 方式 3: 切换回 main 分支

```bash
# 如果重构分支有问题，直接切换回 main
git checkout main
```

## 冲突解决

如果出现合并冲突：

1. **查看冲突文件**
   ```bash
   git status
   ```

2. **手动解决冲突**
   - 打开冲突文件
   - 查找 `<<<<<<<`, `=======`, `>>>>>>>` 标记
   - 选择保留的代码
   - 删除冲突标记

3. **标记为已解决**
   ```bash
   git add <冲突文件>
   ```

4. **完成合并**
   ```bash
   git commit
   ```

## 最佳实践

### 1. 频繁拉取更新

```bash
# 定期从远程拉取更新
git pull origin refactor/modularization
```

### 2. 使用 .gitignore

确保不提交以下文件：
- 环境变量文件 (`.env`, `.env.local`)
- 依赖目录 (`node_modules/`)
- 构建产物 (`dist/`)
- 日志文件 (`*.log`)
- 测试覆盖率报告 (`coverage/`)
- IDE 配置 (`.vscode/`, `.idea/`)

### 3. 提交前检查

```bash
# 查看将要提交的更改
git diff

# 查看暂存区的更改
git diff --staged

# 运行测试
npm test
```

### 4. 保持分支整洁

```bash
# 删除已合并的本地分支
git branch -d <分支名>

# 删除远程分支
git push origin --delete <分支名>
```

## 紧急情况处理

### 生产环境出现问题

1. **立即从 main 创建 hotfix 分支**
   ```bash
   git checkout main
   git checkout -b hotfix/紧急修复描述
   ```

2. **修复问题并测试**
   ```bash
   # 修复代码
   npm test
   ```

3. **合并回 main 和 refactor 分支**
   ```bash
   # 合并到 main
   git checkout main
   git merge hotfix/紧急修复描述
   git push origin main
   
   # 合并到重构分支
   git checkout refactor/modularization
   git merge hotfix/紧急修复描述
   ```

## 标签管理

为重要的里程碑创建标签：

```bash
# 创建标签
git tag -a v1.0.0-refactor-start -m "开始模块化重构"
git tag -a v1.0.0-refactor-complete -m "完成模块化重构"

# 推送标签
git push origin --tags
```

## 查看历史

```bash
# 查看提交历史
git log --oneline --graph --all

# 查看特定文件的历史
git log --follow <文件路径>

# 查看某次提交的详细信息
git show <commit-hash>
```

## 常用命令速查

```bash
# 查看状态
git status

# 查看分支
git branch -a

# 切换分支
git checkout <分支名>

# 创建并切换分支
git checkout -b <新分支名>

# 暂存更改
git add <文件>
git add .

# 提交更改
git commit -m "提交信息"

# 推送到远程
git push origin <分支名>

# 拉取更新
git pull origin <分支名>

# 查看差异
git diff

# 撤销更改
git restore <文件>

# 查看日志
git log --oneline
```
