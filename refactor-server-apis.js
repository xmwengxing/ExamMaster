/**
 * 自动化重构 server.js 中的 SQLite API 到 PostgreSQL
 * 
 * 这个脚本会：
 * 1. 读取 server.js 文件
 * 2. 识别所有使用 SQLite 语法的 API
 * 3. 自动转换为 PostgreSQL 语法
 * 4. 生成重构后的代码
 */

import fs from 'fs/promises';

// 字段名映射（驼峰式 -> 下划线式）
const fieldMapping = {
  'bankId': 'bank_id',
  'userId': 'user_id',
  'questionId': 'question_id',
  'examId': 'exam_id',
  'taskId': 'task_id',
  'tagId': 'tag_id',
  'discussionId': 'discussion_id',
  'commentId': 'comment_id',
  'parentId': 'parent_id',
  'authorId': 'author_id',
  'operatorId': 'operator_id',
  'questionCount': 'question_count',
  'scoreConfig': 'score_config',
  'usageCount': 'usage_count',
  'sortOrder': 'sort_order',
  'aiGradingEnabled': 'ai_grading_enabled',
  'referenceAnswer': 'reference_answer',
  'lastLogin': 'last_login',
  'lastActivity': 'last_activity',
  'loginHistory': 'login_history',
  'realName': 'real_name',
  'idCard': 'id_card',
  'educationType': 'education_type',
  'educationLevel': 'education_level',
  'customFields': 'custom_fields',
  'studentPerms': 'student_perms',
  'allowedBankIds': 'allowed_bank_ids',
  'mistakeCount': 'mistake_count',
  'dailyGoal': 'daily_goal',
  'deepseekApiKey': 'deepseek_api_key',
  'totalOnlineTime': 'total_online_time',
  'className': 'class_name',
  'bankName': 'bank_name',
  'questionTypeFilter': 'question_type_filter',
  'currentIndex': 'current_index',
  'userAnswers': 'user_answers',
  'isCustom': 'is_custom',
  'totalScore': 'total_score',
  'passScore': 'pass_score',
  'passScorePercent': 'pass_score_percent',
  'selectedQuestionIds': 'selected_question_ids',
  'isVisible': 'is_visible',
  'startTime': 'start_time',
  'endTime': 'end_time',
  'singleCount': 'single_count',
  'multipleCount': 'multiple_count',
  'judgeCount': 'judge_count',
  'fillBlankCount': 'fill_blank_count',
  'shortAnswerCount': 'short_answer_count',
  'examTitle': 'exam_title',
  'timeUsed': 'time_used',
  'submitTime': 'submit_time',
  'wrongQuestionIds': 'wrong_question_ids',
  'isFinished': 'is_finished',
  'examConfig': 'exam_config',
  'orderedQuestionIds': 'ordered_question_ids',
  'updatedAt': 'updated_at',
  'createdAt': 'created_at',
  'easeFactor': 'ease_factor',
  'nextReviewDate': 'next_review_date',
  'viewCount': 'view_count',
  'likeCount': 'like_count',
  'commentCount': 'comment_count',
  'isPinned': 'is_pinned',
  'isHidden': 'is_hidden',
  'isDeleted': 'is_deleted',
  'authorName': 'author_name',
  'lastActivityAt': 'last_activity_at',
  'submittedAt': 'submitted_at'
};

async function analyzeServerFile() {
  console.log('正在分析 server.js 文件...\n');
  
  const content = await fs.readFile('server.js', 'utf-8');
  const lines = content.split('\n');
  
  // 统计需要重构的模式
  const patterns = {
    'db.get': 0,
    'db.all': 0,
    'db.run': 0,
    'db.serialize': 0,
    '? placeholder': 0,
    'callback functions': 0
  };
  
  lines.forEach((line, index) => {
    if (line.includes('db.get(')) patterns['db.get']++;
    if (line.includes('db.all(')) patterns['db.all']++;
    if (line.includes('db.run(')) patterns['db.run']++;
    if (line.includes('db.serialize(')) patterns['db.serialize']++;
    if (line.match(/\?/g)) {
      const matches = line.match(/\?/g);
      patterns['? placeholder'] += matches.length;
    }
    if (line.match(/\(err,|, err\)/)) patterns['callback functions']++;
  });
  
  console.log('=== 需要重构的模式统计 ===');
  console.log(`db.get() 调用: ${patterns['db.get']}`);
  console.log(`db.all() 调用: ${patterns['db.all']}`);
  console.log(`db.run() 调用: ${patterns['db.run']}`);
  console.log(`db.serialize() 调用: ${patterns['db.serialize']}`);
  console.log(`? 占位符: ${patterns['? placeholder']}`);
  console.log(`回调函数: ${patterns['callback functions']}`);
  
  // 查找所有 API 端点
  const apiEndpoints = [];
  const apiRegex = /app\.(get|post|put|delete)\(['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = apiRegex.exec(content)) !== null) {
    apiEndpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  console.log(`\n=== 发现 ${apiEndpoints.length} 个 API 端点 ===`);
  
  // 按类别分组
  const categories = {
    'auth': [],
    'user': [],
    'banks': [],
    'questions': [],
    'exams': [],
    'practice': [],
    'mistakes': [],
    'favorites': [],
    'notes': [],
    'srs': [],
    'progress': [],
    'config': [],
    'admin': [],
    'tags': [],
    'discussions': [],
    'comments': [],
    'ai': [],
    'practical': [],
    'other': []
  };
  
  apiEndpoints.forEach(api => {
    const path = api.path.toLowerCase();
    if (path.includes('/auth/')) categories.auth.push(api);
    else if (path.includes('/user/')) categories.user.push(api);
    else if (path.includes('/banks')) categories.banks.push(api);
    else if (path.includes('/questions')) categories.questions.push(api);
    else if (path.includes('/exams')) categories.exams.push(api);
    else if (path.includes('/practice')) categories.practice.push(api);
    else if (path.includes('/mistakes')) categories.mistakes.push(api);
    else if (path.includes('/favorites')) categories.favorites.push(api);
    else if (path.includes('/notes')) categories.notes.push(api);
    else if (path.includes('/srs')) categories.srs.push(api);
    else if (path.includes('/progress')) categories.progress.push(api);
    else if (path.includes('/config')) categories.config.push(api);
    else if (path.includes('/admin/')) categories.admin.push(api);
    else if (path.includes('/tags')) categories.tags.push(api);
    else if (path.includes('/discussions')) categories.discussions.push(api);
    else if (path.includes('/comments')) categories.comments.push(api);
    else if (path.includes('/ai')) categories.ai.push(api);
    else if (path.includes('/practical')) categories.practical.push(api);
    else categories.other.push(api);
  });
  
  console.log('\n=== API 端点分类 ===');
  Object.entries(categories).forEach(([category, apis]) => {
    if (apis.length > 0) {
      console.log(`${category}: ${apis.length} 个端点`);
    }
  });
  
  // 生成重构建议
  console.log('\n=== 重构建议 ===');
  console.log('1. 已完成: 用户认证相关 API (auth, user/profile, user/progress)');
  console.log('2. 进行中: 题库和题目管理 API (banks, questions)');
  console.log('3. 待完成: 考试和练习 API (exams, practice, exam_history)');
  console.log('4. 待完成: 学员管理和系统配置 API (admin, config)');
  console.log('5. 待完成: 讨论区和标签 API (tags, discussions, comments, ai)');
  
  return {
    patterns,
    apiEndpoints,
    categories
  };
}

// 运行分析
analyzeServerFile().catch(console.error);
