---
name: student
description: "Skill for the Student area of ExamMaster. 88 symbols across 19 files."
---

# Student

88 symbols | 19 files | Cohesion: 86%

## When to Use

- Working with code in `pages/`
- Understanding how useAppStore, getEffectiveApiKey, getApiKeyMissingMessage work
- Modifying student-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `pages/Student/PracticeMode.tsx` | PracticeModeView, handleSaveNote, handleExit, handleNext, handlePrev (+15) |
| `pages/Student/Practice.tsx` | PracticeList, handleStartPractice, getTypeLabel, getTypeSummary, handleCountChange (+3) |
| `pages/Student/PracticalPractice.tsx` | handleAiEvaluate, PracticalPractice, handleStartTask, handleUpdateAnswer, handleViewRecord (+2) |
| `pages/Student/LiveCourseDetail.tsx` | LiveCourseDetail, loadData, statusLabel, copyMeetingInfo, openInApp (+2) |
| `utils/deepseek.ts` | callBackendAI, getEffectiveApiKey, getApiKeyMissingMessage, callDeepSeekAPI, generateQuestionAnalysis (+1) |
| `pages/Student/Home.tsx` | StudentHome, handleBankChangeWithMemory, getHeatColor, fetchProgress, handleActionClick |
| `pages/Student/VodCourseDetail.tsx` | VodCourseDetail, loadData, selectLesson, handlePrevLesson, handleNextLesson |
| `pages/Student/Exams.tsx` | QuestionReviewItem, Exams, renderWrongReview, handleAIExplain |
| `pages/Student/Favorites.tsx` | Favorites, toggleSelect, getBankName, handleFilterChange |
| `pages/Student/Mistakes.tsx` | Mistakes, getBankName, getQuestionTypeLabel, handleBankChange |

## Entry Points

Start here when exploring this area:

- **`useAppStore`** (Function) — `store.ts:104`
- **`getEffectiveApiKey`** (Function) — `utils/deepseek.ts:31`
- **`getApiKeyMissingMessage`** (Function) — `utils/deepseek.ts:40`
- **`callDeepSeekAPI`** (Function) — `utils/deepseek.ts:44`
- **`generateQuestionAnalysis`** (Function) — `utils/deepseek.ts:59`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useAppStore` | Function | `store.ts` | 104 |
| `getEffectiveApiKey` | Function | `utils/deepseek.ts` | 31 |
| `getApiKeyMissingMessage` | Function | `utils/deepseek.ts` | 40 |
| `callDeepSeekAPI` | Function | `utils/deepseek.ts` | 44 |
| `generateQuestionAnalysis` | Function | `utils/deepseek.ts` | 59 |
| `generatePracticalEvaluation` | Function | `utils/deepseek.ts` | 93 |
| `DiscussionForm` | Function | `components/DiscussionForm.tsx` | 13 |
| `QuestionDiscussions` | Function | `components/QuestionDiscussions.tsx` | 9 |
| `loadDiscussions` | Function | `components/QuestionDiscussions.tsx` | 21 |
| `formatDate` | Function | `components/QuestionDiscussions.tsx` | 33 |
| `SecurityManager` | Function | `pages/Admin/SecurityManager.tsx` | 7 |
| `AccountSettings` | Function | `pages/Student/AccountSettings.tsx` | 14 |
| `Discussions` | Function | `pages/Student/Discussions.tsx` | 13 |
| `renderContent` | Function | `pages/Student/Discussions.tsx` | 70 |
| `QuestionReviewItem` | Function | `pages/Student/Exams.tsx` | 7 |
| `Exams` | Function | `pages/Student/Exams.tsx` | 136 |
| `renderWrongReview` | Function | `pages/Student/Exams.tsx` | 211 |
| `PracticeModeView` | Function | `pages/Student/PracticeMode.tsx` | 22 |
| `handleSaveNote` | Function | `pages/Student/PracticeMode.tsx` | 161 |
| `handleExit` | Function | `pages/Student/PracticeMode.tsx` | 231 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Exams → DispatchErrorEvent` | cross_community | 7 |
| `Exams → ClearOldestCache` | cross_community | 7 |
| `CommentTree → RemoveCachedDataChunked` | cross_community | 7 |
| `CommentTree → DispatchErrorEvent` | cross_community | 7 |
| `PracticeModeView → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticeModeView → DispatchErrorEvent` | cross_community | 6 |
| `DiscussionManager → RemoveCachedDataChunked` | cross_community | 6 |
| `DiscussionManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalManager → DispatchErrorEvent` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 2 calls |
| Cluster_230 | 1 calls |
| Cluster_231 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "useAppStore"})` — see callers and callees
2. `gitnexus_query({query: "student"})` — find related execution flows
3. Read key files listed above for implementation details
