#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GUI工具手动测试脚本
创建测试Excel文件用于验证GUI工具功能
"""

import os
from pathlib import Path

try:
    from openpyxl import Workbook
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False
    print("请先安装openpyxl: pip install openpyxl")
    exit(1)


def create_test_excel():
    """创建测试Excel文件"""
    wb = Workbook()
    ws = wb.active
    ws.title = "测试题库"
    
    # 添加标题行
    ws.append(['题型', '题目', '选项', '答案', '解析'])
    
    # 添加测试数据
    test_questions = [
        ['单选', 'JavaScript是什么类型的语言？', '编程语言|数据库|操作系统|硬件', 'A', 'JavaScript是一种编程语言'],
        ['单选', 'Python的创始人是谁？', 'Guido van Rossum|Dennis Ritchie|Bjarne Stroustrup|James Gosling', 'A', 'Guido van Rossum创建了Python'],
        ['多选', '以下哪些是前端框架？', 'React|Vue|Django|Angular', 'ABD', 'Django是后端框架'],
        ['判断', 'Python是编译型语言', '', 'B', 'Python是解释型语言'],
        ['判断', 'HTML是一种标记语言', '', 'A', 'HTML确实是标记语言'],
        ['单选', '以下哪个不是数据库？', 'MySQL|PostgreSQL|MongoDB|JavaScript', 'D', 'JavaScript是编程语言，不是数据库'],
        ['多选', '以下哪些是编程语言？', 'Python|Java|HTML|C++', 'ABD', 'HTML是标记语言，不是编程语言'],
        ['单选', 'CSS的全称是什么？', 'Cascading Style Sheets|Computer Style Sheets|Creative Style Sheets|Colorful Style Sheets', 'A', 'CSS是层叠样式表'],
        ['判断', 'Git是一个版本控制系统', '', 'A', 'Git确实是版本控制系统'],
        ['单选', 'Node.js基于什么引擎？', 'V8|SpiderMonkey|Chakra|JavaScriptCore', 'A', 'Node.js基于Chrome的V8引擎'],
    ]
    
    for question in test_questions:
        ws.append(question)
    
    # 保存文件
    output_path = Path(__file__).parent / '测试题库_GUI工具.xlsx'
    wb.save(output_path)
    
    print(f"✓ 测试Excel文件已创建: {output_path}")
    print(f"  包含 {len(test_questions)} 道测试题目")
    print("\n使用方法:")
    print("1. 运行GUI工具: python scripts/convert-questions-gui.py")
    print("2. 选择刚创建的测试文件")
    print("3. 点击'开始转换'")
    print("4. 查看转换结果")
    
    return output_path


if __name__ == '__main__':
    create_test_excel()
