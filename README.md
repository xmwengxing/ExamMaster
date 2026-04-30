# ExamMaster — 智能刷题考试系统

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI/CD](https://github.com/xmwengxing/ExamMaster/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/xmwengxing/ExamMaster/actions/workflows/ci-cd.yml)

一个功能完备的在线刷题与考试系统，支持录播课、直播课、学员分组权限管理、AI 智能解析等。

## ✨ 特性

- 📝 **多题型刷题** — 单选 / 多选 / 判断 / 填空 / 简答
- 🏛️ **题库系统** — 多题库管理、标签、章节、导入 / 导出
- ✏️ **模拟考试** — 自定义题型数量、随机 / 固定出题
- 📋 **系统考试** — 管理员发布考试，学员限时作答
- 🎓 **在线课程** — 录播课（章节+课时）+ 直播课（腾讯会议）
- 🏫 **学员分组** — 三级权限模型（个人高优 + 分组分配 + 资源粒度）
- 🤖 **AI 智能解析** — 题目解析、简答题 AI 评分
- 🔍 **间隔重复** — SRS 智能复习，自动安排复习计划
- 🗣️ **社区讨论** — 题目讨论区，学员互助答疑
- 🐳 **多平台** — Docker / Windows / Linux 一键部署

## 🚀 快速开始

### Docker（推荐）

```bash
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster

# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，修改 DB_PASSWORD 和 JWT_SECRET

# 2. 一键启动
docker compose up -d

# 3. 导入示例数据（可选，含 50+ 题、示例课程）
docker compose exec -T postgres psql -U examaster_user -d examaster < scripts/seed.sql

# 4. 访问
# 前端: http://localhost:9080
# API:  http://localhost:3080/api/health
# 默认管理员: admin / admin
```

### 本地开发

```bash
# 要求: Node.js 18+, PostgreSQL 14+
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster
npm install
cp .env.example .env
# 编辑 .env 中的数据库连接信息
npm run dev
# 前端: http://localhost:5180
# API 通过 Vite 代理到后端
```

### Windows

```bash
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster
# 安装 Docker Desktop 后运行:
docker compose up -d
# 或使用本地开发流程（需安装 Node.js 和 PostgreSQL）
```

## 🏗️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19, Vite 6, Ant Design 5, Recharts, TypeScript |
| 后端 | Express 5, Node.js 18+, bcryptjs, jsonwebtoken |
| 数据库 | PostgreSQL 14 (JSONB, 全文搜索) |
| 容器化 | Docker, Docker Compose |
| 测试 | Vitest, Supertest |

## 📂 目录结构

```
├── src/                    # 后端 API (Express)
│   ├── config/             # CORS, 环境配置
│   ├── controllers/        # 请求处理器
│   ├── middleware/         # Express 中间件
│   ├── routes/             # 路由定义
│   └── services/           # 业务逻辑层
├── pages/                  # 前端页面组件
│   ├── Admin/              # 管理后台页面
│   └── Student/            # 学员端页面
├── components/             # 共享 React 组件
├── postgres/               # 数据库
│   ├── init.sql            # 初始化建表脚本
│   └── migrations/         # 增量迁移脚本
├── scripts/                # 工具脚本
│   ├── cli.js              # CLI 命令入口
│   ├── seed.sql            # 示例数据
│   └── generate-secure-passwords.js
├── tests/                  # 测试文件
├── nginx/                  # Nginx 配置
├── public/                 # 静态资源
└── types/                  # TypeScript 类型定义
```

## ⚙️ 配置指南

编辑 `.env` 文件（从 `.env.example` 复制）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | API 服务端口 | `3080` |
| `DB_HOST` | 数据库主机 (Docker 中为 `postgres`) | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_NAME` | 数据库名称 | `examaster` |
| `DB_USER` | 数据库用户 | `examaster_user` |
| `DB_PASSWORD` | 数据库密码 | 自定强密码 |
| `JWT_SECRET` | JWT 签名密钥 (64 位随机字符串) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ALLOWED_ORIGINS` | CORS 允许的来源 | `http://localhost:5180,http://localhost:9080` |
| `DEEPSEEK_API_KEY` | AI 功能 API 密钥 (可选) | - |

## 🔧 CLI 命令

```bash
npm run setup          # 交互式初始化向导
npm run admin:reset    # 重置管理员密码
npm run db:migrate     # 执行数据库迁移
npm run db:seed        # 导入示例数据（50+ 题、课程）
npm run dev            # 启动开发模式
npm run build          # 构建生产版本
npm run docker:up      # 启动 Docker 服务
npm run docker:down    # 停止 Docker 服务
npm run test           # 运行测试
```

## 🚢 Docker 镜像

从 GitHub Container Registry 拉取：

```bash
docker pull ghcr.io/xmwengxing/ExamMaster:latest
```

## 📄 许可证

MIT License — 详见 [LICENSE](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md)
