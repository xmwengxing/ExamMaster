/**
 * 题库转换工具页面
 * 支持Excel和Word格式转换为JSON
 * 使用Ant Design组件实现拖拽上传和文件管理
 */

import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Space, Alert, Statistic, Row, Col, List, Tag, Progress, message } from 'antd';
import { UploadOutlined, InboxOutlined, DownloadOutlined, SyncOutlined, FileExcelOutlined, FileWordOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface ParsedQuestion {
  content: string;
  type: string;
  options?: string[];
  answer: string | string[];
  explanation?: string;
  chapter?: string;
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

interface ConversionMetadata {
  fileName: string;
  totalCount: number;
  parseTime: number;
}

export default function QuestionBankConverter() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [metadata, setMetadata] = useState<ConversionMetadata | null>(null);

  // 配置上传组件属性
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    fileList: fileList,
    accept: '.xlsx,.xls,.docx',
    beforeUpload: (file) => {
      // 验证文件类型
      const isValidType = file.name.endsWith('.xlsx') || 
                          file.name.endsWith('.xls') || 
                          file.name.endsWith('.docx');
      if (!isValidType) {
        message.error('只支持 Excel (.xlsx, .xls) 和 Word (.docx) 格式！');
        return Upload.LIST_IGNORE;
      }

      // 验证文件大小（限制20MB）
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error('文件大小不能超过 20MB！如果文件包含大量图片，请使用本地GUI转换工具。');
        return Upload.LIST_IGNORE;
      }

      // 更新文件列表
      setFileList([file as UploadFile]);
      
      // 清空之前的转换结果
      setQuestions([]);
      setErrors([]);
      setMetadata(null);
      
      // 阻止自动上传
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setQuestions([]);
      setErrors([]);
      setMetadata(null);
    },
  };

  // 处理文件上传和转换
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('文件读取失败');
      return;
    }

    setUploading(true);
    setParseProgress(0);
    setCurrentStage('准备上传...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 模拟进度更新
      setParseProgress(10);
      setCurrentStage('上传文件中...');

      const response = await axios.post('/api/convert/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setParseProgress(10 + percentCompleted);
          }
        }
      });

      setParseProgress(70);
      setCurrentStage('解析文件中...');

      // 模拟解析延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      setParseProgress(90);
      setCurrentStage('验证数据中...');

      if (response.data.success) {
        setQuestions(response.data.data.questions);
        setMetadata(response.data.data.metadata);
        
        setParseProgress(100);
        setCurrentStage('转换完成！');
        
        if (response.data.validation && !response.data.validation.valid) {
          setErrors(response.data.validation.errors);
          message.warning(`转换完成，但发现 ${response.data.validation.errors.length} 个验证错误`);
        } else {
          message.success('文件转换成功！');
        }
      } else {
        setCurrentStage('转换失败');
        message.error('转换失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      setCurrentStage('转换失败');
      setParseProgress(0);
      message.error('上传失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      // 3秒后清除进度信息
      setTimeout(() => {
        if (!uploading) {
          setParseProgress(0);
          setCurrentStage('');
        }
      }, 3000);
    }
  };

  // 下载JSON文件
  const handleDownload = () => {
    if (questions.length === 0) {
      message.warning('没有可下载的数据');
      return;
    }

    const json = {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        totalQuestions: questions.length,
        source: 'web-converter',
        fileName: metadata?.fileName || fileList[0]?.name || 'unknown',
        parseTime: metadata?.parseTime || Date.now()
      },
      questions: questions.map((q, index) => ({
        ...q,
        id: `q-${Date.now()}-${index}`,
        // 标准化题型格式
        type: q.type.toUpperCase()
      }))
    };

    // 生成格式化的JSON字符串
    const jsonString = JSON.stringify(json, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 生成文件名：原文件名_日期.json
    const originalName = fileList[0]?.name?.replace(/\.[^/.]+$/, '') || 'questions';
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${originalName}_${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('JSON文件已下载');
  };

  // 下载为CSV格式（可选功能）
  const handleDownloadCSV = () => {
    if (questions.length === 0) {
      message.warning('没有可下载的数据');
      return;
    }

    // CSV表头
    const headers = ['题型', '题干', '选项', '答案', '解析', '章节'];
    
    // 转换数据为CSV格式
    const csvRows = questions.map(q => {
      const options = q.options ? q.options.join('|') : '';
      const answer = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
      const explanation = q.explanation || '';
      const chapter = q.chapter || '';
      
      // 处理包含逗号和引号的字段
      const escapeCSV = (str: string) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      return [
        q.type,
        escapeCSV(q.content),
        escapeCSV(options),
        answer,
        escapeCSV(explanation),
        chapter
      ].join(',');
    });
    
    // 添加BOM以支持Excel正确显示中文
    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalName = fileList[0]?.name?.replace(/\.[^/.]+$/, '') || 'questions';
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${originalName}_${dateStr}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('CSV文件已下载');
  };

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
    } else if (fileName.endsWith('.docx')) {
      return <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
    }
    return null;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card>
          <Title level={2}>题库格式转换工具</Title>
          <Paragraph type="secondary">
            支持 Excel (.xlsx, .xls) 和 Word (.docx) 格式转换为系统标准 JSON 格式
          </Paragraph>
        </Card>

        {/* 文件上传区域 */}
        <Card title="1. 选择文件">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 Excel (.xlsx, .xls) 和 Word (.docx) 格式，单个文件不超过 20MB
            </p>
            <p className="ant-upload-hint" style={{ color: '#1890ff', marginTop: 8 }}>
              💡 Word文档仅提取文本内容，不包含图片。如需图片，请使用本地"题库转换工具GUI版"
            </p>
          </Dragger>

          {/* 显示已选择的文件信息 */}
          {fileList.length > 0 && fileList[0].originFileObj && (
            <Card 
              style={{ marginTop: 16 }} 
              size="small"
              title={
                <Space>
                  {getFileIcon(fileList[0].name)}
                  <Text strong>已选择文件</Text>
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>文件名: <Text strong>{fileList[0].name}</Text></Text>
                <Text>文件大小: <Text strong>{formatFileSize(fileList[0].size || 0)}</Text></Text>
                <Text>文件类型: <Text strong>{fileList[0].type || '未知'}</Text></Text>
              </Space>
            </Card>
          )}

          {/* 操作按钮 */}
          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleUpload}
              disabled={fileList.length === 0 || uploading}
              loading={uploading}
              size="large"
            >
              {uploading ? '转换中...' : '开始转换'}
            </Button>

            {questions.length > 0 && (
              <>
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  size="large"
                >
                  下载 JSON
                </Button>
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadCSV}
                  size="large"
                >
                  下载 CSV
                </Button>
              </>
            )}
          </Space>

          {/* 解析进度显示 */}
          {uploading && parseProgress > 0 && (
            <Card style={{ marginTop: 16 }} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{currentStage}</Text>
                <Progress 
                  percent={parseProgress} 
                  status={parseProgress === 100 ? 'success' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </Space>
            </Card>
          )}
        </Card>

        {/* 转换结果统计 */}
        {questions.length > 0 && (
          <Card title="2. 转换结果">
            <Row gutter={16}>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="总题目数"
                    value={questions.length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="单选题"
                    value={questions.filter(q => q.type === 'SINGLE' || q.type === 'single').length}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="多选题"
                    value={questions.filter(q => q.type === 'MULTIPLE' || q.type === 'multiple').length}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="判断题"
                    value={questions.filter(q => q.type === 'JUDGE' || q.type === 'judge').length}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="填空题"
                    value={questions.filter(q => q.type === 'FILL_IN_BLANK' || q.type === 'fill').length}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="简答题"
                    value={questions.filter(q => q.type === 'SHORT_ANSWER' || q.type === 'essay').length}
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 题目预览列表 */}
            <Card 
              title="题目预览（前10题）" 
              style={{ marginTop: 16 }}
              bodyStyle={{ maxHeight: 500, overflow: 'auto' }}
            >
              <List
                dataSource={questions.slice(0, 10)}
                renderItem={(question, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#1890ff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={
                        <Space>
                          <Tag color={
                            question.type === 'SINGLE' || question.type === 'single' ? 'green' :
                            question.type === 'MULTIPLE' || question.type === 'multiple' ? 'orange' :
                            question.type === 'JUDGE' || question.type === 'judge' ? 'purple' :
                            'default'
                          }>
                            {question.type === 'SINGLE' || question.type === 'single' ? '单选' :
                             question.type === 'MULTIPLE' || question.type === 'multiple' ? '多选' :
                             question.type === 'JUDGE' || question.type === 'judge' ? '判断' :
                             question.type}
                          </Tag>
                          <Text>{question.content}</Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {question.options && question.options.length > 0 && (
                            <div>
                              {question.options.map((opt, i) => (
                                <div key={i}>
                                  <Text type="secondary">
                                    {String.fromCharCode(65 + i)}. {opt}
                                  </Text>
                                </div>
                              ))}
                            </div>
                          )}
                          <Text type="success">
                            答案: {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Card>
        )}

        {/* 验证错误显示 */}
        {errors.length > 0 && (
          <Card title={
            <Space>
              <Text type="danger" strong>验证错误 ({errors.length})</Text>
            </Space>
          }>
            <Alert
              message="发现数据验证错误"
              description={
                <Space direction="vertical">
                  <Text>共发现 {errors.length} 个错误，请修正后重新上传</Text>
                  <Text type="secondary">
                    提示：您可以下载 CSV 格式，修正错误后重新上传
                  </Text>
                </Space>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {/* 错误统计 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="必填字段错误"
                    value={errors.filter(e => e.field === 'content' || e.field === 'answer').length}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="选项错误"
                    value={errors.filter(e => e.field === 'options').length}
                    valueStyle={{ color: '#d46b08' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="答案格式错误"
                    value={errors.filter(e => e.field === 'answer').length}
                    valueStyle={{ color: '#d4b106' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 错误详情列表 */}
            <List
              dataSource={errors}
              renderItem={(error, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#ff4d4f',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {error.index + 1}
                      </div>
                    }
                    title={
                      <Space>
                        <Tag color="red">{error.field}</Tag>
                        <Text type="danger">{error.message}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {error.value !== undefined && error.value !== null && (
                          <Text type="secondary">
                            当前值: {typeof error.value === 'object' ? JSON.stringify(error.value) : String(error.value)}
                          </Text>
                        )}
                        {error.suggestion && (
                          <Alert
                            message="修正建议"
                            description={error.suggestion}
                            type="info"
                            showIcon
                            icon={<span>💡</span>}
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
              style={{ maxHeight: 400, overflow: 'auto' }}
            />

            {/* 常见错误说明 */}
            <Card 
              title="常见错误及解决方法" 
              size="small" 
              style={{ marginTop: 16 }}
              type="inner"
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>
                  <Text strong>1. 题目内容不能为空：</Text>
                  请确保每道题目都有完整的题干内容
                </Text>
                <Text>
                  <Text strong>2. 选择题至少需要2个选项：</Text>
                  单选题和多选题必须提供至少2个选项，用竖线(|)分隔
                </Text>
                <Text>
                  <Text strong>3. 答案格式错误：</Text>
                  单选题答案为单个字母(A/B/C)，多选题答案为多个字母(ABC)
                </Text>
                <Text>
                  <Text strong>4. 答案超出选项范围：</Text>
                  答案必须在提供的选项范围内，如有4个选项，答案只能是A-D
                </Text>
              </Space>
            </Card>
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="文件要求"
              description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text>📁 <Text strong>文件大小：</Text>不超过 20MB</Text>
                  <Text>🖼️ <Text strong>图片规格：</Text>如果文件包含图片，建议每张图片不超过 500KB，总图片数不超过 50 张</Text>
                  <Text>💡 <Text strong>大文件处理：</Text>如果文件超过 20MB 或包含大量高清图片，请使用本地"题库转换工具GUI版.bat"，支持自动图片压缩</Text>
                </Space>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>支持格式</Text>
              <Space direction="vertical" size="small">
                <Text>✓ <Text strong>Excel (.xlsx, .xls)：</Text>第一行为标题，包含"题型"、"题干"、"选项"、"答案"、"解析"等列</Text>
                <Text>✓ <Text strong>Word (.docx)：</Text>题目按序号排列，选项使用 A、B、C、D 标记</Text>
                <Alert
                  message="Word文档说明"
                  description={
                    <Space direction="vertical" size="small">
                      <Text>• Web版本仅提取<Text strong>纯文本内容</Text>，不包含图片</Text>
                      <Text>• 如果Word文档包含图片，请使用<Text strong>本地GUI工具</Text>，支持图片提取和压缩</Text>
                      <Text>• 适合PDF转Word后的纯文本题库</Text>
                    </Space>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              </Space>
            </div>
            
            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>转换流程</Text>
              <Space direction="vertical" size="small">
                <Text>1️⃣ 上传 Excel 或 Word 文件（不超过 20MB）</Text>
                <Text>2️⃣ 系统自动解析并识别题型</Text>
                <Text>3️⃣ 预览转换结果，检查题目格式</Text>
                <Text>4️⃣ 下载 JSON 文件，用于题库导入</Text>
              </Space>
            </div>
            
            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>本地转换工具优势</Text>
              <Alert
                message="推荐使用本地GUI工具处理大文件和带图片文档"
                description={
                  <Space direction="vertical" size="small">
                    <Text>✅ 支持大文件（无大小限制）</Text>
                    <Text>✅ <Text strong>完整支持Word文档图片提取</Text></Text>
                    <Text>✅ 自动压缩图片（减少 70-90% 文件大小）</Text>
                    <Text>✅ 详细的转换日志和错误提示</Text>
                    <Text>✅ 测试转换功能（预览前10题）</Text>
                    <Text strong style={{ color: '#1890ff' }}>📍 工具位置：项目根目录 → 题库转换工具GUI版.bat</Text>
                  </Space>
                }
                type="info"
                showIcon
              />
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
