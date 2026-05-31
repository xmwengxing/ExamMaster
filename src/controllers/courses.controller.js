// 在线课程控制器

import * as coursesService from '../services/courses.service.js';
import logger from '../../utils/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ==================== 图文课程图片上传 ====================
export async function uploadArticleImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }
    const uploadDir = path.join(path.dirname(__dirname), '..', 'uploads', 'article-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `article-${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    const url = `/uploads/article-images/${filename}`;
    res.json({ url, filename });
  } catch (error) { next(error); }
}

// ==================== 图文课程导入 ====================
export async function importArticleCourses(req, res, next) {
  try {
    const { sourceDir, courseTitle, teacherName } = req.body;
    if (!sourceDir || !fs.existsSync(sourceDir)) {
      return res.status(400).json({ error: '源目录不存在: ' + (sourceDir || '未提供') });
    }

    const mkdocsPath = path.join(sourceDir, 'mkdocs.yml');
    const articleDir = path.join(sourceDir, 'Article');
    
    if (!fs.existsSync(mkdocsPath)) {
      return res.status(400).json({ error: '未找到 mkdocs.yml 配置文件' });
    }
    if (!fs.existsSync(articleDir)) {
      return res.status(400).json({ error: `未找到 Article 目录: ${articleDir}` });
    }

    const results = await importFromSource(req.db, sourceDir, articleDir, {
      courseTitle: courseTitle || '导入的图文课程',
      teacherName: teacherName || ''
    });

    logger.info(`图文课程导入完成: ${JSON.stringify(results.summary)}`);
    res.json(results);
  } catch (error) { 
    logger.error('图文课程导入失败:', error);
    next(error); 
  }
}

// ==================== 导入预览 ====================
export async function previewImport(req, res, next) {
  try {
    const { sourceDir } = req.body;
    if (!sourceDir || !fs.existsSync(sourceDir)) {
      return res.status(400).json({ error: '源目录不存在' });
    }

    const mkdocsPath = path.join(sourceDir, 'mkdocs.yml');
    if (!fs.existsSync(mkdocsPath)) {
      return res.status(400).json({ error: '未找到 mkdocs.yml' });
    }

    const fs2 = await import('fs');
    const yamlContent = fs2.readFileSync(mkdocsPath, 'utf-8');
    const navItems = parseNavYaml(yamlContent);

    const articleDir = path.join(sourceDir, 'Article');
    let totalLessons = 0;
    let totalImages = 0;
    const chapters = [];

    for (const item of navItems) {
      if (item.isSection) {
        const lessons = [];
        for (const sub of item.children) {
          const filePath = path.join(articleDir, sub.path);
          if (fs2.existsSync(filePath)) {
            const stat = fs2.statSync(filePath);
            lessons.push({ title: sub.title, path: sub.path, size: stat.size });
            totalLessons++;
          }
        }
        chapters.push({ title: item.title, lessonCount: lessons.length });
      } else {
        const filePath = path.join(articleDir, item.path);
        if (fs2.existsSync(filePath)) {
          const stat = fs2.statSync(filePath);
          // Count images in the same directory
          const dir = path.dirname(filePath);
          let imgCount = 0;
          if (fs2.existsSync(dir)) {
            imgCount = fs2.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|gif|svg)$/i.test(f)).length;
            totalImages += imgCount;
          }
          chapters.push({ title: item.title, lessonCount: 1, imageCount: imgCount });
          totalLessons++;
        }
      }
    }

    res.json({ chapters, totalLessons, totalImages });
  } catch (error) { next(error); }
}

// 简易 YAML nav 解析（只解析 mkdocs.yml 的 nav 部分）
function parseNavYaml(content) {
  const result = [];
  const lines = content.split('\n');
  let inNav = false;
  let currentItem = null;

  for (const line of lines) {
    if (line.trim().startsWith('nav:')) {
      inNav = true;
      continue;
    }
    if (!inNav) continue;
    if (line.trim().startsWith('#') || line.trim() === '') continue;
    // Check if we're still in nav section (not indented less than top-level item)
    if (!line.startsWith(' ') && !line.startsWith('-') && !line.startsWith('  ') && line.trim() !== '') {
      // End of nav section
      if (currentItem && currentItem.title) result.push(currentItem);
      break;
    }

    const trimmed = line.trimStart();
    if (trimmed.startsWith('- ')) {
      if (currentItem && currentItem.title) result.push(currentItem);
      currentItem = parseNavLine(trimmed.substring(2));
    } else if (trimmed.startsWith('-') && currentItem && !currentItem.children) {
      // Sub-item
      const subText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
      const subItem = parseNavLine(subText);
      if (subItem) {
        if (!currentItem.children) {
          currentItem.children = [];
          currentItem.isSection = true;
        }
        currentItem.children.push(subItem);
      }
    }
  }
  if (currentItem && currentItem.title) result.push(currentItem);

  return result.filter(i => i.title && !['首页', 'index'].includes(i.title.toLowerCase()));
}

function parseNavLine(text) {
  const match = text.match(/^\s*(.+?)\s*:\s*(.+?\.md)\s*$/);
  if (match) {
    return { title: match[1].trim(), path: match[2].trim().replace(/['"]/g, '') };
  }
  const match2 = text.match(/^\s*(.+?)\s*:\s*$/);
  if (match2) {
    return { title: match2[1].trim(), path: '', children: [], isSection: true };
  }
  const directMatch = text.match(/^\s*(.+?\.md)\s*$/);
  if (directMatch) {
    return { path: directMatch[1].trim().replace(/['"]/g, '') };
  }
  return { title: text.replace(/['":]/g, '').trim(), path: '' };
}

// 执行导入
async function importFromSource(db, sourceDir, articleDir, options) {
  const fs2 = await import('fs');
  const mkdocsPath = path.join(sourceDir, 'mkdocs.yml');
  const yamlContent = fs2.readFileSync(mkdocsPath, 'utf-8');
  const navItems = parseNavYaml(yamlContent);

  // Upload images (use /tmp which is writable by nodejs user)
  const uploadsDir = '/tmp/uploads/article-images/python';
  if (!fs2.existsSync(uploadsDir)) {
    fs2.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create course
  const courseId = `course-${Date.now()}`;
  const now = new Date().toISOString();
  const title = options.courseTitle || '小白学Python';

  await db.execute(
    `INSERT INTO courses (id, title, description, cover_url, course_type, category, teacher_name, teacher_intro, 
     price, status, sort_order, student_count, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO UPDATE SET title = $2, updated_at = $14`,
    [courseId, title, options.teacherName ? `由 ${options.teacherName} 主讲的 Python 入门教程` : 'Python 入门到进阶图文教程',
     '', 'article', 'Python学习', options.teacherName || '水哥', '',
     0, 'published', 0, 0, now, now]
  );

  let chapterCount = 0;
  let lessonCount = 0;
  let imageCount = 0;

  for (const item of navItems) {
    if (item.isSection) {
      // Chapter with sub-lessons
      if (!item.children || item.children.length === 0) continue;
      
      const chapterId = `chapter-${Date.now()}-${chapterCount}`;
      await db.execute(
        'INSERT INTO course_chapters (id, course_id, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [chapterId, courseId, item.title, '', chapterCount]
      );
      chapterCount++;

      let lessonSort = 0;
      for (const sub of item.children) {
        const filePath = path.join(articleDir, sub.path);
        if (!fs2.existsSync(filePath)) continue;

        let content = fs2.readFileSync(filePath, 'utf-8');
        content = copyImagesAndUpdatePaths(content, path.dirname(filePath), uploadsDir);

        const lessonTitle = sub.title || path.basename(sub.path, '.md');

        const lessonId = `lesson-${Date.now()}-${lessonCount}`;
        await db.execute(
          `INSERT INTO course_lessons (id, chapter_id, course_id, title, lesson_type, content, is_free_preview, sort_order, updated_at)
           VALUES ($1,$2,$3,$4,'article',$5,true,$6,$7)`,
          [lessonId, chapterId, courseId, lessonTitle, content, lessonSort, now]
        );
        lessonCount++;
        lessonSort++;
      }
    } else if (item.path) {
      // Single-lesson chapter (one .md file is the chapter itself)
      const filePath = path.join(articleDir, item.path);
      if (!fs2.existsSync(filePath)) continue;

      const chapterId = `chapter-${Date.now()}-${chapterCount}`;
      await db.execute(
        'INSERT INTO course_chapters (id, course_id, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [chapterId, courseId, item.title, '', chapterCount]
      );
      chapterCount++;

      let content = fs2.readFileSync(filePath, 'utf-8');
      content = copyImagesAndUpdatePaths(content, path.dirname(filePath), uploadsDir);

      const lessonTitle = item.title;

      const lessonId = `lesson-${Date.now()}-${lessonCount}`;
      await db.execute(
        `INSERT INTO course_lessons (id, chapter_id, course_id, title, lesson_type, content, is_free_preview, sort_order, updated_at)
         VALUES ($1,$2,$3,$4,'article',$5,true,$6,$7)`,
        [lessonId, chapterId, courseId, lessonTitle, content, 0, now]
      );
      lessonCount++;
    }
  }

  return {
    courseId,
    summary: { chapters: chapterCount, lessons: lessonCount, images: imageCount }
  };
}

function copyImagesAndUpdatePaths(content, sourceDir, uploadsDir) {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+\.(?:png|jpg|jpeg|gif|svg))\)/gi;
  
  content = content.replace(imgRegex, (match, alt, imgPath) => {
    // Skip external URLs
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return match;
    }
    
    const relPath = imgPath.replace(/^\.\//, '');
    const srcFile = path.join(sourceDir, relPath);
    
    if (fs.existsSync(srcFile)) {
      const destFile = path.join(uploadsDir, relPath);
      const destDir = path.dirname(destFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcFile, destFile);
      const urlPath = `/uploads/article-images/python/${relPath}`;
      return `![${alt}](${urlPath})`;
    }
    return match;
  });
  
  return content;
}
