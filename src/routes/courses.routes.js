/**
 * 在线课程路由
 */

import express from 'express';
import multer from 'multer';
import * as coursesController from '../controllers/courses.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// 图片上传内存存储 (用于图文课程)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 课程分类
router.get('/categories', auth, adminAuth, coursesController.listCategories);
router.post('/categories', auth, adminAuth, coursesController.createCategory);
router.delete('/categories/:id', auth, adminAuth, coursesController.deleteCategory);

// 课程 CRUD（管理员）
router.get('/', auth, adminAuth, coursesController.listCourses);
router.post('/', auth, adminAuth, coursesController.createCourse);
router.get('/:id', auth, adminAuth, coursesController.getCourse);
router.put('/:id', auth, adminAuth, coursesController.updateCourse);
router.delete('/:id', auth, adminAuth, coursesController.deleteCourse);
router.put('/:id/status', auth, adminAuth, coursesController.updateCourseStatus);

// 章节管理
router.get('/:courseId/chapters', auth, coursesController.getChapters);
router.post('/:courseId/chapters', auth, adminAuth, coursesController.createChapter);
router.put('/chapters/:id', auth, adminAuth, coursesController.updateChapter);
router.delete('/chapters/:id', auth, adminAuth, coursesController.deleteChapter);
router.put('/chapters/reorder', auth, adminAuth, coursesController.reorderChapters);

// 课时管理
router.post('/chapters/:chapterId/lessons', auth, adminAuth, coursesController.createLesson);
router.put('/lessons/:id', auth, adminAuth, coursesController.updateLesson);
router.delete('/lessons/:id', auth, adminAuth, coursesController.deleteLesson);
router.put('/lessons/reorder', auth, adminAuth, coursesController.reorderLessons);

// 直播场次
router.get('/:courseId/sessions', auth, adminAuth, coursesController.listSessions);
router.post('/:courseId/sessions', auth, adminAuth, coursesController.createSession);
router.put('/sessions/:id', auth, adminAuth, coursesController.updateSession);
router.delete('/sessions/:id', auth, adminAuth, coursesController.deleteSession);
router.put('/sessions/:id/status', auth, adminAuth, coursesController.updateSessionStatus);

// 学员端学习记录
router.get('/my/enrollments', auth, coursesController.getMyEnrollments);
router.get('/my/accessible', auth, coursesController.getStudentCourses);
router.get('/:courseId/progress', auth, coursesController.getMyProgress);
router.post('/:courseId/enroll', auth, coursesController.enrollCourse);
router.put('/:courseId/progress', auth, coursesController.updateProgress);

// 图文课程图片上传
router.post('/upload-image', auth, adminAuth, upload.single('image'), coursesController.uploadArticleImage);

// 图文课程导入
router.post('/import', auth, adminAuth, coursesController.importArticleCourses);
router.post('/import/preview', auth, adminAuth, coursesController.previewImport);

export default router;
