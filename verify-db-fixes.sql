-- Verify database fixes
-- Execute: psql -U edumaster_user -d edumaster -f verify-db-fixes.sql

\echo '========================================';
\echo 'Verifying Database Fixes';
\echo '========================================';
\echo '';

-- Check 1: Verify exam_history.exam_id foreign key constraint is removed
\echo 'Check 1: exam_history.exam_id foreign key constraint';
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'exam_history_exam_id_fkey' 
      AND table_name = 'exam_history'
    ) 
    THEN 'FAIL: Foreign key constraint still exists'
    ELSE 'PASS: Foreign key constraint removed'
  END AS result;

\echo '';

-- Check 2: Verify exam_history.exam_id allows NULL
\echo 'Check 2: exam_history.exam_id NULL constraint';
SELECT 
  CASE 
    WHEN is_nullable = 'YES' 
    THEN 'PASS: exam_id allows NULL'
    ELSE 'FAIL: exam_id does not allow NULL'
  END AS result
FROM information_schema.columns 
WHERE table_name = 'exam_history' AND column_name = 'exam_id';

\echo '';

-- Check 3: Verify all user fields exist
\echo 'Check 3: User table fields';
SELECT 
  column_name,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('gender', 'id_card', 'education_type', 'education_level', 'class_name')
ORDER BY column_name;

\echo '';

-- Check 4: Count exam_history records with NULL exam_id
\echo 'Check 4: exam_history records with NULL exam_id';
SELECT 
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'Found records with NULL exam_id (random mock exams)'
    ELSE 'No records with NULL exam_id yet'
  END AS status
FROM exam_history 
WHERE exam_id IS NULL;

\echo '';
\echo '========================================';
\echo 'Verification Complete';
\echo '========================================';
