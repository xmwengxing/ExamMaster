#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
题目格式转换脚本 - Python版本
将原始题库文件（Excel/Word）转换为系统要求的CSV格式

使用方法：
1. 安装依赖：pip install openpyxl python-docx
2. 运行脚本：python scripts/convert-questions.py
"""

import os
import re
import csv
from pathlib import Path

try:
    from openpyxl import load_workbook
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False
    print("警告: 未安装 openpyxl，无法处理Excel文件")
    print("安装命令: pip install openpyxl")

try:
    from docx import Document
    WORD_AVAILABLE = True
except ImportError:
    WORD_AVAILABLE = False
    print("警告: 未安装 python-docx，无法处理Word文件")
    print("安装命令: pip install python-docx")


def normalize_question_type(type_str):
    """标准化题型"""
    if not type_str:
        return 'SINGLE'
    
    type_str = str(type_str).strip().upper()
    
    if '单选' in type_str or type_str in ['SINGLE', 'A', '1']:
        return 'SINGLE'
    if '多选' in type_str or type_str in ['MULTIPLE', 'B', '2']:
        return 'MULTIPLE'
    if '判断' in type_str or type_str in ['JUDGE', 'C', '3']:
        return 'JUDGE'
    
    return 'SINGLE'


def normalize_answer(answer, question_type):
    """标准化答案格式"""
    if not answer:
        return ''
    
    answer_str = str(answer).strip().upper()
    
    if question_type == 'JUDGE':
        # 判断题答案转换
        if any(x in answer_str for x in ['正确', '对', '√', 'T', 'TRUE']) or answer_str == 'A' or answer_str == '1':
            return 'A'
        if any(x in answer_str for x in ['错误', '错', '×', 'F', 'FALSE']) or answer_str == 'B' or answer_str == '0':
            return 'B'
    
    # 移除所有非字母字符
    return re.sub(r'[^A-Z]', '', answer_str)


def normalize_options(options, question_type):
    """处理选项：统一为 A|B|C|D 格式"""
    if question_type == 'JUDGE':
        return ''
    
    if not options:
        return ''
    
    options_str = str(options).strip()
    
    # 尝试多种分隔符
    if '|' in options_str:
        options_list = options_str.split('|')
    elif '\n' in options_str:
        options_list = options_str.split('\n')
    elif '；' in options_str:
        options_list = options_str.split('；')
    elif ';' in options_str:
        options_list = options_str.split(';')
    else:
        # 尝试匹配 A. B. C. D. 格式
        matches = re.findall(r'[A-Z][.、．]\s*[^A-Z.、．]+', options_str)
        if matches:
            options_list = [re.sub(r'^[A-Z][.、．]\s*', '', m) for m in matches]
        else:
            options_list = [options_str]
    
    # 清理选项：移除序号
    cleaned_options = []
    for opt in options_list:
        opt = opt.strip()
        # 移除各种序号格式
        opt = re.sub(r'^[A-Z][.、．]\s*', '', opt)
        opt = re.sub(r'^[①②③④⑤⑥⑦⑧]\s*', '', opt)
        opt = re.sub(r'^\d+[.、．]\s*', '', opt)
        opt = re.sub(r'^[（(]\s*[A-Z]\s*[)）]\s*', '', opt)
        if opt:
            cleaned_options.append(opt)
    
    return '|'.join(cleaned_options)


def detect_excel_columns(sheet):
    """智能检测Excel列结构"""
    if sheet.max_row == 0:
        return None
    
    # 读取第一行作为标题
    header_row = [cell.value for cell in sheet[1]]
    
    columns = {
        'type': -1,
        'question': -1,
        'options': -1,
        'answer': -1,
        'explanation': -1
    }
    
    # 检测列
    for idx, header in enumerate(header_row):
        if not header:
            continue
        h = str(header).strip().lower()
        
        if '题型' in h or 'type' in h or h == '类型':
            columns['type'] = idx
        elif '题干' in h or '题目' in h or 'question' in h or h == '内容':
            columns['question'] = idx
        elif '选项' in h or 'option' in h:
            columns['options'] = idx
        elif '答案' in h or 'answer' in h or h == '正确答案':
            columns['answer'] = idx
        elif '解析' in h or 'explanation' in h or '说明' in h:
            columns['explanation'] = idx
    
    # 如果没有检测到标题，按位置推断
    if columns['question'] == -1:
        if len(header_row) >= 5:
            columns = {'type': 0, 'question': 1, 'options': 2, 'answer': 3, 'explanation': 4}
        elif len(header_row) >= 4:
            columns = {'type': -1, 'question': 0, 'options': 1, 'answer': 2, 'explanation': 3}
    
    print(f"  检测到的列结构: {columns}")
    return columns


def convert_excel_file(file_path):
    """转换Excel文件"""
    print(f"正在处理: {file_path}")
    
    if not EXCEL_AVAILABLE:
        print("  ✗ 跳过: 未安装 openpyxl")
        return []
    
    try:
        workbook = load_workbook(file_path, data_only=True)
        sheet = workbook.active
        
        # 检测列结构
        columns = detect_excel_columns(sheet)
        if not columns:
            print("  ⚠ 无法识别文件结构")
            return []
        
        questions = []
        start_row = 2 if (columns['type'] >= 0 or columns['question'] >= 0) else 1
        
        for row_idx in range(start_row, sheet.max_row + 1):
            row = [cell.value for cell in sheet[row_idx]]
            if not row or all(cell is None for cell in row):
                continue
            
            # 提取数据
            type_value = row[columns['type']] if columns['type'] >= 0 else ''
            question_value = row[columns['question']] if columns['question'] >= 0 else row[0]
            options_value = row[columns['options']] if columns['options'] >= 0 else (row[1] if len(row) > 1 else '')
            answer_value = row[columns['answer']] if columns['answer'] >= 0 else (row[2] if len(row) > 2 else '')
            explanation_value = row[columns['explanation']] if columns['explanation'] >= 0 else (row[3] if len(row) > 3 else '')
            
            if not question_value:
                continue
            
            question_type = normalize_question_type(type_value)
            question = str(question_value).strip()
            options = normalize_options(options_value, question_type)
            answer = normalize_answer(answer_value, question_type)
            explanation = str(explanation_value).strip() if explanation_value else ''
            
            if question:
                questions.append({
                    'type': question_type,
                    'question': question,
                    'options': options,
                    'answer': answer,
                    'explanation': explanation
                })
        
        print(f"  ✓ 成功转换 {len(questions)} 道题目")
        return questions
        
    except Exception as e:
        print(f"  ✗ 处理失败: {str(e)}")
        return []


def convert_word_file(file_path):
    """转换Word文档"""
    print(f"正在处理: {file_path}")
    
    if not WORD_AVAILABLE:
        print("  ✗ 跳过: 未安装 python-docx")
        return []
    
    try:
        doc = Document(file_path)
        
        # 提取所有段落文本
        lines = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                lines.append(text)
        
        questions = []
        current_question = None
        options_list = []
        
        for line in lines:
            # 检测题目开始
            question_match = re.match(r'^(\d+)[.、．)\s]+(.+)', line)
            if question_match:
                # 保存上一题
                if current_question and current_question['question']:
                    if options_list:
                        current_question['options'] = '|'.join(options_list)
                    questions.append(current_question)
                
                # 开始新题
                current_question = {
                    'type': 'SINGLE',
                    'question': question_match.group(2).strip(),
                    'options': '',
                    'answer': '',
                    'explanation': ''
                }
                options_list = []
                continue
            
            if not current_question:
                continue
            
            # 检测选项
            option_match = re.match(r'^([A-Z])[.、．)\s]+(.+)', line)
            if option_match:
                options_list.append(option_match.group(2).strip())
                continue
            
            # 检测答案
            answer_match = re.match(r'^(?:答案|正确答案|参考答案)[:：\s]+([A-Z]+|正确|错误|对|错)', line, re.IGNORECASE)
            if answer_match:
                current_question['answer'] = normalize_answer(answer_match.group(1), current_question['type'])
                
                # 根据答案判断题型
                if len(current_question['answer']) > 1:
                    current_question['type'] = 'MULTIPLE'
                elif not options_list or len(options_list) <= 2:
                    ans = answer_match.group(1).strip()
                    if ans in ['正确', '错误', '对', '错']:
                        current_question['type'] = 'JUDGE'
                        options_list = []
                continue
            
            # 检测解析
            explanation_match = re.match(r'^(?:解析|答案解析|说明)[:：\s]+(.+)', line, re.IGNORECASE)
            if explanation_match:
                current_question['explanation'] = explanation_match.group(1).strip()
                continue
            
            # 题干延续
            if current_question['question'] and not options_list and not current_question['answer'] and not re.match(r'^[A-Z][.、．)]', line):
                current_question['question'] += ' ' + line
        
        # 保存最后一题
        if current_question and current_question['question']:
            if options_list:
                current_question['options'] = '|'.join(options_list)
            questions.append(current_question)
        
        print(f"  ✓ 成功转换 {len(questions)} 道题目")
        return questions
        
    except Exception as e:
        print(f"  ✗ 处理失败: {str(e)}")
        return []


def generate_csv(questions, output_file):
    """生成CSV文件"""
    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        
        # 写入标题
        writer.writerow(['题型(SINGLE/MULTIPLE/JUDGE)', '题干', '选项(用|分隔;判断题可留空)', '答案(如A或ABC)', '解析'])
        
        # 写入数据
        for q in questions:
            writer.writerow([
                q['type'],
                q['question'],
                q['options'],
                q['answer'],
                q['explanation']
            ])
    
    print(f"\n✓ 已生成: {output_file}")


def generate_report(questions):
    """生成统计报告"""
    total = len(questions)
    single = sum(1 for q in questions if q['type'] == 'SINGLE')
    multiple = sum(1 for q in questions if q['type'] == 'MULTIPLE')
    judge = sum(1 for q in questions if q['type'] == 'JUDGE')
    with_explanation = sum(1 for q in questions if q['explanation'])
    
    print('\n' + '=' * 60)
    print('转换统计')
    print('=' * 60)
    print(f"总题目数: {total}")
    print(f"  - 单选题: {single} ({single/total*100:.1f}%)")
    print(f"  - 多选题: {multiple} ({multiple/total*100:.1f}%)")
    print(f"  - 判断题: {judge} ({judge/total*100:.1f}%)")
    print(f"包含解析: {with_explanation} ({with_explanation/total*100:.1f}%)")
    print('=' * 60)


def main():
    """主函数"""
    print('=' * 60)
    print('题目格式转换工具 - Python版本')
    print('=' * 60)
    print()
    
    # 检查依赖
    if not EXCEL_AVAILABLE and not WORD_AVAILABLE:
        print("错误: 未安装必要的依赖库")
        print("请运行: pip install openpyxl python-docx")
        return
    
    # 扫描文件
    current_dir = Path('.')
    files = []
    
    for pattern in ['原始题库*.xlsx', '原始题库*.xls', '原始题库*.docx']:
        files.extend(current_dir.glob(pattern))
    
    if not files:
        print('❌ 未找到原始题库文件')
        print('\n请将文件命名为"原始题库样本*.xlsx"或"原始题库样本*.docx"')
        print('例如: 原始题库样本1.xlsx、原始题库样本2.xlsx、原始题库样本3.docx')
        return
    
    print(f"找到 {len(files)} 个文件:")
    for f in files:
        print(f"  - {f.name}")
    print()
    
    # 处理每个文件
    all_questions = []
    
    for file_path in files:
        ext = file_path.suffix.lower()
        
        if ext in ['.xlsx', '.xls']:
            questions = convert_excel_file(str(file_path))
        elif ext == '.docx':
            questions = convert_word_file(str(file_path))
        else:
            continue
        
        all_questions.extend(questions)
        print()
    
    if not all_questions:
        print('❌ 没有成功转换任何题目')
        return
    
    # 生成统计报告
    generate_report(all_questions)
    
    # 生成CSV文件
    print('\n正在生成CSV文件...\n')
    generate_csv(all_questions, '转换后的题目-合并.csv')
    
    # 按题型分类
    single_questions = [q for q in all_questions if q['type'] == 'SINGLE']
    multiple_questions = [q for q in all_questions if q['type'] == 'MULTIPLE']
    judge_questions = [q for q in all_questions if q['type'] == 'JUDGE']
    
    if single_questions:
        generate_csv(single_questions, '转换后的题目-单选题.csv')
    if multiple_questions:
        generate_csv(multiple_questions, '转换后的题目-多选题.csv')
    if judge_questions:
        generate_csv(judge_questions, '转换后的题目-判断题.csv')
    
    print('\n✅ 转换完成！')
    print('\n📝 提示: 请检查生成的CSV文件，确认格式正确后再导入系统。')


if __name__ == '__main__':
    main()
