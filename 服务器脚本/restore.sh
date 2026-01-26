#!/bin/bash

# PostgreSQL 数据库恢复脚本
# 从备份文件恢复数据库

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
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/restore.log"

# 从 .env 文件读取数据库配置
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    echo -e "${RED}[错误] 未找到 .env 文件${NC}"
    exit 1
fi

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-edumaster}"
DB_USER="${DB_USER:-edumaster_user}"
DB_PASSWORD="${DB_PASSWORD}"

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [STEP] $1" >> "$LOG_FILE"
}

# 列出可用的备份文件
list_backups() {
    print_step "可用的备份文件:"
    echo ""
    
    local backups=($(ls -t "$BACKUP_DIR"/edumaster_backup_*.sql.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        print_error "未找到备份文件"
        exit 1
    fi
    
    local index=1
    for backup in "${backups[@]}"; do
        local filename=$(basename "$backup")
        local filesize=$(du -h "$backup" | cut -f1)
        local filetime=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c%y "$backup" 2>/dev/null | cut -d'.' -f1)
        echo "  [$index] $filename"
        echo "      大小: $filesize"
        echo "      时间: $filetime"
        echo ""
        ((index++))
    done
}

# 选择备份文件
select_backup() {
    local backups=($(ls -t "$BACKUP_DIR"/edumaster_backup_*.sql.gz 2>/dev/null))
    
    if [ -n "$1" ]; then
        # 如果提供了参数，使用指定的备份文件
        BACKUP_FILE="$1"
        if [ ! -f "$BACKUP_FILE" ]; then
            print_error "备份文件不存在: $BACKUP_FILE"
            exit 1
        fi
    else
        # 否则使用最新的备份文件
        BACKUP_FILE="${backups[0]}"
        print_info "使用最新的备份文件: $(basename "$BACKUP_FILE")"
    fi
}

# 检查 Docker 容器是否运行
check_docker_container() {
    print_step "检查 Docker 容器状态..."
    
    if docker ps | grep -q "edumaster_postgres"; then
        print_info "PostgreSQL 容器正在运行"
        return 0
    else
        print_error "PostgreSQL 容器未运行"
        return 1
    fi
}

# 确认恢复操作
confirm_restore() {
    print_warn "警告：恢复操作将覆盖当前数据库中的所有数据！"
    echo ""
    read -p "确认要恢复数据库吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "恢复操作已取消"
        exit 0
    fi
}

# 创建当前数据库的备份
backup_current_database() {
    print_step "创建当前数据库的备份（以防万一）..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_restore_backup="$BACKUP_DIR/pre_restore_backup_${timestamp}.sql.gz"
    
    if docker exec edumaster_postgres pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        | gzip > "$pre_restore_backup" 2>> "$LOG_FILE"; then
        
        print_info "当前数据库已备份到: $(basename "$pre_restore_backup")"
        return 0
    else
        print_warn "无法备份当前数据库，继续恢复..."
        return 0
    fi
}

# 执行数据库恢复
perform_restore() {
    print_step "开始恢复数据库..."
    
    print_info "备份文件: $(basename "$BACKUP_FILE")"
    
    # 解压并恢复数据库
    if gunzip -c "$BACKUP_FILE" | docker exec -i edumaster_postgres psql -U "$DB_USER" -d postgres > /dev/null 2>> "$LOG_FILE"; then
        print_info "数据库恢复成功"
        return 0
    else
        print_error "数据库恢复失败"
        return 1
    fi
}

# 验证恢复结果
verify_restore() {
    print_step "验证恢复结果..."
    
    # 检查数据库连接
    if docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_info "数据库连接正常"
    else
        print_error "无法连接到数据库"
        return 1
    fi
    
    # 检查表数量
    local table_count=$(docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
        print_info "数据库包含 $table_count 个表"
        return 0
    else
        print_error "数据库中没有表"
        return 1
    fi
}

# 生成恢复报告
generate_report() {
    print_step "生成恢复报告..."
    
    echo ""
    echo "========================================"
    echo "  数据库恢复完成"
    echo "========================================"
    echo ""
    echo "恢复时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "备份文件: $(basename "$BACKUP_FILE")"
    echo "数据库名: $DB_NAME"
    echo ""
    echo "日志文件: $LOG_FILE"
    echo ""
    echo "========================================"
    echo ""
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [备份文件路径]"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用最新的备份文件"
    echo "  $0 backups/edumaster_backup_20260123_120000.sql.gz  # 使用指定的备份文件"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  PostgreSQL 数据库恢复脚本"
    echo "========================================"
    echo ""
    
    # 创建日志目录
    mkdir -p "$LOG_DIR"
    
    # 检查是否需要显示帮助
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # 列出可用的备份文件
    list_backups
    
    # 选择备份文件
    select_backup "$1"
    
    # 检查 Docker 容器
    if ! check_docker_container; then
        print_error "恢复失败：PostgreSQL 容器未运行"
        exit 1
    fi
    
    # 确认恢复操作
    confirm_restore
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 备份当前数据库
    backup_current_database
    
    # 执行恢复
    if ! perform_restore; then
        print_error "恢复失败：数据库恢复失败"
        exit 1
    fi
    
    # 验证恢复结果
    if ! verify_restore; then
        print_error "恢复失败：验证失败"
        exit 1
    fi
    
    # 记录结束时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_info "恢复耗时: ${duration} 秒"
    
    # 生成报告
    generate_report
    
    print_info "恢复成功完成！"
}

# 运行主函数
main "$@"

