/**
 * 导入任务详情组件
 * 显示实时进度、处理阶段和导入结果
 */

import React, { useState, useEffect } from 'react';
import { Card, Progress, Space, Typography, Statistic, Row, Col, Alert, List, Tag, Descriptions, Button, message } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface ImportTask {
  taskId: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    percentage: number;
    currentStage: string;
    estimatedTimeLeft?: number;
  };
  result?: {
    inserted: number;
    duplicates: number;
    errors: Array<{
      index: number;
      message: string;
    }>;
    duration: number;
  };
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ImportTaskDetailProps {
  taskId: string;
  onClose?: () => void;
  onRetry?: (taskId: string) => void;
}

export const ImportTaskDetail: React.FC<ImportTaskDetailProps> = ({
  taskId,
  onClose,
  onRetry
}) => {
  const [task, setTask] = useState<ImportTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载任务详情
  const loadTaskDetail = async () => {
    try {
      const response = await axios.get(`/api/import/status/${taskId}`);
      if (response.data.success) {
        setTask(response.data.data);
      } else {
        message.error('加载任务详情失败');
      }
    } catch (error: any) {
      console.error('加载任务详情失败:', error);
      message.error('加载任务详情失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    loadTaskDetail();

    if (autoRefresh && task?.status === 'processing') {
      const interval = setInterval(loadTaskDetail, 2000); // 每2秒刷新一次
      return () => clearInterval(interval);
    }
  }, [taskId, autoRefresh, task?.status]);

  // 下载错误报告
  const handleDownloadErrorReport = () => {
    if (!task?.result?.errors || task.result.errors.length === 0) {
      message.warning('没有错误需要下载');
      return;
    }

    const errorReport = {
      taskId: task.taskId,
      fileName: task.fileName,
      totalErrors: task.result.errors.length,
      errors: task.result.errors
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_report_${taskId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    message.success('错误报告已下载');
  };

  // 重新导入
  const handleRetry = () => {
    if (onRetry) {
      onRetry(taskId);
    }
  };

  if (loading) {
    return (
      <Card loading={true}>
        <div style={{ height: 400 }} />
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <Alert message="任务不存在" type="error" />
      </Card>
    );
  }

  // 获取状态图标和颜色
  const getStatusIcon = () => {
    switch (task.status) {
      case 'queued':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'processing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'queued':
        return '排队中';
      case 'processing':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'queued':
        return 'blue';
      case 'processing':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 任务基本信息 */}
      <Card
        title={
          <Space>
            {getStatusIcon()}
            <Text strong>任务详情</Text>
            <Tag color={getStatusColor()}>{getStatusText()}</Tag>
          </Space>
        }
        extra={
          <Space>
            {task.status === 'failed' && (
              <Button icon={<ReloadOutlined />} onClick={handleRetry}>
                重新导入
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose}>关闭</Button>
            )}
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="任务ID">{task.taskId}</Descriptions.Item>
          <Descriptions.Item label="文件名">{task.fileName}</Descriptions.Item>
          <Descriptions.Item label="文件大小">
            {(task.fileSize / 1024 / 1024).toFixed(2)} MB
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(task.createdAt).toLocaleString()}
          </Descriptions.Item>
          {task.startedAt && (
            <Descriptions.Item label="开始时间">
              {new Date(task.startedAt).toLocaleString()}
            </Descriptions.Item>
          )}
          {task.completedAt && (
            <Descriptions.Item label="完成时间">
              {new Date(task.completedAt).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 实时进度 */}
      {(task.status === 'processing' || task.status === 'queued') && (
        <Card title="实时进度">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 当前阶段 */}
            <div>
              <Text strong>当前阶段: </Text>
              <Tag color="blue">{task.progress.currentStage}</Tag>
            </div>

            {/* 进度条 */}
            <Progress
              percent={task.progress.percentage}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />

            {/* 统计信息 */}
            <Row gutter={16}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总题目数"
                    value={task.progress.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="已处理"
                    value={task.progress.processed}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="成功"
                    value={task.progress.succeeded}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="失败"
                    value={task.progress.failed}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 预计剩余时间 */}
            {task.progress.estimatedTimeLeft !== undefined && (
              <div>
                <Text type="secondary">
                  预计剩余时间: {Math.round(task.progress.estimatedTimeLeft)} 秒
                </Text>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* 导入结果摘要 */}
      {task.status === 'completed' && task.result && (
        <Card title="导入结果摘要">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功插入"
                  value={task.result.inserted}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="重复跳过"
                  value={task.result.duplicates}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="失败"
                  value={task.result.errors.length}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总耗时"
                  value={task.result.duration}
                  suffix="秒"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {task.result.errors.length > 0 && (
            <Alert
              message={`发现 ${task.result.errors.length} 个错误`}
              description="部分题目导入失败，请查看错误详情"
              type="warning"
              showIcon
              action={
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadErrorReport}
                >
                  下载错误报告
                </Button>
              }
            />
          )}
        </Card>
      )}

      {/* 错误详情 */}
      {task.status === 'failed' && task.error && (
        <Card title="错误详情">
          <Alert
            message="导入失败"
            description={task.error}
            type="error"
            showIcon
          />
        </Card>
      )}

      {/* 错误列表 */}
      {task.result && task.result.errors.length > 0 && (
        <Card title={`错误列表 (${task.result.errors.length})`}>
          <List
            dataSource={task.result.errors.slice(0, 10)}
            renderItem={(error) => (
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
                  title={<Text type="danger">题目 {error.index + 1}</Text>}
                  description={error.message}
                />
              </List.Item>
            )}
          />
          {task.result.errors.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">
                还有 {task.result.errors.length - 10} 个错误，请下载完整报告查看
              </Text>
            </div>
          )}
        </Card>
      )}
    </Space>
  );
};

export default ImportTaskDetail;
