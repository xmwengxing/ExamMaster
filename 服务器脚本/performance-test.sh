#!/bin/bash
# ========================================
# 性能测试脚本
# 用于验证优化效果
# ========================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="${1:-http://localhost:3001}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EduMaster 性能测试${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "测试目标: $API_URL"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 测试 1: 健康检查响应时间
echo -e "${YELLOW}[1/5] 健康检查响应时间...${NC}"
for i in {1..5}; do
    response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$API_URL/api/health")
    echo "  第 $i 次: ${response_time}s"
done
echo ""

# 测试 2: 并发请求测试
echo -e "${YELLOW}[2/5] 并发请求测试...${NC}"
if command -v ab &> /dev/null; then
    ab -n 100 -c 10 -q "$API_URL/api/health" | grep -E "Requests per second|Time per request|Failed requests"
else
    echo "  ⚠️  Apache Bench (ab) 未安装，跳过并发测试"
    echo "  安装命令: yum install -y httpd-tools"
fi
echo ""

# 测试 3: 数据库连接测试
echo -e "${YELLOW}[3/5] 数据库连接测试...${NC}"
if docker ps | grep -q "edumaster_postgres"; then
    start_time=$(date +%s.%N)
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "SELECT 1;" > /dev/null 2>&1
    end_time=$(date +%s.%N)
    db_time=$(echo "$end_time - $start_time" | bc)
    echo "  数据库查询时间: ${db_time}s"
    
    # 检查连接数
    connections=$(docker exec edumaster_postgres psql -U edumaster_user -d edumaster -t -c "SELECT count(*) FROM pg_stat_activity;")
    echo "  当前连接数: $connections"
else
    echo "  ⚠️  PostgreSQL 容器未运行"
fi
echo ""

# 测试 4: 容器资源使用
echo -e "${YELLOW}[4/5] 容器资源使用...${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep edumaster
echo ""

# 测试 5: 系统资源
echo -e "${YELLOW}[5/5] 系统资源...${NC}"
echo "  CPU 使用率:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "    空闲: " $1 "%"}'
echo "  内存使用:"
free -h | grep Mem | awk '{print "    总计: " $2 ", 已用: " $3 ", 可用: " $7}'
echo "  磁盘使用:"
df -h / | tail -1 | awk '{print "    总计: " $2 ", 已用: " $3 ", 可用: " $4 ", 使用率: " $5}'
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "💡 性能优化建议:"
echo "  - 健康检查响应时间应 < 0.1s"
echo "  - 数据库查询时间应 < 0.05s"
echo "  - API 容器内存使用应 < 512MB"
echo "  - PostgreSQL 容器内存使用应 < 1GB"
echo ""
