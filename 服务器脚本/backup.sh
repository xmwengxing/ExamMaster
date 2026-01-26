#!/bin/bash

# PostgreSQL 数据库备份脚本
# 使用 pg_dump 导出数据库，压缩备份文件，保留最近 7 天的备份

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
LOG_FILE="$LOG_DIR/backup.log"

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

# 备份配置
BACKUP_RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="edumaster_backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

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

# 创建必要的目录
create_directories() {
    print_step "创建备份和日志目录..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    print_info "备份目录: $BACKUP_DIR"
    print_info "日志目录: $LOG_DIR"
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

# 检查数据库连接
check_database_connection() {
    print_step "检查数据库连接..."
    
    # 使用 Docker exec 测试连接
    if docker exec edumaster_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_info "数据库连接正常"
        return 0
    else
        print_error "无法连接到数据库"
        return 1
    fi
}

# 执行数据库备份
perform_backup() {
    print_step "开始备份数据库..."
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILE"
    local backup_path_gz="$BACKUP_DIR/$BACKUP_FILE_GZ"
    
    print_info "备份文件: $BACKUP_FILE_GZ"
    
    # 使用 Docker exec 执行 pg_dump
    # --clean: 在重新创建之前清理（删除）数据库对象
    # --if-exists: 使用 IF EXISTS 子句删除对象
    # --create: 包含创建数据库的命令
    # --format=plain: 输出纯文本 SQL 脚本
    if docker exec edumaster_postgres pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        > "$backup_path" 2>> "$LOG_FILE"; then
        
        print_info "数据库导出成功"
        
        # 压缩备份文件
        print_step "压缩备份文件..."
        if gzip "$backup_path"; then
            print_info "备份文件已压缩"
            
            # 显示备份文件大小
            local file_size=$(du -h "$backup_path_gz" | cut -f1)
            print_info "备份文件大小: $file_size"
            
            return 0
        else
            print_error "压缩备份文件失败"
            return 1
        fi
    else
        print_error "数据库导出失败"
        return 1
    fi
}

# 验证备份文件
verify_backup() {
    print_step "验证备份文件..."
    
    local backup_path_gz="$BACKUP_DIR/$BACKUP_FILE_GZ"
    
    # 检查文件是否存在
    if [ ! -f "$backup_path_gz" ]; then
        print_error "备份文件不存在: $backup_path_gz"
        return 1
    fi
    
    # 检查文件大小（至少应该有 1KB）
    local file_size=$(stat -f%z "$backup_path_gz" 2>/dev/null || stat -c%s "$backup_path_gz" 2>/dev/null)
    if [ "$file_size" -lt 1024 ]; then
        print_error "备份文件太小，可能损坏: ${file_size} bytes"
        return 1
    fi
    
    # 测试 gzip 文件完整性
    if gzip -t "$backup_path_gz" 2>> "$LOG_FILE"; then
        print_info "备份文件验证通过"
        return 0
    else
        print_error "备份文件损坏"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    print_step "清理旧备份文件..."
    
    # 查找并删除超过 BACKUP_RETENTION_DAYS 天的备份文件
    local deleted_count=0
    
    # 使用 find 命令查找旧文件
    while IFS= read -r old_file; do
        if [ -f "$old_file" ]; then
            print_info "删除旧备份: $(basename "$old_file")"
            rm -f "$old_file"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_DIR" -name "edumaster_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS)
    
    if [ $deleted_count -gt 0 ]; then
        print_info "已删除 $deleted_count 个旧备份文件"
    else
        print_info "没有需要删除的旧备份文件"
    fi
    
    # 显示当前备份文件列表
    print_info "当前备份文件列表:"
    ls -lh "$BACKUP_DIR"/edumaster_backup_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || print_info "  无备份文件"
}

# 生成备份报告
generate_report() {
    print_step "生成备份报告..."
    
    local backup_path_gz="$BACKUP_DIR/$BACKUP_FILE_GZ"
    local file_size=$(du -h "$backup_path_gz" | cut -f1)
    local backup_count=$(ls -1 "$BACKUP_DIR"/edumaster_backup_*.sql.gz 2>/dev/null | wc -l)
    
    echo ""
    echo "========================================"
    echo "  数据库备份完成"
    echo "========================================"
    echo ""
    echo "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "备份文件: $BACKUP_FILE_GZ"
    echo "文件大小: $file_size"
    echo "备份位置: $BACKUP_DIR"
    echo "保留天数: $BACKUP_RETENTION_DAYS 天"
    echo "当前备份数: $backup_count 个"
    echo ""
    echo "日志文件: $LOG_FILE"
    echo ""
    echo "========================================"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  PostgreSQL 数据库备份脚本"
    echo "========================================"
    echo ""
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 创建目录
    create_directories
    
    # 检查 Docker 容器
    if ! check_docker_container; then
        print_error "备份失败：PostgreSQL 容器未运行"
        exit 1
    fi
    
    # 检查数据库连接
    if ! check_database_connection; then
        print_error "备份失败：无法连接到数据库"
        exit 1
    fi
    
    # 执行备份
    if ! perform_backup; then
        print_error "备份失败：数据库导出失败"
        exit 1
    fi
    
    # 验证备份
    if ! verify_backup; then
        print_error "备份失败：备份文件验证失败"
        exit 1
    fi
    
    # 清理旧备份
    cleanup_old_backups
    
    # 记录结束时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_info "备份耗时: ${duration} 秒"
    
    # 生成报告
    generate_report
    
    print_info "备份成功完成！"
}

# 运行主函数
main

