---
name: cluster-229
description: "Skill for the Cluster_229 area of ExamMaster. 61 symbols across 1 files."
---

# Cluster_229

61 symbols | 1 files | Cohesion: 65%

## When to Use

- Understanding how interval, refreshPracticeRecords, refreshBanks work
- Modifying cluster_229-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `store.ts` | dispatchErrorEvent, fetchApi, interval, refreshPracticeRecords, refreshBanks (+56) |

## Entry Points

Start here when exploring this area:

- **`interval`** (Function) — `store.ts:468`
- **`refreshPracticeRecords`** (Function) — `store.ts:476`
- **`refreshBanks`** (Function) — `store.ts:492`
- **`updatePracticeRecordDirect`** (Function) — `store.ts:514`
- **`checkBankUpdates`** (Function) — `store.ts:539`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `interval` | Function | `store.ts` | 468 |
| `refreshPracticeRecords` | Function | `store.ts` | 476 |
| `refreshBanks` | Function | `store.ts` | 492 |
| `updatePracticeRecordDirect` | Function | `store.ts` | 514 |
| `checkBankUpdates` | Function | `store.ts` | 539 |
| `sendHeartbeat` | Function | `store.ts` | 653 |
| `getPracticeRecord` | Function | `store.ts` | 715 |
| `updatePracticeRecord` | Function | `store.ts` | 755 |
| `deletePracticeRecord` | Function | `store.ts` | 760 |
| `getDailyProgress` | Function | `store.ts` | 765 |
| `incrementDailyProgress` | Function | `store.ts` | 769 |
| `addNote` | Function | `store.ts` | 773 |
| `getNote` | Function | `store.ts` | 777 |
| `changeAdminPassword` | Function | `store.ts` | 974 |
| `changePassword` | Function | `store.ts` | 984 |
| `batchSetStudentPerms` | Function | `store.ts` | 994 |
| `logAction` | Function | `store.ts` | 1078 |
| `gradeFillInBlank` | Function | `store.ts` | 1100 |
| `gradeShortAnswer` | Function | `store.ts` | 1114 |
| `fetchQuestionsByTags` | Function | `store.ts` | 1221 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Exams → DispatchErrorEvent` | cross_community | 7 |
| `CommentTree → DispatchErrorEvent` | cross_community | 7 |
| `PracticeModeView → DispatchErrorEvent` | cross_community | 6 |
| `DiscussionManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalPractice → DispatchErrorEvent` | cross_community | 6 |
| `PracticeList → DispatchErrorEvent` | cross_community | 6 |
| `AiAnalysisViewer → DispatchErrorEvent` | cross_community | 6 |
| `ContentManager → DispatchErrorEvent` | cross_community | 6 |
| `StudentHome → DispatchErrorEvent` | cross_community | 6 |

## How to Explore

1. `gitnexus_context({name: "interval"})` — see callers and callees
2. `gitnexus_query({query: "cluster_229"})` — find related execution flows
3. Read key files listed above for implementation details
