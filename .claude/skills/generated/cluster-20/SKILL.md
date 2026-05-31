---
name: cluster-20
description: "Skill for the Cluster_20 area of ExamMaster. 5 symbols across 1 files."
---

# Cluster_20

5 symbols | 1 files | Cohesion: 92%

## When to Use

- Understanding how App, handleNavigate, checkPracticeSession work
- Modifying cluster_20-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `App.tsx` | App, handleNavigate, checkPracticeSession, handleInputChange, renderContent |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `App` | Function | `App.tsx` | 50 |
| `handleNavigate` | Function | `App.tsx` | 189 |
| `checkPracticeSession` | Function | `App.tsx` | 194 |
| `handleInputChange` | Function | `App.tsx` | 265 |
| `renderContent` | Function | `App.tsx` | 405 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `App → RemoveCachedDataChunked` | cross_community | 6 |
| `App → DispatchErrorEvent` | cross_community | 6 |
| `App → ClearOldestCache` | cross_community | 5 |
| `App → RemoveCachedDataByPrefix` | cross_community | 4 |
| `App → HandleNavigate` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Student | 1 calls |

## How to Explore

1. `gitnexus_context({name: "App"})` — see callers and callees
2. `gitnexus_query({query: "cluster_20"})` — find related execution flows
3. Read key files listed above for implementation details
