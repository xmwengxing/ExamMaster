---
name: cluster-231
description: "Skill for the Cluster_231 area of ExamMaster. 7 symbols across 1 files."
---

# Cluster_231

7 symbols | 1 files | Cohesion: 52%

## When to Use

- Understanding how loadBankQuestions, handleSetActiveBank, refreshBank work
- Modifying cluster_231-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `store.ts` | loadBankQuestions, handleSetActiveBank, refreshBank, addQuestion, updateQuestion (+2) |

## Entry Points

Start here when exploring this area:

- **`loadBankQuestions`** (Function) — `store.ts:382`
- **`handleSetActiveBank`** (Function) — `store.ts:434`
- **`refreshBank`** (Function) — `store.ts:575`
- **`addQuestion`** (Function) — `store.ts:840`
- **`updateQuestion`** (Function) — `store.ts:864`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `loadBankQuestions` | Function | `store.ts` | 382 |
| `handleSetActiveBank` | Function | `store.ts` | 434 |
| `refreshBank` | Function | `store.ts` | 575 |
| `addQuestion` | Function | `store.ts` | 840 |
| `updateQuestion` | Function | `store.ts` | 864 |
| `deleteQuestion` | Function | `store.ts` | 876 |
| `importQuestions` | Function | `store.ts` | 922 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CommentTree → DispatchErrorEvent` | cross_community | 7 |
| `PracticeModeView → DispatchErrorEvent` | cross_community | 6 |
| `DiscussionManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalPractice → DispatchErrorEvent` | cross_community | 6 |
| `PracticeList → DispatchErrorEvent` | cross_community | 6 |
| `AiAnalysisViewer → DispatchErrorEvent` | cross_community | 6 |
| `ContentManager → DispatchErrorEvent` | cross_community | 6 |
| `StudentHome → DispatchErrorEvent` | cross_community | 6 |
| `CacheManager → DispatchErrorEvent` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 5 calls |
| Cluster_232 | 4 calls |

## How to Explore

1. `gitnexus_context({name: "loadBankQuestions"})` — see callers and callees
2. `gitnexus_query({query: "cluster_231"})` — find related execution flows
3. Read key files listed above for implementation details
