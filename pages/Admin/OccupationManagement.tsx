import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Upload, Space, Popconfirm, Card 
} from 'antd';
import { 
  PlusOutlined, UploadOutlined, DeleteOutlined, 
  EditOutlined, DownloadOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface OccupationRecord {
  id: string;
  occupation: string;
  direction: string | null;
  levels: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 职业工种管理页面
 * 管理职业工种清单，支持增删改查和批量导入
 */
const OccupationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OccupationRecord[]>([]);
  const [filteredData, setFilteredData] = useState<OccupationRecord[]>([]);
  const [occupations, setOccupations] = useState<string[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OccupationRecord | null>(null);
  const [form] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 过滤数据
  useEffect(() => {
    if (selectedOccupation) {
      setFilteredData(data.filter(item => item.occupation === selectedOccupation));
    } else {
      setFilteredData(data);
    }
  }, [selectedOccupation, data]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('edu_token');
      const response = await fetch('/api/occupation-list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        
        // 提取唯一的职业列表
        const uniqueOccupations = Array.from(
          new Set((result.data || []).map((item: OccupationRecord) => item.occupation))
        ).sort();
        setOccupations(uniqueOccupations as string[]);
      } else {
        message.error('加载数据失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开新增/编辑弹窗
  const handleOpenModal = (record?: OccupationRecord) => {
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue(record);
    } else {
      setEditingRecord(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('edu_token');

      if (editingRecord) {
        // 更新
        const response = await fetch(`/api/occupation-list/${editingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(values)
        });

        if (response.ok) {
          message.success('更新成功');
          handleCloseModal();
          loadData();
        } else {
          message.error('更新失败');
        }
      } else {
        // 新增
        const response = await fetch('/api/occupation-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(values)
        });

        if (response.ok) {
          message.success('添加成功');
          handleCloseModal();
          loadData();
        } else {
          message.error('添加失败');
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 删除记录
  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('edu_token');
      const response = await fetch(`/api/occupation-list/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        message.success('删除成功');
        loadData();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 导入Excel
  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('edu_token');
      const response = await fetch('/api/occupations/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        message.success(`导入成功：${result.success} 条，跳过：${result.skipped} 条`);
        loadData();
      } else {
        message.error('导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败');
    }

    return false; // 阻止自动上传
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      ['申报认定职业', '工种/职业方向名称'],
      ['互联网营销师', '选品员'],
      ['互联网营销师', '商品选品员'],
      ['互联网营销师', '平台管理员'],
      ['互联网营销师', '直播销售员'],
      ['互联网营销师', '视频创推员'],
      ['人工智能训练师', ''],
      ['汽车维修工', ''],
    ];

    // 转换为CSV格式
    const csv = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '职业工种清单模板.csv';
    link.click();
  };

  // 表格列定义
  const columns: ColumnsType<OccupationRecord> = [
    {
      title: '申报认定职业',
      dataIndex: 'occupation',
      key: 'occupation',
      width: 200,
    },
    {
      title: '工种/职业方向名称',
      dataIndex: 'direction',
      key: 'direction',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '职业等级',
      dataIndex: 'levels',
      key: 'levels',
      width: 200,
      render: (levels: string[]) => levels?.join('、') || '全部等级'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="occupation-management">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              新增职业工种
            </Button>
            <Upload
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />}>
                导入Excel
              </Button>
            </Upload>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载模板
            </Button>
          </Space>

          <div style={{ float: 'right' }}>
            <Space>
              <span>筛选职业：</span>
              <Select
                style={{ width: 200 }}
                placeholder="全部职业"
                allowClear
                value={selectedOccupation || undefined}
                onChange={setSelectedOccupation}
              >
                {occupations.map(occ => (
                  <Option key={occ} value={occ}>{occ}</Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑职业工种' : '新增职业工种'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="申报认定职业"
            name="occupation"
            rules={[{ required: true, message: '请输入职业名称' }]}
          >
            <Input placeholder="请输入职业名称" />
          </Form.Item>

          <Form.Item
            label="工种/职业方向名称"
            name="direction"
            help="可选，如果该职业没有细分工种方向可留空"
          >
            <Input placeholder="请输入工种/职业方向名称（可选）" />
          </Form.Item>

          <Form.Item
            label="职业等级"
            name="levels"
            help="选择该职业可申报的等级范围"
            initialValue={['五级', '四级', '三级', '二级', '一级']}
          >
            <Select
              mode="multiple"
              placeholder="请选择职业等级"
              options={[
                { label: '五级', value: '五级' },
                { label: '四级', value: '四级' },
                { label: '三级', value: '三级' },
                { label: '二级', value: '二级' },
                { label: '一级', value: '一级' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OccupationManagement;
