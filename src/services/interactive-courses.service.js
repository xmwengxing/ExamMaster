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
    'INSERT INTO interactive_courses (id, title, description, base_path, cover_image, status, sort_order, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, data.title, data.description || '', data.base_path, data.cover_image || '', data.status || 'draft', data.sort_order || 0, data.group_id]
  );
  return { id, ...data };
}

export async function updateChapter(db, id, data) {
  await db.query(
    'UPDATE interactive_courses SET title=$1, description=$2, base_path=$3, cover_image=$4, status=$5, sort_order=$6, group_id=$7, updated_at=NOW() WHERE id=$8',
    [data.title, data.description || '', data.base_path, data.cover_image || '', data.status || 'draft', data.sort_order || 0, data.group_id, id]
  );
}

export async function deleteChapter(db, id) {
  await db.query('DELETE FROM interactive_courses WHERE id=$1', [id]);
}
