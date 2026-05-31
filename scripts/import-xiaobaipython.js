// 小白学Python 图文课程导入脚本
// 运行方式: node scripts/import-xiaobaipython.js

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

const POOL = new Pool({
  host: 'localhost',
  port: 54320,
  database: 'edumaster',
  user: 'edumaster_user',
  password: 'dd4afec32aaf561b7c02508e014654df'
});

const SOURCE_DIR = '/home/shijingtian/workspace/projects/小白学python';
const ARTICLE_DIR = path.join(SOURCE_DIR, 'Article');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'article-images', 'python');
const COURSE_TITLE = '小白学Python';
const TEACHER_NAME = '水哥';

let imageCount = 0;

// 解析 mkdocs.yml 的 nav 部分
function parseNavYaml(content) {
  const result = [];
  const lines = content.split('\n');
  let inNav = false;
  let currentItem = null;

  for (const line of lines) {
    if (line.trim().startsWith('nav:')) { inNav = true; continue; }
    if (!inNav) continue;
    if (line.trim().startsWith('#') || line.trim() === '') continue;

    const trimmed = line.trimStart();
    if (trimmed.startsWith('- ')) {
      if (currentItem && currentItem.title && currentItem.path) result.push(currentItem);
      currentItem = parseNavLine(trimmed.substring(2));
    } else if (trimmed.startsWith('-') && currentItem && (!currentItem.children)) {
      const subText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
      const subItem = parseNavLine(subText);
      if (subItem && subItem.path) {
        if (!currentItem.children) {
          currentItem.children = [];
          currentItem.isSection = true;
        }
        currentItem.children.push(subItem);
      }
    }
  }
  if (currentItem && currentItem.title && currentItem.path) result.push(currentItem);

  return result.filter(i => i.title && i.path && !['首页', 'index'].includes(i.title.toLowerCase()));
}

function parseNavLine(text) {
  // "标题: path/to/file.md"
  const match = text.match(/^\s*(.+?):\s*(.+?\.md)\s*$/);
  if (match) {
    return { title: match[1].trim(), path: match[2].trim().replace(/['"]/g, '') };
  }
  // "标题:" (has sub-items)
  const match2 = text.match(/^\s*(.+?):\s*$/);
  if (match2) {
    return { title: match2[1].trim(), path: '', children: [], isSection: true };
  }
  const directMatch = text.match(/^\s*(.+?\.md)\s*$/);
  if (directMatch) {
    return { path: directMatch[1].trim().replace(/['"]/g, '') };
  }
  return { title: text.replace(/['":]/g, '').trim(), path: '' };
}

// 复制图片并更新 Markdown 引用路径
function copyImagesAndUpdatePaths(content, sourceDir) {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+\.(?:png|jpg|jpeg|gif|svg))\)/gi;
  
  return content.replace(imgRegex, (match, alt, imgPath) => {
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return match;
    
    const relPath = imgPath.replace(/^\.\//, '');
    const srcFile = path.join(sourceDir, relPath);
    
    if (fs.existsSync(srcFile)) {
      const destFile = path.join(UPLOADS_DIR, relPath);
      const destDir = path.dirname(destFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcFile, destFile);
      imageCount++;
      const urlPath = `/uploads/article-images/python/${relPath}`;
      return `![${alt}](${urlPath})`;
    }
    return match;
  });
}

async function run() {
  console.log('🔍 解析 mkdocs.yml...');
  const mkdocsPath = path.join(SOURCE_DIR, 'mkdocs.yml');
  if (!fs.existsSync(mkdocsPath)) {
    console.error('❌ 未找到 mkdocs.yml');
    process.exit(1);
  }
  const yamlContent = fs.readFileSync(mkdocsPath, 'utf-8');
  const navItems = parseNavYaml(yamlContent);
  console.log(`📋 解析到 ${navItems.length} 个导航项`);

  // 确保上传目录存在
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const db = await POOL.connect();
  try {
    await db.query('BEGIN');

    // 1. 创建课程
    console.log('📚 创建课程记录...');
    const courseId = `course-xiaobai-${Date.now()}`;
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO courses (id, title, description, cover_url, course_type, category, teacher_name, teacher_intro, price, status, sort_order, student_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET title=$2, updated_at=$14`,
      [courseId, COURSE_TITLE, `由 ${TEACHER_NAME} 主讲的 Python 入门到进阶图文教程`, '', 'article', 'Python学习', TEACHER_NAME, '', 0, 'published', 0, 0, now, now]
    );

    let chapterCount = 0;
    let lessonCount = 0;

    // 2. 遍历导航创建章节和课时
    for (const item of navItems) {
      if (item.isSection && item.children && item.children.length > 0) {
        // 多课时章节
        const chapterId = `chapter-xiaobai-${chapterCount}`;
        await db.query(
          'INSERT INTO course_chapters (id, course_id, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [chapterId, courseId, item.title, '', chapterCount]
        );
        chapterCount++;

        let lessonSort = 0;
        for (const sub of item.children) {
          if (!sub.path) continue;
          const filePath = path.join(ARTICLE_DIR, sub.path);
          if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  文件不存在: ${sub.path}`);
            continue;
          }

          let content = fs.readFileSync(filePath, 'utf-8');
          content = copyImagesAndUpdatePaths(content, path.dirname(filePath));

          const lessonTitle = sub.title || path.basename(sub.path, '.md');
          const lessonId = `lesson-xiaobai-${lessonCount}`;
          await db.query(
            `INSERT INTO course_lessons (id, chapter_id, course_id, title, lesson_type, content, is_free_preview, sort_order, updated_at)
             VALUES ($1,$2,$3,$4,'article',$5,true,$6,$7)`,
            [lessonId, chapterId, courseId, lessonTitle, content, lessonSort, now]
          );
          lessonCount++;
          lessonSort++;
        }
        console.log(`  ✅ 章节[${item.title}]: ${item.children.length} 课时`);
      } else if (item.path) {
        // 单课时章节
        const filePath = path.join(ARTICLE_DIR, item.path);
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️  文件不存在: ${item.path}`);
          continue;
        }

        const chapterId = `chapter-xiaobai-${chapterCount}`;
        await db.query(
          'INSERT INTO course_chapters (id, course_id, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [chapterId, courseId, item.title, '', chapterCount]
        );
        chapterCount++;

        let content = fs.readFileSync(filePath, 'utf-8');
        content = copyImagesAndUpdatePaths(content, path.dirname(filePath));

        const lessonId = `lesson-xiaobai-${lessonCount}`;
        await db.query(
          `INSERT INTO course_lessons (id, chapter_id, course_id, title, lesson_type, content, is_free_preview, sort_order, updated_at)
           VALUES ($1,$2,$3,$4,'article',$5,true,$6,$7)`,
          [lessonId, chapterId, courseId, item.title, content, 0, now]
        );
        lessonCount++;
        console.log(`  ✅ 章节[${item.title}]: 1 课时`);
      }
    }

    await db.query('COMMIT');
    console.log(`\n🎉 导入完成!`);
    console.log(`   课程: ${COURSE_TITLE}`);
    console.log(`   章节: ${chapterCount}`);
    console.log(`   课时: ${lessonCount}`);
    console.log(`   图片: ${imageCount}`);
    console.log(`   课程ID: ${courseId}`);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ 导入失败:', err.message);
    process.exit(1);
  } finally {
    db.release();
    await POOL.end();
  }
}

run();
