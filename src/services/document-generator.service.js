// 文档生成服务
// 负责生成学历教育 Excel 文档和职业技能 Word 文档

import xlsx from 'xlsx';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import logger from '../../utils/logger.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文档存储目录
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'registrations');
const TEMPLATE_DIR = path.join(process.cwd(), '报名管理');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 生成学历教育 Excel 文档
 * @param {Object} registrationData - 报名数据
 * @returns {Promise<string>} 文档路径
 */
export async function generateEducationExcel(registrationData) {
  try {
    logger.info('开始生成学历教育 Excel 文档', { 
      registrationId: registrationData.id,
      name: registrationData.name 
    });

    // 创建工作簿
    const workbook = xlsx.utils.book_new();

    // 准备数据行
    const data = [
      ['学历教育报名表'],
      [],
      ['基本信息'],
      ['姓名', registrationData.name],
      ['性别', registrationData.gender || ''],
      ['出生年月', registrationData.birth_date || ''],
      ['联系电话', registrationData.phone],
      ['证件类型', registrationData.id_type || ''],
      ['证件号', registrationData.id_number || ''],
      ['所在城市', registrationData.city || ''],
      ['工作单位', registrationData.company || ''],
      [],
      ['教育背景'],
      ['第一学历', registrationData.first_education || ''],
      ['第一学历院校', registrationData.first_education_school || ''],
      ['第一学历专业', registrationData.first_education_major || ''],
      ['第一学历毕业时间', registrationData.first_education_graduation_date || ''],
      ['最高学历', registrationData.highest_education || ''],
      ['最高学历院校', registrationData.highest_education_school || ''],
      ['最高学历专业', registrationData.highest_education_major || ''],
      ['最高学历毕业时间', registrationData.highest_education_graduation_date || ''],
      [],
      ['升学选择'],
      ['升学类型', registrationData.upgrade_type || ''],
      ['升学预算', registrationData.upgrade_budget || ''],
      ['升学形式', registrationData.upgrade_form || ''],
      ['升学专业', registrationData.upgrade_major || '']
    ];

    // 创建工作表
    const worksheet = xlsx.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 },  // 第一列宽度
      { wch: 40 }   // 第二列宽度
    ];

    // 添加工作表到工作簿
    xlsx.utils.book_append_sheet(workbook, worksheet, '学历教育报名');

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `education_${registrationData.id}_${timestamp}.xlsx`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // 写入文件
    xlsx.writeFile(workbook, filePath);

    logger.info('学历教育 Excel 文档生成成功', { 
      registrationId: registrationData.id,
      filePath 
    });

    // 返回相对路径
    return `/uploads/registrations/${fileName}`;
  } catch (error) {
    logger.error('生成学历教育 Excel 文档失败', { 
      error: error.message,
      registrationId: registrationData.id 
    });
    throw error;
  }
}

/**
 * 生成职业技能 Word 文档
 * @param {Object} registrationData - 报名数据
 * @returns {Promise<string>} 文档路径
 */
export async function generateVocationalDocx(registrationData) {
  try {
    logger.info('开始生成职业技能 Word 文档', { 
      registrationId: registrationData.id,
      name: registrationData.name 
    });

    // 模板文件路径
    const templatePath = path.join(TEMPLATE_DIR, '福建省职业技能等级认定申报表.docx');

    // 检查模板文件是否存在
    if (!fs.existsSync(templatePath)) {
      throw new Error('Word 模板文件不存在');
    }

    // 读取模板文件
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // 创建 docxtemplater 实例
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // 启用表格自动换行
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    // 准备填充数据
    const templateData = prepareVocationalTemplateData(registrationData);

    // 填充数据
    doc.render(templateData);

    // 生成文档
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `vocational_${registrationData.id}_${timestamp}.docx`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // 写入文件
    fs.writeFileSync(filePath, buf);

    logger.info('职业技能 Word 文档生成成功', { 
      registrationId: registrationData.id,
      filePath 
    });

    // 返回相对路径
    return `/uploads/registrations/${fileName}`;
  } catch (error) {
    logger.error('生成职业技能 Word 文档失败', { 
      error: error.message,
      registrationId: registrationData.id 
    });
    throw error;
  }
}

/**
 * 准备职业技能模板数据
 * @param {Object} registrationData - 报名数据
 * @returns {Object} 模板数据
 */
function prepareVocationalTemplateData(registrationData) {
  // 格式化日期
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatGraduationDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
  };

  // 处理学习经历（确保解析为数组）
  let educationHistory = registrationData.education_history || [];
  try {
    if (typeof educationHistory === 'string') {
      educationHistory = JSON.parse(educationHistory);
    }
  } catch (error) {
    logger.error('解析学习经历失败', { error: error.message });
    educationHistory = [];
  }
  
  const educationRows = [];
  for (let i = 0; i < 4; i++) {
    const edu = educationHistory[i] || {};
    educationRows.push({
      level: edu.level || '',
      school: edu.school || '',
      major: edu.major || '',
      graduation_date: edu.graduation_date || ''
    });
  }

  // 处理工作经历（确保解析为数组）
  let workHistory = registrationData.work_history || [];
  try {
    if (typeof workHistory === 'string') {
      workHistory = JSON.parse(workHistory);
    }
  } catch (error) {
    logger.error('解析工作经历失败', { error: error.message });
    workHistory = [];
  }
  
  const workRows = [];
  for (let i = 0; i < 3; i++) {
    const work = workHistory[i] || {};
    workRows.push({
      period: work.period || '',
      company: work.company || '',
      position: work.position || ''
    });
  }

  return {
    // 基本信息
    name: registrationData.name || '',
    gender: registrationData.gender || '',
    birth_date: formatDate(registrationData.birth_date),
    id_number: registrationData.id_number || '',
    phone: registrationData.phone || '',
    
    // 申报信息
    occupation: registrationData.occupation || '',
    occupation_direction: registrationData.occupation_direction || '',
    apply_level: registrationData.apply_level || '',
    highest_education: registrationData.highest_education || '',
    highest_education_major: registrationData.highest_education_major || '',
    work_years: registrationData.work_years || 0,
    
    // 现有证书信息
    current_certificate: registrationData.current_certificate || '',
    certificate_level: registrationData.certificate_level || '',
    certificate_code: registrationData.certificate_code || '',
    certificate_date: registrationData.certificate_date || '',
    
    // 学习经历
    education_history: educationRows,
    
    // 工作经历
    work_history: workRows,
    
    // 其他信息
    city: registrationData.city || '',
    company: registrationData.company || ''
  };
}

/**
 * 批量生成文档并打包
 * @param {Object} db - 数据库实例
 * @param {Array<string>} registrationIds - 报名记录ID数组
 * @param {string} type - 报名类型 ('EDUCATION' | 'VOCATIONAL')
 * @returns {Promise<string>} 压缩包路径
 */
export async function generateBatchDocuments(db, registrationIds, type) {
  try {
    logger.info('开始批量生成文档', { 
      count: registrationIds.length,
      type 
    });

    // 生成临时目录
    const timestamp = Date.now();
    const tempDir = path.join(UPLOAD_DIR, `batch_${timestamp}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const generatedFiles = [];

    // 逐个生成文档
    for (const registrationId of registrationIds) {
      try {
        // 查询报名记录
        const registration = await db.getOne(
          'SELECT * FROM registrations WHERE id = $1',
          [registrationId]
        );

        if (!registration) {
          logger.warn('报名记录不存在，跳过', { registrationId });
          continue;
        }

        let documentPath;
        if (type === 'EDUCATION') {
          documentPath = await generateEducationExcel(registration);
        } else if (type === 'VOCATIONAL') {
          documentPath = await generateVocationalDocx(registration);
        }

        if (documentPath) {
          const fullPath = path.join(process.cwd(), documentPath.substring(1));
          generatedFiles.push({
            path: fullPath,
            name: path.basename(fullPath)
          });
        }
      } catch (error) {
        logger.error('单个文档生成失败', { 
          registrationId,
          error: error.message 
        });
      }
    }

    // 创建压缩包
    const zipFileName = `batch_${type.toLowerCase()}_${timestamp}.zip`;
    const zipFilePath = path.join(UPLOAD_DIR, zipFileName);
    
    await createZipArchive(generatedFiles, zipFilePath);

    // 清理临时文件
    for (const file of generatedFiles) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        logger.warn('清理临时文件失败', { 
          filePath: file.path,
          error: error.message 
        });
      }
    }

    logger.info('批量文档生成完成', { 
      count: generatedFiles.length,
      zipFilePath 
    });

    return `/uploads/registrations/${zipFileName}`;
  } catch (error) {
    logger.error('批量生成文档失败', { 
      error: error.message,
      type 
    });
    throw error;
  }
}

/**
 * 创建 ZIP 压缩包
 * @param {Array<Object>} files - 文件列表 [{path, name}]
 * @param {string} outputPath - 输出路径
 * @returns {Promise<void>}
 */
function createZipArchive(files, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });

    output.on('close', () => {
      logger.debug('压缩包创建完成', { 
        outputPath,
        size: archive.pointer() 
      });
      resolve();
    });

    archive.on('error', (err) => {
      logger.error('压缩包创建失败', { 
        error: err.message,
        outputPath 
      });
      reject(err);
    });

    archive.pipe(output);

    // 添加文件到压缩包
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.name });
      }
    }

    archive.finalize();
  });
}

/**
 * 加载 Word 文档模板
 * @param {string} templateName - 模板文件名
 * @returns {Buffer} 模板内容
 */
export function loadDocxTemplate(templateName) {
  try {
    const templatePath = path.join(TEMPLATE_DIR, templateName);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板文件不存在: ${templateName}`);
    }

    const content = fs.readFileSync(templatePath);
    
    logger.debug('模板加载成功', { templateName });
    return content;
  } catch (error) {
    logger.error('加载模板失败', { 
      error: error.message,
      templateName 
    });
    throw error;
  }
}

/**
 * 填充 Word 文档模板
 * @param {Buffer} template - 模板内容
 * @param {Object} data - 填充数据
 * @returns {Buffer} 生成的文档内容
 */
export function fillDocxTemplate(template, data) {
  try {
    const zip = new PizZip(template);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    logger.debug('模板填充成功');
    return buf;
  } catch (error) {
    logger.error('填充模板失败', { error: error.message });
    throw error;
  }
}

// 默认导出
export default {
  generateEducationExcel,
  generateVocationalDocx,
  generateBatchDocuments,
  loadDocxTemplate,
  fillDocxTemplate
};
