import * as service from '../services/interactive-courses.service.js';

// --- Groups ---

export async function listGroups(req, res) {
  try {
    const groups = await service.listGroups(req.db);
    res.json({ groups });
  } catch (err) {
    console.error('[interactive-courses] listGroups error:', err);
    res.status(500).json({ error: '查询失败' });
  }
}

export async function listPublicData(req, res) {
  try {
    const groups = await service.listGroups(req.db);
    const chapters = await service.listChapters(req.db, { status: 'published' });
    const groupsWithChapters = groups.map(g => ({
      ...g,
      chapters: chapters.filter(c => c.group_id === g.id),
    }));
    res.json({ groups: groupsWithChapters });
  } catch (err) {
    console.error('[interactive-courses] listPublicData error:', err);
    res.status(500).json({ error: '查询失败' });
  }
}

export async function createGroup(req, res) {
  try {
    const result = await service.createGroup(req.db, req.body);
    res.json(result);
  } catch (err) {
    console.error('[interactive-courses] createGroup error:', err);
    res.status(500).json({ error: '创建失败' });
  }
}

export async function updateGroup(req, res) {
  try {
    await service.updateGroup(req.db, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[interactive-courses] updateGroup error:', err);
    res.status(500).json({ error: '更新失败' });
  }
}

export async function deleteGroup(req, res) {
  try {
    await service.deleteGroup(req.db, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[interactive-courses] deleteGroup error:', err);
    res.status(500).json({ error: '删除失败' });
  }
}

// --- Chapters ---

export async function listChapters(req, res) {
  try {
    const filters = {};
    if (req.query.group_id) filters.group_id = req.query.group_id;
    if (req.query.status) filters.status = req.query.status;
    const chapters = await service.listChapters(req.db, filters);
    res.json({ chapters });
  } catch (err) {
    console.error('[interactive-courses] listChapters error:', err);
    res.status(500).json({ error: '查询失败' });
  }
}

export async function createChapter(req, res) {
  try {
    const result = await service.createChapter(req.db, req.body);
    res.json(result);
  } catch (err) {
    console.error('[interactive-courses] createChapter error:', err);
    res.status(500).json({ error: '创建失败' });
  }
}

export async function updateChapter(req, res) {
  try {
    await service.updateChapter(req.db, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[interactive-courses] updateChapter error:', err);
    res.status(500).json({ error: '更新失败' });
  }
}

export async function deleteChapter(req, res) {
  try {
    await service.deleteChapter(req.db, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[interactive-courses] deleteChapter error:', err);
    res.status(500).json({ error: '删除失败' });
  }
}
