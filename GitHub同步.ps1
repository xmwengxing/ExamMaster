# GitHub 同步脚本 (PowerShell 版本)
# 更好的中文支持和错误处理

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     GitHub 同步脚本 (PowerShell)       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查是否在 Git 仓库中
try {
    git rev-parse --git-dir 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "当前目录不是 Git 仓库"
    }
} catch {
    Write-Host "❌ 错误：$_" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 设置 Git 配置以正确处理中文文件名
git config core.quotepath false

# 获取当前分支
$currentBranch = git branch --show-current
Write-Host "📌 当前分支: $currentBranch" -ForegroundColor Green
Write-Host ""

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    $changeCount = ($status | Measure-Object).Count
    Write-Host "📊 更改统计: 总共 $changeCount 个文件有更改" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "📋 更改文件列表:" -ForegroundColor Cyan
    Write-Host "----------------------------------------"
    git status --short
    Write-Host "----------------------------------------"
    Write-Host ""
    
    # 询问是否要提交
    $confirm = Read-Host "是否要提交所有更改？(y/n)"
    if ($confirm -ne 'y') {
        Write-Host "❌ 已取消提交" -ForegroundColor Yellow
        Read-Host "按回车键退出"
        exit 0
    }
    
    # 添加所有更改
    Write-Host ""
    Write-Host "📦 添加所有更改到暂存区..." -ForegroundColor Cyan
    git add -A
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 添加文件失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "✅ 已添加 $changeCount 个文件" -ForegroundColor Green
    
    # 输入提交信息
    Write-Host ""
    Write-Host "💡 提示：可以使用以下快捷提交信息：" -ForegroundColor Yellow
    Write-Host "   1 - 修复 AI 解析接口认证问题"
    Write-Host "   2 - 重构服务器架构为模块化"
    Write-Host "   3 - 更新文档和配置"
    Write-Host "   4 - 修复 bug 和优化性能"
    Write-Host "   5 - 自定义提交信息"
    Write-Host ""
    
    $choice = Read-Host "请选择提交信息类型 (1-5)"
    
    switch ($choice) {
        "1" { $commitMsg = "修复 AI 解析接口认证问题 - 添加 auth 中间件和 nginx Authorization 头传递" }
        "2" { $commitMsg = "重构服务器架构为模块化 - 将 server-new.js 重命名为 server.js" }
        "3" { $commitMsg = "更新文档和配置 - 添加服务器架构说明和部署指南" }
        "4" { $commitMsg = "修复 bug 和优化性能 - 多项改进和问题修复" }
        "5" { 
            $commitMsg = Read-Host "请输入自定义提交信息"
            if ([string]::IsNullOrWhiteSpace($commitMsg)) {
                Write-Host "❌ 提交信息不能为空" -ForegroundColor Red
                Read-Host "按回车键退出"
                exit 1
            }
        }
        default {
            Write-Host "❌ 无效的选择" -ForegroundColor Red
            Read-Host "按回车键退出"
            exit 1
        }
    }
    
    # 提交更改
    Write-Host ""
    Write-Host "💾 提交更改: $commitMsg" -ForegroundColor Cyan
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 提交失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "✅ 提交成功" -ForegroundColor Green
} else {
    Write-Host "✅ 工作区干净，没有未提交的更改" -ForegroundColor Green
    Write-Host ""
}

# 询问是否推送
Write-Host ""
$pushConfirm = Read-Host "是否要推送到远程仓库？(y/n)"
if ($pushConfirm -ne 'y') {
    Write-Host "ℹ️  已跳过推送" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 0
}

# 检查远程仓库
$remotes = git remote -v
if (-not ($remotes -match "origin")) {
    Write-Host "❌ 错误：未配置远程仓库 origin" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先配置远程仓库："
    Write-Host "git remote add origin [your-repo-url]"
    Read-Host "按回车键退出"
    exit 1
}

# 先拉取远程更改（避免冲突）
Write-Host ""
Write-Host "📥 检查远程更新..." -ForegroundColor Cyan
git fetch origin $currentBranch 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    $behindCount = (git rev-list HEAD..origin/$currentBranch --count)
    if ($behindCount -gt 0) {
        Write-Host "⚠️  远程仓库有 $behindCount 个新提交" -ForegroundColor Yellow
        $pullConfirm = Read-Host "是否要先拉取远程更改？(y/n)"
        if ($pullConfirm -eq 'y') {
            Write-Host ""
            Write-Host "📥 拉取远程更改..." -ForegroundColor Cyan
            git pull origin $currentBranch --rebase
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ 拉取失败，可能有冲突需要手动解决" -ForegroundColor Red
                Write-Host ""
                Write-Host "解决冲突后，请运行："
                Write-Host "  git rebase --continue"
                Write-Host "  git push origin $currentBranch"
                Read-Host "按回车键退出"
                exit 1
            }
        }
    }
}

# 推送到远程仓库
Write-Host ""
Write-Host "🚀 推送到远程仓库 origin/$currentBranch..." -ForegroundColor Cyan
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因："
    Write-Host "  1. 网络连接问题"
    Write-Host "  2. 没有推送权限"
    Write-Host "  3. 远程分支被保护"
    Write-Host "  4. 需要先拉取远程更改"
    Write-Host ""
    Write-Host "请检查错误信息并手动解决"
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 同步完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 最近的提交:" -ForegroundColor Cyan
git log --oneline -5
Write-Host ""
Write-Host "🌐 远程仓库: https://github.com/xmwengxing/EduMaster_postgresql" -ForegroundColor Cyan
Write-Host "📌 分支: $currentBranch" -ForegroundColor Cyan
Write-Host ""

Read-Host "按回车键退出"
