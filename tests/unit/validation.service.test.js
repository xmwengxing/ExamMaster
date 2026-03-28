// 验证服务单元测试
// 测试学历等级验证、升学预算和形式联动、专业匹配、工作年限计算等功能

import { describe, it, expect } from 'vitest';
import {
  validateEducationLevel,
  validateUpgradeForm,
  getAllowedUpgradeForms,
  checkMajorCompatibility,
  calculateRequiredWorkYears,
  formatBirthDate,
  formatGraduationDate,
  validateImageSize
} from '../../src/services/validation.service.js';

describe('验证服务 - validateEducationLevel', () => {
  it('应该允许最高学历等于第一学历', () => {
    const result = validateEducationLevel('本科', '本科');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe(null);
  });

  it('应该允许最高学历高于第一学历', () => {
    const result = validateEducationLevel('本科', '硕士研究生');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe(null);
  });

  it('应该拒绝最高学历低于第一学历', () => {
    const result = validateEducationLevel('本科', '大专');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('请选择高于第一学历的选项');
  });

  it('应该正确处理同等级学历（高中、中专、技校）', () => {
    const result1 = validateEducationLevel('高中', '中专');
    expect(result1.isValid).toBe(true);
    
    const result2 = validateEducationLevel('中专', '技校');
    expect(result2.isValid).toBe(true);
    
    const result3 = validateEducationLevel('技校', '高中');
    expect(result3.isValid).toBe(true);
  });

  it('应该验证学历等级顺序：初中 < 高中/中专/技校 < 大专 < 本科 < 硕士 < 博士', () => {
    expect(validateEducationLevel('初中', '高中').isValid).toBe(true);
    expect(validateEducationLevel('高中', '大专').isValid).toBe(true);
    expect(validateEducationLevel('大专', '本科').isValid).toBe(true);
    expect(validateEducationLevel('本科', '硕士研究生').isValid).toBe(true);
    expect(validateEducationLevel('硕士研究生', '博士研究生').isValid).toBe(true);
  });

  it('应该拒绝无效的学历选项', () => {
    const result = validateEducationLevel('无效学历', '本科');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('无效的学历选项');
  });
});

describe('验证服务 - validateUpgradeForm', () => {
  it('应该允许预算5000-6000匹配函授', () => {
    const result = validateUpgradeForm('5000-6000', '函授');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe(null);
  });

  it('应该拒绝预算5000-6000匹配国家开放大学', () => {
    const result = validateUpgradeForm('5000-6000', '国家开放大学');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('所选升学形式与预算不匹配');
  });

  it('应该允许预算7000-10000匹配国家开放大学', () => {
    const result = validateUpgradeForm('7000-10000', '国家开放大学');
    expect(result.isValid).toBe(true);
  });

  it('应该允许预算7000-10000匹配自学考试', () => {
    const result = validateUpgradeForm('7000-10000', '自学考试');
    expect(result.isValid).toBe(true);
  });

  it('应该允许预算12000+匹配单证硕士', () => {
    const result = validateUpgradeForm('12000+', '单证硕士');
    expect(result.isValid).toBe(true);
  });

  it('应该允许预算12000+匹配双证硕士', () => {
    const result = validateUpgradeForm('12000+', '双证硕士');
    expect(result.isValid).toBe(true);
  });

  it('应该允许预算12000+匹配硕升博', () => {
    const result = validateUpgradeForm('12000+', '硕升博');
    expect(result.isValid).toBe(true);
  });

  it('应该拒绝无效的预算选项', () => {
    const result = validateUpgradeForm('无效预算', '函授');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('无效的预算选项');
  });
});

describe('验证服务 - getAllowedUpgradeForms', () => {
  it('应该返回预算5000-6000的允许形式', () => {
    const forms = getAllowedUpgradeForms('5000-6000');
    expect(forms).toEqual(['函授']);
  });

  it('应该返回预算7000-10000的允许形式', () => {
    const forms = getAllowedUpgradeForms('7000-10000');
    expect(forms).toEqual(['国家开放大学', '自学考试']);
  });

  it('应该返回预算12000+的允许形式', () => {
    const forms = getAllowedUpgradeForms('12000+');
    expect(forms).toEqual(['单证硕士', '双证硕士', '硕升博']);
  });

  it('应该返回空数组对于无效预算', () => {
    const forms = getAllowedUpgradeForms('无效预算');
    expect(forms).toEqual([]);
  });
});

describe('验证服务 - checkMajorCompatibility', () => {
  const mockMappings = [
    {
      occupation: '人工智能训练师',
      major_name: '计算机科学与技术',
      level_4_compatible: true,
      level_3_compatible: true
    },
    {
      occupation: '人工智能训练师',
      major_name: '软件工程',
      level_4_compatible: false,
      level_3_compatible: true
    }
  ];

  it('应该识别四级专业符合（中专）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '中专',
      mockMappings
    );
    expect(result.level4Match).toBe(true);
    expect(result.level3Match).toBe(false);
  });

  it('应该识别四级专业符合（技校）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '技校',
      mockMappings
    );
    expect(result.level4Match).toBe(true);
    expect(result.level3Match).toBe(false);
  });

  it('应该识别三级专业符合（大专）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '大专',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(true);
  });

  it('应该识别三级专业符合（本科）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '本科',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(true);
  });

  it('应该识别三级专业符合（硕士研究生）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '硕士研究生',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(true);
  });

  it('应该识别三级专业符合（博士研究生）', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '博士研究生',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(true);
  });

  it('应该处理仅三级兼容的专业', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '软件工程',
      '大专',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(true);
  });

  it('应该返回无匹配当专业不在对照表中', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '不存在的专业',
      '本科',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(false);
  });

  it('应该返回无匹配当职业不在对照表中', () => {
    const result = checkMajorCompatibility(
      '不存在的职业',
      '计算机科学与技术',
      '本科',
      mockMappings
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(false);
  });

  it('应该返回无匹配当专业对照表为空', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '本科',
      []
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(false);
  });

  it('应该返回无匹配当专业对照表为null', () => {
    const result = checkMajorCompatibility(
      '人工智能训练师',
      '计算机科学与技术',
      '本科',
      null
    );
    expect(result.level4Match).toBe(false);
    expect(result.level3Match).toBe(false);
  });
});

describe('验证服务 - calculateRequiredWorkYears', () => {
  it('应该返回0年当四级专业符合', () => {
    const result = calculateRequiredWorkYears('四级', { level4Match: true, level3Match: false });
    expect(result.workYears).toBe(0);
    expect(result.isAutoFilled).toBe(true);
    expect(result.message).toBe(null);
  });

  it('应该返回0年当三级专业符合', () => {
    const result = calculateRequiredWorkYears('三级', { level4Match: false, level3Match: true });
    expect(result.workYears).toBe(0);
    expect(result.isAutoFilled).toBe(true);
    expect(result.message).toBe(null);
  });

  it('应该返回6年当四级无专业匹配', () => {
    const result = calculateRequiredWorkYears('四级', { level4Match: false, level3Match: false });
    expect(result.workYears).toBe(6);
    expect(result.isAutoFilled).toBe(true);
    expect(result.message).toBe('工作总年限不低于6年');
  });

  it('应该返回10年当三级无专业匹配', () => {
    const result = calculateRequiredWorkYears('三级', { level4Match: false, level3Match: false });
    expect(result.workYears).toBe(10);
    expect(result.isAutoFilled).toBe(true);
    expect(result.message).toBe('工作总年限不低于10年');
  });

  it('应该返回null当申报等级不是四级或三级', () => {
    const result = calculateRequiredWorkYears('五级', { level4Match: false, level3Match: false });
    expect(result.workYears).toBe(null);
    expect(result.isAutoFilled).toBe(false);
    expect(result.message).toBe(null);
  });

  it('应该优先使用专业符合规则而非默认年限', () => {
    // 即使有三级匹配，但申报四级时应该使用四级规则
    const result = calculateRequiredWorkYears('四级', { level4Match: false, level3Match: true });
    expect(result.workYears).toBe(6);
    expect(result.message).toBe('工作总年限不低于6年');
  });
});

describe('验证服务 - formatBirthDate', () => {
  it('应该将日期格式化为YYYY.MM格式', () => {
    const date = new Date('1990-05-15');
    const result = formatBirthDate(date);
    expect(result).toBe('1990.05');
  });

  it('应该处理日期字符串', () => {
    const result = formatBirthDate('1995-08-20');
    expect(result).toBe('1995.08');
  });

  it('应该正确处理单位数月份（补零）', () => {
    const result = formatBirthDate('2000-01-01');
    expect(result).toBe('2000.01');
  });

  it('应该正确处理双位数月份', () => {
    const result = formatBirthDate('2000-12-31');
    expect(result).toBe('2000.12');
  });

  it('应该返回空字符串对于无效日期', () => {
    const result = formatBirthDate('无效日期');
    expect(result).toBe('');
  });

  it('应该返回空字符串对于null', () => {
    const result = formatBirthDate(null);
    expect(result).toBe('');
  });
});

describe('验证服务 - formatGraduationDate', () => {
  it('应该将日期格式化为YYYY年MM月格式', () => {
    const date = new Date('2012-07-01');
    const result = formatGraduationDate(date);
    expect(result).toBe('2012年07月');
  });

  it('应该处理日期字符串', () => {
    const result = formatGraduationDate('2018-06-30');
    expect(result).toBe('2018年06月');
  });

  it('应该正确处理单位数月份（补零）', () => {
    const result = formatGraduationDate('2020-01-15');
    expect(result).toBe('2020年01月');
  });

  it('应该正确处理双位数月份', () => {
    const result = formatGraduationDate('2020-12-31');
    expect(result).toBe('2020年12月');
  });

  it('应该返回空字符串对于无效日期', () => {
    const result = formatGraduationDate('无效日期');
    expect(result).toBe('');
  });

  it('应该返回空字符串对于null', () => {
    const result = formatGraduationDate(null);
    expect(result).toBe('');
  });
});

describe('验证服务 - validateImageSize', () => {
  it('应该允许小于200KB的图片', () => {
    const result = validateImageSize(100 * 1024); // 100KB
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe(null);
  });

  it('应该允许等于200KB的图片', () => {
    const result = validateImageSize(200 * 1024); // 200KB
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe(null);
  });

  it('应该拒绝大于200KB的图片', () => {
    const result = validateImageSize(250 * 1024); // 250KB
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('照片大小不能超过200KB，请压缩后重新上传');
  });

  it('应该支持自定义最大大小', () => {
    const result = validateImageSize(150 * 1024, 100 * 1024); // 150KB，限制100KB
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('照片大小不能超过100KB，请压缩后重新上传');
  });

  it('应该允许0字节文件', () => {
    const result = validateImageSize(0);
    expect(result.isValid).toBe(true);
  });
});
