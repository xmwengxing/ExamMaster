# Contributing to ExamMaster

Thank you for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ExamMaster.git`
3. Install dependencies: `npm install`
4. Copy the environment template: `cp .env.example .env`
5. Generate secure keys: `node scripts/generate-secure-passwords.js` (or set your own in .env)
6. Start the development environment: `npm run dev`

## Development Workflow

### Branch Strategy

- `main` — Production-ready code
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/bug-description`

### Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add student group permission management
fix: resolve course chapter creation error
docs: update deployment guide
refactor: simplify permission checking logic
test: add unit tests for auth service
```

### Code Style

- We use ESLint and Prettier for code formatting
- Run `npx eslint .` to check for issues
- Run `npx prettier --write .` to format code
- TypeScript is used for type safety

### Before Submitting a PR

1. Run tests: `npm test`
2. Run linting: `npx eslint .`
3. Test the Docker build: `docker compose up -d`
4. Ensure no `.env` or secret files are committed
5. Update documentation if needed

## Pull Request Process

1. Create a PR from your branch to `main`
2. Fill out the PR template
3. Ensure CI passes
4. Request review from a maintainer
5. Address review feedback
6. Once approved, your PR will be merged

## Adding New Features

- Discuss major features in an issue first
- Follow the existing architecture pattern:
  - Backend: service → controller → route
  - Frontend: pages in `pages/` directory
  - Shared types in `types.ts`
- Add database migrations in `postgres/migrations/`
- Write tests for new functionality

## Project Structure

```
├── src/          # Backend (Express API)
│   ├── config/       # Configuration
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── routes/       # API route definitions
│   └── services/     # Business logic
├── pages/        # Frontend page components
│   ├── Admin/        # Admin dashboard pages
│   └── Student/      # Student interface pages
├── components/   # Shared React components
├── postgres/     # Database init + migrations
├── scripts/      # Utility scripts
├── public/       # Static assets
└── types/        # TypeScript type definitions
```

## Questions?

Open an issue or discussion on GitHub.
