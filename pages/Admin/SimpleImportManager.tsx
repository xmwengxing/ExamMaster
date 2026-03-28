/**
 * 简化版导入管理页面
 * 功能：选择题库 -> 上传JSON -> 预览 -> 导入 -> 可撤销
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Select,
  Upload,
  message,
  Table,
  Modal,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Descriptions,
  Typography
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;
const { Dragger } = Upload;

// 清理内容中的Base64图片编码，用于预览显示
const cleanContentForPreview = (content: string): string => {
  if (!content) return content;
  
  // 替换Base64图片为简单标识
  const pattern = /<img\s+src=['"]data:image\/[^;]+;base64,[^'"]+['"](?:\s+[^>]*)?\s*\/?>/g;
  let cleaned = content.replace(pattern, '[图片]');
  
  // 如果内容过长，截断显示
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200) + '...';
  }
  
  return cleaned;
};

interface Bank {
  id: string;
  name: string;
}

interface Question {
  content: string;
  type: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
}

interface ImportRecord {
  id: string;
  bankId: string;
  bankName: string;
  fileName: string;
  questionCount: number;
  importedAt: string;
  questionIds: string[];
}

export default function SimpleImportManager() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  // 生成预览数据：每种题型各5题
  const previewQuestions = React.useMemo(() => {
    const questionsByType: Record<string, Question[]> = {
      'SINGLE': [],
      'MULTIPLE': [],
      'JUDGE': [],
      'FILL_IN_BLANK': [],
      'SHORT_ANSWER': []
    };

    questions.forEach(q => {
      if (questionsByType[q.type]) {
        questionsByType[q.type].push(q);
      }
    });

    const preview: Question[] = [];
    Object.entries(questionsByType).forEach(([type, list]) => {
      const count = Math.min(5, list.length);
      if (count > 0) {
        preview.push(...list.slice(0, count));
      }
    });

    return preview;
  }, [questions]);

  // 加载题库列表
  useEffect(() => {
    loadBanks();
    loadImportHistory();
  }, []);

  const loadBanks = async () => {
    try {
      const token = localStorage.getItem('edu_token');
      const response = await fetch('/api/banks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBanks(data || []);
    } catch (error) {
      console.error('加载题库失败:', error);
      message.error('加载题库列表失败');
    }
  };

  const loadImportHistory = () => {
    // 从localStorage加载导入历史
    const history = localStorage.getItem('import_history');
    if (history) {
      setImportRecords(JSON.parse(history));
    }
  };

  const saveImportHistory = (record: ImportRecord) => {
    const history = [...importRecords, record];
    setImportRecords(history);
    localStorage.setItem('import_history', JSON.stringify(history));
  };

  // 处理文件选择
  const handleFileChange = async (file: File) => {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // 提取题目数据
      let questionList: Question[] = [];
      if (Array.isArray(jsonData)) {
        questionList = jsonData;
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        questionList = jsonData.questions;
      } else {
        throw new Error('JSON格式错误：未找到题目数据');
      }

      if (questionList.length === 0) {
        throw new Error('文件中没有题目数据');
      }

      // 标准化题型
      const normalizedQuestions = questionList.map(q => ({
        ...q,
        type: normalizeType(q.type)
      }));

      // 按题型分类统计
      const questionsByType: Record<string, Question[]> = {
        'SINGLE': [],
        'MULTIPLE': [],
        'JUDGE': [],
        'FILL_IN_BLANK': [],
        'SHORT_ANSWER': []
      };

      normalizedQuestions.forEach(q => {
        if (questionsByType[q.type]) {
          questionsByType[q.type].push(q);
        }
      });

      // 生成统计信息（显示所有题型，包括0题的）
      let statsMsg = `成功解析 ${normalizedQuestions.length} 道题目\n\n题型统计：`;
      ['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL_IN_BLANK', 'SHORT_ANSWER'].forEach(type => {
        const count = questionsByType[type]?.length || 0;
        statsMsg += `\n  ${getTypeName(type)}: ${count} 题`;
      });

      // 预览：每种题型各取5题
      const previewQuestions: Question[] = [];
      let previewInfo = '\n\n预览（每种题型最多5题）：';
      ['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL_IN_BLANK', 'SHORT_ANSWER'].forEach(type => {
        const list = questionsByType[type] || [];
        const count = Math.min(5, list.length);
        if (count > 0) {
          previewQuestions.push(...list.slice(0, count));
          previewInfo += `\n  ${getTypeName(type)}: 预览 ${count} 题`;
        }
      });

      if (previewQuestions.length < normalizedQuestions.length) {
        statsMsg += previewInfo;
      }

      setQuestions(normalizedQuestions); // 保存完整题目列表用于导入
      setFileList([file as any]);
      message.success(statsMsg, 5);
      setPreviewVisible(true);
    } catch (error: any) {
      message.error('文件解析失败: ' + error.message);
      setFileList([]);
      setQuestions([]);
    }
  };

  // 标准化题型
  const normalizeType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'single': 'SINGLE',
      'multiple': 'MULTIPLE',
      'judge': 'JUDGE',
      'fill': 'FILL_IN_BLANK',
      'fill_in_blank': 'FILL_IN_BLANK',
      'essay': 'SHORT_ANSWER',
      'short_answer': 'SHORT_ANSWER'
    };
    return typeMap[type?.toLowerCase()] || type?.toUpperCase() || 'SINGLE';
  };

  // 获取题型中文名
  const getTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'SINGLE': '单选题',
      'MULTIPLE': '多选题',
      'JUDGE': '判断题',
      'FILL_IN_BLANK': '填空题',
      'SHORT_ANSWER': '简答题'
    };
    return names[type] || type;
  };

  // 执行导入
  const handleImport = async () => {
    if (!selectedBankId) {
      message.error('请选择目标题库');
      return;
    }

    if (questions.length === 0) {
      message.error('没有可导入的题目');
      return;
    }

    setImporting(true);

    try {
      const token = localStorage.getItem('edu_token');
      
      // 转换为API需要的格式
      const formattedQuestions = questions.map(q => ({
        type: q.type,
        content: q.content,
        options: q.options ? q.options.join('|') : '',
        answer: q.answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 1,
        tags: q.tags || []
      }));

      const response = await fetch(`/api/banks/${selectedBankId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questions: formattedQuestions })
      });

      const result = await response.json();

      if (response.ok) {
        const bank = banks.find(b => b.id === selectedBankId);
        
        // 保存导入记录
        const record: ImportRecord = {
          id: Date.now().toString(),
          bankId: selectedBankId,
          bankName: bank?.name || '未知题库',
          fileName: fileList[0]?.name || '未知文件',
          questionCount: result.inserted || questions.length,
          importedAt: new Date().toISOString(),
          questionIds: result.questionIds || []
        };
        saveImportHistory(record);

        message.success(`成功导入 ${result.inserted} 道题目！`);
        
        // 清空状态
        setFileList([]);
        setQuestions([]);
        setPreviewVisible(false);
        setSelectedBankId('');
      } else {
        throw new Error(result.error || '导入失败');
      }
    } catch (error: any) {
      console.error('导入失败:', error);
      message.error('导入失败: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 撤销导入
  const handleRollback = async (record: ImportRecord) => {
    try {
      const token = localStorage.getItem('edu_token');
      
      // 批量删除题目
      const response = await fetch('/api/questions/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          bankId: record.bankId,
          ids: record.questionIds 
        })
      });

      if (response.ok) {
        message.success('已撤销导入');
        
        // 从历史记录中移除
        const newRecords = importRecords.filter(r => r.id !== record.id);
        setImportRecords(newRecords);
        localStorage.setItem('import_history', JSON.stringify(newRecords));
      } else {
        throw new Error('撤销失败');
      }
    } catch (error: any) {
      message.error('撤销失败: ' + error.message);
    }
  };

  // 预览表格列
  const previewColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="blue">{getTypeName(type)}</Tag>
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => {
        const cleaned = cleanContentForPreview(text);
        return <Text ellipsis={{ tooltip: cleaned }}>{cleaned}</Text>;
      }
    },
    {
      title: '答案',
      dataIndex: 'answer',
      key: 'answer',
      width: 100,
      render: (text: string) => {
        const cleaned = cleanContentForPreview(text);
        return <Text ellipsis={{ tooltip: cleaned }}>{cleaned}</Text>;
      }
    }
  ];

  // 历史记录表格列
  const historyColumns = [
    {
      title: '导入时间',
      dataIndex: 'importedAt',
      key: 'importedAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '题库',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 150
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true
    },
    {
      title: '题目数量',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 100,
      render: (count: number) => <Tag color="green">{count} 题</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ImportRecord) => (
        <Popconfirm
          title="确定要撤销这次导入吗？"
          description="将删除本次导入的所有题目，此操作不可恢复！"
          onConfirm={() => handleRollback(record)}
          okText="确定撤销"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            撤销导入
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>题库导入</Title>
              <Text type="secondary">上传JSON文件，批量导入题目到指定题库</Text>
            </div>
            <Button onClick={() => setHistoryVisible(true)}>
              导入历史
            </Button>
          </Space>
        </Card>

        {/* 导入步骤 */}
        <Card title="导入步骤">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 步骤1: 选择题库 */}
            <div>
              <Title level={5}>1. 选择目标题库</Title>
              <Select
                style={{ width: '100%', maxWidth: 400 }}
                placeholder="请选择要导入到的题库"
                value={selectedBankId}
                onChange={setSelectedBankId}
                options={banks.map(bank => ({
                  label: bank.name,
                  value: bank.id
                }))}
              />
            </div>

            {/* 步骤2: 上传文件 */}
            <div>
              <Title level={5}>2. 上传JSON文件</Title>
              <Dragger
                fileList={fileList}
                beforeUpload={(file) => {
                  if (!file.name.endsWith('.json')) {
                    message.error('只支持JSON格式文件');
                    return Upload.LIST_IGNORE;
                  }
                  handleFileChange(file);
                  return false;
                }}
                onRemove={() => {
                  setFileList([]);
                  setQuestions([]);
                }}
                maxCount={1}
                accept=".json"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽JSON文件到此区域</p>
                <p className="ant-upload-hint">
                  支持题库转换工具生成的JSON格式
                </p>
              </Dragger>
            </div>

            {/* 步骤3: 预览和导入 */}
            {questions.length > 0 && (
              <div>
                <Title level={5}>3. 确认导入</Title>
                {!selectedBankId ? (
                  <Alert
                    message="请先选择目标题库"
                    description='在上方"选择目标题库"下拉框中选择要导入到的题库，然后才能开始导入'
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <Alert
                    message={`已解析 ${questions.length} 道题目`}
                    description={`将导入到题库：${banks.find(b => b.id === selectedBankId)?.name || '未知'}`}
                    type="success"
                    showIcon
                    action={
                      <Space>
                        <Button size="small" onClick={() => setPreviewVisible(true)}>
                          预览题目
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={handleImport}
                          loading={importing}
                        >
                          开始导入
                        </Button>
                      </Space>
                    }
                  />
                )}
              </div>
            )}
          </Space>
        </Card>
      </Space>

      {/* 预览对话框 */}
      <Modal
        title={
          <Space>
            <span>预览题目</span>
            <Tag color="blue">共 {questions.length} 题</Tag>
            <Tag color="green">预览 {previewQuestions.length} 题</Tag>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            loading={importing}
            disabled={!selectedBankId}
          >
            确认导入全部 {questions.length} 题
          </Button>
        ]}
      >
        <Alert
          message="预览说明"
          description='为便于快速查看，每种题型最多显示5题。点击"确认导入"将导入全部题目。'
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={previewColumns}
          dataSource={previewQuestions}
          rowKey={(_, index) => index?.toString() || '0'}
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Modal>

      {/* 导入历史对话框 */}
      <Modal
        title="导入历史"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setHistoryVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Alert
          message="提示"
          description="可以撤销最近的导入操作，撤销后将删除本次导入的所有题目"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={historyColumns}
          dataSource={importRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
}
