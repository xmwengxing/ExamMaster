---
name: cluster-234
description: "Skill for the Cluster_234 area of ExamMaster. 6 symbols across 2 files."
---

# Cluster_234

6 symbols | 2 files | Cohesion: 56%

## When to Use

- Working with code in `utils/`
- Understanding how createDiscussion, updateDiscussion, deleteDiscussion work
- Modifying cluster_234-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `store.ts` | createDiscussion, updateDiscussion, deleteDiscussion, toggleDiscussionVisibility, toggleDiscussionPin |
| `utils/cache.ts` | removeCachedDataByPrefix |

## Entry Points

Start here when exploring this area:

- **`createDiscussion`** (Function) — `store.ts:1306`
- **`updateDiscussion`** (Function) — `store.ts:1326`
- **`deleteDiscussion`** (Function) — `store.ts:1345`
- **`toggleDiscussionVisibility`** (Function) — `store.ts:1357`
- **`toggleDiscussionPin`** (Function) — `store.ts:1372`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createDiscussion` | Function | `store.ts` | 1306 |
| `updateDiscussion` | Function | `store.ts` | 1326 |
| `deleteDiscussion` | Function | `store.ts` | 1345 |
| `toggleDiscussionVisibility` | Function | `store.ts` | 1357 |
| `toggleDiscussionPin` | Function | `store.ts` | 1372 |
| `removeCachedDataByPrefix` | Function | `utils/cache.ts` | 333 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Exams → RemoveCachedDataByPrefix` | cross_community | 6 |
| `CommentTree → RemoveCachedDataByPrefix` | cross_community | 5 |
| `PracticeModeView → RemoveCachedDataByPrefix` | cross_community | 4 |
| `DiscussionManager → RemoveCachedDataByPrefix` | cross_community | 4 |
| `PracticalManager → RemoveCachedDataByPrefix` | cross_community | 4 |
| `PracticalPractice → RemoveCachedDataByPrefix` | cross_community | 4 |
| `PracticeList → RemoveCachedDataByPrefix` | cross_community | 4 |
| `AiAnalysisViewer → RemoveCachedDataByPrefix` | cross_community | 4 |
| `ContentManager → RemoveCachedDataByPrefix` | cross_community | 4 |
| `StudentHome → RemoveCachedDataByPrefix` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 5 calls |

## How to Explore

1. `gitnexus_context({name: "createDiscussion"})` — see callers and callees
2. `gitnexus_query({query: "cluster_234"})` — find related execution flows
3. Read key files listed above for implementation details
