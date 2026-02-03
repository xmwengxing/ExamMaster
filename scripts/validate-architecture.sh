#!/bin/bash

# 模块化架构验证脚本
# 用于本地验证架构完整性

set -e

echo "========================================="
echo "  模块化架构验证"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0
WARN=0

# 检查函数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARN++))
}

echo "1. 检查目录结构..."
echo "-----------------------------------"

required_dirs=(
    "src/config"
    "src/controllers"
    "src/middleware"
    "src/routes"
    "src/services"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "目录存在: $dir"
    else
        check_fail "目录缺失: $dir"
    fi
done

echo ""
echo "2. 检查服务器文件..."
echo "-----------------------------------"

if [ -f "server.js" ]; then
    if grep -q "registerRoutes" server.js; then
        check_pass "server.js 是模块化版本"
    else
        check_fail "server.js 不是模块化版本"
    fi
else
    check_fail "server.js 不存在"
fi

if [ -f "server-new.js" ]; then
    check_warn "发现 server-new.js，应该已重命名"
fi

if [ -f "server-old.js" ]; then
    check_pass "旧版本已备份为 server-old.js"
fi

echo ""
echo "3. 检查路由文件..."
echo "-----------------------------------"

if [ -f "src/routes/index.js" ]; then
    check_pass "路由聚合器存在"
    
    # 检查路由注册
    route_files=$(find src/routes -name "*.routes.js" -type f 2>/dev/null || true)
    route_count=0
    
    for route_file in $route_files; do
        route_name=$(basename "$route_file" .routes.js)
        if grep -q "$route_name" src/routes/index.js; then
            check_pass "路由已注册: $route_name"
        else
            check_warn "路由可能未注册: $route_name"
        fi
        ((route_count++))
    done
    
    echo "   总计: $route_count 个路由文件"
else
    check_fail "路由聚合器不存在"
fi

echo ""
echo "4. 检查中间件..."
echo "-----------------------------------"

if [ -f "src/middleware/auth.js" ]; then
    if grep -q "export.*auth" src/middleware/auth.js; then
        check_pass "认证中间件正确导出"
    else
        check_fail "认证中间件未正确导出"
    fi
else
    check_fail "认证中间件不存在"
fi

middleware_count=$(find src/middleware -name "*.js" -type f 2>/dev/null | wc -l || echo 0)
echo "   总计: $middleware_count 个中间件文件"

echo ""
echo "5. 检查控制器..."
echo "-----------------------------------"

controller_count=$(find src/controllers -name "*.controller.js" -type f 2>/dev/null | wc -l || echo 0)

if [ $controller_count -gt 0 ]; then
    check_pass "找到 $controller_count 个控制器"
else
    check_fail "未找到控制器文件"
fi

echo ""
echo "6. 检查服务层..."
echo "-----------------------------------"

service_count=$(find src/services -name "*.service.js" -type f 2>/dev/null | wc -l || echo 0)

if [ $service_count -gt 0 ]; then
    check_pass "找到 $service_count 个服务"
else
    check_fail "未找到服务文件"
fi

echo ""
echo "7. 检查 Dockerfile..."
echo "-----------------------------------"

if [ -f "Dockerfile" ]; then
    if grep -q "server-new.js" Dockerfile; then
        check_fail "Dockerfile 仍在使用 server-new.js"
    elif grep -q "COPY server.js" Dockerfile; then
        check_pass "Dockerfile 配置正确"
    else
        check_warn "Dockerfile 可能配置不正确"
    fi
else
    check_fail "Dockerfile 不存在"
fi

echo ""
echo "8. 检查 .dockerignore..."
echo "-----------------------------------"

if [ -f ".dockerignore" ]; then
    if grep -q "server-old.js" .dockerignore; then
        check_pass ".dockerignore 已排除旧文件"
    else
        check_warn ".dockerignore 可能需要更新"
    fi
else
    check_warn ".dockerignore 不存在"
fi

echo ""
echo "9. 检查 ES 模块导入..."
echo "-----------------------------------"

# 检查是否使用了 CommonJS require
require_count=$(find src -name "*.js" -type f -exec grep -l "require(" {} \; 2>/dev/null | wc -l || echo 0)

if [ $require_count -gt 0 ]; then
    check_warn "发现 $require_count 个文件使用 CommonJS require"
else
    check_pass "所有文件使用 ES 模块"
fi

# 检查导入路径是否包含 .js 扩展名
missing_ext_count=$(find src -name "*.js" -type f -exec grep -E "from ['\"]\..*['\"]" {} \; 2>/dev/null | grep -v "\.js['\"]" | wc -l || echo 0)

if [ $missing_ext_count -gt 0 ]; then
    check_warn "发现 $missing_ext_count 个导入可能缺少 .js 扩展名"
else
    check_pass "导入路径包含 .js 扩展名"
fi

echo ""
echo "10. 检查测试文件..."
echo "-----------------------------------"

if [ -d "tests" ]; then
    test_count=$(find tests -name "*.test.js" -type f 2>/dev/null | wc -l || echo 0)
    check_pass "找到 $test_count 个测试文件"
else
    check_warn "tests 目录不存在"
fi

echo ""
echo "========================================="
echo "  验证结果"
echo "========================================="
echo ""
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${YELLOW}警告: $WARN${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ 验证失败，请修复上述问题${NC}"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  验证通过，但有警告${NC}"
    exit 0
else
    echo -e "${GREEN}✅ 验证完全通过！${NC}"
    exit 0
fi
