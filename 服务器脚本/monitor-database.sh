#!/bin/bash

# 数据库监控脚本
# 监控连接池状态、慢查询、查询性能指标

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
MONITOR_LOG="$LOG_DIR/database-monitor.log"

# 从 .env 文件读取数据库配置
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    echo -e "${RED}[错误] 未找到 .env 文件${NC}"
    exit 1
fi

# 数据库配置
DB_NAME="${DB_NAME:-edumaster}"
DB_USER="${DB_USER:-edumaster_user}"

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$MONITOR_LOG"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$MONITOR_LOG"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$MONITOR_LOG"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查 Docker 容器是否运行
check_container() {
    if ! docker ps | grep -q "edumaster_postgres"; then
        print_error "PostgreSQL 容器未运行"
        return 1
    fi
    return 0
}

# 获取数据库大小
get_database_size() {
    print_step "数据库大小"
    
    local size=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
    
    echo "  数据库大小: $size"
    print_info "数据库大小: $size"
}

# 获取表大小
get_table_sizes() {
    print_step "表大小（前 10 个最大的表）"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            schemaname || '.' || tablename AS table_name,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
         FROM pg_tables
         WHERE schemaname = 'public'
         ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
         LIMIT 10;" 2>/dev/null
}

# 获取连接数
get_connection_count() {
    print_step "数据库连接"
    
    local total=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
    
    local active=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ')
    
    local idle=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';" 2>/dev/null | tr -d ' ')
    
    echo "  总连接数: $total"
    echo "  活动连接: $active"
    echo "  空闲连接: $idle"
    
    print_info "连接数 - 总计: $total, 活动: $active, 空闲: $idle"
    
    # 警告：连接数过多
    if [ "$total" -gt 15 ]; then
        print_warn "连接数过多: $total (建议 < 15)"
    fi
}

# 获取慢查询
get_slow_queries() {
    print_step "慢查询（执行时间 > 1秒）"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            query,
            state
         FROM pg_stat_activity
         WHERE (now() - pg_stat_activity.query_start) > interval '1 seconds'
         AND state != 'idle'
         ORDER BY duration DESC;" 2>/dev/null
}

# 获取锁信息
get_locks() {
    print_step "数据库锁"
    
    local lock_count=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT count(*) FROM pg_locks;" 2>/dev/null | tr -d ' ')
    
    echo "  锁数量: $lock_count"
    print_info "锁数量: $lock_count"
    
    # 警告：锁过多
    if [ "$lock_count" -gt 100 ]; then
        print_warn "锁数量过多: $lock_count (建议 < 100)"
    fi
}

# 获取缓存命中率
get_cache_hit_ratio() {
    print_step "缓存命中率"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            sum(heap_blks_read) as heap_read,
            sum(heap_blks_hit) as heap_hit,
            sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 AS cache_hit_ratio
         FROM pg_statio_user_tables;" 2>/dev/null
}

# 获取索引使用情况
get_index_usage() {
    print_step "索引使用情况（未使用的索引）"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            schemaname || '.' || tablename AS table_name,
            indexname,
            idx_scan,
            pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
         FROM pg_stat_user_indexes
         WHERE idx_scan = 0
         AND schemaname = 'public'
         ORDER BY pg_relation_size(indexrelid) DESC
         LIMIT 10;" 2>/dev/null
}

# 获取表统计信息
get_table_stats() {
    print_step "表统计信息（前 10 个最活跃的表）"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            schemaname || '.' || tablename AS table_name,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_tup_ins,
            n_tup_upd,
            n_tup_del
         FROM pg_stat_user_tables
         WHERE schemaname = 'public'
         ORDER BY (seq_scan + idx_scan) DESC
         LIMIT 10;" 2>/dev/null
}

# 获取死元组
get_dead_tuples() {
    print_step "死元组（需要 VACUUM 的表）"
    
    docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT 
            schemaname || '.' || tablename AS table_name,
            n_dead_tup,
            n_live_tup,
            round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
         FROM pg_stat_user_tables
         WHERE n_dead_tup > 0
         AND schemaname = 'public'
         ORDER BY n_dead_tup DESC
         LIMIT 10;" 2>/dev/null
}

# 生成监控报告
generate_report() {
    echo ""
    echo "========================================"
    echo "  数据库监控报告"
    echo "========================================"
    echo ""
    echo "监控时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "数据库: $DB_NAME"
    echo ""
    echo "日志文件: $MONITOR_LOG"
    echo ""
    echo "========================================"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  PostgreSQL 数据库监控"
    echo "========================================"
    echo ""
    
    # 检查容器
    if ! check_container; then
        print_error "监控失败：PostgreSQL 容器未运行"
        exit 1
    fi
    
    # 获取各项指标
    get_database_size
    echo ""
    
    get_table_sizes
    echo ""
    
    get_connection_count
    echo ""
    
    get_slow_queries
    echo ""
    
    get_locks
    echo ""
    
    get_cache_hit_ratio
    echo ""
    
    get_index_usage
    echo ""
    
    get_table_stats
    echo ""
    
    get_dead_tuples
    echo ""
    
    # 生成报告
    generate_report
    
    print_info "监控完成"
}

# 运行主函数
main

