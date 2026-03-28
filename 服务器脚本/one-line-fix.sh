#!/bin/bash
# 一键修复数据库脚本 - 可以直接在服务器上运行

echo "========================================"; echo "开始修复数据库..."; echo "========================================"; cd /www/wwwroot/exammaster.zzzjl.com && echo "[1/5] 备份数据库..." && docker exec edumaster_postgres pg_dump -U edumaster_user edumaster | gzip > backups/pre-fix-backup-$(date +%Y%m%d_%H%M%S).sql.gz && echo "✅ 备份完成" && echo "" && echo "[2/5] 创建修复脚本..." && cat > /tmp/fix-db.sql << 'EOFFIX'
ALTER TABLE tags ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
UPDATE tags SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
DELETE FROM question_tags WHERE tag_id IS NULL;
DELETE FROM questions WHERE id LIKE 'test-%';
DELETE FROM banks WHERE id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';
DELETE FROM exam_history WHERE id LIKE 'test-%';
DELETE FROM exams WHERE id LIKE 'test-%';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banks' AND column_name = 'created_at') THEN ALTER TABLE banks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banks' AND column_name = 'updated_at') THEN ALTER TABLE banks ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'created_at') THEN ALTER TABLE questions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'updated_at') THEN ALTER TABLE questions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'sort_order') THEN ALTER TABLE questions ADD COLUMN sort_order INTEGER DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_history' AND column_name = 'created_at') THEN ALTER TABLE exam_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_sort_order ON questions(bank_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_exam_id ON exam_history(exam_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);
ANALYZE users; ANALYZE banks; ANALYZE questions; ANALYZE exam_history; ANALYZE tags; ANALYZE question_tags;
SELECT '✅ 数据库修复完成！' as status;
EOFFIX
echo "✅ 修复脚本已创建" && echo "" && echo "[3/5] 执行修复..." && docker exec -i edumaster_postgres psql -U edumaster_user -d edumaster < /tmp/fix-db.sql && echo "" && echo "[4/5] 重启 API 服务..." && docker compose restart api && sleep 3 && echo "" && echo "[5/5] 检查服务状态..." && docker ps | grep edumaster && echo "" && echo "========================================" && echo "✅ 修复完成！" && echo "========================================" && echo "" && echo "测试健康检查：" && curl -s http://localhost:3001/api/health && echo "" && echo ""
