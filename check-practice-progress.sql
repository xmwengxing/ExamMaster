-- Check practice progress records
-- Execute: psql -U edumaster_user -d edumaster -f check-practice-progress.sql

\echo 'Checking practice_records table...';
\echo '';

-- Check table structure
\echo '1. Table structure:';
\d practice_records;

\echo '';
\echo '2. Recent practice records (last 10):';
SELECT 
  id,
  user_id,
  bank_id,
  mode,
  current_index,
  jsonb_array_length(COALESCE(user_answers::jsonb, '{}'::jsonb)) as answer_count,
  is_custom,
  date,
  created_at
FROM practice_records
ORDER BY created_at DESC
LIMIT 10;

\echo '';
\echo '3. Check for records with progress:';
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE current_index > 0) as records_with_progress,
  COUNT(*) FILTER (WHERE jsonb_typeof(user_answers::jsonb) = 'object' AND jsonb_object_keys(user_answers::jsonb) IS NOT NULL) as records_with_answers
FROM practice_records;
