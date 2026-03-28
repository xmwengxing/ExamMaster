/**
 * 分片上传进度组件
 * 显示上传进度、速度和剩余时间
 */

import React from 'react';
import { Progress, Card, Space, Typography, Tag, Statistic, Row, Col } from 'antd';
import { CloudUploadOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { UploadProgress, formatFileSize, formatSpeed, formatTime } from '../utils/chunkedUpload';

const { Text } = Typography;

interface ChunkedUploadProgressProps {
  progress: UploadProgress;
  fileName?: string;
  status?: 'uploading' | 'success' | 'error';
}

export const ChunkedUploadProgress: React.FC<ChunkedUploadProgressProps> = ({
  progress,
  fileName,
  status = 'uploading'
}) => {
  return (
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 文件名 */}
        {fileName && (
          <div>
            <Text strong>上传文件: </Text>
            <Text>{fileName}</Text>
          </div>
        )}

        {/* 进度条 */}
        <div>
          <Progress
            percent={progress.percentage}
            status={
              status === 'error' ? 'exception' :
              status === 'success' ? 'success' :
              'active'
            }
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>

        {/* 统计信息 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
              <Statistic
                title="已上传"
                value={formatFileSize(progress.uploadedBytes)}
                suffix={`/ ${formatFileSize(progress.totalBytes)}`}
                valueStyle={{ fontSize: 16 }}
                prefix={<CloudUploadOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
              <Statistic
                title="上传速度"
                value={formatSpeed(progress.speed)}
                valueStyle={{ fontSize: 16, color: '#1890ff' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
              <Statistic
                title="剩余时间"
                value={formatTime(progress.estimatedTimeLeft)}
                valueStyle={{ fontSize: 16, color: '#52c41a' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 分片信息 */}
        <div>
          <Space>
            <Text type="secondary">分片进度:</Text>
            <Tag color="blue">
              {progress.uploadedChunks} / {progress.totalChunks}
            </Tag>
            <Text type="secondary">当前分片:</Text>
            <Tag color="green">#{progress.currentChunk + 1}</Tag>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default ChunkedUploadProgress;
