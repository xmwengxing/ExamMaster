/**
 * 导入管理页面
 * 管理题库导入任务，支持分片上传和进度跟踪
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Upload, 
  message, 
  Input,
  Select,
  Typography,
  Popconfirm
} from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SearchOutlined,
  InboxOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import axios from 'axios';
import { ChunkedUploader, UploadProgress } from '../../utils/chunkedUpload';
import ChunkedUploadProgress from '../../components/ChunkedUploadProgress';
import ImportTaskDetail from '../../components/ImportTaskDetail';

const { Title } = Typography;
const { Dragger } = Upload;

// 配置axios默认添加认证头
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('edu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ImportTask {
  taskId: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export default function ImportManager() {
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 加载任务列表
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/import/tasks');
      if (response.data.success) {
        // API返回的数据结构是 { success: true, data: { tasks: [...], total: 123 } }
        const tasksData = response.data.data?.tasks || response.data.data;
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }
    } catch (error: any) {
      console.error('加载任务列表失败:', error);
      message.error('加载任务列表失败');
      // 出错时设置为空数组
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // 每5秒自动刷新
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // 处理文件上传
  const handleUpload = async () => {
    console.log('[ImportManager] 开始上传流程');
    
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('文件读取失败');
      return;
    }

    console.log('[ImportManager] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setUploading(true);

    try {
      console.log('[ImportManager] 创建ChunkedUploader实例');
      // 使用分片上传
      const uploader = new ChunkedUploader(file);
      
      console.log('[ImportManager] 开始上传文件');
      const filePath = await uploader.upload({
        file,
        onProgress: (progress) => {
          console.log('[ImportManager] 上传进度:', progress);
          setUploadProgress(progress);
        },
        onError: (error) => {
          console.error('[ImportManager] 上传错误:', error);
          message.error('上传失败: ' + error.message);
        }
      });

      console.log('[ImportManager] 文件上传完成，路径:', filePath);

      // 创建导入任务
      console.log('[ImportManager] 创建导入任务');
      const response = await axios.post('/api/import/start', {
        filePath,
        fileName: file.name,
        fileSize: file.size
      });

      console.log('[ImportManager] 导入任务响应:', response.data);

      if (response.data.success) {
        message.success('导入任务已创建');
        setUploadModalVisible(false);
        setFileList([]);
        setUploadProgress(null);
        loadTasks();
      } else {
        message.error('创建导入任务失败: ' + (response.data.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('[ImportManager] 上传失败:', error);
      console.error('[ImportManager] 错误详情:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      message.error('上传失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // 查看任务详情
  const handleViewDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailModalVisible(true);
  };

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await axios.delete(`/api/import/cancel/${taskId}`);
      if (response.data.success) {
        message.success('任务已取消');
        loadTasks();
      } else {
        message.error('取消任务失败');
      }
    } catch (error: any) {
      console.error('取消任务失败:', error);
      message.error('取消任务失败');
    }
  };

  // 重新导入
  const handleRetry = async (taskId: string) => {
    try {
      const response = await axios.post(`/api/import/retry/${taskId}`);
      if (response.data.success) {
        message.success('重新导入任务已创建');
        loadTasks();
      } else {
        message.error('重新导入失败');
      }
    } catch (error: any) {
      console.error('重新导入失败:', error);
      message.error('重新导入失败');
    }
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.fileName.toLowerCase().includes(searchText.toLowerCase()) ||
                       task.taskId.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 200,
      ellipsis: true,
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          queued: 'blue',
          processing: 'processing',
          completed: 'success',
          failed: 'error',
        };
        const textMap: Record<string, string> = {
          queued: '排队中',
          processing: '执行中',
          completed: '已完成',
          failed: '失败',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ImportTask) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.taskId)}
          >
            详情
          </Button>
          {record.status === 'processing' && (
            <Popconfirm
              title="确定要取消这个任务吗？"
              onConfirm={() => handleCancelTask(record.taskId)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                取消
              </Button>
            </Popconfirm>
          )}
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRetry(record.taskId)}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>导入管理</Title>
            </div>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
              size="large"
            >
              新建导入任务
            </Button>
          </Space>
        </Card>

        {/* 筛选和搜索 */}
        <Card>
          <Space>
            <Input
              placeholder="搜索任务ID或文件名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="queued">排队中</Select.Option>
              <Select.Option value="processing">执行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
            <Button onClick={loadTasks}>刷新</Button>
          </Space>
        </Card>

        {/* 任务列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredTasks}
            rowKey="taskId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个任务`,
            }}
          />
        </Card>
      </Space>

      {/* 上传对话框 */}
      <Modal
        title="新建导入任务"
        open={uploadModalVisible}
        onCancel={() => {
          if (!uploading) {
            setUploadModalVisible(false);
            setFileList([]);
            setUploadProgress(null);
          }
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => setUploadModalVisible(false)}
            disabled={uploading}
          >
            取消
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            开始上传
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Dragger
            fileList={fileList}
            beforeUpload={(file) => {
              // 验证文件类型
              const isJSON = file.name.endsWith('.json');
              if (!isJSON) {
                message.error('只支持 JSON 格式的文件！');
                return Upload.LIST_IGNORE;
              }

              // 验证文件大小（限制100MB）
              const isLt100M = file.size / 1024 / 1024 < 100;
              if (!isLt100M) {
                message.error('文件大小不能超过 100MB！');
                return Upload.LIST_IGNORE;
              }

              setFileList([file as UploadFile]);
              return false;
            }}
            onRemove={() => {
              setFileList([]);
            }}
            maxCount={1}
            accept=".json"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 JSON 格式，单个文件不超过 100MB
            </p>
          </Dragger>

          {/* 上传进度 */}
          {uploading && uploadProgress && (
            <ChunkedUploadProgress
              progress={uploadProgress}
              fileName={fileList[0]?.name}
              status="uploading"
            />
          )}
        </Space>
      </Modal>

      {/* 任务详情对话框 */}
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedTaskId && (
          <ImportTaskDetail
            taskId={selectedTaskId}
            onClose={() => setDetailModalVisible(false)}
            onRetry={handleRetry}
          />
        )}
      </Modal>
    </div>
  );
}
