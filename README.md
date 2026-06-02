# ExamMaster — Intelligent Practice & Exam System

[English](README.md) | [中文](README_CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI/CD](https://github.com/xmwengxing/ExamMaster/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/xmwengxing/ExamMaster/actions/workflows/ci-cd.yml)

A feature-rich online practice and exam system supporting recorded courses, live courses, student group permission management, and AI-powered analytics.

## ✨ Features

- 📝 **Multi-question practice** — Single choice / Multiple choice / True-False / Fill-in-the-blank / Short answer
- 🏛️ **Question bank system** — Multi-bank management, tags, chapters, import/export
- ✏️ **Mock exams** — Customizable question types, random/fixed question selection
- 📋 **System exams** — Admin-published exams with time limits for students
- 🎓 **Online courses** — Recorded courses (chapters + lessons) + Live courses (Tencent Meeting)
- 🏫 **Student groups** — Three-level permission model (personal priority + group assignment + resource granularity)
- 🤖 **AI-powered analytics** — Question explanations, AI grading for short answers
- 🔍 **Spaced repetition** — SRS intelligent review, automatic review scheduling
- 🗣️ **Community discussion** — Question discussion boards, peer-to-peer Q&A
- 🐳 **Multi-platform** — Docker / Windows / Linux one-click deployment

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster

# 1. Configure environment variables
cp .env.example .env
# Edit .env, modify DB_PASSWORD and JWT_SECRET

# 2. Start services
docker compose up -d

# 3. Import sample data (optional, includes 50+ questions and sample courses)
docker compose exec -T postgres psql -U examaster_user -d examaster < scripts/seed.sql

# 4. Access
# Frontend: http://localhost:9080
# API:  http://localhost:3080/api/health
# Default admin: admin / admin
```

### Local Development

```bash
# Requirements: Node.js 18+, PostgreSQL 14+
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster
npm install
cp .env.example .env
# Edit .env with database connection details
npm run dev
# Frontend: http://localhost:5180
# API proxied via Vite to backend
```

### Windows

```bash
git clone https://github.com/xmwengxing/ExamMaster.git
cd ExamMaster
# After installing Docker Desktop, run:
docker compose up -d
# Or use local development (requires Node.js and PostgreSQL)
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Ant Design 5, Recharts, TypeScript |
| Backend | Express 5, Node.js 18+, bcryptjs, jsonwebtoken |
| Database | PostgreSQL 14 (JSONB, Full-text search) |
| Containerization | Docker, Docker Compose |
| Testing | Vitest, Supertest |

## 📂 Directory Structure

```
├── src/                    # Backend API (Express)
│   ├── config/             # CORS, environment config
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route definitions
│   └── services/           # Business logic layer
├── pages/                  # Frontend page components
│   ├── Admin/              # Admin dashboard pages
│   └── Student/            # Student portal pages
├── components/             # Shared React components
├── postgres/               # Database
│   ├── init.sql            # Initial table creation script
│   └── migrations/         # Incremental migration scripts
├── scripts/                # Utility scripts
│   ├── cli.js              # CLI command entry
│   ├── seed.sql            # Sample data
│   └── generate-secure-passwords.js
├── courses/                # Interactive course presentations (see docs/COURSE-UPDATE-GUIDE.md)
│   └── <name>/             # e.g. ai-trainer/ — Vite + React + TTS output
├── dist/                   # Production build output (served by nginx)
├── tests/                  # Test files
├── nginx/                  # Nginx configuration
├── public/                 # Static assets
├── types/                  # TypeScript type definitions
└── docs/                   # Project documentation
    └── COURSE-UPDATE-GUIDE.md  # Interactive course authoring/deployment guide
```

## ⚙️ Configuration Guide

Edit `.env` file (copy from `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API service port | `3080` |
| `DB_HOST` | Database host (Docker: `postgres`) | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `examaster` |
| `DB_USER` | Database user | `examaster_user` |
| `DB_PASSWORD` | Database password | Use a strong password |
| `JWT_SECRET` | JWT signing key (64-character random string) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5180,http://localhost:9080` |
| `DEEPSEEK_API_KEY` | AI feature API key (optional) | - |

## 🔧 CLI Commands

```bash
npm run setup          # Interactive setup wizard
npm run admin:reset    # Reset admin password
npm run db:migrate     # Run database migrations
npm run db:seed        # Import sample data (50+ questions, courses)
pm run dev            # Start development mode
npm run build          # Build production version
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
npm run test           # Run tests
```

## 🎓 Interactive Courses

ExamMaster ships with a generic **interactive course** module that renders any Vite + React + TTS presentation under `courses/<name>/embed.html`, with chapters managed via the `interactive_courses` DB table and grouped by `interactive_course_groups`.

For course authoring, deploying, and DB management, see [**docs/COURSE-UPDATE-GUIDE.md**](docs/COURSE-UPDATE-GUIDE.md).

The authoring toolkit (templates, components, TTS runners) lives in the separate [**course-forge**](https://github.com/xmwengxing/course-forge) repository.

## 🚢 Docker Images

Pull from GitHub Container Registry:

```bash
docker pull ghcr.io/xmwengxing/ExamMaster:latest
```

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Issues and Pull Requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.