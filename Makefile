# EduMaster 部署 Makefile
# 提供快速部署命令

.PHONY: help install build test deploy-local deploy-prod deploy-dev rollback clean

# 默认目标：显示帮助信息
help:
	@echo "EduMaster 部署命令"
	@echo ""
	@echo "可用命令："
	@echo "  make install       - 安装依赖"
	@echo "  make build         - 构建前端"
	@echo "  make test          - 运行测试"
	@echo "  make deploy-local  - 本地部署"
	@echo "  make deploy-prod   - 部署到生产环境"
	@echo "  make deploy-dev    - 部署到开发环境"
	@echo "  make rollback      - 回滚到上一个版本"
	@echo "  make clean         - 清理构建产物和 Docker 资源"
	@echo "  make logs          - 查看服务日志"
	@echo "  make status        - 查看服务状态"
	@echo "  make restart       - 重启服务"
	@echo ""

# 安装依赖
install:
	@echo "安装依赖..."
	npm ci

# 构建前端
build:
	@echo "构建前端..."
	npm run build

# 运行测试
test:
	@echo "运行测试..."
	npm test

# 本地部署
deploy-local:
	@echo "开始本地部署..."
	@chmod +x scripts/deploy-local.sh
	@./scripts/deploy-local.sh

# 部署到生产环境
deploy-prod:
	@echo "开始部署到生产环境..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh production

# 部署到开发环境
deploy-dev:
	@echo "开始部署到开发环境..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh development

# 回滚
rollback:
	@echo "开始回滚..."
	@chmod +x scripts/rollback.sh
	@./scripts/rollback.sh

# 清理
clean:
	@echo "清理构建产物和 Docker 资源..."
	@rm -rf dist/
	@rm -rf node_modules/
	@docker-compose down -v
	@docker system prune -f

# 查看日志
logs:
	@docker-compose logs -f

# 查看服务状态
status:
	@docker-compose ps

# 重启服务
restart:
	@docker-compose restart

# 停止服务
stop:
	@docker-compose down

# 启动服务
start:
	@docker-compose up -d

# 健康检查
health:
	@echo "检查 API 健康状态..."
	@curl -f http://localhost:3001/api/health || echo "API 健康检查失败"
	@echo ""
	@echo "检查前端可访问性..."
	@curl -f http://localhost || echo "前端可访问性检查失败"

# 数据库备份
backup:
	@echo "执行数据库备份..."
	@chmod +x scripts/backup.sh
	@./scripts/backup.sh

# 查看备份列表
list-backups:
	@echo "可用的备份："
	@ls -lt backups/ 2>/dev/null || echo "没有找到备份"

# 开发模式（前端热重载）
dev:
	@echo "启动开发模式..."
	npm run dev

# 开发模式（前端 + 后端）
dev-full:
	@echo "启动完整开发模式..."
	npm run start:dev

# 构建 Docker 镜像
docker-build:
	@echo "构建 Docker 镜像..."
	docker-compose build

# 推送 Docker 镜像
docker-push:
	@echo "推送 Docker 镜像..."
	@docker-compose push

# 拉取 Docker 镜像
docker-pull:
	@echo "拉取 Docker 镜像..."
	@docker-compose pull

# 查看 Docker 镜像
docker-images:
	@docker images | grep edumaster

# 清理 Docker 镜像
docker-clean:
	@echo "清理 Docker 镜像..."
	@docker image prune -a -f

# 初始化数据库
db-init:
	@echo "初始化数据库..."
	@docker-compose exec postgres psql -U edumaster_user -d edumaster -f /docker-entrypoint-initdb.d/init.sql

# 数据库迁移
db-migrate:
	@echo "执行数据库迁移..."
	@node scripts/migrate.js

# 验证数据库
db-verify:
	@echo "验证数据库..."
	@node scripts/verify-postgres-schema.js

# 连接到数据库
db-shell:
	@docker-compose exec postgres psql -U edumaster_user -d edumaster

# 查看数据库日志
db-logs:
	@docker-compose logs postgres

# 安全配置验证
security-verify:
	@echo "验证安全配置..."
	@node scripts/verify-security-config.js

# 性能分析
performance-analyze:
	@echo "分析查询性能..."
	@node scripts/analyze-query-performance.js

# 生成安全密码
generate-passwords:
	@echo "生成安全密码..."
	@node scripts/generate-secure-passwords.js

# Git 提交和推送
git-push:
	@echo "提交并推送代码..."
	@git add .
	@git commit -m "Update: $(shell date '+%Y-%m-%d %H:%M:%S')"
	@git push origin main

# 创建 Git 标签
git-tag:
	@echo "创建 Git 标签..."
	@read -p "输入版本号 (例如 v1.0.0): " version; \
	git tag -a $$version -m "Release $$version"; \
	git push origin $$version

# 查看 Git 日志
git-log:
	@git log --oneline --graph --decorate --all -10
