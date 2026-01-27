
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuestionBank, QuestionType, Question, Tag } from '../../types';
import TagSelector from '../../components/TagSelector';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextDisplay from '../../components/RichTextDisplay';
import { useAppStore } from '../../store';
import * as XLSX from 'xlsx';

interface BankManagerProps {
  banks: QuestionBank[];
  allQuestions: Question[];
  onAdd: (bank: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onUpdateScore: (bankId: string, config: any) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (id: string, data: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onDeleteQuestions: (bankId: string, ids: string[]) => void;
  onImportQuestions: (bankId: string, qs: Question[]) => void;
}

const BankManager: React.FC<BankManagerProps> = ({ 
  banks, allQuestions, onAdd, onUpdate, onDelete, onUpdateScore,
  onAddQuestion, onUpdateQuestion, onDeleteQuestion, onDeleteQuestions, onImportQuestions
}) => {
  const store = useAppStore();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [bankForm, setBankForm] = useState<any>({ name: '', category: '', level: '初级', description: '' });
  const [scoreForm, setScoreForm] = useState<any>({});

  const [qSearch, setQSearch] = useState('');
  const [qTypeFilter, setQTypeFilter] = useState<string>('ALL');
  const [qChapterFilter, setQChapterFilter] = useState<string[]>([]); // 新增：章节筛选
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  // 加载所有标签
  const [allTags, setAllTags] = useState<Tag[]>([]);
  
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await store.fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error('[BankManager] 加载标签失败:', error);
      }
    };
    loadTags();
  }, []);
  
  // 根据 tagId 查找标签对象
  const getTagById = (tagId: string) => {
    return allTags.find(tag => tag.id === tagId);
  };

  const editingBank = useMemo(() => banks.find(b => b.id === editingBankId) || null, [banks, editingBankId]);
  const bankQuestions = useMemo(() => editingBankId ? allQuestions.filter(q => q.bankId === editingBankId) : [], [allQuestions, editingBankId]);
  
  // 获取当前题库的所有章节（去重）
  const availableChapters = useMemo(() => {
    const chapters = bankQuestions
      .map(q => q.chapter)
      .filter(c => c && c.trim())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return chapters;
  }, [bankQuestions]);
  
  const filteredQuestions = useMemo(() => {
    return bankQuestions.filter(q => {
      const matchType = qTypeFilter === 'ALL' || q.type === qTypeFilter;
      const matchSearch = q.content.toLowerCase().includes(qSearch.toLowerCase());
      const matchChapter = qChapterFilter.length === 0 || (q.chapter && qChapterFilter.includes(q.chapter));
      return matchType && matchSearch && matchChapter;
    });
  }, [bankQuestions, qSearch, qTypeFilter, qChapterFilter]);
  
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const paginatedQuestions = useMemo(() => filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredQuestions, currentPage]);

  const handleBankSave = () => {
    if (!bankForm.name) return alert('请填写题库名称');
    
    if (editingBankId) {
      onUpdate(editingBankId, bankForm);
    } else {
      onAdd({
        ...bankForm,
        id: 'bank-' + Date.now(),
        questionCount: 0,
        scoreConfig: { 
          [QuestionType.SINGLE]: 2, 
          [QuestionType.MULTIPLE]: 4, 
          [QuestionType.JUDGE]: 1,
          [QuestionType.FILL_IN_BLANK]: 3,
          [QuestionType.SHORT_ANSWER]: 5
        }
      });
    }
    setIsBankModalOpen(false);
  };

  const handleQuestionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBankId || !editingQuestion) return;
    if (!editingQuestion.content) return alert('请填写题目内容');

    const finalQuestion = { ...editingQuestion };
    
    // 判断题：固定选项
    if (finalQuestion.type === QuestionType.JUDGE) {
      finalQuestion.options = ['正确', '错误'];
    }
    
    // 填空题：验证配置
    if (finalQuestion.type === QuestionType.FILL_IN_BLANK) {
      if (!finalQuestion.blanks || finalQuestion.blanks.length === 0) {
        return alert('填空题至少需要配置一个空白');
      }
      // 验证每个空白都有答案
      for (const blank of finalQuestion.blanks) {
        if (!blank.acceptedAnswers || blank.acceptedAnswers.length === 0) {
          return alert(`空白 ${blank.id} 至少需要一个可接受的答案`);
        }
      }
      // 清空不需要的字段
      finalQuestion.options = [];
      finalQuestion.answer = '';
    }
    
    // 简答题：验证参考答案
    if (finalQuestion.type === QuestionType.SHORT_ANSWER) {
      if (!finalQuestion.referenceAnswer || finalQuestion.referenceAnswer.trim() === '') {
        return alert('简答题需要填写参考答案');
      }
      // 清空不需要的字段
      finalQuestion.options = [];
      finalQuestion.answer = '';
    }

    try {
      if (finalQuestion.id) {
        await onUpdateQuestion(finalQuestion.id, finalQuestion);
      } else {
        const res = await onAddQuestion({ 
          ...finalQuestion,
          id: 'q-' + Date.now(), 
          bankId: editingBankId,
        } as Question);
        // Optionally we could do something with res.question or res.id here
      }
      // wait a tick for store refresh to propagate
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      alert('保存题目失败：' + (err?.message || err));
    }

    setIsQuestionModalOpen(false);
    setDuplicateIds([]);
  };

  const handleCheckDuplicates = () => {
    setIsChecking(true);
    setTimeout(() => {
      const seen = new Map<string, string>(); 
      const toDelete: string[] = [];

      bankQuestions.forEach(q => {
        const key = `${q.content.trim().toLowerCase()}_${q.type}`;
        if (seen.has(key)) {
          toDelete.push(q.id);
        } else {
          seen.set(key, q.id);
        }
      });

      setDuplicateIds(toDelete);
      setIsChecking(false);
      if (toDelete.length === 0) alert('当前题库未发现重复题目！');
    }, 800);
  };

  const handleClearDuplicates = async () => {
    if (duplicateIds.length === 0) return;
    if (confirm(`检测到 ${duplicateIds.length} 道重复项，确定清理吗？`)) {
      await onDeleteQuestions(editingBankId!, duplicateIds);
      setDuplicateIds([]);
      alert('清理完成');
    }
  };

  // 统一的数据处理逻辑（CSV和Excel共用）
  const processImportData = async (headerRow: string[], dataRows: string[][]) => {
    const newQs: Question[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const parts = dataRows[i];
      
      try {
        // 新格式：题型,题干,选项,答案,解析,单元/章节,填空配置,简答参考答案
        if (parts.length < 4) {
          errors.push(`第${i+2}行：字段不足（至少需要4个字段）`);
          continue;
        }
        const [typeStr, content, optionsStr, answer, explanation = '', chapter = '', fillBlanksStr = '', shortAnswerRef = ''] = parts.map(p => String(p || '').trim());
        const type = typeStr.toUpperCase() as QuestionType;
        
        // 验证题型
        if (![QuestionType.SINGLE, QuestionType.MULTIPLE, QuestionType.JUDGE, QuestionType.FILL_IN_BLANK, QuestionType.SHORT_ANSWER].includes(type)) {
          errors.push(`第${i+2}行：题型无效（${typeStr}），应为SINGLE/MULTIPLE/JUDGE/FILL_IN_BLANK/SHORT_ANSWER`);
          continue;
        }
        
        // 验证题干
        if (!content || content.trim() === '') {
          errors.push(`第${i+2}行：题干不能为空`);
          continue;
        }
        // 处理填空题
        if (type === QuestionType.FILL_IN_BLANK) {
          if (!fillBlanksStr || fillBlanksStr.trim() === '') {
            errors.push(`第${i+2}行：填空题需要填空配置（格式：blank1:答案1|答案2;blank2:答案3）`);
            continue;
          }
          try {
            const blanks: any[] = [];
            const blankConfigs = fillBlanksStr.split(';').filter(b => b.trim());
            
            blankConfigs.forEach((config, idx) => {
              const [blankId, answersStr] = config.split(':');
              if (!blankId || !answersStr) {
                throw new Error('填空配置格式错误');
              }
              
              const acceptedAnswers = answersStr.split('|').map(a => a.trim()).filter(a => a);
              if (acceptedAnswers.length === 0) {
                throw new Error(`${blankId} 至少需要一个答案`);
              }
              
              blanks.push({
                id: blankId.trim(),
                position: idx,
                acceptedAnswers: acceptedAnswers,
                caseSensitive: false
              });
            });
            
            newQs.push({
              id: `q-imp-${Date.now()}-${Math.floor(Math.random()*1000000)}-${i}`,
              bankId: editingBankId!,
              type: type,
              content: content.trim(),
              options: [],
              answer: '',
              explanation: explanation.trim(),
              chapter: chapter.trim() || undefined,
              blanks: blanks
            });
            continue;
          } catch (err: any) {
            errors.push(`第${i+2}行：填空题配置解析失败 - ${err.message}`);
            continue;
          }
        }
        // 处理简答题
        if (type === QuestionType.SHORT_ANSWER) {
          if (!shortAnswerRef || shortAnswerRef.trim() === '') {
            errors.push(`第${i+2}行：简答题需要参考答案`);
            continue;
          }
          
          newQs.push({
            id: `q-imp-${Date.now()}-${Math.floor(Math.random()*1000000)}-${i}`,
            bankId: editingBankId!,
            type: type,
            content: content.trim(),
            options: [],
            answer: '',
            explanation: explanation.trim(),
            chapter: chapter.trim() || undefined,
            referenceAnswer: shortAnswerRef.trim(),
            aiGradingEnabled: false
          });
          continue;
        }
        // 处理选择题和判断题
        let options: string[] = [];
        if (type === QuestionType.JUDGE) {
          options = ['正确', '错误'];
        } else {
          options = optionsStr ? optionsStr.split('|').map(o => o.trim()).filter(o => o) : [];
          if (options.length < 2) {
            errors.push(`第${i+2}行：选择题至少需要2个选项`);
            continue;
          }
          if (options.length > 8) {
            errors.push(`第${i+2}行：选项数量不能超过8个`);
            continue;
          }
        }
        
        // 验证答案
        if (!answer || answer.trim() === '') {
          errors.push(`第${i+2}行：答案不能为空`);
          continue;
        }
        
        const answerUpper = answer.toUpperCase().trim();
        let finalAnswer: string | string[];
        
        if (type === QuestionType.MULTIPLE) {
          finalAnswer = answerUpper.split('').filter(a => /^[A-Z]$/.test(a));
          if (finalAnswer.length === 0) {
            errors.push(`第${i+2}行：多选题答案格式错误（如：ABC）`);
            continue;
          }
          // 验证答案选项是否在范围内
          const maxOption = String.fromCharCode(65 + options.length - 1);
          if (finalAnswer.some(a => a > maxOption)) {
            errors.push(`第${i+2}行：答案超出选项范围（最大为${maxOption}）`);
            continue;
          }
        } else {
          finalAnswer = answerUpper;
          if (type === QuestionType.JUDGE) {
            if (!['A', 'B'].includes(finalAnswer)) {
              errors.push(`第${i+2}行：判断题答案应为A（正确）或B（错误）`);
              continue;
            }
          } else {
            // 单选题
            if (!/^[A-Z]$/.test(finalAnswer)) {
              errors.push(`第${i+2}行：单选题答案格式错误（如：A）`);
              continue;
            }
            const maxOption = String.fromCharCode(65 + options.length - 1);
            if (finalAnswer > maxOption) {
              errors.push(`第${i+2}行：答案超出选项范围（最大为${maxOption}）`);
              continue;
            }
          }
        }

        newQs.push({
          id: `q-imp-${Date.now()}-${Math.floor(Math.random()*1000000)}-${i}`,
          bankId: editingBankId!,
          type: type,
          content: content.trim(),
          options: options,
          answer: finalAnswer,
          explanation: explanation.trim(),
          chapter: chapter.trim() || undefined
        });
      } catch (err: any) {
        errors.push(`第${i+2}行：解析失败 - ${err.message}`);
      }
    }
    
    // 显示导入结果
    if (errors.length > 0) {
      const errorMsg = `导入完成，但有 ${errors.length} 条错误：\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...(更多错误已省略)' : ''}`;
      if (newQs.length === 0) {
        alert('导入失败！\n\n' + errorMsg);
        return;
      } else {
        if (!confirm(`发现 ${errors.length} 条错误，成功解析 ${newQs.length} 题。\n\n是否继续导入有效题目？\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)) {
          return;
        }
      }
    }
    
    if (newQs.length > 0) {
      try {
        console.log('[BankManager] Importing questions:', newQs.length);
        const res = await onImportQuestions(editingBankId!, newQs as Question[]);
        
        const inserted = res?.inserted ?? 0;
        const skipped = res?.skipped ?? 0;
        const total = res?.total ?? newQs.length;
        const serverErrors = res?.errors || [];
        
        // 合并前端和后端的错误
        const allErrors = [...errors, ...serverErrors];
        
        // 构建结果消息
        let message = `导入完成！\n\n`;
        message += `总计：${total} 题\n`;
        message += `✓ 成功：${inserted} 题\n`;
        if (skipped > 0) {
          message += `✗ 失败：${skipped} 题\n`;
        }
        
        if (allErrors.length > 0) {
          message += `\n错误详情（前${Math.min(10, allErrors.length)}条）：\n`;
          message += allErrors.slice(0, 10).join('\n');
          if (allErrors.length > 10) {
            message += `\n...(还有${allErrors.length - 10}条错误)`;
          }
        }
        
        alert(message);
        setIsImportModalOpen(false);
        
      } catch (err: any) {
        console.error('[BankManager] Import error:', err);
        alert('导入失败：' + (err?.message || err));
      }
    }
  };

  // 处理Excel导入
  const handleExcelImport = async (file: File) => {
    if (!editingBankId) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为JSON数据（保留原始格式）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (jsonData.length < 2) {
          alert('Excel文件格式错误：至少需要包含表头和一行数据');
          return;
        }
        
        // 过滤掉注释行（以#开头）和空行
        const validLines = jsonData.filter(row => {
          if (!row || row.length === 0) return false;
          const firstCell = String(row[0] || '').trim();
          return firstCell && !firstCell.startsWith('#');
        });
        
        if (validLines.length < 2) {
          alert('Excel文件中没有有效的题目数据（注释行和空行已自动过滤）');
          return;
        }
        
        // 第一行是表头
        const headerRow = validLines[0].map((h: any) => String(h || '').trim());
        
        // 从第二行开始是数据
        const dataRows = validLines.slice(1);
        
        // 使用CSV的解析逻辑处理数据
        await processImportData(headerRow, dataRows);
        
      } catch (error: any) {
        console.error('Excel解析错误:', error);
        alert('Excel文件解析失败：' + (error?.message || '未知错误'));
      }
    };
    
    reader.readAsBinaryString(file);
  };
  
  // 处理CSV导入
  const handleCSVImport = async (file: File) => {
    if (!editingBankId) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        
        // 过滤掉注释行（以#开头）
        const validLines = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('#');
        });
        
        if (validLines.length < 2) {
          alert('CSV文件中没有有效的题目数据（注释行已自动过滤）');
          return;
        }
        
        // 解析表头
        const headerLine = validLines[0];
        const headerParts: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < headerLine.length; j++) {
          const char = headerLine[j];
          const nextChar = headerLine[j + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              j++;
              continue;
            } else {
              inQuotes = !inQuotes;
              continue;
            }
          }
          
          if (char === ',' && !inQuotes) {
            headerParts.push(current.trim());
            current = '';
            continue;
          }
          
          current += char;
        }
        headerParts.push(current.trim());
        
        // 解析数据行
        const dataRows: string[][] = [];
        for (let i = 1; i < validLines.length; i++) {
          const line = validLines[i].trim();
          if (!line) continue;
          // 改进的CSV解析：正确处理引号包裹和转义
          const parts: string[] = [];
          let current = '';
          let inQuotes = false;
          let j = 0;
          
          while (j < line.length) {
            const char = line[j];
            const nextChar = line[j + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // 转义的引号（""）
                current += '"';
                j += 2;
                continue;
              } else {
                // 切换引号状态
                inQuotes = !inQuotes;
                j++;
                continue;
              }
            }
            
            if (char === ',' && !inQuotes) {
              // 字段分隔符
              parts.push(current.trim());
              current = '';
              j++;
              continue;
            }
            
            current += char;
            j++;
          }
          
          // 添加最后一个字段
          parts.push(current.trim());
          dataRows.push(parts);
        }
        
        // 使用统一的数据处理逻辑
        await processImportData(headerParts, dataRows);
        
      } catch (error: any) {
        console.error('CSV解析错误:', error);
        alert('CSV文件解析失败：' + (error?.message || '未知错误'));
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };
  
  // 统一的文件导入入口
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBankId) return;
    
    const fileName = file.name.toLowerCase();
    
    // 根据文件扩展名选择处理方式
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      handleExcelImport(file);
    } else if (fileName.endsWith('.csv')) {
      handleCSVImport(file);
    } else {
      alert('不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件');
    }
    
    e.target.value = '';
  };
  
  // 下载CSV模板
  const downloadCSVTemplate = () => {
    const headers = '题型(SINGLE/MULTIPLE/JUDGE/FILL_IN_BLANK/SHORT_ANSWER),题干,选项(用|分隔),答案,解析,单元/章节,填空配置(格式:blank1:答案1|答案2;blank2:答案3),简答参考答案\n';
    const example1 = 'SINGLE,下列哪个协议用于加密网页传输？,HTTP|FTP|HTTPS|SMTP,C,HTTPS是HTTP的安全版本,第一章,,\n';
    const example2 = 'JUDGE,防火墙主要用于监控和过滤进出网络的数据包。,,A,防火墙是网络安全的第一道防线,网络基础,,\n';
    const example3 = 'MULTIPLE,发现账号被盗应采取哪些措施？(多选),立即修改密码|通知银行|告知好友|举报异常,ABCD,这些都是减少损失的重要步骤,第二章,,\n';
    const example4 = 'FILL_IN_BLANK,"JavaScript是一种{{blank1}}语言，常用于{{blank2}}开发。",,,,模块1,blank1:脚本|编程|动态;blank2:前端|Web|网页,\n';
    const example5 = 'SHORT_ANSWER,请简述HTTPS的工作原理。,,,,网络安全,,HTTPS通过SSL/TLS协议对HTTP通信进行加密。客户端与服务器建立连接时会进行握手，交换密钥，之后的数据传输都经过加密处理，确保数据的机密性和完整性。\n';
    
    const instructions = '\n# 导入说明：\n' +
      '# 1. 题型：SINGLE(单选) / MULTIPLE(多选) / JUDGE(判断) / FILL_IN_BLANK(填空) / SHORT_ANSWER(简答)\n' +
      '# 2. 题干：如包含逗号或引号，请用英文双引号包裹整个题干\n' +
      '# 3. 选项：用竖线|分隔，支持2-8个选项；判断题/填空题/简答题可留空\n' +
      '# 4. 答案：单选填A/B/C等，多选填ABC等（无需分隔），判断题A=正确/B=错误；填空题/简答题可留空\n' +
      '# 5. 解析：选填，如包含逗号请用双引号包裹\n' +
      '# 6. 单元/章节：选填，用于分类和筛选题目\n' +
      '# 7. 填空配置：仅填空题需要，格式：blank1:答案1|答案2;blank2:答案3（多个空白用分号分隔）\n' +
      '# 8. 简答参考答案：仅简答题需要，用于AI评分参考\n' +
      '# 9. 特殊字符：题干或解析中如有逗号、引号等，请用双引号包裹该字段\n\n';
    
    const blob = new Blob([`\uFEFF${instructions}${headers}${example1}${example2}${example3}${example4}${example5}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "题目导入模板_完整版.csv";
    link.click();
  };
  
  // 下载Excel模板
  const downloadExcelTemplate = () => {
    const headers = ['题型', '题干', '选项', '答案', '解析', '单元/章节', '填空配置', '简答参考答案'];
    
    const examples = [
      ['SINGLE', '下列哪个协议用于加密网页传输？', 'HTTP|FTP|HTTPS|SMTP', 'C', 'HTTPS是HTTP的安全版本', '第一章', '', ''],
      ['JUDGE', '防火墙主要用于监控和过滤进出网络的数据包。', '', 'A', '防火墙是网络安全的第一道防线', '网络基础', '', ''],
      ['MULTIPLE', '发现账号被盗应采取哪些措施？(多选)', '立即修改密码|通知银行|告知好友|举报异常', 'ABCD', '这些都是减少损失的重要步骤', '第二章', '', ''],
      ['FILL_IN_BLANK', 'JavaScript是一种{{blank1}}语言，常用于{{blank2}}开发。', '', '', '', '模块1', 'blank1:脚本|编程|动态;blank2:前端|Web|网页', ''],
      ['SHORT_ANSWER', '请简述HTTPS的工作原理。', '', '', '', '网络安全', '', 'HTTPS通过SSL/TLS协议对HTTP通信进行加密。客户端与服务器建立连接时会进行握手，交换密钥，之后的数据传输都经过加密处理，确保数据的机密性和完整性。']
    ];
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...examples];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 15 },  // 题型
      { wch: 50 },  // 题干
      { wch: 40 },  // 选项
      { wch: 10 },  // 答案
      { wch: 40 },  // 解析
      { wch: 15 },  // 单元/章节
      { wch: 40 },  // 填空配置
      { wch: 50 }   // 简答参考答案
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '题目列表');
    
    // 添加说明工作表
    const instructions = [
      ['题目导入说明'],
      [''],
      ['1. 题型说明'],
      ['SINGLE', '单选题', '需要填写选项和答案（A/B/C等）'],
      ['MULTIPLE', '多选题', '需要填写选项和答案（ABC等，无需分隔）'],
      ['JUDGE', '判断题', '选项可留空，答案填A（正确）或B（错误）'],
      ['FILL_IN_BLANK', '填空题', '需要在题干中使用{{blank1}}、{{blank2}}标记，并填写填空配置'],
      ['SHORT_ANSWER', '简答题', '需要填写参考答案，用于AI评分参考'],
      [''],
      ['2. 字段说明'],
      ['题干', '题目内容，支持富文本（导入后可在编辑器中添加图片）'],
      ['选项', '用竖线|分隔，如：选项A|选项B|选项C（支持2-8个选项）'],
      ['答案', '单选填A/B/C等，多选填ABC等'],
      ['解析', '选填，题目的详细解析'],
      ['单元/章节', '选填，用于分类和筛选题目'],
      ['填空配置', '仅填空题需要，格式：blank1:答案1|答案2;blank2:答案3'],
      ['简答参考答案', '仅简答题需要，用于AI评分参考'],
      [''],
      ['3. 注意事项'],
      ['• Excel格式会自动处理特殊字符，无需手动添加引号'],
      ['• 以#开头的行会被视为注释，导入时自动跳过'],
      ['• 空行会被自动过滤'],
      ['• 系统会自动验证格式并提示错误行'],
      ['• 只有格式正确的题目会被导入']
    ];
    
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, '导入说明');
    
    // 导出Excel文件
    XLSX.writeFile(wb, '题目导入模板.xlsx');
  };

  const downloadTemplate = downloadCSVTemplate;

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-800">题库管理</h2>
              <p className="text-xs text-gray-400 font-medium">资源分类展示与快捷分值设定</p>
            </div>
            <button onClick={() => { setEditingBankId(null); setBankForm({ name: '', category: '', level: '初级', description: '' }); setIsBankModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">创建新题库</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map(bank => (
              <div key={bank.id} className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black">{bank.name[0]}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingBankId(bank.id); 
                        setBankForm({ 
                          name: bank.name, 
                          category: bank.category, 
                          level: bank.level, 
                          description: bank.description 
                        }); 
                        setIsBankModalOpen(true); 
                      }} 
                      className="p-1.5 text-gray-300 hover:text-indigo-600 transition-colors" 
                      title="编辑题库信息"
                    >
                      <i className="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button onClick={() => { setEditingBankId(bank.id); setScoreForm(bank.scoreConfig); setIsScoreModalOpen(true); }} className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 uppercase hover:bg-amber-100 transition-colors">分值配置</button>
                    <button 
                      onClick={() => { 
                        const questionCount = bank.questionCount || 0;
                        const message = questionCount > 0 
                          ? `确定要删除题库"${bank.name}"吗？\n\n⚠️ 警告：此操作将同时删除该题库内的 ${questionCount} 道题目，且无法恢复！` 
                          : `确定要删除题库"${bank.name}"吗？`;
                        if(confirm(message)) onDelete(bank.id); 
                      }} 
                      className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                      title="删除题库"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-2">{bank.name}</h3>
                <div className="flex gap-2 mb-3">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold">{bank.category || '未分类'}</span>
                  <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-lg font-bold">{bank.level || '初级'}</span>
                </div>
                {bank.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{bank.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">单选:{bank.scoreConfig?.[QuestionType.SINGLE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">多选:{bank.scoreConfig?.[QuestionType.MULTIPLE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">判断:{bank.scoreConfig?.[QuestionType.JUDGE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">填空:{bank.scoreConfig?.[QuestionType.FILL_IN_BLANK] || 3}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">简答:{bank.scoreConfig?.[QuestionType.SHORT_ANSWER] || 5}分</span>
                </div>
                <div className="mt-auto flex justify-between items-center border-t border-dashed pt-5">
                  <div className="text-center">
                    <div className="text-xl font-black text-indigo-600">{bank.questionCount}</div>
                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">总题目数</div>
                  </div>
                  <button onClick={() => { setEditingBankId(bank.id); setView('editor'); setCurrentPage(1); }} className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-black active:scale-95 transition-all">内容管理 &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl border shadow-sm gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button onClick={() => { setView('list'); setDuplicateIds([]); }} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors active:scale-90" title="返回题库列表">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-lg font-black truncate max-w-[250px]">{editingBank?.name}</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border mr-2">
                 {duplicateIds.length > 0 ? (
                   <div className="flex items-center gap-2 px-3">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 animate-pulse">发现 {duplicateIds.length} 个重复项</span>
                      <button onClick={handleClearDuplicates} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-rose-700">清理</button>
                   </div>
                 ) : (
                   <button onClick={handleCheckDuplicates} disabled={isChecking} className="text-gray-500 hover:text-indigo-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                     {isChecking ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
                     查重
                   </button>
                 )}
              </div>
              <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all">批量导入</button>
              <button onClick={() => { 
                setEditingQuestion({ 
                  type: QuestionType.SINGLE, 
                  options: ['', '', '', ''], 
                  answer: 'A', 
                  content: '',
                  blanks: [],
                  referenceAnswer: '',
                  aiGradingEnabled: false,
                  tags: []
                }); 
                setIsQuestionModalOpen(true); 
              }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg">新增题目</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="bg-white p-6 rounded-3xl border shadow-sm h-fit space-y-4">
               <input className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-indigo-100 font-bold" placeholder="搜索关键词..." value={qSearch} onChange={e => { setQSearch(e.target.value); setCurrentPage(1); }} />
               <select className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-black border-none" value={qTypeFilter} onChange={e => { setQTypeFilter(e.target.value); setCurrentPage(1); }}>
                 <option value="ALL">全部题型</option>
                 <option value={QuestionType.SINGLE}>单选题</option>
                 <option value={QuestionType.MULTIPLE}>多选题</option>
                 <option value={QuestionType.JUDGE}>判断题</option>
                 <option value={QuestionType.FILL_IN_BLANK}>填空题</option>
                 <option value={QuestionType.SHORT_ANSWER}>简答题</option>
               </select>
               
               {/* 单元/章节多选筛选器 */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">单元/章节筛选</label>
                 {availableChapters.length > 0 ? (
                   <>
                     <div className="bg-gray-50 rounded-xl p-3 max-h-64 overflow-y-auto space-y-2">
                       {availableChapters.map(chapter => {
                         const chapterQuestionCount = bankQuestions.filter(q => q.chapter === chapter).length;
                         return (
                           <div key={chapter} className="flex items-center gap-2 hover:bg-white p-2 rounded-lg transition-colors group/chapter">
                             <label className="flex items-center gap-2 cursor-pointer flex-1">
                               <input 
                                 type="checkbox" 
                                 className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                 checked={qChapterFilter.includes(chapter)}
                                 onChange={e => {
                                   if (e.target.checked) {
                                     setQChapterFilter([...qChapterFilter, chapter]);
                                   } else {
                                     setQChapterFilter(qChapterFilter.filter(c => c !== chapter));
                                   }
                                   setCurrentPage(1);
                                 }}
                               />
                               <span className="text-xs font-bold text-gray-700 flex-1">{chapter}</span>
                               <span className="text-[10px] text-gray-400 font-medium">({chapterQuestionCount})</span>
                             </label>
                             <button
                               onClick={() => {
                                 if (confirm(`确定要删除"${chapter}"章节下的所有 ${chapterQuestionCount} 道题目吗？\n\n⚠️ 此操作不可恢复！`)) {
                                   const chapterQuestionIds = bankQuestions
                                     .filter(q => q.chapter === chapter)
                                     .map(q => q.id);
                                   onDeleteQuestions(editingBankId!, chapterQuestionIds);
                                   // 清除该章节的筛选
                                   setQChapterFilter(qChapterFilter.filter(c => c !== chapter));
                                 }
                               }}
                               className="opacity-0 group-hover/chapter:opacity-100 transition-opacity p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                               title={`删除"${chapter}"章节的所有题目`}
                             >
                               <i className="fa-solid fa-trash-can text-xs"></i>
                             </button>
                           </div>
                         );
                       })}
                     </div>
                     {qChapterFilter.length > 0 && (
                       <button 
                         onClick={() => { setQChapterFilter([]); setCurrentPage(1); }}
                         className="text-[10px] font-black text-rose-500 hover:underline w-full text-center"
                       >
                         清除筛选 ({qChapterFilter.length})
                       </button>
                     )}
                   </>
                 ) : (
                   <div className="bg-gray-50 rounded-xl p-4 text-center">
                     <i className="fa-solid fa-book-open text-gray-300 text-2xl mb-2"></i>
                     <p className="text-[10px] text-gray-400 font-medium">暂无章节数据</p>
                     <p className="text-[9px] text-gray-300 mt-1">添加题目时可设置章节</p>
                   </div>
                 )}
               </div>
            </aside>
            <div className="md:col-span-3 flex flex-col space-y-4">
              <div className="bg-white rounded-3xl border shadow-sm divide-y overflow-hidden">
                {paginatedQuestions.map((q, i) => {
                  const isDup = duplicateIds.includes(q.id);
                  return (
                    <div key={q.id} className={`p-6 transition-all flex justify-between group ${isDup ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : 'hover:bg-gray-50/50'}`}>
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black">#{(currentPage-1)*pageSize+i+1}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{q.type}</span>
                          {q.chapter && (
                            <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded border border-purple-200">
                              <i className="fa-solid fa-book-open text-[8px] mr-1"></i>
                              {q.chapter}
                            </span>
                          )}
                          {isDup && <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-rose-200">重复标记</span>}
                          {q.type === QuestionType.FILL_IN_BLANK && q.blanks && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded border border-amber-200">{q.blanks.length}个空白</span>
                          )}
                          {q.type === QuestionType.SHORT_ANSWER && q.aiGradingEnabled && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200">AI评分</span>
                          )}
                        </div>
                        <div className="font-bold text-gray-800 leading-relaxed">
                          <RichTextDisplay content={q.content} className="line-clamp-3" />
                        </div>
                        {q.type !== QuestionType.FILL_IN_BLANK && q.type !== QuestionType.SHORT_ANSWER && (
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt, idx) => (
                              <span key={idx} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-500 font-medium">{String.fromCharCode(65+idx)}. {opt}</span>
                            ))}
                          </div>
                        )}
                        {q.type === QuestionType.FILL_IN_BLANK && q.blanks && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">空白答案：</span>
                            {q.blanks.map((blank, idx) => (
                              <span key={blank.id} className="ml-2">
                                {blank.id}: {blank.acceptedAnswers.slice(0, 2).join(', ')}
                                {blank.acceptedAnswers.length > 2 && '...'}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.type === QuestionType.SHORT_ANSWER && q.referenceAnswer && (
                          <div className="text-xs text-gray-500 line-clamp-2">
                            <span className="font-medium">参考答案：</span>
                            {q.referenceAnswer}
                          </div>
                        )}
                        {/* 标签显示 */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {q.tags.slice(0, 5).map((tagId, idx) => {
                              const tag = getTagById(tagId);
                              return tag ? (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold text-white"
                                  style={{ backgroundColor: tag.color || '#6366f1' }}
                                >
                                  <i className="fa-solid fa-tag text-[8px] mr-1"></i>
                                  {tag.name}
                                </span>
                              ) : (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-400"
                                >
                                  <i className="fa-solid fa-tag text-[8px] mr-1"></i>
                                  {tagId}
                                </span>
                              );
                            })}
                            {q.tags.length > 5 && (
                              <span className="text-[10px] text-gray-400 font-medium">+{q.tags.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start ml-4">
                        <button onClick={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                        <button onClick={() => onDeleteQuestion(q.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    </div>
                  );
                })}
                {paginatedQuestions.length === 0 && (
                  <div className="py-20 text-center text-gray-300 italic">暂无题目内容</div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-gray-400">共 {filteredQuestions.length} 题，第 {currentPage} / {totalPages} 页</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) < 2)
                      .map((p, i, arr) => {
                        const showDots = i > 0 && p - arr[i-1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showDots && <span className="text-gray-300 self-center px-1">...</span>}
                            <button 
                              onClick={() => setCurrentPage(p)}
                              className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">{editingBankId ? '修改题库信息' : '创建新题库'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题库名称</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.name} onChange={e => setBankForm({...bankForm, name: e.target.value})} placeholder="例如：2024网络安全基础" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">所属分类</label>
                  <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.category} onChange={e => setBankForm({...bankForm, category: e.target.value})} placeholder="例如：IT技术" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">等级</label>
                  <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.level || ''} onChange={e => setBankForm({...bankForm, level: e.target.value})} placeholder="例如：初级" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题库描述</label>
                <textarea className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none h-24" value={bankForm.description} onChange={e => setBankForm({...bankForm, description: e.target.value})} placeholder="简要介绍题库考核范围..." />
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button onClick={() => setIsBankModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button onClick={handleBankSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">确认保存</button>
            </div>
          </div>
        </div>
      )}

      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleQuestionSave} className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black mb-6">{editingQuestion?.id ? '编辑题目' : '新增题目'}</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题目类型</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={editingQuestion?.type} onChange={e => setEditingQuestion({...editingQuestion, type: e.target.value as QuestionType})}>
                    <option value={QuestionType.SINGLE}>单选题</option>
                    <option value={QuestionType.MULTIPLE}>多选题</option>
                    <option value={QuestionType.JUDGE}>判断题</option>
                    <option value={QuestionType.FILL_IN_BLANK}>填空题</option>
                    <option value={QuestionType.SHORT_ANSWER}>简答题</option>
                  </select>
                </div>
                {editingQuestion?.type !== QuestionType.FILL_IN_BLANK && editingQuestion?.type !== QuestionType.SHORT_ANSWER && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">正确答案</label>
                    <input 
                      className="w-full bg-indigo-50 text-indigo-600 border-none rounded-2xl px-5 py-3.5 font-black outline-none" 
                      placeholder={editingQuestion?.type === QuestionType.JUDGE ? "A(正确) 或 B(错误)" : "如: A 或 ABC"} 
                      value={Array.isArray(editingQuestion?.answer) ? editingQuestion?.answer.join('') : editingQuestion?.answer} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setEditingQuestion({
                          ...editingQuestion, 
                          answer: editingQuestion?.type === QuestionType.MULTIPLE ? val.split('') : val
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 单元/章节输入框 */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">
                  单元/章节 (选填)
                  <span className="text-gray-300 ml-2 normal-case font-medium">用于分类和筛选题目</span>
                </label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" 
                  value={editingQuestion?.chapter || ''} 
                  onChange={e => setEditingQuestion({...editingQuestion, chapter: e.target.value})} 
                  placeholder="例如：第一章、网络基础、模块1..." 
                  list="chapter-suggestions"
                />
                {availableChapters.length > 0 && (
                  <datalist id="chapter-suggestions">
                    {availableChapters.map(chapter => (
                      <option key={chapter} value={chapter} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                  题目正文
                  <span className="text-indigo-500 ml-2 normal-case font-medium">支持插入图片</span>
                </label>
                <RichTextEditor
                  value={editingQuestion?.content || ''}
                  onChange={(value) => setEditingQuestion({...editingQuestion, content: value})}
                  placeholder="输入题目内容，可插入图片..."
                />
              </div>

              {/* 填空题配置 */}
              {editingQuestion?.type === QuestionType.FILL_IN_BLANK && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      填空配置
                      <span className="text-gray-300 ml-2 normal-case font-medium">在题干中使用 {'{{'} blank1 {'}}'}, {'{{'} blank2 {'}}'} 等标记空白位置</span>
                    </label>
                    {editingQuestion?.blanks?.map((blank, idx) => (
                      <div key={blank.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-indigo-600">空白 #{idx + 1} ({blank.id})</span>
                          {editingQuestion.blanks!.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setEditingQuestion({
                                ...editingQuestion, 
                                blanks: editingQuestion.blanks!.filter((_, i) => i !== idx)
                              })} 
                              className="text-rose-400 hover:text-rose-600 text-xs"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                        <label className="text-[9px] font-bold text-gray-400 block mb-1 ml-1">可接受的答案（每行一个）</label>
                        <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 h-20" 
                          value={blank.acceptedAnswers.join('\n')}
                          onChange={e => {
                            const newBlanks = [...editingQuestion.blanks!];
                            newBlanks[idx] = {
                              ...blank,
                              acceptedAnswers: e.target.value.split('\n').filter(a => a.trim())
                            };
                            setEditingQuestion({...editingQuestion, blanks: newBlanks});
                          }}
                          placeholder="例如：&#10;JavaScript&#10;JS&#10;javascript"
                        />
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={blank.caseSensitive || false}
                              onChange={e => {
                                const newBlanks = [...editingQuestion.blanks!];
                                newBlanks[idx] = {...blank, caseSensitive: e.target.checked};
                                setEditingQuestion({...editingQuestion, blanks: newBlanks});
                              }}
                              className="rounded"
                            />
                            区分大小写
                          </label>
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => {
                        const nextId = `blank${(editingQuestion.blanks?.length || 0) + 1}`;
                        setEditingQuestion({
                          ...editingQuestion, 
                          blanks: [
                            ...(editingQuestion.blanks || []),
                            {
                              id: nextId,
                              position: editingQuestion.blanks?.length || 0,
                              acceptedAnswers: [],
                              caseSensitive: false
                            }
                          ]
                        });
                      }}
                      className="text-xs font-black text-indigo-600 hover:underline"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> 添加空白
                    </button>
                  </div>
                </div>
              )}

              {/* 简答题配置 */}
              {editingQuestion?.type === QuestionType.SHORT_ANSWER && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      参考答案
                      <span className="text-indigo-500 ml-2 normal-case font-medium">支持插入图片</span>
                    </label>
                    <RichTextEditor
                      value={editingQuestion?.referenceAnswer || ''}
                      onChange={(value) => setEditingQuestion({...editingQuestion, referenceAnswer: value})}
                      placeholder="输入参考答案，用于AI评分参考，可插入图片..."
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingQuestion?.aiGradingEnabled || false}
                        onChange={e => setEditingQuestion({...editingQuestion, aiGradingEnabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-sm font-bold text-gray-700">启用AI自动评分</span>
                    </label>
                    <p className="text-[10px] text-gray-400 font-medium italic mt-1 ml-8">启用后，学员可以使用AI评分功能获得即时反馈</p>
                  </div>
                </div>
              )}

              {editingQuestion?.type === QuestionType.JUDGE ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">判断选项展示</label>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-indigo-100">A</div>
                        <span className="font-black text-indigo-700">正确</span>
                     </div>
                     <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center font-black shrink-0">B</div>
                        <span className="font-black text-gray-500">错误</span>
                     </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic mt-1 ml-1">* 判断题选项已固定为“正确/错误”，无需手动输入。</p>
                </div>
              ) : editingQuestion?.type !== QuestionType.FILL_IN_BLANK && editingQuestion?.type !== QuestionType.SHORT_ANSWER ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">候选项配置</label>
                  {editingQuestion?.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black shrink-0">{String.fromCharCode(65+idx)}</div>
                      <input 
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 font-bold outline-none" 
                        value={opt} 
                        onChange={e => {
                          const nextOpts = [...(editingQuestion.options || [])];
                          nextOpts[idx] = e.target.value;
                          setEditingQuestion({...editingQuestion, options: nextOpts});
                        }}
                      />
                      {editingQuestion.options!.length > 2 && (
                        <button type="button" onClick={() => setEditingQuestion({...editingQuestion, options: editingQuestion.options!.filter((_, i) => i !== idx)})} className="text-rose-300 hover:text-rose-500"><i className="fa-solid fa-circle-minus"></i></button>
                      )}
                    </div>
                  ))}
                  {editingQuestion?.options && editingQuestion.options.length < 8 && (
                    <button type="button" onClick={() => setEditingQuestion({...editingQuestion, options: [...editingQuestion.options!, '']})} className="text-xs font-black text-indigo-600 hover:underline"><i className="fa-solid fa-plus mr-1"></i> 添加选项</button>
                  )}
                </div>
              ) : null}

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                  专家解析 (选填)
                  <span className="text-indigo-500 ml-2 normal-case font-medium">支持插入图片</span>
                </label>
                <RichTextEditor
                  value={editingQuestion?.explanation || ''}
                  onChange={(value) => setEditingQuestion({...editingQuestion, explanation: value})}
                  placeholder="输入题目解析，可插入图片..."
                />
              </div>

              {/* 标签选择器 */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">题目标签 (选填)</label>
                <TagSelector
                  selectedTagIds={editingQuestion?.tags || []}
                  onChange={(tagIds) => setEditingQuestion({...editingQuestion, tags: tagIds})}
                  allowCreate={true}
                  placeholder="搜索或创建标签..."
                />
                <p className="text-[10px] text-gray-400 font-medium italic mt-2 ml-1">* 标签可用于分类和筛选题目</p>
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">确认保存题目</button>
            </div>
          </form>
        </div>
      )}

      {isScoreModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6">题库分值设置</h3>
            <div className="space-y-5">
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">单选题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.SINGLE] || 2} onChange={e => setScoreForm({...scoreForm, [QuestionType.SINGLE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">多选题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.MULTIPLE] || 4} onChange={e => setScoreForm({...scoreForm, [QuestionType.MULTIPLE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">判断题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.JUDGE] || 1} onChange={e => setScoreForm({...scoreForm, [QuestionType.JUDGE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">填空题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.FILL_IN_BLANK] || 3} onChange={e => setScoreForm({...scoreForm, [QuestionType.FILL_IN_BLANK]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">简答题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.SHORT_ANSWER] || 5} onChange={e => setScoreForm({...scoreForm, [QuestionType.SHORT_ANSWER]: Number(e.target.value)})} />
               </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button onClick={() => setIsScoreModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold">取消</button>
              <button onClick={() => { onUpdateScore(editingBankId!, scoreForm); setIsScoreModalOpen(false); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">保存分值</button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">批量导入题目</h3>
            <p className="text-xs text-gray-400 mb-8 font-medium">支持 Excel 和 CSV 两种格式，请按照模板格式进行题目编撰后再上传。</p>
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition-colors group"
              >
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-indigo-400 mb-4 group-hover:scale-110 transition-transform"></i>
                <div className="text-sm font-bold text-indigo-600">点击此处上传题目文件</div>
                <div className="text-[10px] text-gray-400 mt-2">支持 Excel (.xlsx, .xls) 和 CSV 格式</div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileImport} />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">填写规范说明</h4>
                <ul className="text-[11px] text-amber-700/80 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>题型标识符: <strong>SINGLE</strong>(单选), <strong>MULTIPLE</strong>(多选), <strong>JUDGE</strong>(判断), <strong>FILL_IN_BLANK</strong>(填空), <strong>SHORT_ANSWER</strong>(简答)</li>
                  <li>选项分隔符: 使用英文半角 <strong>|</strong> 分隔，支持 <strong>2-8个</strong> 选项</li>
                  <li>答案规范: 单选填A/B/C等，多选填ABC等（无需分隔符）</li>
                  <li>判断题: 选项可留空，答案 <strong>A</strong>=正确，<strong>B</strong>=错误</li>
                  <li>填空题: 在题干中使用 <strong>{'{{'} blank1 {'}}'}</strong> 标记，填空配置格式：<strong>blank1:答案1|答案2;blank2:答案3</strong></li>
                  <li>简答题: 需填写参考答案，用于AI评分参考</li>
                  <li>单元/章节: 选填，用于分类和筛选题目</li>
                  <li><strong>Excel格式</strong>会自动处理特殊字符；<strong>CSV格式</strong>中如有逗号、引号，请用英文双引号包裹该字段</li>
                  <li>系统会自动验证格式并提示错误行，只导入有效题目</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={downloadExcelTemplate}
                  className="py-4 border-2 border-indigo-100 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-file-excel"></i> Excel 模板
                </button>
                <button 
                  onClick={downloadCSVTemplate}
                  className="py-4 border-2 border-gray-100 text-gray-500 rounded-2xl text-xs font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-file-csv"></i> CSV 模板
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankManager;
