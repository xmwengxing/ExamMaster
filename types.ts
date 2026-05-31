
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export enum QuestionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
  JUDGE = 'JUDGE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',  // 填空题
  SHORT_ANSWER = 'SHORT_ANSWER'      // 简答题
}

export enum PracticeMode {
  SEQUENTIAL = 'SEQUENTIAL',
  MEMORY = 'MEMORY',
  MISTAKE = 'MISTAKE',
  MOCK = 'MOCK',
  PRACTICAL = 'PRACTICAL',
  SMART_REVIEW = 'SMART_REVIEW' // 新增：智能复习模式
}

export type StudentPermission = 'BANK' | 'VIDEO' | 'EXAM';

export interface BannerItem {
  id: string;
  image: string;
  content: string;
  detailContent?: string;
}

export interface User {
  id: string;
  phone: string;
  password?: string;
  nickname: string;
  realName: string;
  avatar: string;
  role: UserRole;
  permissions?: string[];
  studentPerms?: StudentPermission[];
  allowedBankIds?: string[];
  
  idCard?: string;
  school?: string;
  educationType?: string;
  educationLevel?: string;
  major?: string;
  company?: string;
  className?: string; // 新增：班级字段
  groupId?: string;     // 新增：学员分组ID
  gender?: string; // 新增：性别字段
  
  customFields?: Record<string, string>;
  accuracy: number;
  mistakeCount: number;
  lastLogin?: string;
  isOnline?: boolean;
  totalOnlineTime?: number;
  loginHistory?: string[] | LoginSession[]; // 支持旧格式和新格式
  dailyGoal?: number;
  deepseekApiKey?: string;
}

// 登录会话信息
export interface LoginSession {
  loginTime: string;
  logoutTime?: string;
  duration?: number; // 本次登录时长（秒）
}

export interface Question {
  id: string;
  bankId: string;
  type: QuestionType;
  content: string;
  options: string[];
  answer: string | string[];
  explanation: string;
  score?: number;
  
  // 新增字段 - 填空题和简答题支持
  blanks?: BlankConfig[];      // 填空题配置
  referenceAnswer?: string;    // 简答题参考答案
  aiGradingEnabled?: boolean;  // 是否启用AI评分
  tags?: string[];             // 题目标签ID列表
  chapter?: string;            // 单元/章节
}

// 填空题配置
export interface BlankConfig {
  id: string;                  // 空白ID (如 "blank1", "blank2")
  position: number;            // 在题干中的位置
  acceptedAnswers: string[];   // 可接受的答案列表
  caseSensitive?: boolean;     // 是否区分大小写（默认false）
  partialScore?: number;       // 部分得分
}

// SRS 智能复习记录
export interface SrsRecord {
  id?: number;
  userId: string;
  questionId: string;
  interval: number;      // 当前复习间隔（天）
  easeFactor: number;   // 易度系数 (默认 2.5)
  repetitions: number;  // 连续正确次数
  nextReviewDate: string; // 下次复习日期 YYYY-MM-DD
  status: 'LEARNING' | 'REVIEWING' | 'MASTERED';
}

export enum PracticalPartType {
  STEM = 'STEM',
  BLANK = 'BLANK',
  ANSWER = 'ANSWER',
  CODE = 'CODE',
  CODE_BLANK = 'CODE_BLANK'
}

export interface PracticalTaskPart {
  id: string;
  type: PracticalPartType;
  content: string;
}

export interface PracticalTask {
  id: string;
  title: string;
  createdAt: string;
  parts: PracticalTaskPart[];
}

export interface PracticalTaskRecord {
  id: string;
  userId: string;
  taskId: string;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface QuestionNote {
  id: string;
  userId: string;
  questionId: string;
  content: string;
  updatedAt: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  questionCount: number;
  scoreConfig: Record<QuestionType, number>;
  usageCount?: number;
}

export interface Exam {
  id: string;
  bankId: string;
  title: string;
  duration: number;
  totalScore: number;
  passScore: number;
  passScorePercent: number;
  strategy: 'RANDOM' | 'MANUAL';
  selectedQuestionIds?: string[];
  status: 'PENDING' | 'ONGOING' | 'FINISHED';
  isVisible?: boolean;
  startTime?: string;
  endTime?: string;
  singleCount?: number;
  multipleCount?: number;
  judgeCount?: number;
  fillBlankCount?: number;
  shortAnswerCount?: number;
}

export interface AuditLog {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface DailyProgress {
  id: string;
  userId: string;
  date: string;
  count: number;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  loginTime: string;
  logoutTime?: string;        // 退出时间（可选）
  sessionDuration?: number;   // 本次登录时长（秒）
}

export interface ExamRecord {
  id: string;
  userId?: string;
  examId: string;
  examTitle: string;
  score: number;
  totalScore: number;
  passScore: number;
  timeUsed: number;
  submitTime: string;
  bankId?: string;
  wrongQuestionIds?: string[];
  userAnswers?: Record<string, string[]>;
  passed: boolean;
  currentIndex?: number;
  isFinished: boolean;
  examConfig?: any;
  orderedQuestionIds?: string[];
}

export interface PracticeRecord {
  id: string;
  userId?: string;
  bankId: string;
  bankName: string;
  type: string;
  questionTypeFilter?: string;
  mode: PracticeMode;
  count: number;
  date: string;
  currentIndex: number;
  userAnswers: Record<string, string[]>;
  isCustom?: boolean;
}

export interface VideoConfig {
  id: string;
  title: string;
  desc: string;
  type: 'LINK' | 'API';
  url: string;
}

// ========== 在线课程系统类型 ==========

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  permissions: GroupPermissions;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupPermissions {
  banks: string[];
  exams: string[];
  vod_courses: {
    mode: 'all' | 'category' | 'specific' | 'none';
    categories: string[];
    courses: string[];
  };
  live_courses: {
    mode: 'all' | 'category' | 'specific' | 'none';
    categories: string[];
    courses: string[];
  };
  article_courses: {
    mode: 'all' | 'category' | 'specific' | 'none';
    categories: string[];
    courses: string[];
  };
  interactive_courses: {
    mode: 'all' | 'none';
    courses: string[];
  };
}

export interface CourseCategory {
  id: string;
  name: string;
  courseType: 'vod' | 'live' | 'article';
  sortOrder: number;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  courseType: 'vod' | 'live' | 'article';
  category?: string;
  teacherName?: string;
  teacherIntro?: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseChapter {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  chapterId: string;
  courseId: string;
  title: string;
  lessonType: 'video' | 'article';
  videoType?: 'upload' | 'embed' | 'link';
  videoUrl?: string;
  duration: number;
  content?: string;
  isFreePreview: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveSession {
  id: string;
  courseId: string;
  title?: string;
  meetingNumber?: string;
  meetingUrl?: string;
  meetingPassword?: string;
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'living' | 'ended';
  replayUrl?: string;
  createdAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  lastLessonId?: string;
  lastPosition: number;
  progressPercent: number;
  completedAt?: string;
  enrolledAt: string;
  updatedAt: string;
}

// ========== 标签系统类型 ==========

export interface Tag {
  id: string;
  name: string;
  color?: string;              // 标签颜色（可选）
  createdAt: string;
  usageCount: number;          // 使用次数
}

export interface QuestionTag {
  questionId: string;
  tagId: string;
}

// ========== 讨论系统类型 ==========

export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  questionId?: string;         // 关联的题目ID（可选）
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;      // 最后活跃时间
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;           // 是否置顶
  isHidden: boolean;           // 是否隐藏
}

export interface Comment {
  id: string;
  discussionId: string;
  parentId?: string;           // 父评论ID（用于嵌套回复）
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isDeleted: boolean;
}

export interface DiscussionLike {
  userId: string;
  discussionId?: string;
  commentId?: string;
  createdAt: string;
}
