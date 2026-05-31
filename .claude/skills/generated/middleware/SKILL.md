---
name: middleware
description: "Skill for the Middleware area of ExamMaster. 14 symbols across 2 files."
---

# Middleware

14 symbols | 2 files | Cohesion: 89%

## When to Use

- Working with code in `src/`
- Understanding how notFoundHandler, validateBody, validateQuery work
- Modifying middleware-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/middleware/errorHandler.js` | AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError (+4) |
| `src/services/auth.service.js` | login, changePassword, verifyToken, generateToken, refreshToken |

## Entry Points

Start here when exploring this area:

- **`notFoundHandler`** (Function) — `src/middleware/errorHandler.js:195`
- **`validateBody`** (Function) — `src/middleware/errorHandler.js:229`
- **`validateQuery`** (Function) — `src/middleware/errorHandler.js:257`
- **`login`** (Function) — `src/services/auth.service.js:20`
- **`changePassword`** (Function) — `src/services/auth.service.js:121`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AppError` | Class | `src/middleware/errorHandler.js` | 9 |
| `ValidationError` | Class | `src/middleware/errorHandler.js` | 23 |
| `NotFoundError` | Class | `src/middleware/errorHandler.js` | 34 |
| `UnauthorizedError` | Class | `src/middleware/errorHandler.js` | 45 |
| `ForbiddenError` | Class | `src/middleware/errorHandler.js` | 56 |
| `DatabaseError` | Class | `src/middleware/errorHandler.js` | 67 |
| `notFoundHandler` | Function | `src/middleware/errorHandler.js` | 195 |
| `validateBody` | Function | `src/middleware/errorHandler.js` | 229 |
| `validateQuery` | Function | `src/middleware/errorHandler.js` | 257 |
| `login` | Function | `src/services/auth.service.js` | 20 |
| `changePassword` | Function | `src/services/auth.service.js` | 121 |
| `verifyToken` | Function | `src/services/auth.service.js` | 177 |
| `generateToken` | Function | `src/services/auth.service.js` | 196 |
| `refreshToken` | Function | `src/services/auth.service.js` | 205 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ChangePassword → Query` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 4 calls |

## How to Explore

1. `gitnexus_context({name: "notFoundHandler"})` — see callers and callees
2. `gitnexus_query({query: "middleware"})` — find related execution flows
3. Read key files listed above for implementation details
