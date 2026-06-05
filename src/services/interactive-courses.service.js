export async function listGroups(db) {
  const result = await db.query(
    'SELECT * FROM interactive_course_groups ORDER BY sort_order ASC, created_at DESC'
  );
  return result.rows;
}

export async function createGroup(db, data) {
  const id = `icg-${Date.now()}`;
  await db.query(
    'INSERT INTO interactive_course_groups (id, title, description, cover_image, sort_order) VALUES ($1,$2,$3,$4,$5)',
    [id, data.title, data.description || '', data.cover_image || '', data.sort_order || 0]
  );
  return { id, ...data };
}

export async function updateGroup(db, id, data) {
  await db.query(
    'UPDATE interactive_course_groups SET title=$1, description=$2, cover_image=$3, sort_order=$4, updated_at=NOW() WHERE id=$5',
    [data.title, data.description || '', data.cover_image || '', data.sort_order || 0, id]
  );
}

export async function deleteGroup(db, id) {
  await db.query('DELETE FROM interactive_course_groups WHERE id=$1', [id]);
}

export async function listChapters(db, filters = {}) {
  const conditions = [];
  const params = [];
  let i = 1;
  if (filters.group_id) {
    conditions.push(`c.group_id = $${i++}`);
    params.push(filters.group_id);
  }
  if (filters.status) {
    conditions.push(`c.status = $${i++}`);
    params.push(filters.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT c.*, g.title as group_title FROM interactive_courses c LEFT JOIN interactive_course_groups g ON c.group_id = g.id ${where} ORDER BY c.sort_order ASC, c.created_at DESC`,
    params
  );
  return result.rows;
}

export async function createChapter(db, data) {
  const id = `ic-${Date.now()}`;
  await db.query(
    'INSERT INTO interactive_courses (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, data.title, data.description || '', data.base_path, data.cover_image || '', data.status || 'draft', data.sort_order || 0, data.group_id, data.start_chapter ?? 0]
  );
  return { id, ...data };
}

export async function updateChapter(db, id, data) {
  await db.query(
    'UPDATE interactive_courses SET title=$1, description=$2, base_path=$3, cover_image=$4, status=$5, sort_order=$6, group_id=$7, start_chapter=$8, updated_at=NOW() WHERE id=$9',
    [data.title, data.description || '', data.base_path, data.cover_image || '', data.status || 'draft', data.sort_order || 0, data.group_id, data.start_chapter ?? 0, id]
  );
}

export async function deleteChapter(db, id) {
  await db.query('DELETE FROM interactive_courses WHERE id=$1', [id]);
}

// 从 course.json 自动检测并创建缺失的章节
export async function detectAndCreateChapters(db, groupId) {
  const fs = await import('fs');
  const path = await import('path');
  
  // 查询 group 名称以确定使用哪个 course JSON 文件
  const groupResult = await db.query('SELECT title FROM interactive_course_groups WHERE id=$1', [groupId]);
  const groupName = groupResult.rows[0]?.title || '';
  
  // 读取 course JSON（优先 dist，回退 public）
  const isL4 = groupName.includes('四级');
  const isKids = groupName.includes('儿童');
  const courseFile = isKids ? 'course-kids.json' : (isL4 ? 'course-l4.json' : 'course.json');
  const tryPaths = [
    `dist/courses/ai-trainer/${courseFile}`,
    `public/courses/ai-trainer/${courseFile}`,
  ];
  let courseJsonPath = '';
  for (const p of tryPaths) {
    const full = path.resolve(p);
    if (fs.existsSync(full)) { courseJsonPath = full; break; }
  }
  if (!courseJsonPath) {
    return { error: '未发现课件目录', created: [] };
  }

  const course = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'));
  
  // 获取该 group 下已有的章节
  const existing = await db.query(
    'SELECT id, title FROM interactive_courses WHERE group_id=$1',
    [groupId]
  );
  const existingIds = new Set(existing.rows.map(r => r.id));
  
  // 获取当前最大 sort_order 和默认 base_path
  const refs = await db.query(
    'SELECT base_path FROM interactive_courses WHERE group_id=$1 LIMIT 1',
    [groupId]
  );
  const defaultBasePath = refs.rows[0]?.base_path || 'courses/ai-trainer/';
  
  const maxSortResult = await db.query(
    'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM interactive_courses WHERE group_id=$1',
    [groupId]
  );
  let nextSort = parseInt(maxSortResult.rows[0].max_sort) + 1;
  
  const created = [];
  let cumulativeChapters = 0;
  
  const level = isKids ? '儿童' : (isL4 ? '四级' : '三级');
  const prefix = isKids ? 'ic-kids-' : (isL4 ? 'ic-trainer-4-' : 'ic-trainer-');

  for (const section of course.sections) {
    const sectionChapters = section.segments.reduce((sum, seg) => sum + (seg.chapters || []).length, 0);
    
    const dbId = `${prefix}${section.id}`;
    if (!existingIds.has(dbId)) {
      const title = section.title || section.id;
      const description = `人工智能训练师${level} · ${section.id} ${title}`;
      const startChapter = cumulativeChapters;
      
      await db.query(
        'INSERT INTO interactive_courses (id, title, description, base_path, status, sort_order, group_id, start_chapter) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [dbId, title, description, defaultBasePath, 'published', nextSort, groupId, startChapter]
      );
      
      created.push({ id: dbId, title, start_chapter: startChapter, sort_order: nextSort });
      nextSort++;
    }
    
    cumulativeChapters += sectionChapters;
  }
  
  return { created, total: course.sections.length };
}

/**
 * 自动发现已部署但未入库的课件，创建 course group 并同步章节。
 */
const COURSE_MAP = {
  'course-kids.json': { title: '儿童编程基础--AI方向', description: '儿童AI编程启蒙课程（7-13岁）', courseParam: 'kids' },
};

export async function discoverCourses(db) {
  const fs = await import('fs');
  const path = await import('path');
  const created = [];

  const searchDirs = [
    'dist/courses/ai-trainer/',
    'public/courses/ai-trainer/',
  ];

  for (const dir of searchDirs) {
    const fullDir = path.resolve(dir);
    if (!fs.existsSync(fullDir)) continue;

    for (const [jsonFile, info] of Object.entries(COURSE_MAP)) {
      const jsonPath = path.join(fullDir, jsonFile);
      if (!fs.existsSync(jsonPath)) continue;

      // 检查是否已有同名 group
      const existing = await db.query('SELECT id FROM interactive_course_groups WHERE title=$1', [info.title]);
      if (existing.rows.length > 0) continue;

      // 创建 group
      const groupId = `icg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const maxSort = await db.query('SELECT COALESCE(MAX(sort_order), 0) as mx FROM interactive_course_groups');
      await db.query(
        'INSERT INTO interactive_course_groups (id, title, description, sort_order, course_param) VALUES ($1,$2,$3,$4,$5)',
        [groupId, info.title, info.description, parseInt(maxSort.rows[0].mx) + 1, info.courseParam || '']
      );

      // 同步章节
      let chapterResult = null;
      try {
        chapterResult = await detectAndCreateChapters(db, groupId);
      } catch (e) {
        chapterResult = { error: e.message };
      }

      created.push({ groupId, title: info.title, chapters: chapterResult });
    }
    break;
  }

  return created;
}
