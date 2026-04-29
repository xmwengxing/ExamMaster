// 在线课程服务层
// 处理课程、章节、课时、直播场次、学习记录的 CRUD

import { v4 as uuidv4 } from 'uuid';

// ==================== 课程分类 ====================

export async function listCategories(db, courseType) {
  let sql = 'SELECT * FROM course_categories';
  const params = [];
  if (courseType) { sql += ' WHERE course_type = $1'; params.push(courseType); }
  sql += ' ORDER BY sort_order ASC';
  const rows = await db.getMany(sql, params);
  return (rows || []).map(row => ({
    id: row.id, name: row.name, courseType: row.course_type,
    sortOrder: row.sort_order, createdAt: row.created_at
  }));
}

export async function createCategory(db, data) {
  const id = `cat-${Date.now()}`;
  await db.execute(
    'INSERT INTO course_categories (id, name, course_type, sort_order) VALUES ($1, $2, $3, $4)',
    [id, data.name, data.courseType, data.sortOrder || 0]
  );
  return { id, name: data.name, courseType: data.courseType, sortOrder: data.sortOrder || 0 };
}

export async function deleteCategory(db, id) {
  await db.execute('DELETE FROM course_categories WHERE id = $1', [id]);
  return { success: true };
}

// ==================== 课程主表 ====================

export async function listCourses(db, filters = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (filters.courseType) { conditions.push(`c.course_type = $${paramIdx++}`); params.push(filters.courseType); }
  if (filters.category) { conditions.push(`c.category = $${paramIdx++}`); params.push(filters.category); }
  if (filters.status) { conditions.push(`c.status = $${paramIdx++}`); params.push(filters.status); }
  if (filters.search) { conditions.push(`(c.title ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx})`); params.push(`%${filters.search}%`); paramIdx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `SELECT c.* FROM courses c ${where} ORDER BY c.sort_order ASC, c.created_at DESC`;
  const rows = await db.getMany(sql, params);
  return (rows || []).map(rowToCourse);
}

export async function getCourse(db, id) {
  const row = await db.getOne('SELECT * FROM courses WHERE id = $1', [id]);
  return row ? rowToCourse(row) : null;
}

export async function createCourse(db, data) {
  const id = `course-${Date.now()}`;
  const now = new Date().toISOString();
  
  await db.execute(
    `INSERT INTO courses (id, title, description, cover_url, course_type, category, teacher_name, teacher_intro, 
     price, status, sort_order, student_count, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [id, data.title, data.description || '', data.coverUrl || '', data.courseType, data.category || '',
     data.teacherName || '', data.teacherIntro || '', data.price || 0, data.status || 'draft',
     data.sortOrder || 0, 0, now, now]
  );
  return getCourse(db, id);
}

export async function updateCourse(db, id, data) {
  const now = new Date().toISOString();
  const sets = [];
  const params = [];
  let idx = 1;

  const fields = ['title','description','cover_url','course_type','category','teacher_name','teacher_intro',
                  'price','status','sort_order'];
  const dataKeys = ['title','description','coverUrl','courseType','category','teacherName','teacherIntro',
                    'price','status','sortOrder'];
  
  for (let i = 0; i < fields.length; i++) {
    if (data[dataKeys[i]] !== undefined) {
      sets.push(`${fields[i]} = $${idx++}`);
      params.push(data[dataKeys[i]]);
    }
  }

  if (sets.length === 0) return getCourse(db, id);

  sets.push(`updated_at = $${idx++}`);
  params.push(now);
  params.push(id);

  await db.execute(`UPDATE courses SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  return getCourse(db, id);
}

export async function deleteCourse(db, id) {
  await db.execute('DELETE FROM courses WHERE id = $1', [id]);
  return { success: true };
}

export async function updateCourseStatus(db, id, status) {
  const now = new Date().toISOString();
  await db.execute('UPDATE courses SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);
  return getCourse(db, id);
}

// ==================== 章节管理（录播课专用） ====================

export async function getChapters(db, courseId) {
  const chapters = await db.getMany(
    'SELECT * FROM course_chapters WHERE course_id = $1 ORDER BY sort_order ASC',
    [courseId]
  );
  
  const result = [];
  for (const ch of (chapters || [])) {
    const lessons = await db.getMany(
      'SELECT * FROM course_lessons WHERE chapter_id = $1 ORDER BY sort_order ASC',
      [ch.id]
    );
    result.push({
      id: ch.id, courseId: ch.course_id, title: ch.title,
      description: ch.description, sortOrder: ch.sort_order, createdAt: ch.created_at,
      lessons: (lessons || []).map(rowToLesson)
    });
  }
  return result;
}

export async function createChapter(db, courseId, data) {
  const id = `chapter-${Date.now()}`;
  await db.execute(
    'INSERT INTO course_chapters (id, course_id, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)',
    [id, courseId, data.title, data.description || '', data.sortOrder || 0]
  );
  return { id, courseId, title: data.title, description: data.description, sortOrder: data.sortOrder || 0 };
}

export async function updateChapter(db, id, data) {
  const sets = [];
  const params = [];
  let idx = 1;

  if (data.title !== undefined) { sets.push(`title = $${idx++}`); params.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); params.push(data.sortOrder); }
  
  if (sets.length > 0) {
    params.push(id);
    await db.execute(`UPDATE course_chapters SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  }
  return { success: true };
}

export async function deleteChapter(db, id) {
  await db.execute('DELETE FROM course_chapters WHERE id = $1', [id]);
  return { success: true };
}

export async function reorderChapters(db, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute('UPDATE course_chapters SET sort_order = $1 WHERE id = $2', [i, orderedIds[i]]);
  }
  return { success: true };
}

// ==================== 课时管理（录播课专用） ====================

export async function createLesson(db, chapterId, data) {
  const id = `lesson-${Date.now()}`;
  const courseRow = await db.getOne('SELECT course_id FROM course_chapters WHERE id = $1', [chapterId]);
  const courseId = courseRow?.course_id || '';
  
  await db.execute(
    `INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, chapterId, courseId, data.title, data.videoType || 'upload', data.videoUrl || '',
     data.duration || 0, data.isFreePreview || false, data.sortOrder || 0]
  );
  return rowToLesson(await db.getOne('SELECT * FROM course_lessons WHERE id = $1', [id]));
}

export async function updateLesson(db, id, data) {
  const sets = [];
  const params = [];
  let idx = 1;

  if (data.title !== undefined) { sets.push(`title = $${idx++}`); params.push(data.title); }
  if (data.videoType !== undefined) { sets.push(`video_type = $${idx++}`); params.push(data.videoType); }
  if (data.videoUrl !== undefined) { sets.push(`video_url = $${idx++}`); params.push(data.videoUrl); }
  if (data.duration !== undefined) { sets.push(`duration = $${idx++}`); params.push(data.duration); }
  if (data.isFreePreview !== undefined) { sets.push(`is_free_preview = $${idx++}`); params.push(data.isFreePreview); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); params.push(data.sortOrder); }

  if (sets.length > 0) {
    params.push(id);
    await db.execute(`UPDATE course_lessons SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  }
  return { success: true };
}

export async function deleteLesson(db, id) {
  await db.execute('DELETE FROM course_lessons WHERE id = $1', [id]);
  return { success: true };
}

export async function reorderLessons(db, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute('UPDATE course_lessons SET sort_order = $1 WHERE id = $2', [i, orderedIds[i]]);
  }
  return { success: true };
}

// ==================== 直播场次（直播课专用） ====================

export async function listSessions(db, courseId) {
  const rows = await db.getMany(
    'SELECT * FROM live_sessions WHERE course_id = $1 ORDER BY start_time ASC',
    [courseId]
  );
  return (rows || []).map(rowToSession);
}

export async function createSession(db, courseId, data) {
  const id = `session-${Date.now()}`;
  await db.execute(
    `INSERT INTO live_sessions (id, course_id, title, meeting_number, meeting_url, meeting_password, start_time, end_time, status, replay_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, courseId, data.title || '', data.meetingNumber || '', data.meetingUrl || '',
     data.meetingPassword || '', data.startTime || null, data.endTime || null,
     data.status || 'scheduled', data.replayUrl || '']
  );
  return rowToSession(await db.getOne('SELECT * FROM live_sessions WHERE id = $1', [id]));
}

export async function updateSession(db, id, data) {
  const sets = [];
  const params = [];
  let idx = 1;

  const fields = ['title','meeting_number','meeting_url','meeting_password','start_time','end_time','status','replay_url'];
  const dataKeys = ['title','meetingNumber','meetingUrl','meetingPassword','startTime','endTime','status','replayUrl'];

  for (let i = 0; i < fields.length; i++) {
    if (data[dataKeys[i]] !== undefined) {
      sets.push(`${fields[i]} = $${idx++}`);
      params.push(data[dataKeys[i]]);
    }
  }

  if (sets.length > 0) {
    params.push(id);
    await db.execute(`UPDATE live_sessions SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  }
  return rowToSession(await db.getOne('SELECT * FROM live_sessions WHERE id = $1', [id]));
}

export async function deleteSession(db, id) {
  await db.execute('DELETE FROM live_sessions WHERE id = $1', [id]);
  return { success: true };
}

export async function updateSessionStatus(db, id, status) {
  await db.execute('UPDATE live_sessions SET status = $1 WHERE id = $2', [status, id]);
  return rowToSession(await db.getOne('SELECT * FROM live_sessions WHERE id = $1', [id]));
}

// ==================== 学员学习记录 ====================

export async function getMyEnrollments(db, userId) {
  const rows = await db.getMany(
    `SELECT e.*, c.title as course_title, c.cover_url as course_cover, c.course_type, c.category
     FROM course_enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = $1
     ORDER BY e.updated_at DESC`,
    [userId]
  );
  return (rows || []).map(row => ({
    id: row.id, userId: row.user_id, courseId: row.course_id,
    lastLessonId: row.last_lesson_id, lastPosition: row.last_position,
    progressPercent: row.progress_percent, completedAt: row.completed_at,
    enrolledAt: row.enrolled_at, updatedAt: row.updated_at,
    courseTitle: row.course_title, courseCover: row.course_cover,
    courseType: row.course_type, category: row.category
  }));
}

export async function getMyProgress(db, userId, courseId) {
  const row = await db.getOne(
    'SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  return row ? {
    id: row.id, userId: row.user_id, courseId: row.course_id,
    lastLessonId: row.last_lesson_id, lastPosition: row.last_position,
    progressPercent: row.progress_percent, completedAt: row.completed_at,
    enrolledAt: row.enrolled_at, updatedAt: row.updated_at
  } : null;
}

export async function enrollCourse(db, userId, courseId) {
  const existing = await db.getOne(
    'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  if (existing) {
    return getMyProgress(db, userId, courseId);
  }
  
  const id = `enroll-${Date.now()}`;
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO course_enrollments (id, user_id, course_id, last_position, progress_percent, enrolled_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, userId, courseId, 0, 0, now, now]
  );
  
  await db.execute('UPDATE courses SET student_count = student_count + 1 WHERE id = $1', [courseId]);
  return getMyProgress(db, userId, courseId);
}

export async function updateProgress(db, userId, courseId, data) {
  const now = new Date().toISOString();
  const existing = await db.getOne(
    'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  
  if (!existing) {
    await enrollCourse(db, userId, courseId);
  }

  const sets = [];
  const params = [];
  let idx = 1;

  if (data.lastLessonId !== undefined) { sets.push(`last_lesson_id = $${idx++}`); params.push(data.lastLessonId); }
  if (data.lastPosition !== undefined) { sets.push(`last_position = $${idx++}`); params.push(data.lastPosition); }
  if (data.progressPercent !== undefined) { sets.push(`progress_percent = $${idx++}`); params.push(data.progressPercent); }
  if (data.completedAt !== undefined) { sets.push(`completed_at = $${idx++}`); params.push(data.completedAt); }
  
  sets.push(`updated_at = $${idx++}`);
  params.push(now);
  params.push(userId);
  params.push(courseId);

  await db.execute(
    `UPDATE course_enrollments SET ${sets.join(', ')} WHERE user_id = $${idx++} AND course_id = $${idx}`,
    params
  );
  return getMyProgress(db, userId, courseId);
}

// ==================== 学员课程访问权限 ====================

export async function getStudentCoursePermission(db, userId) {
  const user = await db.getOne(
    "SELECT group_id FROM users WHERE id = $1 AND role = 'STUDENT'",
    [userId]
  );
  if (!user?.group_id) return { vod: [], live: [] };

  const group = await db.getOne('SELECT permissions FROM user_groups WHERE id = $1', [user.group_id]);
  if (!group) return { vod: [], live: [] };

  const permissions = typeof group.permissions === 'string' ? JSON.parse(group.permissions) : group.permissions;
  return { vod: permissions?.vod_courses || null, live: permissions?.live_courses || null };
}

export async function getStudentAccessibleCourses(db, userId, courseType) {
  const perm = await getStudentCoursePermission(db, userId);
  const coursePerm = courseType === 'vod' ? perm.vod : perm.live;
  
  if (!coursePerm || coursePerm.mode === 'none') return [];

  let courses;
  if (coursePerm.mode === 'all') {
    courses = await db.getMany(
      "SELECT * FROM courses WHERE course_type = $1 AND status = 'published' ORDER BY sort_order ASC, created_at DESC",
      [courseType]
    );
  } else if (coursePerm.mode === 'category') {
    const cats = coursePerm.categories || [];
    if (cats.length === 0) return [];
    const placeholders = cats.map((_, i) => `$${i + 2}`);
    courses = await db.getMany(
      `SELECT * FROM courses WHERE course_type = $1 AND status = 'published' AND category IN (${placeholders.join(',')}) ORDER BY sort_order ASC`,
      [courseType, ...cats]
    );
  } else if (coursePerm.mode === 'specific') {
    const ids = coursePerm.courses || [];
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 2}`);
    courses = await db.getMany(
      `SELECT * FROM courses WHERE course_type = $1 AND status = 'published' AND id IN (${placeholders.join(',')}) ORDER BY sort_order ASC`,
      [courseType, ...ids]
    );
  }

  return (courses || []).map(rowToCourse);
}

// ==================== 辅助函数 ====================

function rowToCourse(row) {
  return {
    id: row.id, title: row.title, description: row.description,
    coverUrl: row.cover_url, courseType: row.course_type,
    category: row.category, teacherName: row.teacher_name,
    teacherIntro: row.teacher_intro, price: parseFloat(row.price) || 0,
    status: row.status, sortOrder: row.sort_order,
    studentCount: row.student_count,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at
  };
}

function rowToLesson(row) {
  return {
    id: row.id, chapterId: row.chapter_id, courseId: row.course_id,
    title: row.title, videoType: row.video_type,
    videoUrl: row.video_url, duration: row.duration,
    isFreePreview: row.is_free_preview, sortOrder: row.sort_order,
    createdAt: row.created_at?.toISOString?.() || row.created_at
  };
}

function rowToSession(row) {
  return {
    id: row.id, courseId: row.course_id, title: row.title,
    meetingNumber: row.meeting_number, meetingUrl: row.meeting_url,
    meetingPassword: row.meeting_password,
    startTime: row.start_time?.toISOString?.() || row.start_time,
    endTime: row.end_time?.toISOString?.() || row.end_time,
    status: row.status, replayUrl: row.replay_url,
    createdAt: row.created_at?.toISOString?.() || row.created_at
  };
}
