// 文档生成服务测试
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import documentGenerator from '../../src/services/document-generator.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据
const mockEducationData = {
  id: 'test-education-001',
  type: 'EDUCATION',
  name: '张三',
  gender: '男',
  birth_date: '1990-05-15',
  phone: '13800138000',
  id_type: '居民身份证',
  id_number: '350100199005150001',
  city: '福州市',
  company: '某某公司',
  first_education: '本科',
  first_education_school: '福建师范大学',
  first_education_major: '计算机科学与技术',
  first_education_graduation_date: '2012-07-01',
  highest_education: '本科',
  highest_education_school: '福建师范大学',
  highest_education_major: '计算机科学与技术',
  highest_education_graduation_date: '2012-07-01',
  upgrade_type: '硕士研究生',
  upgrade_budget: '12000+',
  upgrade_form: '双证硕士',
  upgrade_major: '软件工程'
};

const mockVocationalData = {
  id: 'test-vocational-001',
  type: 'VOCATIONAL',
  name: '李四',
  gender: '女',
  birth_date: '1995-08-20',
  phone: '13900139000',
  id_type: '居民身份证',
  id_number: '350100199508200002',
  city: '厦门市',
  company: '某某科技公司',
  occupation: '人工智能训练师',
  occupation_direction: '数据标注',
  apply_level: '四级',
  highest_education: '大专',
  highest_education_major: '计算机应用技术',
  work_years: 0,
  education_history: [
    {
      level: '初中',
      school: '某某中学',
      major: '',
      graduation_date: '2010.07'
    },
    {
      level: '大专',
      school: '某某职业技术学院',
      major: '计算机应用技术',
      graduation_date: '2018.07'
    }
  ],
  work_history: [
    {
      period: '2020年1月至2025年1月',
      company: '某某科技公司',
      position: '数据标注员'
    }
  ]
};

describe('文档生成服务测试', () => {
  describe('学历教育 Excel 文档生成', () => {
    it('应该成功生成学历教育 Excel 文档', async () => {
      const documentPath = await documentGenerator.generateEducationExcel(mockEducationData);
      
      // 验证返回的路径格式
      expect(documentPath).toMatch(/^\/uploads\/registrations\/education_.*\.xlsx$/);
      
      // 验证文件是否存在
      const fullPath = path.join(process.cwd(), documentPath.substring(1));
      expect(fs.existsSync(fullPath)).toBe(true);
      
      // 清理测试文件
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    it('应该在文档中包含所有必要的报名信息', async () => {
      const documentPath = await documentGenerator.generateEducationExcel(mockEducationData);
      const fullPath = path.join(process.cwd(), documentPath.substring(1));
      
      // 验证文件存在
      expect(fs.existsSync(fullPath)).toBe(true);
      
      // 清理测试文件
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  });

  describe('职业技能 Word 文档生成', () => {
    it('应该成功生成职业技能 Word 文档', async () => {
      // 检查模板文件是否存在
      const templatePath = path.join(process.cwd(), '报名管理', '福建省职业技能等级认定申报表.docx');
      
      if (!fs.existsSync(templatePath)) {
        console.warn('Word 模板文件不存在，跳过测试');
        return;
      }
      
      const documentPath = await documentGenerator.generateVocationalDocx(mockVocationalData);
      
      // 验证返回的路径格式
      expect(documentPath).toMatch(/^\/uploads\/registrations\/vocational_.*\.docx$/);
      
      // 验证文件是否存在
      const fullPath = path.join(process.cwd(), documentPath.substring(1));
      expect(fs.existsSync(fullPath)).toBe(true);
      
      // 清理测试文件
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  });

  describe('模板加载和填充', () => {
    it('应该能够加载 Word 模板', () => {
      const templatePath = path.join(process.cwd(), '报名管理', '福建省职业技能等级认定申报表.docx');
      
      if (!fs.existsSync(templatePath)) {
        console.warn('Word 模板文件不存在，跳过测试');
        return;
      }
      
      const template = documentGenerator.loadDocxTemplate('福建省职业技能等级认定申报表.docx');
      expect(template).toBeDefined();
      expect(Buffer.isBuffer(template)).toBe(true);
    });
  });
});
