---
name: services
description: "Skill for the Services area of ExamMaster. 248 symbols across 51 files."
---

# Services

248 symbols | 51 files | Cohesion: 84%

## When to Use

- Working with code in `src/`
- Understanding how getOne, getAllBanks, toggleFavoriteStatus work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/courses.service.js` | createLesson, getMyProgress, enrollCourse, updateProgress, rowToLesson (+16) |
| `src/services/registration.service.js` | getRegistrationById, updateRegistration, deleteRegistration, createMajorMapping, checkMajorMatch (+11) |
| `src/services/discussion.service.js` | getDiscussions, getQuestionDiscussions, getComments, getDiscussionById, createDiscussion (+9) |
| `src/services/question.service.js` | gradeFillInBlank, getQuestions, createQuestion, deleteQuestion, batchDeleteQuestions (+5) |
| `db.js` | getOne, getMany, query, execute, getClient (+4) |
| `src/controllers/registration.controller.js` | importMajorMappings, createOccupation, updateOccupation, deleteOccupation, getMajorMappings (+3) |
| `src/services/progress-tracker.service.js` | createProgress, generateSummary, generateFailureReport, updateProcessed, updateStage (+3) |
| `src/services/web-conversion.service.ts` | parseFile, parseExcelFile, parseExcelRow, parseWordFile, parseHTMLToQuestions (+3) |
| `src/services/web-conversion.service.js` | parseFile, parseExcelFile, parseExcelRow, parseWordFile, parseHTMLToQuestions (+3) |
| `src/services/groups.service.js` | getGroupStudents, getGroup, createGroup, updateGroup, updateGroupPermissions (+2) |

## Entry Points

Start here when exploring this area:

- **`getOne`** (Function) — `db.js:94`
- **`getAllBanks`** (Function) — `src/controllers/bank.controller.js:10`
- **`toggleFavoriteStatus`** (Function) — `src/controllers/favorite.controller.js:37`
- **`getNoteController`** (Function) — `src/controllers/note.controller.js:45`
- **`importMajorMappings`** (Function) — `src/controllers/registration.controller.js:524`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getOne` | Function | `db.js` | 94 |
| `getAllBanks` | Function | `src/controllers/bank.controller.js` | 10 |
| `toggleFavoriteStatus` | Function | `src/controllers/favorite.controller.js` | 37 |
| `getNoteController` | Function | `src/controllers/note.controller.js` | 45 |
| `importMajorMappings` | Function | `src/controllers/registration.controller.js` | 524 |
| `createOccupation` | Function | `src/controllers/registration.controller.js` | 765 |
| `updateOccupation` | Function | `src/controllers/registration.controller.js` | 831 |
| `deleteOccupation` | Function | `src/controllers/registration.controller.js` | 882 |
| `generateContent` | Function | `src/services/ai.service.js` | 84 |
| `gradeAnswer` | Function | `src/services/ai.service.js` | 129 |
| `getAnalysis` | Function | `src/services/ai.service.js` | 235 |
| `getBankById` | Function | `src/services/bank.service.js` | 57 |
| `createLesson` | Function | `src/services/courses.service.js` | 173 |
| `getMyProgress` | Function | `src/services/courses.service.js` | 293 |
| `enrollCourse` | Function | `src/services/courses.service.js` | 306 |
| `updateProgress` | Function | `src/services/courses.service.js` | 327 |
| `getExamById` | Function | `src/services/exam.service.js` | 45 |
| `toggleExamVisibility` | Function | `src/services/exam.service.js` | 204 |
| `toggleFavorite` | Function | `src/services/favorite.service.js` | 59 |
| `addMistake` | Function | `src/services/mistake.service.js` | 32 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpdateSRSRecordController → Query` | cross_community | 5 |
| `UpdateProgress → Query` | cross_community | 5 |
| `BatchDownloadDocuments → FormatDate` | intra_community | 5 |
| `DownloadDocument → FormatDate` | intra_community | 4 |
| `CreateRegistration → FormatDate` | intra_community | 4 |
| `Heartbeat → Query` | cross_community | 4 |
| `Logout → Query` | cross_community | 4 |
| `ToggleFavoriteStatus → Query` | cross_community | 4 |
| `BatchDownloadDocuments → Query` | cross_community | 4 |
| `BatchDownloadDocuments → GenerateSimpleVocationalDocx` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Scripts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getOne"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
