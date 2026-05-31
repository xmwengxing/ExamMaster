---
name: scripts
description: "Skill for the Scripts area of ExamMaster. 134 symbols across 21 files."
---

# Scripts

134 symbols | 21 files | Cohesion: 91%

## When to Use

- Working with code in `scripts/`
- Understanding how getPoolStatus, closePool, getDatabaseMonitor work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/convert-questions-gui.py` | browse_file, browse_output_dir, log_message, _log, update_progress (+39) |
| `scripts/final-verification.js` | queries, addResult, checkDatabase, checkAPI, checkSecurity (+5) |
| `scripts/migrate.js` | openSQLiteDB, exportTableFromSQLite, importTableToPostgreSQL, migrateTable, validateMigration (+5) |
| `scripts/convert-questions.py` | clean_html_tags, normalize_question_type, normalize_options, detect_excel_columns, convert_excel_file (+5) |
| `scripts/verify-major-mappings-table.js` | verifyTableExists, verifyTableStructure, verifyIndexes, verifyUniqueConstraint, verifyCheckConstraint (+4) |
| `scripts/verify-migration.js` | openSQLiteDB, getSQLiteCount, getPostgreSQLCount, verifyRecordCounts, verifyForeignKeys (+3) |
| `scripts/analyze-query-performance.js` | analyzeTableSizes, analyzeIndexUsage, analyzeCacheHitRatio, analyzeTableStats, analyzeJsonbFields (+3) |
| `scripts/verify-occupation-list-table.js` | verifyTableExists, verifyTableStructure, verifyIndexes, verifyExampleData, testKeywordSearch (+2) |
| `scripts/verify-postgres-schema.js` | verifyTables, verifyIndexes, verifyForeignKeys, verifyJsonbFields, verifyAdminUser (+1) |
| `scripts/pack-and-upload.js` | createArchive, generateServerEnv, displayUploadInstructions, main |

## Entry Points

Start here when exploring this area:

- **`getPoolStatus`** (Function) — `db.js:423`
- **`closePool`** (Function) — `db.js:435`
- **`getDatabaseMonitor`** (Function) — `src/services/system.service.js:10`
- **`clean_html_tags`** (Function) — `scripts/convert-questions.py:38`
- **`normalize_question_type`** (Function) — `scripts/convert-questions.py:52`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getPoolStatus` | Function | `db.js` | 423 |
| `closePool` | Function | `db.js` | 435 |
| `getDatabaseMonitor` | Function | `src/services/system.service.js` | 10 |
| `clean_html_tags` | Function | `scripts/convert-questions.py` | 38 |
| `normalize_question_type` | Function | `scripts/convert-questions.py` | 52 |
| `normalize_options` | Function | `scripts/convert-questions.py` | 87 |
| `detect_excel_columns` | Function | `scripts/convert-questions.py` | 157 |
| `convert_excel_file` | Function | `scripts/convert-questions.py` | 201 |
| `normalize_answer` | Function | `scripts/convert-questions.py` | 69 |
| `convert_word_file` | Function | `scripts/convert-questions.py` | 272 |
| `generate_csv` | Function | `scripts/convert-questions.py` | 363 |
| `generate_report` | Function | `scripts/convert-questions.py` | 396 |
| `main` | Function | `scripts/convert-questions.py` | 415 |
| `main` | Function | `scripts/convert-questions-gui.py` | 1545 |
| `diagnose_excel` | Function | `scripts/diagnose-excel.py` | 18 |
| `main` | Function | `scripts/diagnose-excel.py` | 125 |
| `diagnose_row` | Function | `scripts/diagnose-specific-rows.py` | 6 |
| `main` | Function | `scripts/diagnose-specific-rows.py` | 52 |
| `browse_file` | Method | `scripts/convert-questions-gui.py` | 278 |
| `browse_output_dir` | Method | `scripts/convert-questions-gui.py` | 303 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Convert_file → _log` | cross_community | 4 |
| `Convert_file → _update` | cross_community | 4 |
| `Test_convert_file → _log` | intra_community | 3 |
| `Detect_question_type → _log` | intra_community | 3 |
| `Convert_file → Detect_excel_columns` | cross_community | 3 |
| `Compress_image → _log` | intra_community | 3 |
| `Cancel_conversion → _log` | intra_community | 3 |
| `Cancel_conversion → _update` | intra_community | 3 |
| `Save_as_json → _log` | intra_community | 3 |
| `Save_as_json → _update` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 4 calls |

## How to Explore

1. `gitnexus_context({name: "getPoolStatus"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
