---
name: components
description: "Skill for the Components area of ExamMaster. 71 symbols across 16 files."
---

# Components

71 symbols | 16 files | Cohesion: 91%

## When to Use

- Working with code in `components/`
- Understanding how getCacheStats, initUpload, uploadChunk work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `components/CacheManager.tsx` | CacheManager, loadStats, formatSize, formatAge, handleClearCache (+5) |
| `components/RichTextEditor.tsx` | RichTextEditor, execCommand, setFontSize, setTextColor, handleInput (+3) |
| `components/ChunkedUpload.tsx` | initUpload, uploadChunk, completeUpload, startUpload, resumeUpload (+2) |
| `components/TagManager.tsx` | TagManager, loadTags, handleCreate, handleUpdate, handleDelete (+2) |
| `components/VideoPlayer.tsx` | VideoPlayer, isDirectVideo, isEmbeddableVideo, getEmbedUrl, getApiVideoUrl (+1) |
| `components/ImportTaskDetail.tsx` | ImportTaskDetail, loadTaskDetail, getStatusIcon, getStatusText, getStatusColor |
| `components/TagSelector.tsx` | TagSelector, loadTags, handleCreateTag, handleToggleTag, handleRemoveTag |
| `components/CommentTree.tsx` | CommentTree, buildCommentTree, CommentNode, formatDate |
| `components/DiscussionDetail.tsx` | DiscussionDetail, loadDiscussionDetail, handlePostComment, formatDate |
| `components/DiscussionList.tsx` | DiscussionList, loadDiscussions, formatDate, DiscussionCard |

## Entry Points

Start here when exploring this area:

- **`getCacheStats`** (Function) — `utils/cache.ts:408`
- **`initUpload`** (Function) — `components/ChunkedUpload.tsx:51`
- **`uploadChunk`** (Function) — `components/ChunkedUpload.tsx:71`
- **`completeUpload`** (Function) — `components/ChunkedUpload.tsx:119`
- **`startUpload`** (Function) — `components/ChunkedUpload.tsx:138`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getCacheStats` | Function | `utils/cache.ts` | 408 |
| `initUpload` | Function | `components/ChunkedUpload.tsx` | 51 |
| `uploadChunk` | Function | `components/ChunkedUpload.tsx` | 71 |
| `completeUpload` | Function | `components/ChunkedUpload.tsx` | 119 |
| `startUpload` | Function | `components/ChunkedUpload.tsx` | 138 |
| `resumeUpload` | Function | `components/ChunkedUpload.tsx` | 226 |
| `continueUpload` | Function | `components/ChunkedUpload.tsx` | 233 |
| `handleFileSelect` | Function | `components/ChunkedUpload.tsx` | 318 |
| `ImportTaskDetail` | Function | `components/ImportTaskDetail.tsx` | 54 |
| `loadTaskDetail` | Function | `components/ImportTaskDetail.tsx` | 64 |
| `getStatusIcon` | Function | `components/ImportTaskDetail.tsx` | 139 |
| `getStatusText` | Function | `components/ImportTaskDetail.tsx` | 154 |
| `getStatusColor` | Function | `components/ImportTaskDetail.tsx` | 169 |
| `logout` | Function | `store.ts` | 661 |
| `clearAllCache` | Function | `utils/cache.ts` | 352 |
| `ChunkedUploadProgress` | Function | `components/ChunkedUploadProgress.tsx` | 18 |
| `formatFileSize` | Function | `utils/chunkedUpload.ts` | 309 |
| `formatSpeed` | Function | `utils/chunkedUpload.ts` | 319 |
| `formatTime` | Function | `utils/chunkedUpload.ts` | 326 |
| `CacheManager` | Function | `components/CacheManager.tsx` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CommentTree → RemoveCachedDataChunked` | cross_community | 7 |
| `CommentTree → DispatchErrorEvent` | cross_community | 7 |
| `CacheManager → RemoveCachedDataChunked` | cross_community | 6 |
| `CacheManager → DispatchErrorEvent` | cross_community | 6 |
| `TagManager → RemoveCachedDataChunked` | cross_community | 6 |
| `TagManager → DispatchErrorEvent` | cross_community | 6 |
| `TagSelector → RemoveCachedDataChunked` | cross_community | 6 |
| `TagSelector → DispatchErrorEvent` | cross_community | 6 |
| `DiscussionDetail → RemoveCachedDataChunked` | cross_community | 6 |
| `DiscussionDetail → DispatchErrorEvent` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Student | 6 calls |
| Cluster_234 | 2 calls |
| Cluster_232 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "getCacheStats"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
