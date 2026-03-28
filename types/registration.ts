/**
 * 报名登记相关类型定义
 */

// 报名类型
export type RegistrationType = 'EDUCATION' | 'VOCATIONAL' | 'K12';

// 报名状态
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// 学历等级
export type EducationLevel = 
  | '无'
  | '初中'
  | '高中'
  | '中专'
  | '技校'
  | '大专'
  | '本科'
  | '硕士研究生'
  | '博士研究生';

// 升学类型
export type UpgradeType = '大专' | '本科' | '硕士研究生' | '博士研究生';

// 升学预算
export type UpgradeBudget = '5000-6000' | '7000-10000' | '12000+';

// 升学形式
export type UpgradeForm = '函授' | '国家开放大学' | '自学考试' | '单证硕士' | '双证硕士' | '硕升博';

// 证件类型
export type IDType = 
  | '居民身份证'
  | '港澳居民居住证'
  | '台湾居民居住证'
  | '军官证'
  | '护照';

// 申报等级
export type ApplyLevel = '五级' | '四级' | '三级' | '二级' | '一级';

// 通用报名信息
export interface BaseRegistration {
  id?: string;
  type: RegistrationType;
  status?: RegistrationStatus;
  name: string;
  gender: string;
  birth_date: string;
  phone: string;
  id_type: IDType;
  id_number: string;
  city: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
}

// 学历教育报名信息
export interface EducationRegistration extends BaseRegistration {
  type: 'EDUCATION';
  first_education: EducationLevel;
  first_education_school: string;
  first_education_major: string;
  first_education_graduation_date: string;
  highest_education: EducationLevel;
  highest_education_school: string;
  highest_education_major: string;
  highest_education_graduation_date: string;
  upgrade_type: UpgradeType;
  upgrade_budget: UpgradeBudget;
  upgrade_form: UpgradeForm;
  upgrade_major: string;
}

// 职业技能报名信息
export interface VocationalRegistration extends BaseRegistration {
  type: 'VOCATIONAL';
  occupation: string;
  occupation_direction?: string;
  apply_level: ApplyLevel;
  work_years: number;
  education_history: EducationHistoryItem[];
  work_history: WorkHistoryItem[];
  photo_url: string;
}

// 学习经历项
export interface EducationHistoryItem {
  level: string;
  school: string;
  major: string;
  graduation_date: string | null;
}

// 工作经历项
export interface WorkHistoryItem {
  period: string;
  company: string;
  position: string;
}

// 专业匹配结果
export interface MajorMatchResult {
  level4Match: boolean;
  level3Match: boolean;
}

// 草稿数据
export interface DraftData<T> {
  data: T;
  timestamp: number;
}

// 表单验证错误
export interface FormValidationError {
  field: string;
  message: string;
}

// 提交结果
export interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
  document_path?: string;
}
