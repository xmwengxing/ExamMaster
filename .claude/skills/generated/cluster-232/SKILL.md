---
name: cluster-232
description: "Skill for the Cluster_232 area of ExamMaster. 6 symbols across 2 files."
---

# Cluster_232

6 symbols | 2 files | Cohesion: 43%

## When to Use

- Working with code in `utils/`
- Understanding how deleteQuestions, createTag, updateTag work
- Modifying cluster_232-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `store.ts` | deleteQuestions, createTag, updateTag, deleteTag, mergeTags |
| `utils/cache.ts` | removeCachedData |

## Entry Points

Start here when exploring this area:

- **`deleteQuestions`** (Function) — `store.ts:901`
- **`createTag`** (Function) — `store.ts:1162`
- **`updateTag`** (Function) — `store.ts:1178`
- **`deleteTag`** (Function) — `store.ts:1194`
- **`mergeTags`** (Function) — `store.ts:1206`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `deleteQuestions` | Function | `store.ts` | 901 |
| `createTag` | Function | `store.ts` | 1162 |
| `updateTag` | Function | `store.ts` | 1178 |
| `deleteTag` | Function | `store.ts` | 1194 |
| `mergeTags` | Function | `store.ts` | 1206 |
| `removeCachedData` | Function | `utils/cache.ts` | 314 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DeleteQuestions → DispatchErrorEvent` | cross_community | 4 |
| `AddQuestion → RemoveCachedDataChunked` | cross_community | 3 |
| `UpdateQuestion → RemoveCachedDataChunked` | cross_community | 3 |
| `DeleteQuestion → RemoveCachedDataChunked` | cross_community | 3 |
| `DeleteQuestions → RemoveCachedDataChunked` | cross_community | 3 |
| `ImportQuestions → RemoveCachedDataChunked` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_229 | 5 calls |
| Cluster_231 | 1 calls |
| Cluster_233 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "deleteQuestions"})` — see callers and callees
2. `gitnexus_query({query: "cluster_232"})` — find related execution flows
3. Read key files listed above for implementation details
