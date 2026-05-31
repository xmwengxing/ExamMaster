---
name: cluster-237
description: "Skill for the Cluster_237 area of ExamMaster. 4 symbols across 1 files."
---

# Cluster_237

4 symbols | 1 files | Cohesion: 86%

## When to Use

- Working with code in `utils/`
- Understanding how uploadChunks, uploadChunkWithRetry, uploadSingleChunk work
- Modifying cluster_237-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `utils/chunkedUpload.ts` | uploadChunks, uploadChunkWithRetry, uploadSingleChunk, sleep |

## Entry Points

Start here when exploring this area:

- **`uploadChunks`** (Method) — `utils/chunkedUpload.ts:118`
- **`uploadChunkWithRetry`** (Method) — `utils/chunkedUpload.ts:139`
- **`uploadSingleChunk`** (Method) — `utils/chunkedUpload.ts:192`
- **`sleep`** (Method) — `utils/chunkedUpload.ts:273`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `uploadChunks` | Method | `utils/chunkedUpload.ts` | 118 |
| `uploadChunkWithRetry` | Method | `utils/chunkedUpload.ts` | 139 |
| `uploadSingleChunk` | Method | `utils/chunkedUpload.ts` | 192 |
| `sleep` | Method | `utils/chunkedUpload.ts` | 273 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleUpload → UploadSingleChunk` | cross_community | 5 |
| `HandleUpload → Sleep` | cross_community | 5 |

## How to Explore

1. `gitnexus_context({name: "uploadChunks"})` — see callers and callees
2. `gitnexus_query({query: "cluster_237"})` — find related execution flows
3. Read key files listed above for implementation details
