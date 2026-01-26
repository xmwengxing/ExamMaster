#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""诊断特定行的选项解析问题"""

from openpyxl import load_workbook

def diagnose_row(sheet, row_num, columns):
    """诊断特定行的数据"""
    print(f"\n{'='*60}")
    print(f"第 {row_num} 行诊断")
    print('='*60)
    
    row = [cell.value for cell in sheet[row_num]]
    
    print(f"原始行数据（共 {len(row)} 列）:")
    for idx, cell in enumerate(row):
        print(f"  列 {idx}: {repr(cell)}")
    
    # 提取关键字段
    type_value = row[columns['type']] if columns['type'] >= 0 else ''
    question_value = row[columns['question']] if columns['question'] >= 0 else row[0]
    options_value = row[columns['options']] if columns['options'] >= 0 else (row[1] if len(row) > 1 else '')
    answer_value = row[columns['answer']] if columns['answer'] >= 0 else (row[2] if len(row) > 2 else '')
    
    print(f"\n提取的字段:")
    print(f"  题型: {repr(type_value)}")
    print(f"  题干: {repr(question_value)}")
    print(f"  选项: {repr(options_value)}")
    print(f"  答案: {repr(answer_value)}")
    
    # 分析选项字段
    if options_value:
        print(f"\n选项字段分析:")
        print(f"  类型: {type(options_value)}")
        print(f"  长度: {len(str(options_value))}")
        print(f"  内容: {repr(str(options_value))}")
        
        # 检查可能的分隔符
        options_str = str(options_value)
        print(f"\n分隔符检测:")
        print(f"  包含 '|': {'|' in options_str}")
        print(f"  包含 '\\n': {chr(10) in options_str}")
        print(f"  包含 '；': {'；' in options_str}")
        print(f"  包含 ';': {';' in options_str}")
        
        # 尝试分割
        if '|' in options_str:
            parts = options_str.split('|')
            print(f"\n按 '|' 分割结果（{len(parts)} 个）:")
            for i, part in enumerate(parts):
                print(f"    {i+1}. {repr(part)}")

def main():
    file_path = '原始题库2.xlsx'
    
    print(f"正在加载文件: {file_path}")
    workbook = load_workbook(file_path, data_only=True)
    sheet = workbook.active
    
    # 检测列结构
    header_row = [cell.value for cell in sheet[1]]
    print(f"\n标题行: {header_row}")
    
    columns = {
        'type': -1,
        'question': -1,
        'options': -1,
        'answer': -1,
        'explanation': -1
    }
    
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
    
    print(f"\n检测到的列结构: {columns}")
    
    # 诊断第 26 行（CSV 第 25 行 + 1 标题行）
    diagnose_row(sheet, 26, columns)
    
    # 诊断第 27 行（CSV 第 26 行 + 1 标题行）
    diagnose_row(sheet, 27, columns)

if __name__ == '__main__':
    main()
