#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试题型识别功能
"""

import sys
sys.path.append('scripts')

from convert_questions_gui import QuestionBankConverterGUI

# 创建转换器实例
converter = QuestionBankConverterGUI()

# 测试用例
test_cases = [
    {
        'name': '单选题（有选项）',
        'content': '下列哪个协议用于加密网页传输？',
        'options': ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
        'answer': 'C',
        'expected': 'single'
    },
    {
        'name': '多选题（答案多个字母）',
        'content': '发现账号被盗应采取哪些措施？',
        'options': ['立即修改密码', '通知银行', '告知好友', '举报异常'],
        'answer': 'ABCD',
        'expected': 'multiple'
    },
    {
        'name': '判断题（2个选项）',
        'content': '防火墙主要用于监控和过滤进出网络的数据包。',
        'options': ['正确', '错误'],
        'answer': 'A',
        'expected': 'judge'
    },
    {
        'name': '填空题（有下划线）',
        'content': 'JavaScript是一种____语言，常用于____开发。',
        'options': [],
        'answer': '',
        'expected': 'fill'
    },
    {
        'name': '简答题（有关键词）',
        'content': '根据材料一，概括新式学堂课程设置的特点',
        'options': [],
        'answer': '①注重自然科学；②兼顾理论和实践',
        'expected': 'essay'
    },
    {
        'name': '问答题（有关键词）',
        'content': '阅读下列材料，回答问题。',
        'options': [],
        'answer': '答案内容',
        'expected': 'essay'
    },
    {
        'name': '简答题（答案长）',
        'content': '请简述HTTPS的工作原理。',
        'options': [],
        'answer': 'HTTPS通过SSL/TLS协议对HTTP通信进行加密。',
        'expected': 'essay'
    },
    {
        'name': '复合题（有关键词）',
        'content': '（1）根据材料二，概要指出中国共产党在黄埔军校开展政治教育的措施。',
        'options': [],
        'answer': '①开设丰富的政治教育课程',
        'expected': 'essay'
    }
]

print("=" * 80)
print("题型识别测试")
print("=" * 80)

passed = 0
failed = 0

for i, test in enumerate(test_cases, 1):
    result = converter.detect_question_type(
        test['content'],
        test['options'],
        test['answer']
    )
    
    status = "✓ 通过" if result == test['expected'] else "✗ 失败"
    
    print(f"\n测试 {i}: {test['name']}")
    print(f"  题目: {test['content'][:50]}...")
    print(f"  选项数: {len(test['options'])}")
    print(f"  答案: {test['answer'][:30]}...")
    print(f"  预期: {test['expected']}")
    print(f"  实际: {result}")
    print(f"  结果: {status}")
    
    if result == test['expected']:
        passed += 1
    else:
        failed += 1

print("\n" + "=" * 80)
print(f"测试结果: 通过 {passed}/{len(test_cases)}, 失败 {failed}/{len(test_cases)}")
print("=" * 80)
