---
name: cluster-230
description: "Skill for the Cluster_230 area of ExamMaster. 42 symbols across 1 files."
---

# Cluster_230

42 symbols | 1 files | Cohesion: 64%

## When to Use

- Understanding how refreshAll, login, updateProfile work
- Modifying cluster_230-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `store.ts` | refreshAll, login, updateProfile, addPracticeRecord, toggleFavorite (+37) |

## Entry Points

Start here when exploring this area:

- **`refreshAll`** (Function) — `store.ts:132`
- **`login`** (Function) — `store.ts:637`
- **`updateProfile`** (Function) — `store.ts:710`
- **`addPracticeRecord`** (Function) — `store.ts:750`
- **`toggleFavorite`** (Function) — `store.ts:781`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `refreshAll` | Function | `store.ts` | 132 |
| `login` | Function | `store.ts` | 637 |
| `updateProfile` | Function | `store.ts` | 710 |
| `addPracticeRecord` | Function | `store.ts` | 750 |
| `toggleFavorite` | Function | `store.ts` | 781 |
| `addToMistakes` | Function | `store.ts` | 786 |
| `updateSrsRecord` | Function | `store.ts` | 792 |
| `addStudent` | Function | `store.ts` | 798 |
| `updateStudent` | Function | `store.ts` | 802 |
| `deleteStudents` | Function | `store.ts` | 806 |
| `addCustomField` | Function | `store.ts` | 812 |
| `removeCustomField` | Function | `store.ts` | 816 |
| `addBank` | Function | `store.ts` | 822 |
| `updateBank` | Function | `store.ts` | 826 |
| `deleteBank` | Function | `store.ts` | 830 |
| `updateBankScore` | Function | `store.ts` | 834 |
| `publishExam` | Function | `store.ts` | 946 |
| `updateExam` | Function | `store.ts` | 950 |
| `deleteExam` | Function | `store.ts` | 954 |
| `toggleExamVisibility` | Function | `store.ts` | 958 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Exams → DispatchErrorEvent` | cross_community | 7 |
| `Exams → ClearOldestCache` | cross_community | 7 |
| `CommentTree → RemoveCachedDataChunked` | cross_community | 7 |
| `PracticeModeView → RemoveCachedDataChunked` | cross_community | 6 |
| `DiscussionManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalPractice → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticeList → RemoveCachedDataChunked` | cross_community | 6 |
| `AiAnalysisViewer → RemoveCachedDataChunked` | cross_community | 6 |
| `ContentManager → RemoveCachedDataChunked` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 42 calls |
| Cluster_233 | 2 calls |
| Cluster_234 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "refreshAll"})` — see callers and callees
2. `gitnexus_query({query: "cluster_230"})` — find related execution flows
3. Read key files listed above for implementation details
