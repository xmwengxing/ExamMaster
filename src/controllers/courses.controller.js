// 在线课程控制器

import * as coursesService from '../services/courses.service.js';
import logger from '../../utils/logger.js';

// ==================== 分类 ====================
export async function listCategories(req, res, next) {
  try {
    const categories = await coursesService.listCategories(req.db, req.query.type);
    res.json(categories);
  } catch (error) { next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const cat = await coursesService.createCategory(req.db, req.body);
    res.status(201).json(cat);
  } catch (error) { next(error); }
}

export async function deleteCategory(req, res, next) {
  try {
    const result = await coursesService.deleteCategory(req.db, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
}

// ==================== 课程 CRUD ====================
export async function listCourses(req, res, next) {
  try {
    const { type, category, status, search } = req.query;
    const courses = await coursesService.listCourses(req.db, {
      courseType: type, category, status, search
    });
    res.json(courses);
  } catch (error) { next(error); }
}

export async function getCourse(req, res, next) {
  try {
    const course = await coursesService.getCourse(req.db, req.params.id);
    if (!course) return res.status(404).json({ error: '课程不存在' });
    res.json(course);
  } catch (error) { next(error); }
}

export async function createCourse(req, res, next) {
  try {
    const course = await coursesService.createCourse(req.db, req.body);
    res.status(201).json(course);
  } catch (error) { next(error); }
}

export async function updateCourse(req, res, next) {
  try {
    const course = await coursesService.updateCourse(req.db, req.params.id, req.body);
    if (!course) return res.status(404).json({ error: '课程不存在' });
    res.json(course);
  } catch (error) { next(error); }
}

export async function deleteCourse(req, res, next) {
  try {
    const result = await coursesService.deleteCourse(req.db, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
}

export async function updateCourseStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !['draft','published','archived'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    const course = await coursesService.updateCourseStatus(req.db, req.params.id, status);
    if (!course) return res.status(404).json({ error: '课程不存在' });
    res.json(course);
  } catch (error) { next(error); }
}

// ==================== 章节 ====================
export async function getChapters(req, res, next) {
  try {
    const chapters = await coursesService.getChapters(req.db, req.params.courseId);
    res.json(chapters);
  } catch (error) { next(error); }
}

export async function createChapter(req, res, next) {
  try {
    const chapter = await coursesService.createChapter(req.db, req.params.courseId, req.body);
    res.status(201).json(chapter);
  } catch (error) { next(error); }
}

export async function updateChapter(req, res, next) {
  try {
    const result = await coursesService.updateChapter(req.db, req.params.id, req.body);
    res.json(result);
  } catch (error) { next(error); }
}

export async function deleteChapter(req, res, next) {
  try {
    const result = await coursesService.deleteChapter(req.db, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
}

export async function reorderChapters(req, res, next) {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: '缺少 orderedIds 数组' });
    }
    const result = await coursesService.reorderChapters(req.db, orderedIds);
    res.json(result);
  } catch (error) { next(error); }
}

// ==================== 课时 ====================
export async function createLesson(req, res, next) {
  try {
    const lesson = await coursesService.createLesson(req.db, req.params.chapterId, req.body);
    res.status(201).json(lesson);
  } catch (error) { next(error); }
}

export async function updateLesson(req, res, next) {
  try {
    const result = await coursesService.updateLesson(req.db, req.params.id, req.body);
    res.json(result);
  } catch (error) { next(error); }
}

export async function deleteLesson(req, res, next) {
  try {
    const result = await coursesService.deleteLesson(req.db, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
}

export async function reorderLessons(req, res, next) {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: '缺少 orderedIds 数组' });
    }
    const result = await coursesService.reorderLessons(req.db, orderedIds);
    res.json(result);
  } catch (error) { next(error); }
}

// ==================== 直播场次 ====================
export async function listSessions(req, res, next) {
  try {
    const sessions = await coursesService.listSessions(req.db, req.params.courseId);
    res.json(sessions);
  } catch (error) { next(error); }
}

export async function createSession(req, res, next) {
  try {
    const session = await coursesService.createSession(req.db, req.params.courseId, req.body);
    res.status(201).json(session);
  } catch (error) { next(error); }
}

export async function updateSession(req, res, next) {
  try {
    const session = await coursesService.updateSession(req.db, req.params.id, req.body);
    res.json(session);
  } catch (error) { next(error); }
}

export async function deleteSession(req, res, next) {
  try {
    const result = await coursesService.deleteSession(req.db, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
}

export async function updateSessionStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !['scheduled','living','ended'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    const session = await coursesService.updateSessionStatus(req.db, req.params.id, status);
    res.json(session);
  } catch (error) { next(error); }
}

// ==================== 学员学习记录 ====================
export async function getMyEnrollments(req, res, next) {
  try {
    const enrollments = await coursesService.getMyEnrollments(req.db, req.user.id);
    res.json(enrollments);
  } catch (error) { next(error); }
}

export async function getMyProgress(req, res, next) {
  try {
    const progress = await coursesService.getMyProgress(req.db, req.user.id, req.params.courseId);
    res.json(progress);
  } catch (error) { next(error); }
}

export async function enrollCourse(req, res, next) {
  try {
    const enrollment = await coursesService.enrollCourse(req.db, req.user.id, req.params.courseId);
    res.json(enrollment);
  } catch (error) { next(error); }
}

export async function updateProgress(req, res, next) {
  try {
    const progress = await coursesService.updateProgress(req.db, req.user.id, req.params.courseId, req.body);
    res.json(progress);
  } catch (error) { next(error); }
}

// ==================== 学员课程列表（权限过滤） ====================
export async function getStudentCourses(req, res, next) {
  try {
    const { type } = req.query;
    const courses = await coursesService.getStudentAccessibleCourses(req.db, req.user.id, type);
    res.json(courses);
  } catch (error) { next(error); }
}
