-- 迁移分组题库权限: 旧格式 banks: ["id1", "id2"] → 新格式 banks: { mode, banks }
-- 空数组 → mode='none'
-- 非空数组 → mode='specific'

UPDATE user_groups
SET permissions = jsonb_set(
  permissions,
  '{banks}',
  CASE
    WHEN jsonb_typeof(permissions->'banks') = 'array' THEN
      CASE
        WHEN jsonb_array_length(permissions->'banks') = 0 THEN
          '{"mode": "none", "banks": []}'::jsonb
        ELSE
          jsonb_build_object('mode', 'specific', 'banks', permissions->'banks')
      END
    WHEN permissions->'banks' IS NULL THEN
      '{"mode": "all", "banks": []}'::jsonb
    ELSE
      permissions->'banks'
  END
)
WHERE permissions ? 'banks';
