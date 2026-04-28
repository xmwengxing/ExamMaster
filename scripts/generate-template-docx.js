// 使用 officegen 生成包含占位符的Word模板
// 这个脚本会创建一个新的模板文件，包含所有必要的占位符

import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, VerticalAlign, BorderStyle } from 'docx';

const TEMPLATE_DIR = path.join(process.cwd(), '报名管理');
const OUTPUT_FILE = path.join(TEMPLATE_DIR, '福建省职业技能等级认定申报表-带占位符.docx');

console.log('开始生成Word模板文件...\n');

// 定义表格边框样式
const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
};

// 创建表格单元格的辅助函数
function createCell(text, options = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        text: text,
        alignment: options.alignment || AlignmentType.LEFT,
        style: options.style
      })
    ],
    width: options.width || { size: 20, type: WidthType.PERCENTAGE },
    verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
    borders: borders,
    columnSpan: options.columnSpan,
    rowSpan: options.rowSpan,
    margins: {
      top: 50,
      bottom: 50,
      left: 100,
      right: 100
    }
  });
}

// 创建标签单元格（灰色背景）
function createLabelCell(text, options = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        text: text,
        alignment: AlignmentType.CENTER
      })
    ],
    width: options.width || { size: 15, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    borders: borders,
    columnSpan: options.columnSpan,
    rowSpan: options.rowSpan,
    shading: {
      fill: 'E7E6E6'
    },
    margins: {
      top: 50,
      bottom: 50,
      left: 100,
      right: 100
    }
  });
}

// 创建文档
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1440,    // 1英寸 = 1440 twips
          right: 1440,
          bottom: 1440,
          left: 1440
        }
      }
    },
    children: [
      // 标题
      new Paragraph({
        text: '福建省职业技能等级认定申报表',
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 300
        },
        children: [
          new TextRun({
            text: '福建省职业技能等级认定申报表',
            bold: true,
            size: 32
          })
        ]
      }),

      // 主信息表格
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: [
          // 第1行：姓名、性别、出生年月、照片
          new TableRow({
            children: [
              createLabelCell('姓名'),
              createCell('{{name}}', { width: { size: 18, type: WidthType.PERCENTAGE } }),
              createLabelCell('性别'),
              createCell('{{gender}}', { width: { size: 10, type: WidthType.PERCENTAGE } }),
              createLabelCell('出生年月'),
              createCell('{{birth_date}}', { width: { size: 15, type: WidthType.PERCENTAGE } }),
              createLabelCell('照片', { rowSpan: 2, width: { size: 12, type: WidthType.PERCENTAGE } })
            ]
          }),

          // 第2行：身份证号码、联系电话
          new TableRow({
            children: [
              createLabelCell('身份证号码'),
              createCell('{{id_number}}', { columnSpan: 3 }),
              createLabelCell('联系电话'),
              createCell('{{phone}}')
            ]
          }),

          // 第3行：申报认定职业
          new TableRow({
            children: [
              createLabelCell('申报认定职业'),
              createCell('{{occupation}}', { columnSpan: 6 })
            ]
          }),

          // 第4行：工种/职业方向名称
          new TableRow({
            children: [
              createLabelCell('工种/职业方向名称'),
              createCell('{{occupation_direction}}', { columnSpan: 6 })
            ]
          }),

          // 第5行：申报等级、从事本职业年限
          new TableRow({
            children: [
              createLabelCell('申报等级'),
              createCell('{{apply_level}}', { columnSpan: 2 }),
              createLabelCell('从事本职业年限'),
              createCell('{{work_years}}年', { columnSpan: 3 })
            ]
          }),

          // 第6行：现工作单位、电话
          new TableRow({
            children: [
              createLabelCell('现工作单位'),
              createCell('{{company}}', { columnSpan: 4 }),
              createLabelCell('电话'),
              createCell('{{phone}}')
            ]
          }),

          // 第7行：最高学历、毕业院校
          new TableRow({
            children: [
              createLabelCell('最高学历'),
              createCell('{{highest_education}}'),
              createLabelCell('毕业院校'),
              createCell('{{highest_education_school}}', { columnSpan: 4 })
            ]
          }),

          // 第8行：最高学历专业、毕业时间
          new TableRow({
            children: [
              createLabelCell('最高学历专业'),
              createCell('{{highest_education_major}}', { columnSpan: 3 }),
              createLabelCell('毕业时间'),
              createCell('{{highest_education_graduation_date}}', { columnSpan: 2 })
            ]
          }),

          // 第9行：现已持何种职业证书、等级
          new TableRow({
            children: [
              createLabelCell('现已持何种职业证书'),
              createCell('{{current_certificate}}', { columnSpan: 3 }),
              createLabelCell('等级'),
              createCell('{{certificate_level}}', { columnSpan: 2 })
            ]
          }),

          // 第10行：证书编码、取得证书时间
          new TableRow({
            children: [
              createLabelCell('证书编码'),
              createCell('{{certificate_code}}', { columnSpan: 3 }),
              createLabelCell('取得证书时间'),
              createCell('{{certificate_date}}', { columnSpan: 2 })
            ]
          })
        ]
      }),

      // 学习经历标题
      new Paragraph({
        text: '学习经历',
        spacing: {
          before: 300,
          after: 100
        },
        children: [
          new TextRun({
            text: '学习经历',
            bold: true,
            size: 24
          })
        ]
      }),

      // 学习经历表格
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: [
          // 表头
          new TableRow({
            children: [
              createLabelCell('程度', { width: { size: 15, type: WidthType.PERCENTAGE } }),
              createLabelCell('所在院校', { width: { size: 35, type: WidthType.PERCENTAGE } }),
              createLabelCell('专业', { width: { size: 30, type: WidthType.PERCENTAGE } }),
              createLabelCell('毕业时间', { width: { size: 20, type: WidthType.PERCENTAGE } })
            ]
          }),
          // 数据行（使用循环占位符）
          new TableRow({
            children: [
              createCell('{{#education_history}}{{level}}{{/education_history}}'),
              createCell('{{#education_history}}{{school}}{{/education_history}}'),
              createCell('{{#education_history}}{{major}}{{/education_history}}'),
              createCell('{{#education_history}}{{graduation_date}}{{/education_history}}')
            ]
          }),
          new TableRow({
            children: [
              createCell('{{#education_history}}{{level}}{{/education_history}}'),
              createCell('{{#education_history}}{{school}}{{/education_history}}'),
              createCell('{{#education_history}}{{major}}{{/education_history}}'),
              createCell('{{#education_history}}{{graduation_date}}{{/education_history}}')
            ]
          }),
          new TableRow({
            children: [
              createCell('{{#education_history}}{{level}}{{/education_history}}'),
              createCell('{{#education_history}}{{school}}{{/education_history}}'),
              createCell('{{#education_history}}{{major}}{{/education_history}}'),
              createCell('{{#education_history}}{{graduation_date}}{{/education_history}}')
            ]
          }),
          new TableRow({
            children: [
              createCell('{{#education_history}}{{level}}{{/education_history}}'),
              createCell('{{#education_history}}{{school}}{{/education_history}}'),
              createCell('{{#education_history}}{{major}}{{/education_history}}'),
              createCell('{{#education_history}}{{graduation_date}}{{/education_history}}')
            ]
          })
        ]
      }),

      // 工作经历标题
      new Paragraph({
        text: '工作经历',
        spacing: {
          before: 300,
          after: 100
        },
        children: [
          new TextRun({
            text: '工作经历',
            bold: true,
            size: 24
          })
        ]
      }),

      // 工作经历表格
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: [
          // 表头
          new TableRow({
            children: [
              createLabelCell('何年至何年', { width: { size: 25, type: WidthType.PERCENTAGE } }),
              createLabelCell('从事何职业', { width: { size: 20, type: WidthType.PERCENTAGE } }),
              createLabelCell('所在单位', { width: { size: 35, type: WidthType.PERCENTAGE } }),
              createLabelCell('证明人姓名、电话', { width: { size: 20, type: WidthType.PERCENTAGE } })
            ]
          }),
          // 数据行
          new TableRow({
            children: [
              createCell('{{#work_history}}{{period}}{{/work_history}}'),
              createCell('{{#work_history}}{{position}}{{/work_history}}'),
              createCell('{{#work_history}}{{company}}{{/work_history}}'),
              createCell('{{#work_history}}{{witness}}{{/work_history}}')
            ]
          }),
          new TableRow({
            children: [
              createCell('{{#work_history}}{{period}}{{/work_history}}'),
              createCell('{{#work_history}}{{position}}{{/work_history}}'),
              createCell('{{#work_history}}{{company}}{{/work_history}}'),
              createCell('{{#work_history}}{{witness}}{{/work_history}}')
            ]
          }),
          new TableRow({
            children: [
              createCell('{{#work_history}}{{period}}{{/work_history}}'),
              createCell('{{#work_history}}{{position}}{{/work_history}}'),
              createCell('{{#work_history}}{{company}}{{/work_history}}'),
              createCell('{{#work_history}}{{witness}}{{/work_history}}')
            ]
          })
        ]
      })
    ]
  }]
});

// 生成文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_FILE, buffer);
  console.log('✓ 模板文件创建成功:', OUTPUT_FILE);
  console.log('\n模板特性:');
  console.log('  ✓ 包含所有必要的占位符');
  console.log('  ✓ 表格自动换行支持');
  console.log('  ✓ 学习经历循环（4行）');
  console.log('  ✓ 工作经历循环（3行）');
  console.log('\n下一步:');
  console.log('  1. 运行测试脚本: node scripts/test-vocational-template.js');
  console.log('  2. 检查生成的测试文档');
  console.log('  3. 如果测试通过，将此模板替换原模板文件');
}).catch(error => {
  console.error('✗ 创建模板失败:', error.message);
  console.error(error.stack);
  process.exit(1);
});
