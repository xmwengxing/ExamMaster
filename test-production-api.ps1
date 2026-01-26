# 测试生产环境 API

Write-Host "🧪 测试生产环境 API..." -ForegroundColor Cyan
Write-Host ""

# 1. 健康检查
Write-Host "[1/5] 健康检查..." -ForegroundColor Yellow
$health = curl -k -s https://exammaster.zzzjl.com/api/health | ConvertFrom-Json
if ($health.status -eq "healthy") {
    Write-Host "✅ 健康检查通过" -ForegroundColor Green
    Write-Host "   数据库: $($health.database)" -ForegroundColor Gray
} else {
    Write-Host "❌ 健康检查失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. 题库列表（需要认证）
Write-Host "[2/5] 题库列表（未认证）..." -ForegroundColor Yellow
$banks = curl -k -s https://exammaster.zzzjl.com/api/banks
if ($banks -match "Unauthorized") {
    Write-Host "✅ 认证中间件正常工作" -ForegroundColor Green
} else {
    Write-Host "⚠️  认证中间件可能有问题" -ForegroundColor Yellow
}
Write-Host ""

# 3. 登录测试（错误凭证）
Write-Host "[3/5] 登录测试（错误凭证）..." -ForegroundColor Yellow
$loginBody = @{
    username = "nonexistent"
    password = "wrongpassword"
} | ConvertTo-Json
$loginResult = curl -k -s -X POST https://exammaster.zzzjl.com/api/login -H "Content-Type: application/json" -d $loginBody
if ($loginResult -match "用户名或密码错误") {
    Write-Host "✅ 登录验证正常" -ForegroundColor Green
} else {
    Write-Host "⚠️  登录响应: $loginResult" -ForegroundColor Yellow
}
Write-Host ""

# 4. 系统信息
Write-Host "[4/5] 系统信息..." -ForegroundColor Yellow
$system = curl -k -s https://exammaster.zzzjl.com/api/system/info | ConvertFrom-Json
if ($system) {
    Write-Host "✅ 系统模块正常" -ForegroundColor Green
    Write-Host "   版本: $($system.version)" -ForegroundColor Gray
} else {
    Write-Host "⚠️  系统模块可能有问题" -ForegroundColor Yellow
}
Write-Host ""

# 5. 404 测试
Write-Host "[5/5] 404 错误处理..." -ForegroundColor Yellow
$notfound = curl -k -s https://exammaster.zzzjl.com/api/nonexistent
if ($notfound -match "NOT_FOUND") {
    Write-Host "✅ 错误处理正常" -ForegroundColor Green
} else {
    Write-Host "⚠️  错误处理响应: $notfound" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🎉 生产环境验证完成！                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 访问地址: https://exammaster.zzzjl.com" -ForegroundColor Green
Write-Host "💡 提示: 记得强制刷新浏览器 (Ctrl + Shift + R)" -ForegroundColor Yellow
