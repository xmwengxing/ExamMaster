import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, Row, Col, message, Radio } from 'antd';
import dayjs from 'dayjs';
import './EducationRegistrationForm.css';
import './RegistrationForm.css';

const { Option } = Select;

interface EducationRegistrationFormProps {
  onNavigate?: (tab: string) => void;
}

const EducationRegistrationForm: React.FC<EducationRegistrationFormProps> = ({ onNavigate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundRecord, setFoundRecord] = useState<any>(null);

  const educationLevels = ['无', '初中', '高中', '中专', '技校', '大专', '本科', '硕士研究生', '博士研究生'];
  const upgradeTypes = ['大专', '本科', '硕士研究生', '博士研究生'];
  const budgetOptions = ['5000-6000', '7000-10000', '12000+'];
  const upgradeFormOptions: Record<string, string[]> = {
    '5000-6000': ['函授'],
    '7000-10000': ['国家开放大学', '自学考试'],
    '12000+': ['单证硕士', '双证硕士', '硕升博']
  };
  const idTypes = ['居民身份证', '港澳居民居住证', '台湾居民居住证', '军官证', '护照'];

  const handleBudgetChange = (value: string) => {
    form.setFieldsValue({ upgrade_form: undefined });
  };

  const handleSearch = async () => {
    console.log('[搜索] 开始搜索', { searchPhone, searchId });
    if (!searchPhone && !searchId) {
      message.warning('请输入手机号或身份证号');
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchPhone) params.append('phone', searchPhone);
      if (searchId) params.append('idNumber', searchId);
      console.log('[搜索] 请求 API', `/api/registrations/search?${params}`);
      const response = await fetch(`/api/registrations/search?${params}`);
      console.log('[搜索] 响应状态', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('[搜索] 响应数据', result);
        if (result.data && result.data.length > 0) {
          console.log('[搜索] 找到记录', result.data[0]);
          setFoundRecord(result.data[0]);
          message.success('已找到报名记录，请点击"重新填写"按钮清空表单后重新提交');
        } else {
          console.log('[搜索] 未找到记录');
          message.warning('不存在报名记录，请核对手机号码或身份证号');
          setFoundRecord(null);
        }
      } else {
        console.error('[搜索] API 返回错误', response.status);
        message.error('搜索失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('[搜索] 异常', error);
      message.error('搜索失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResetAndSearch = () => {
    form.resetFields();
    setFoundRecord(null);
    setSearchPhone('');
    setSearchId('');
    message.info('表单已清空，请重新填写报名信息');
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        type: 'EDUCATION',
        birth_date: values.birth_date?.format('YYYY-MM-DD') || null,
        first_education_graduation_date: values.first_education_graduation_date?.format('YYYY-MM-DD') || null,
        highest_education_graduation_date: values.highest_education_graduation_date?.format('YYYY-MM-DD') || null,
      };

      const token = localStorage.getItem('edu_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedValues)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '提交失败');
      }

      const result = await response.json();
      message.success('报名提交成功!');
      if (result.document_path) message.info('报名文档已生成，可在报名管理中下载', 3);
      setFoundRecord(null);
      setTimeout(() => onNavigate && onNavigate('registration'), 1500);
    } catch (error: any) {
      message.error(error.message || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const currentBudget = Form.useWatch('upgrade_budget', form);
  const availableUpgradeForms = currentBudget ? upgradeFormOptions[currentBudget] : [];

  return (
    <div className="education-registration-form">
      <div className="form-header">
        <button onClick={() => onNavigate && onNavigate('registration')} className="back-button">← 返回</button>
        <h2>学历教育报名</h2>
        <p>请如实填写以下信息，标记 * 的为必填项</p>
      </div>

      {/* 搜索已有报名 */}
      <Card className="search-section" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="手机号"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Input
              placeholder="身份证号"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Button 
              type="primary" 
              onClick={handleSearch}
              loading={searchLoading}
              block
            >
              查找报名
            </Button>
          </Col>
        </Row>
        <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
          💡 提示：输入手机号或身份证号可查找已提交的报名表单
        </div>
        {foundRecord && (
          <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: '#faad14', marginBottom: 8 }}>
              ✓ 已找到报名记录
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              姓名：{foundRecord.name}，手机号：{foundRecord.phone}，报名时间：{new Date(foundRecord.created_at).toLocaleString('zh-CN')}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              如需修改信息，请点击下方"重新填写"按钮清空表单后重新提交，系统将自动更新记录
            </div>
          </div>
        )}
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>
        <Card title="基本信息" className="form-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                <Radio.Group><Radio value="男">男</Radio><Radio value="女">女</Radio></Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="出生年月" name="birth_date" rules={[{ required: true, message: '请选择出生年月' }]}>
                <DatePicker style={{ width: '100%' }} picker="month" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]}>
                <Input placeholder="请输入 11 位手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="证件类型" name="id_type" rules={[{ required: true, message: '请选择证件类型' }]}>
                <Select placeholder="请选择证件类型">{idTypes.map(type => <Option key={type} value={type}>{type}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="证件号" name="id_number" rules={[
                { required: true, message: '请输入证件号' },
                { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' }
              ]}>
                <Input placeholder="请输入证件号" maxLength={18} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="所在城市" name="city" rules={[{ required: true, message: '请输入所在城市' }]}>
                <Input placeholder="请输入所在城市" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="工作单位" name="company">
                <Input placeholder="请输入工作单位 (可选)" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="教育背景" className="form-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="第一学历" name="first_education" rules={[{ required: true, message: '请选择第一学历' }]}>
                <Select placeholder="请选择第一学历">{educationLevels.map(level => <Option key={level} value={level}>{level}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="第一学历院校" name="first_education_school" rules={[{ required: true, message: '请输入第一学历院校' }]}>
                <Input placeholder="请输入院校名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="第一学历专业" name="first_education_major" rules={[{ required: true, message: '请输入第一学历专业' }]}>
                <Input placeholder="请输入专业名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="第一学历毕业时间" name="first_education_graduation_date" rules={[{ required: true, message: '请选择毕业时间' }]}>
                <DatePicker style={{ width: '100%' }} picker="month" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="最高学历" name="highest_education" rules={[{ required: true, message: '请选择最高学历' }]}>
                <Select placeholder="请选择最高学历">{educationLevels.map(level => <Option key={level} value={level}>{level}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="最高学历院校" name="highest_education_school" rules={[{ required: true, message: '请输入最高学历院校' }]}>
                <Input placeholder="请输入院校名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="最高学历专业" name="highest_education_major" rules={[{ required: true, message: '请输入最高学历专业' }]}>
                <Input placeholder="请输入专业名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="最高学历毕业时间" name="highest_education_graduation_date" rules={[{ required: true, message: '请选择毕业时间' }]}>
                <DatePicker style={{ width: '100%' }} picker="month" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="升学选择" className="form-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="升学类型" name="upgrade_type" rules={[{ required: true, message: '请选择升学类型' }]}>
                <Select placeholder="请选择升学类型">{upgradeTypes.map(type => <Option key={type} value={type}>{type}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="升学预算" name="upgrade_budget" rules={[{ required: true, message: '请选择升学预算' }]}>
                <Select placeholder="请选择升学预算" onChange={handleBudgetChange}>
                  {budgetOptions.map(budget => <Option key={budget} value={budget}>{budget}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="升学形式" name="upgrade_form" rules={[{ required: true, message: '请选择升学形式' }]}>
                <Select placeholder="请先选择升学预算" disabled={!currentBudget}>
                  {availableUpgradeForms.map(form => <Option key={form} value={form}>{form}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="升学专业" name="upgrade_major" rules={[{ required: true, message: '请输入升学专业' }]}>
                <Input placeholder="请输入专业名称" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className="form-actions">
          <Button onClick={handleResetAndSearch} style={{ marginRight: 16 }}>
            {foundRecord ? '重新填写' : '清空重填'}
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交审核
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EducationRegistrationForm;
