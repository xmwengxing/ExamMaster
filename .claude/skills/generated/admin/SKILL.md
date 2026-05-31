---
name: admin
description: "Skill for the Admin area of ExamMaster. 159 symbols across 24 files."
---

# Admin

159 symbols | 24 files | Cohesion: 93%

## When to Use

- Working with code in `pages/`
- Understanding how SimpleImportManager, loadBanks, loadImportHistory work
- Modifying admin-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `pages/Admin/DiscussionManager.tsx` | DiscussionManager, loadDiscussions, loadComments, handleSelectDiscussion, handleBackToList (+7) |
| `pages/Admin/SimpleImportManager.tsx` | cleanContentForPreview, SimpleImportManager, loadBanks, loadImportHistory, handleFileChange (+7) |
| `pages/Admin/GroupManager.tsx` | GroupManager, fetchGroups, handleDelete, openPermsModal, openMembersModal (+6) |
| `pages/Admin/ImportTaskManager.tsx` | ImportTaskManager, viewTaskDetail, getStatusTag, formatFileSize, formatTime (+5) |
| `pages/Admin/MajorForms.tsx` | MajorForms, loadOccupations, handleEdit, handleSelectAll, handleSelectOne (+5) |
| `pages/Admin/BankManager.tsx` | processImportData, handleExcelImport, handleCSVImport, handleJSONImport, handleFileImport (+4) |
| `pages/Admin/OccupationManagement.tsx` | OccupationManagement, loadData, handleOpenModal, handleCloseModal, handleSubmit (+3) |
| `pages/Admin/VodCourseEditor.tsx` | VodCourseEditor, handleAddChapter, handleDeleteLesson, openEditLesson, refreshChapters (+3) |
| `pages/Admin/CourseManager.tsx` | CourseManager, fetchCourses, openEdit, handleStatusChange, handleDelete (+2) |
| `pages/Admin/LiveCourseManager.tsx` | LiveCourseManager, refresh, openEdit, handleSave, handleStatus (+2) |

## Entry Points

Start here when exploring this area:

- **`SimpleImportManager`** (Function) — `pages/Admin/SimpleImportManager.tsx:75`
- **`loadBanks`** (Function) — `pages/Admin/SimpleImportManager.tsx:118`
- **`loadImportHistory`** (Function) — `pages/Admin/SimpleImportManager.tsx:134`
- **`handleFileChange`** (Function) — `pages/Admin/SimpleImportManager.tsx:149`
- **`getTypeName`** (Function) — `pages/Admin/SimpleImportManager.tsx:238`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ChunkedUploader` | Class | `utils/chunkedUpload.ts` | 40 |
| `SimpleImportManager` | Function | `pages/Admin/SimpleImportManager.tsx` | 75 |
| `loadBanks` | Function | `pages/Admin/SimpleImportManager.tsx` | 118 |
| `loadImportHistory` | Function | `pages/Admin/SimpleImportManager.tsx` | 134 |
| `handleFileChange` | Function | `pages/Admin/SimpleImportManager.tsx` | 149 |
| `getTypeName` | Function | `pages/Admin/SimpleImportManager.tsx` | 238 |
| `handleRollback` | Function | `pages/Admin/SimpleImportManager.tsx` | 322 |
| `render` | Function | `pages/Admin/SimpleImportManager.tsx` | 360 |
| `ChunkedUpload` | Function | `components/ChunkedUpload.tsx` | 29 |
| `ImportTaskManager` | Function | `pages/Admin/ImportTaskManager.tsx` | 48 |
| `viewTaskDetail` | Function | `pages/Admin/ImportTaskManager.tsx` | 92 |
| `getStatusTag` | Function | `pages/Admin/ImportTaskManager.tsx` | 130 |
| `formatFileSize` | Function | `pages/Admin/ImportTaskManager.tsx` | 150 |
| `formatTime` | Function | `pages/Admin/ImportTaskManager.tsx` | 159 |
| `render` | Function | `pages/Admin/ImportTaskManager.tsx` | 191 |
| `ImportManager` | Function | `pages/Admin/ImportManager.tsx` | 55 |
| `loadTasks` | Function | `pages/Admin/ImportManager.tsx` | 68 |
| `handleViewDetail` | Function | `pages/Admin/ImportManager.tsx` | 170 |
| `handleCancelTask` | Function | `pages/Admin/ImportManager.tsx` | 176 |
| `handleRetry` | Function | `pages/Admin/ImportManager.tsx` | 192 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DiscussionManager → RemoveCachedDataChunked` | cross_community | 6 |
| `DiscussionManager → DispatchErrorEvent` | cross_community | 6 |
| `PracticalManager → RemoveCachedDataChunked` | cross_community | 6 |
| `PracticalManager → DispatchErrorEvent` | cross_community | 6 |
| `AiAnalysisViewer → RemoveCachedDataChunked` | cross_community | 6 |
| `AiAnalysisViewer → DispatchErrorEvent` | cross_community | 6 |
| `ContentManager → RemoveCachedDataChunked` | cross_community | 6 |
| `ContentManager → DispatchErrorEvent` | cross_community | 6 |
| `BankManager → RemoveCachedDataChunked` | cross_community | 6 |
| `BankManager → DispatchErrorEvent` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Student | 6 calls |
| Cluster_237 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "SimpleImportManager"})` — see callers and callees
2. `gitnexus_query({query: "admin"})` — find related execution flows
3. Read key files listed above for implementation details
