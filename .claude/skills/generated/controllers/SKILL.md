---
name: controllers
description: "Skill for the Controllers area of ExamMaster. 8 symbols across 6 files."
---

# Controllers

8 symbols | 6 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how changePassword, changeAdminPassword, getExamHistory work
- Modifying controllers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/controllers/admin.controller.js` | changePassword, getExamHistory |
| `src/services/admin.service.js` | changeAdminPassword, getAllExamHistory |
| `src/controllers/note.controller.js` | saveNoteController |
| `src/services/note.service.js` | saveNote |
| `src/controllers/user.controller.js` | heartbeat |
| `src/services/user.service.js` | updateLastActivity |

## Entry Points

Start here when exploring this area:

- **`changePassword`** (Function) — `src/controllers/admin.controller.js:229`
- **`changeAdminPassword`** (Function) — `src/services/admin.service.js:671`
- **`getExamHistory`** (Function) — `src/controllers/admin.controller.js:251`
- **`getAllExamHistory`** (Function) — `src/services/admin.service.js:711`
- **`saveNoteController`** (Function) — `src/controllers/note.controller.js:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `changePassword` | Function | `src/controllers/admin.controller.js` | 229 |
| `changeAdminPassword` | Function | `src/services/admin.service.js` | 671 |
| `getExamHistory` | Function | `src/controllers/admin.controller.js` | 251 |
| `getAllExamHistory` | Function | `src/services/admin.service.js` | 711 |
| `saveNoteController` | Function | `src/controllers/note.controller.js` | 12 |
| `saveNote` | Function | `src/services/note.service.js` | 15 |
| `heartbeat` | Function | `src/controllers/user.controller.js` | 62 |
| `updateLastActivity` | Function | `src/services/user.service.js` | 163 |

## How to Explore

1. `gitnexus_context({name: "changePassword"})` — see callers and callees
2. `gitnexus_query({query: "controllers"})` — find related execution flows
3. Read key files listed above for implementation details
