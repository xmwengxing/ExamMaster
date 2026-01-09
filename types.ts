
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

export type StudentPermission = 'BANK' | 'VIDEO' | 'EXAM' | 'NONE';

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
  gender?: string; // 新增：性别字段
  
  customFields?: Record<string, string>;
  accuracy: number;
  mistakeCount: number;
  lastLogin?: string;
  isOnline?: boolean;
  totalOnlineTime?: number;
  loginHistory?: string[];
  dailyGoal?: number;
  deepseekApiKey?: string;
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
  ANSWER = 'ANSWER'
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
