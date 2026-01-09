
import { UserRole, QuestionType, User, QuestionBank, Question, Exam } from './types';

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  phone: 'admin',
  password: 'admin',
  nickname: '超级管理员',
  realName: '系统管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  role: UserRole.ADMIN,
  accuracy: 0,
  mistakeCount: 0
};

export const MOCK_STUDENT: User = {
  id: 'student-1',
  phone: '13666666666',
  password: '123456',
  nickname: '努力的同学',
  realName: '张三',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
  role: UserRole.STUDENT,
  idCard: '440101199001018888',
  educationType: '全日制',
  educationLevel: '本科',
  school: '清华大学',
  major: '计算机科学与技术',
  company: '某互联网大厂',
  accuracy: 85.5,
  mistakeCount: 12,
  lastLogin: '2023-10-27 10:30:00'
};

export const EDUCATION_TYPE_OPTIONS = ['全日制', '非全日制'];
export const EDUCATION_LEVEL_OPTIONS = ['初中', '高中', '大专', '本科', '硕士', '博士'];

export const PRESET_AVATARS = {
  male: [
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Ming',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Wei',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Chen',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Jun',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Hao',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Kai',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Feng',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Long',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Tao',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Yang'
  ],
  female: [
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Mei',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Ling',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Xia',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Yue',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Jing',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Fang',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Lan',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Xin',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Hui',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Qing'
  ]
};

export const MOCK_BANKS: QuestionBank[] = [
  { 
    id: 'bank-1', 
    name: '2024年网络安全知识竞赛', 
    category: '信息技术', 
    level: '初级', 
    description: '涵盖网络安全基础常识。', 
    questionCount: 150,
    scoreConfig: { [QuestionType.SINGLE]: 1, [QuestionType.MULTIPLE]: 2, [QuestionType.JUDGE]: 1 }
  }
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    bankId: 'bank-1',
    type: QuestionType.SINGLE,
    content: '下列哪个选项不属于网络攻击？',
    options: ['SQL注入', '跨站脚本(XSS)', '防火墙设置', 'DDoS攻击'],
    answer: 'C',
    explanation: '防火墙设置属于安全防御措施，而非攻击。'
  }
];

export const MOCK_EXAMS: Exam[] = [
  { id: 'e-1', bankId: 'bank-1', title: '网络安全季度考', duration: 60, totalScore: 100, passScore: 60, passScorePercent: 60, strategy: 'RANDOM', status: 'ONGOING' }
];
