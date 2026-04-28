-- 清空现有数据
TRUNCATE TABLE major_mappings CASCADE;
TRUNCATE TABLE occupation_list CASCADE;

-- 导入专业对照表数据
\copy major_mappings from '/tmp/major_mappings.csv' with csv header;

-- 导入职业工种清单数据
\copy occupation_list from '/tmp/occupation_list.csv' with csv header;

-- 验证导入结果
SELECT COUNT(*) as major_mappings_count FROM major_mappings;
SELECT COUNT(*) as occupation_list_count FROM occupation_list;