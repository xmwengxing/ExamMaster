/**
 * 导入任务管理页面
 * 显示所有导入任务、状态和进度
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  message,
  Input,
  Select,
  Descriptions,
  Progress,
  Alert
} from 'antd';
import {
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { ChunkedUpload } from '../../components/ChunkedUpload';

const { Search } = Input;
const { Option } = Select;

interface ImportTask {
  task_id: string;
  file_name: string;
  file_size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: any;
}

export const ImportTaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ImportTask | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  /**
   * 加载任务列表
   */
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/import/tasks');
      if (response.data.success) {
        setTasks(response.data.data.tasks);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 取消任务
   */
  const cancelTask = async (taskId: string) => {
    try {
      const response = await axios.delete(`/api/import/cancel/${taskId}`);
      if (response.data.success) {
        message.success('任务已取消');
        loadTasks();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '取消任务失败');
    }
  };

  /**
   * 查看任务详情
   */
  const viewTaskDetail = async (task: ImportTask) => {
    try {
      // 获取最新状态
      const response = await axios.get(`/api/import/status/${task.task_id}`);
      if (response.data.success) {
        setSelectedTask(response.data.data);
        setDetailVisible(true);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取任务详情失败');
    }
  };

  /**
   * 上传完成处理
   */
  const handleUploadComplete = async (result: any) => {
    try {
      // 开始导入任务
      const response = await axios.post('/api/import/start', {
        filePath: result.filePath,
        fileName: result.fileName,
        fileSize: result.fileSize
      });

      if (response.data.success) {
        message.success('导入任务已创建');
        setUploadVisible(false);
        loadTasks();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建导入任务失败');
    }
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      queued: { color: 'default', icon: <ClockCircleOutlined />, text: '排队中' },
      processing: { color: 'processing', icon: <SyncOutlined spin />, text: '处理中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      cancelled: { color: 'default', icon: <CloseCircleOutlined />, text: '已取消' }
    };

    const config = statusConfig[status] || statusConfig.queued;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  /**
   * 格式化时间
   */
  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  /**
   * 过滤任务
   */
  const filteredTasks = tasks.filter(task => {
    const matchStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchSearch = !searchText || task.file_name.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  useEffect(() => {
    loadTasks();
    // 每10秒自动刷新
    const interval = setInterval(loadTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => formatFileSize(size),
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      width: 120
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: ImportTask) => {
        if (record.status === 'processing' && record.progress) {
          const progress = JSON.parse(record.progress);
          return <Progress percent={progress.percentage || 0} size="small" />;
        }
        if (record.status === 'completed') {
          return <Progress percent={100} size="small" status="success" />;
        }
        if (record.status === 'failed') {
          return <Progress percent={0} size="small" status="exception" />;
        }
        return '-';
      },
      width: 150
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatTime,
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ImportTask) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewTaskDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'queued' || record.status === 'processing') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认取消',
                  content: '确定要取消这个导入任务吗？',
                  onOk: () => cancelTask(record.task_id)
                });
              }}
            >
              取消
            </Button>
          )}
        </Space>
      ),
      width: 150
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="导入任务管理"
        extra={
          <Space>
            <Button type="primary" onClick={() => setUploadVisible(true)}>
              新建导入任务
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadTasks}>
              刷新
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索文件名"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="queued">排队中</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="task_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 上传对话框 */}
      <Modal
        title="上传文件并导入"
        open={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        footer={null}
        width={600}
      >
        <ChunkedUpload
          onComplete={handleUploadComplete}
          onError={(error) => {
            message.error(error.message);
          }}
        />
      </Modal>

      {/* 任务详情对话框 */}
      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedTask && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="任务ID" span={2}>
                {selectedTask.task_id}
              </Descriptions.Item>
              <Descriptions.Item label="文件名" span={2}>
                {selectedTask.file_name}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {formatFileSize(selectedTask.file_size)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedTask.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatTime(selectedTask.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {formatTime(selectedTask.started_at || '')}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间" span={2}>
                {formatTime(selectedTask.completed_at || '')}
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.status === 'processing' && selectedTask.progress && (
              <Alert
                message="处理进度"
                description={
                  <div>
                    <Progress
                      percent={JSON.parse(selectedTask.progress).percentage || 0}
                      status="active"
                    />
                    <div style={{ marginTop: 8 }}>
                      当前阶段: {JSON.parse(selectedTask.progress).stage || '-'}
                    </div>
                  </div>
                }
                type="info"
                style={{ marginTop: 16 }}
              />
            )}

            {selectedTask.status === 'completed' && selectedTask.result && (
              <Alert
                message="导入结果"
                description={
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="总题目数">
                      {JSON.parse(selectedTask.result).totalQuestions || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="成功数">
                      {JSON.parse(selectedTask.result).successCount || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="失败数">
                      {JSON.parse(selectedTask.result).failureCount || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="耗时">
                      {JSON.parse(selectedTask.result).duration?.toFixed(2) || 0} 秒
                    </Descriptions.Item>
                  </Descriptions>
                }
                type="success"
                style={{ marginTop: 16 }}
              />
            )}

            {selectedTask.status === 'failed' && selectedTask.error_message && (
              <Alert
                message="错误信息"
                description={selectedTask.error_message}
                type="error"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImportTaskManager;
