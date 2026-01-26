#!/bin/bash

# EduMaster 清理和优化脚本
# 用途：清理测试数据、优化 Docker 镜像、清理日志文件

set -e

echo "========================================="
echo "EduMaster 清理和优化脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 清理测试数据
echo -e "${YELLOW}[1/5] 清理测试数据...${NC}"

if docker ps | grep -q edumaster_postgres; then
    echo "正在清理数据库中的测试数据..."
    
    # 清理测试用户
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    DELETE FROM users WHERE id LIKE 'test-%';
    " > /dev/null 2>&1
    
    # 清理测试题库
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    DELETE FROM banks WHERE id LIKE 'test-%';
    " > /dev/null 2>&1
    
    # 清理测试题目
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    DELETE FROM questions WHERE id LIKE 'test-%' OR id LIKE 'batch-%' OR id LIKE 'fk-test-%';
    " > /dev/null 2>&1
    
    # 清理测试考试
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    DELETE FROM exams WHERE id LIKE 'test-%';
    " > /dev/null 2>&1
    
    # 清理测试标签
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    DELETE FROM tags WHERE id LIKE 'test-%';
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✓ 测试数据清理完成${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL 容器未运行，跳过数据库清理${NC}"
fi

# 2. 清理旧日志文件
echo -e "${YELLOW}[2/5] 清理旧日志文件...${NC}"

if [ -d "logs" ]; then
    # 删除 30 天前的日志
    find logs/ -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # 统计日志文件
    LOG_COUNT=$(find logs/ -name "*.log" | wc -l)
    LOG_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1)
    
    echo -e "${GREEN}✓ 日志清理完成${NC}"
    echo "  - 日志文件数量: $LOG_COUNT"
    echo "  - 日志总大小: $LOG_SIZE"
else
    echo -e "${YELLOW}⚠ logs 目录不存在${NC}"
fi

# 3. 清理 Docker 资源
echo -e "${YELLOW}[3/5] 清理 Docker 资源...${NC}"

# 清理未使用的镜像
echo "清理未使用的 Docker 镜像..."
docker image prune -f > /dev/null 2>&1 || true

# 清理未使用的容器
echo "清理停止的容器..."
docker container prune -f > /dev/null 2>&1 || true

# 清理未使用的网络
echo "清理未使用的网络..."
docker network prune -f > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Docker 资源清理完成${NC}"

# 4. 优化数据库
echo -e "${YELLOW}[4/5] 优化数据库...${NC}"

if docker ps | grep -q edumaster_postgres; then
    echo "正在执行 VACUUM ANALYZE..."
    
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    VACUUM ANALYZE;
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✓ 数据库优化完成${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL 容器未运行，跳过数据库优化${NC}"
fi

# 5. 显示资源使用情况
echo -e "${YELLOW}[5/5] 资源使用情况...${NC}"

if docker ps | grep -q edumaster; then
    echo ""
    echo "Docker 容器状态:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -n 6
    
    echo ""
    echo "数据库大小:"
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    SELECT pg_size_pretty(pg_database_size('edumaster')) as database_size;
    " 2>/dev/null || echo "无法获取数据库大小"
    
    echo ""
    echo "表数量和行数:"
    docker exec edumaster_postgres psql -U edumaster_user -d edumaster -c "
    SELECT 
        schemaname,
        COUNT(*) as table_count,
        SUM(n_live_tup) as total_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    GROUP BY schemaname;
    " 2>/dev/null || echo "无法获取表统计信息"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}清理和优化完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
