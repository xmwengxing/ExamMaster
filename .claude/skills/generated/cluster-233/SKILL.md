---
name: cluster-233
description: "Skill for the Cluster_233 area of ExamMaster. 8 symbols across 2 files."
---

# Cluster_233

8 symbols | 2 files | Cohesion: 78%

## When to Use

- Working with code in `utils/`
- Understanding how fetchTags, fetchDiscussions, getCachedData work
- Modifying cluster_233-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `utils/cache.ts` | getCachedData, setCachedDataChunked, getCachedDataChunked, removeCachedDataChunked, setCachedData (+1) |
| `store.ts` | fetchTags, fetchDiscussions |

## Entry Points

Start here when exploring this area:

- **`fetchTags`** (Function) — `store.ts:1130`
- **`fetchDiscussions`** (Function) — `store.ts:1251`
- **`getCachedData`** (Function) — `utils/cache.ts:40`
- **`setCachedData`** (Function) — `utils/cache.ts:255`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `fetchTags` | Function | `store.ts` | 1130 |
| `fetchDiscussions` | Function | `store.ts` | 1251 |
| `getCachedData` | Function | `utils/cache.ts` | 40 |
| `setCachedData` | Function | `utils/cache.ts` | 255 |
| `setCachedDataChunked` | Function | `utils/cache.ts` | 107 |
| `getCachedDataChunked` | Function | `utils/cache.ts` | 178 |
| `removeCachedDataChunked` | Function | `utils/cache.ts` | 227 |
| `clearOldestCache` | Function | `utils/cache.ts` | 370 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Exams → ClearOldestCache` | cross_community | 7 |
| `CommentTree → RemoveCachedDataChunked` | cross_community | 7 |
| `PracticeModeView → RemoveCachedDataChunked` | cross_community | 6 |
| `DiscussionManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalPractice → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticeList → RemoveCachedDataChunked` | cross_community | 6 |
| `AiAnalysisViewer → RemoveCachedDataChunked` | cross_community | 6 |
| `ContentManager → RemoveCachedDataChunked` | cross_community | 6 |
| `StudentHome → RemoveCachedDataChunked` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "fetchTags"})` — see callers and callees
2. `gitnexus_query({query: "cluster_233"})` — find related execution flows
3. Read key files listed above for implementation details
