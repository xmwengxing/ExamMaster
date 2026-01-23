# PostgreSQL 数据库自动设置脚本
# 用于快速创建 edumaster 数据库和用户

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 数据库设置向导" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 PostgreSQL 服务状态
$service = Get-Service postgresql-x64-18 -ErrorAction SilentlyContinue
if ($null -eq $service) {
    Write-Host "❌ 未找到 PostgreSQL 18 服务" -ForegroundColor Red
    Write-Host "请确保 PostgreSQL 18 已正确安装" -ForegroundColor Yellow
    exit 1
}

if ($service.Status -ne 'Running') {
    Write-Host "⚠️  PostgreSQL 服务未运行，正在启动..." -ForegroundColor Yellow
    Start-Service postgresql-x64-18
    Start-Sleep -Seconds 3
    $service = Get-Service postgresql-x64-18
    if ($service.Status -eq 'Running') {
        Write-Host "✅ PostgreSQL 服务已启动" -ForegroundColor Green
    } else {
        Write-Host "❌ 无法启动 PostgreSQL 服务" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL 服务正在运行" -ForegroundColor Green
}

Write-Host ""

# 获取 PostgreSQL 超级用户密码
Write-Host "请输入 PostgreSQL 超级用户 (postgres) 的密码:" -ForegroundColor Yellow
$pgPassword = Read-Host -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# 设置环境变量
$env:PGPASSWORD = $pgPasswordPlain

Write-Host ""
Write-Host "正在执行数据库设置..." -ForegroundColor Cyan

# 查找 psql 可执行文件
$psqlPath = "D:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "❌ 未找到 psql.exe" -ForegroundColor Red
    Write-Host "请检查 PostgreSQL 安装路径" -ForegroundColor Yellow
    exit 1
}

# 执行 SQL 脚本
try {
    & $psqlPath -h localhost -p 5433 -U postgres -f setup-database.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ 数据库设置成功！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "下一步：" -ForegroundColor Cyan
        Write-Host "1. 更新 .env 文件中的数据库配置" -ForegroundColor White
        Write-Host "2. 运行测试脚本验证连接：node test-db-connection.js" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ 数据库设置失败" -ForegroundColor Red
        Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ 执行失败: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 清除密码环境变量
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
