#!/bin/bash
# ========================================
# 服务器所有网站备份脚本
# 用于系统升级前的完整备份
# ========================================

set -e  # 遇到错误立即退出

# 配置
BACKUP_ROOT="/root/backups"
SITES_ROOT="/www/wwwroot"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/system_upgrade_${TIMESTAMP}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}服务器网站备份工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "备份目录: ${BACKUP_DIR}"
echo ""

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 获取所有网站目录
echo -e "${YELLOW}[1/6] 扫描网站目录...${NC}"
cd "${SITES_ROOT}"
SITES=$(ls -d */ 2>/dev/null | sed 's#/##')
SITE_COUNT=$(echo "${SITES}" | wc -l)

echo "找到 ${SITE_COUNT} 个网站目录:"
echo "${SITES}" | nl
echo ""

# 备份每个网站
echo -e "${YELLOW}[2/6] 备份网站文件...${NC}"
for site in ${SITES}; do
    echo "  备份: ${site}"
    
    # 创建网站备份目录
    SITE_BACKUP="${BACKUP_DIR}/sites/${site}"
    mkdir -p "${SITE_BACKUP}"
    
    # 备份网站文件（排除 node_modules 和临时文件）
    tar -czf "${SITE_BACKUP}/files.tar.gz" \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='.git' \
        --exclude='dist' \
        -C "${SITES_ROOT}" \
        "${site}" 2>/dev/null || echo "    警告: ${site} 备份可能不完整"
    
    # 记录文件大小
    du -sh "${SITE_BACKUP}/files.tar.gz" | awk '{print "    大小: " $1}'
done
echo ""

# 备份 Docker 数据
echo -e "${YELLOW}[3/6] 备份 Docker 数据...${NC}"
if command -v docker &> /dev/null; then
    # 备份 Docker 卷
    DOCKER_VOLUMES=$(docker volume ls -q 2>/dev/null || echo "")
    if [ -n "${DOCKER_VOLUMES}" ]; then
        mkdir -p "${BACKUP_DIR}/docker/volumes"
        for volume in ${DOCKER_VOLUMES}; do
            echo "  备份卷: ${volume}"
            docker run --rm \
                -v "${volume}:/data" \
                -v "${BACKUP_DIR}/docker/volumes:/backup" \
                alpine tar -czf "/backup/${volume}.tar.gz" -C /data . 2>/dev/null || \
                echo "    警告: ${volume} 备份失败"
        done
    fi
    
    # 导出运行中的容器配置
    mkdir -p "${BACKUP_DIR}/docker/containers"
    docker ps -a --format "{{.Names}}" > "${BACKUP_DIR}/docker/containers/container_list.txt" 2>/dev/null || true
    
    echo "  Docker 数据备份完成"
else
    echo "  Docker 未安装，跳过"
fi
echo ""

# 备份数据库
echo -e "${YELLOW}[4/6] 备份数据库...${NC}"
mkdir -p "${BACKUP_DIR}/databases"

# PostgreSQL 备份（Docker 容器）
if command -v docker &> /dev/null; then
    PG_CONTAINERS=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" 2>/dev/null || echo "")
    if [ -n "${PG_CONTAINERS}" ]; then
        for container in ${PG_CONTAINERS}; do
            echo "  备份 PostgreSQL 容器: ${container}"
            docker exec "${container}" pg_dumpall -U postgres > \
                "${BACKUP_DIR}/databases/${container}_postgres.sql" 2>/dev/null || \
                echo "    警告: ${container} 数据库备份失败"
            
            # 记录备份大小
            if [ -f "${BACKUP_DIR}/databases/${container}_postgres.sql" ]; then
                size=$(du -sh "${BACKUP_DIR}/databases/${container}_postgres.sql" | awk '{print $1}')
                echo "    大小: ${size}"
            fi
        done
    fi
fi

# MySQL 备份（宝塔面板）
if command -v mysql &> /dev/null; then
    echo "  检测到 MySQL，开始备份..."
    
    # 宝塔面板的 MySQL 配置文件路径
    BT_MYSQL_CONF="/etc/my.cnf"
    
    # 尝试从宝塔配置读取 MySQL root 密码
    if [ -f "/www/server/panel/data/default.db" ]; then
        # 宝塔面板安装的 MySQL
        MYSQL_ROOT_PWD=$(cat /www/server/panel/default.pl 2>/dev/null | grep "mysql_root" | awk -F"'" '{print $2}')
        
        if [ -z "${MYSQL_ROOT_PWD}" ]; then
            # 尝试从宝塔数据库配置文件读取
            MYSQL_ROOT_PWD=$(grep "password" /www/server/panel/data/default.db 2>/dev/null | head -1 | awk -F"'" '{print $2}')
        fi
    fi
    
    # 如果找不到密码，尝试无密码连接或使用 .my.cnf
    if [ -z "${MYSQL_ROOT_PWD}" ] && [ -f "/root/.my.cnf" ]; then
        echo "    使用 /root/.my.cnf 配置"
        MYSQL_AUTH="--defaults-extra-file=/root/.my.cnf"
    elif [ -n "${MYSQL_ROOT_PWD}" ]; then
        echo "    使用宝塔面板 MySQL 密码"
        MYSQL_AUTH="-uroot -p${MYSQL_ROOT_PWD}"
    else
        echo "    ⚠️  警告: 无法获取 MySQL 密码，尝试无密码连接"
        MYSQL_AUTH="-uroot"
    fi
    
    # 获取所有数据库列表
    DATABASES=$(mysql ${MYSQL_AUTH} -e "SHOW DATABASES;" 2>/dev/null | grep -Ev "Database|information_schema|performance_schema|mysql|sys")
    
    if [ -n "${DATABASES}" ]; then
        echo "    找到 $(echo "${DATABASES}" | wc -l) 个数据库"
        
        # 备份每个数据库
        for db in ${DATABASES}; do
            echo "    备份数据库: ${db}"
            mysqldump ${MYSQL_AUTH} \
                --single-transaction \
                --quick \
                --lock-tables=false \
                --databases "${db}" > \
                "${BACKUP_DIR}/databases/mysql_${db}.sql" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                size=$(du -sh "${BACKUP_DIR}/databases/mysql_${db}.sql" | awk '{print $1}')
                echo "      ✅ 成功 (${size})"
            else
                echo "      ❌ 失败"
                rm -f "${BACKUP_DIR}/databases/mysql_${db}.sql"
            fi
        done
        
        # 同时创建一个完整备份
        echo "    创建 MySQL 完整备份..."
        mysqldump ${MYSQL_AUTH} \
            --all-databases \
            --single-transaction \
            --quick \
            --lock-tables=false \
            --events \
            --routines \
            --triggers > \
            "${BACKUP_DIR}/databases/mysql_all_databases.sql" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            size=$(du -sh "${BACKUP_DIR}/databases/mysql_all_databases.sql" | awk '{print $1}')
            echo "      ✅ 完整备份成功 (${size})"
        else
            echo "      ⚠️  完整备份失败，但单独数据库备份可能已成功"
            rm -f "${BACKUP_DIR}/databases/mysql_all_databases.sql"
        fi
    else
        echo "    ⚠️  无法连接 MySQL 或没有数据库需要备份"
        echo "    💡 提示: 如需手动备份，请运行:"
        echo "       mysqldump -uroot -p --all-databases > mysql_backup.sql"
    fi
else
    echo "  MySQL 未安装，跳过"
fi

# 备份宝塔面板数据库配置
if [ -d "/www/server/panel/data" ]; then
    echo "  备份宝塔面板数据库配置..."
    mkdir -p "${BACKUP_DIR}/baota"
    cp -r /www/server/panel/data "${BACKUP_DIR}/baota/" 2>/dev/null || true
    echo "    ✅ 宝塔配置已备份"
fi

echo ""

# 备份 Nginx 配置
echo -e "${YELLOW}[5/6] 备份 Nginx 配置...${NC}"
if [ -d "/www/server/panel/vhost/nginx" ]; then
    mkdir -p "${BACKUP_DIR}/nginx"
    cp -r /www/server/panel/vhost/nginx/* "${BACKUP_DIR}/nginx/" 2>/dev/null || true
    echo "  宝塔 Nginx 配置已备份"
fi

if [ -d "/etc/nginx" ]; then
    tar -czf "${BACKUP_DIR}/nginx/etc_nginx.tar.gz" -C /etc nginx 2>/dev/null || true
    echo "  系统 Nginx 配置已备份"
fi
echo ""

# 生成备份清单
echo -e "${YELLOW}[6/6] 生成备份清单...${NC}"

# 统计数据库备份
DB_COUNT=$(ls -1 "${BACKUP_DIR}/databases/" 2>/dev/null | wc -l)
PG_COUNT=$(ls -1 "${BACKUP_DIR}/databases/"*postgres*.sql 2>/dev/null | wc -l)
MYSQL_COUNT=$(ls -1 "${BACKUP_DIR}/databases/"mysql_*.sql 2>/dev/null | wc -l)

cat > "${BACKUP_DIR}/backup_manifest.txt" << EOF
========================================
服务器备份清单
========================================
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
系统信息: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
主机名: $(hostname)
内核版本: $(uname -r)

========================================
网站备份
========================================
网站数量: ${SITE_COUNT}
网站列表:
${SITES}

========================================
数据库备份
========================================
数据库文件总数: ${DB_COUNT}
PostgreSQL 备份: ${PG_COUNT} 个
MySQL 备份: ${MYSQL_COUNT} 个

数据库文件列表:
$(ls -lh "${BACKUP_DIR}/databases/" 2>/dev/null | tail -n +2 | awk '{print $9 " (" $5 ")"}' || echo "无")

========================================
Docker 信息
========================================
Docker 版本: $(docker --version 2>/dev/null || echo "未安装")
容器数量: $(docker ps -a --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
运行中容器: $(docker ps --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")

容器列表:
$(docker ps -a --format "{{.Names}} ({{.Status}})" 2>/dev/null || echo "无")

Docker 卷:
$(docker volume ls --format "{{.Name}}" 2>/dev/null || echo "无")

========================================
备份目录结构
========================================
$(tree -L 3 "${BACKUP_DIR}" 2>/dev/null || find "${BACKUP_DIR}" -maxdepth 3 -type d | sed 's|[^/]*/| |g')

========================================
备份大小统计
========================================
网站文件: $(du -sh "${BACKUP_DIR}/sites" 2>/dev/null | awk '{print $1}' || echo "0")
数据库: $(du -sh "${BACKUP_DIR}/databases" 2>/dev/null | awk '{print $1}' || echo "0")
Docker 卷: $(du -sh "${BACKUP_DIR}/docker" 2>/dev/null | awk '{print $1}' || echo "0")
Nginx 配置: $(du -sh "${BACKUP_DIR}/nginx" 2>/dev/null | awk '{print $1}' || echo "0")
宝塔配置: $(du -sh "${BACKUP_DIR}/baota" 2>/dev/null | awk '{print $1}' || echo "0")

总备份大小: $(du -sh "${BACKUP_DIR}" | awk '{print $1}')

========================================
恢复说明
========================================
1. 网站文件恢复:
   cd ${BACKUP_DIR}/sites
   tar -xzf <网站名>/files.tar.gz -C /www/wwwroot/

2. MySQL 数据库恢复:
   mysql -uroot -p < databases/mysql_all_databases.sql
   # 或单独恢复某个数据库:
   mysql -uroot -p < databases/mysql_<数据库名>.sql

3. PostgreSQL 数据库恢复:
   docker exec -i <容器名> psql -U postgres < databases/<容器名>_postgres.sql

4. Docker 卷恢复:
   docker volume create <卷名>
   docker run --rm -v <卷名>:/data -v ${BACKUP_DIR}/docker/volumes:/backup \\
     alpine tar -xzf /backup/<卷名>.tar.gz -C /data

5. Nginx 配置恢复:
   cp -r ${BACKUP_DIR}/nginx/* /www/server/panel/vhost/nginx/
   nginx -t && nginx -s reload

========================================
EOF

cat "${BACKUP_DIR}/backup_manifest.txt"
echo ""

# 压缩整个备份
echo -e "${YELLOW}压缩备份文件...${NC}"
cd "${BACKUP_ROOT}"
tar -czf "system_upgrade_${TIMESTAMP}.tar.gz" "system_upgrade_${TIMESTAMP}"
FINAL_SIZE=$(du -sh "system_upgrade_${TIMESTAMP}.tar.gz" | awk '{print $1}')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 备份完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📦 备份文件: ${BACKUP_ROOT}/system_upgrade_${TIMESTAMP}.tar.gz"
echo "📊 备份大小: ${FINAL_SIZE}"
echo "📁 备份目录: ${BACKUP_DIR}"
echo ""
echo "📋 备份内容:"
echo "  ✅ 网站文件: ${SITE_COUNT} 个网站"
echo "  ✅ 数据库: ${DB_COUNT} 个备份文件"
echo "     - PostgreSQL: ${PG_COUNT} 个"
echo "     - MySQL: ${MYSQL_COUNT} 个"
echo "  ✅ Docker 卷: $(ls -1 "${BACKUP_DIR}/docker/volumes/" 2>/dev/null | wc -l || echo "0") 个"
echo "  ✅ Nginx 配置"
echo "  ✅ 宝塔配置"
echo ""
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "1. 请立即下载备份文件到本地保存"
echo "2. 建议同时备份到云存储（阿里云 OSS）"
echo "3. 升级系统前请验证备份文件完整性"
echo "4. 保留备份至少 30 天"
echo ""
echo -e "${GREEN}📥 下载命令（在本地执行）:${NC}"
echo "scp root@47.104.173.139:${BACKUP_ROOT}/system_upgrade_${TIMESTAMP}.tar.gz ./"
echo ""
echo -e "${GREEN}🔍 验证备份完整性:${NC}"
echo "tar -tzf system_upgrade_${TIMESTAMP}.tar.gz | head -20"
echo ""
echo -e "${GREEN}📖 查看备份清单:${NC}"
echo "cat ${BACKUP_DIR}/backup_manifest.txt"
echo ""
