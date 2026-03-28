import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, Button, Card, Row, Col,
  message, Radio, Upload, Image, Space, Divider, Alert
  } from 'antd';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import './VocationalRegistrationForm.css';
import './RegistrationForm.css';

const { Option } = Select;
const { TextArea } = Input;

interface VocationalRegistrationFormProps {
  onNavigate?: (tab: string) => void;
}

/**
 * 职业技能报名表单组件
 * 包含申报条件、认定申报表、照片上传三个区域
 */
const VocationalRegistrationForm: React.FC<VocationalRegistrationFormProps> = ({ onNavigate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [occupations, setOccupations] = useState<any[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [majorMatch, setMajorMatch] = useState<{ level4Match: boolean; level3Match: boolean }>({
    level4Match: false,
    level3Match: false
  });
  const [workYearsDisabled, setWorkYearsDisabled] = useState(false);
  const [workHistoryDisabled, setWorkHistoryDisabled] = useState(false);
  const [workYearsHint, setWorkYearsHint] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundRecord, setFoundRecord] = useState<any>(null);
  const [existingUser, setExistingUser] = useState<{ exists: boolean; message?: string } | null>(null);

  // 学历选项
  const educationLevels = [
    '初中',
    '高中',
    '中专',
    '技校',
    '大专',
    '本科',
    '硕士研究生',
    '博士研究生'
  ];

  // 申报等级选项
  const applyLevels = ['五级', '四级', '三级', '二级', '一级'];

  // 证件类型选项
  const idTypes = [
    '居民身份证',
    '港澳居民居住证',
    '台湾居民居住证',
    '军官证',
    '护照'
  ];

  // 学习经历程度选项
  const educationDegrees = [
    '初中',
    '高中',
    '中专',
    '技校',
    '大专',
    '本科',
    '硕士研究生',
    '博士研究生'
  ];

  // 加载职业工种清单
  useEffect(() => {
    loadOccupations();
  }, []);

  const loadOccupations = async () => {
    try {
      const response = await fetch('/api/occupations');
      if (response.ok) {
        const result = await response.json();
        console.log('[职业清单] API返回数据:', result);
        
        // 处理不同的返回格式
        let data = [];
        if (result.success && Array.isArray(result.data)) {
          // 格式: { success: true, data: [...] }
          data = result.data;
        } else if (Array.isArray(result)) {
          // 格式: [...]  
          data = result;
        }
        
        // 统一转换为对象数组格式
        const normalizedData = data.map(item => {
          if (typeof item === 'string') {
            // 如果是字符串，转换为对象
            return { occupation: item };
          } else if (item && typeof item === 'object' && item.occupation) {
            // 如果已经是对象格式，直接返回
            return item;
          } else {
            // 其他情况，尝试提取 occupation 字段
            return { occupation: String(item) };
          }
        });
        
        console.log('[职业清单] 处理后的数据:', normalizedData);
        setOccupations(normalizedData);
      } else {
        console.error('加载职业清单失败，状态码:', response.status);
        setOccupations([]);
        message.error('加载职业清单失败，请稍后重试');
      }
    } catch (error) {
      console.error('加载职业清单失败:', error);
      setOccupations([]);
      message.error('加载职业清单失败，请检查网络连接');
    }
  };

  // 处理职业选择变化
  const handleOccupationChange = async (value: string) => {
    console.log('[职业选择] 选择的职业:', value);
    
    // 清空工种方向选择
    form.setFieldsValue({ occupation_direction: undefined });
    setDirections([]);
    
    // 检查 value 是否有效
    if (!value || value === 'null' || value === 'undefined') {
      console.warn('[职业选择] 无效的职业值:', value);
      return;
    }
    
    // 加载该职业的工种方向
    try {
      const encodedOccupation = encodeURIComponent(value);
      console.log('[职业选择] 编码后的职业名称:', encodedOccupation);
      
      const response = await fetch(`/api/occupations/${encodedOccupation}/directions`);
      console.log('[工种方向] 响应状态:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[工种方向] API返回数据:', result);
        
        // 处理不同的返回格式
        let data = [];
        if (result.success && Array.isArray(result.data)) {
          data = result.data;
        } else if (Array.isArray(result)) {
          data = result;
        }
        
        console.log('[工种方向] 处理后的数据:', data);
        setDirections(data);
        if (data.length === 0) {
          message.info('该职业暂无相关工种方向');
        }
      } else {
        console.error('加载工种方向失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        setDirections([]);
        message.error('加载工种方向失败，请稍后重试');
      }
    } catch (error) {
      console.error('加载工种方向失败:', error);
      setDirections([]);
      message.error('加载工种方向失败，请检查网络连接');
    }
    
    // 触发专业匹配检查
    checkMajorMatch();
  };

  // 检查专业匹配规则
  const checkMajorMatch = async () => {
    const occupation = form.getFieldValue('occupation');
    const major = form.getFieldValue('highest_education_major');
    const education = form.getFieldValue('highest_education');
    const applyLevel = form.getFieldValue('apply_level');

    console.log('[专业匹配] 检查参数:', { occupation, major, education, applyLevel });

    if (!occupation || !major || !education) {
      return;
    }

    try {
      // 调用后端API检查专业匹配
      const response = await fetch('/api/registrations/check-major-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ occupation, major, education })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[专业匹配] 匹配结果:', result);
        
        setMajorMatch(result);
        
        // 显示匹配提示
        if (result.level4Match) {
          message.success('✓ 四级专业符合：您的学历和专业符合四级申报条件，工作年限要求已自动调整');
        } else if (result.level3Match) {
          message.success('✓ 三级专业符合：您的学历和专业符合三级申报条件，工作年限要求已自动调整');
        } else {
          message.info('未匹配到专业符合规则，将按标准工作年限要求');
        }
        
        // 根据匹配结果自动计算工作年限
        calculateWorkYears(applyLevel, result);
      } else {
        console.error('检查专业匹配失败，状态码:', response.status);
        message.error('检查专业匹配失败，请稍后重试');
      }
    } catch (error) {
      console.error('检查专业匹配失败:', error);
      message.error('检查专业匹配失败，请检查网络连接');
    }
  };

  // 计算工作年限
  const calculateWorkYears = (applyLevel: string, match: { level4Match: boolean; level3Match: boolean }) => {
    let years = 0;
    let disabled = false;
    let hint = '';
    let historyDisabled = false;

    // 四级专业符合规则
    if (match.level4Match && applyLevel === '四级') {
      years = 0;
      disabled = true;
      historyDisabled = false;
    }
    // 三级专业符合规则
    else if (match.level3Match && applyLevel === '三级') {
      years = 0;
      disabled = true;
      historyDisabled = true; // 三级专业符合时禁用工作经历
    }
    // 无专业匹配
    else if (applyLevel === '四级') {
      years = 6;
      disabled = true;
      hint = '工作总年限不低于6年';
    } else if (applyLevel === '三级') {
      years = 10;
      disabled = true;
      hint = '工作总年限不低于10年';
    }

    form.setFieldsValue({ work_years: years });
    setWorkYearsDisabled(disabled);
    setWorkHistoryDisabled(historyDisabled);
    setWorkYearsHint(hint);
  };

  // 处理学历变化
  const handleEducationChange = () => {
    checkMajorMatch();
  };

// 处理专业变化
const handleMajorChange = () => {
  checkMajorMatch();
};

// 验证工作时间格式：YYYY 年 X 月至 YYYY 年 X 月
  const validateWorkPeriod = (value: string): boolean => {
    if (!value) return false;
    const regex = /^\d{4}年\d{1,2}月至\d{4}年\d{1,2}月$/;
    return regex.test(value);
  };

  // 检查手机号是否已存在用户
  const checkPhoneExists = async (phone: string) => {
    try {
      const response = await fetch(`/api/users/check-phone?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.exists) {
          setExistingUser({ exists: true, message: '该号码已存在用户，请登录后报名' });
          return true;
        } else {
          setExistingUser({ exists: false });
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('检查手机号失败:', error);
      return false;
    }
  };

  // 搜索已提交的表单
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
    setPhotoUrl('');
    message.info('表单已清空，请重新填写报名信息');
  };

  // 处理申报等级变化
  const handleApplyLevelChange = (value: string) => {
    calculateWorkYears(value, majorMatch);
  };

  // 格式化日期为 YYYY.MM 格式
  const formatBirthDate = (date: dayjs.Dayjs) => {
    return date.format('YYYY.MM');
  };

  // 格式化日期为 YYYY年MM月 格式
  const formatGraduationDate = (date: dayjs.Dayjs) => {
    return date.format('YYYY年MM月');
  };

  // 照片上传前验证
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }

    const isLt200K = file.size / 1024 < 200;
    if (!isLt200K) {
      message.error('照片大小不能超过200KB,请压缩后重新上传');
      return false;
    }

    return true;
  };

  // 处理照片上传
  const handlePhotoUpload = async (info: any) => {
    if (info.file.status === 'done') {
      const url = info.file.response?.url;
      if (url) {
        setPhotoUrl(url);
        form.setFieldsValue({ photo_url: url });
        message.success('照片上传成功');
      }
    } else if (info.file.status === 'error') {
      message.error('照片上传失败');
    }
  };

// 提交表单
  const handleSubmit = async (values: any) => {
    try {
      // 先检查手机号是否已存在用户
      const phoneExists = await checkPhoneExists(values.phone);
      if (phoneExists) {
        message.error('该号码已存在用户，请登录后报名');
        return;
      }

      setLoading(true);

      // 格式化日期
      const formattedValues = {
        ...values,
        type: 'VOCATIONAL',
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        certificate_date: values.certificate_date ? values.certificate_date.format('YYYY-MM-DD') : null,
        photo_url: photoUrl
      };

      // 调用后端 API 提交报名
      const token = localStorage.getItem('edu_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = 'Bearer ' + token; }
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

      // 显示文档下载链接
      if (result.document_path) {
        message.info('认定申报表已生成,可在报名管理中下载', 3);
      }

      // 跳转到成功页面或返回
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('registration');
        }
      }, 1500);

    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '提交失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  // {foundRecord ? '重新填写' : '清空重填'}
  const handleReset = () => {
    form.resetFields();
    setPhotoUrl('');
    setExistingUser(null);
    message.info('表单已清空');
  };

  return (
    <div className="vocational-registration-form">
<div className="form-header">
        <button
          onClick={() => onNavigate && onNavigate('registration')}
          className="back-button"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          ← 返回
        </button>
        <h2>职业技能报名</h2>
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
          💡 提示：输入手机号或身份证号可查找已提交的报名表单，方便修改后重新提交
        </div>
      </Card>

      {/* 搜索结果显示 */}
      {foundRecord && (
        <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', marginBottom: 16 }}>
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

      {/* 用户已存在提示 */}
      {existingUser?.exists && (
        <Alert
          message={existingUser.message}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
    form={form}
    layout="vertical"
    onFinish={handleSubmit}
    scrollToFirstError
    initialValues={{
      education_history: [
        { level: '初中', school: '', major: '', graduation_date: null },
        { level: undefined, school: '', major: '', graduation_date: null },
        { level: undefined, school: '', major: '', graduation_date: null },
        { level: undefined, school: '', major: '', graduation_date: null }
      ]
    }}
  >
        {/* 申报条件 - 移到最上方 */}
        <Card title="申报条件" className="form-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="申报认定职业"
                name="occupation"
                rules={[{ required: true, message: '请选择申报认定职业' }]}
              >
                <Select 
                  placeholder="请选择或搜索职业"
                  showSearch
                  allowClear
                  filterOption={(input, option) => {
                    // 安全的过滤函数，处理各种边界情况
                    if (!input) return true;
                    const children = option?.children;
                    if (!children) return false;
                    const childrenStr = String(children);
                    if (!childrenStr) return false;
                    return childrenStr.toLowerCase().includes(input.toLowerCase());
                  }}
                  onChange={handleOccupationChange}
                >
                  {occupations.map(occ => (
                    <Option key={occ.occupation} value={occ.occupation}>
                      {occ.occupation}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="工种/职业方向名称"
                name="occupation_direction"
              >
                <Select placeholder="请先选择职业">
                  {directions.map(dir => (
                    <Option key={dir} value={dir}>{dir}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="申报等级"
                name="apply_level"
                rules={[{ required: true, message: '请选择申报等级' }]}
              >
                <Select 
                  placeholder="请选择申报等级"
                  onChange={handleApplyLevelChange}
                >
                  {applyLevels.map(level => (
                    <Option key={level} value={level}>{level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="最高学历"
                name="highest_education"
                rules={[{ required: true, message: '请选择最高学历' }]}
              >
                <Select 
                  placeholder="请选择最高学历"
                  onChange={handleEducationChange}
                >
                  {educationLevels.map(level => (
                    <Option key={level} value={level}>{level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="最高学历专业"
                name="highest_education_major"
                rules={[{ required: true, message: '请输入最高学历专业' }]}
              >
                <Input 
                  placeholder="请输入专业名称"
                  onBlur={handleMajorChange}
                />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 专业匹配提示 */}
          {(majorMatch.level4Match || majorMatch.level3Match) && (
            <Row>
              <Col span={24}>
                <div style={{ 
                  padding: '12px', 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: '4px',
                  marginTop: '16px'
                }}>
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    ✓ {majorMatch.level4Match ? '四级专业符合' : '三级专业符合'}：
                  </span>
                  <span style={{ marginLeft: '8px', color: '#666' }}>
                    您的学历和专业符合{majorMatch.level4Match ? '四级' : '三级'}申报条件
                  </span>
                </div>
              </Col>
            </Row>
          )}
        </Card>

        {/* 基本信息 */}
        <Card title="基本信息" className="form-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Radio.Group>
                  <Radio value="男">男</Radio>
                  <Radio value="女">女</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="出生年月"
                name="birth_date"
                rules={[{ required: true, message: '请选择出生年月' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="请选择出生年月"
                  picker="month"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
              >
                <Input placeholder="请输入11位手机号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="证件类型"
                name="id_type"
                rules={[{ required: true, message: '请选择证件类型' }]}
              >
                <Select placeholder="请选择证件类型">
                  {idTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="证件号"
                name="id_number"
                rules={[
                  { required: true, message: '请输入证件号' },
                  { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' }
                ]}
              >
                <Input placeholder="请输入证件号" maxLength={18} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="所在城市"
                name="city"
                rules={[{ required: true, message: '请输入所在城市' }]}
              >
                <Input placeholder="请输入所在城市" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="工作单位"
                name="company"
              >
                <Input placeholder="请输入工作单位(可选)" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

  {/* 学习经历 */}
  <Card title="学习经历" className="form-section">
    <Form.List name="education_history">
      {(fields, { add, remove }) => (
        <>
          {fields.map((field, index) => (
            <Row gutter={16} key={field.key} align="middle">
              <Col xs={24} sm={6}>
                <Form.Item
                  {...field}
                  label="程度"
                  name={[field.name, 'level']}
                  rules={[{ required: index === 0, message: '请选择程度' }]}
                >
                  <Select
                    placeholder={index === 0 ? "初中（固定）" : "请选择程度"}
                    disabled={index === 0}
                    value={index === 0 ? '初中' : undefined}
                  >
                    {index === 0 ? (
                      <Option key="初中" value="初中">初中</Option>
                    ) : (
                      educationDegrees.map(degree => (
                        <Option key={degree} value={degree}>{degree}</Option>
                      ))
                    )}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  {...field}
                  label="学校名称"
                  name={[field.name, 'school']}
                  rules={index === 0 ? [{ required: true, message: '请输入学校名称' }] : []}
                >
                  <Input placeholder={index === 0 ? "请输入学校名称" : "请输入学校名称（选填）"} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item
                  {...field}
                  label="专业"
                  name={[field.name, 'major']}
                >
                  <Input placeholder="请输入专业（选填）" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={4}>
                <Form.Item
                  {...field}
                  label="毕业时间"
                  name={[field.name, 'graduation_date']}
                  rules={index === 0 ? [{ required: true, message: '请选择毕业时间' }] : []}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder={index === 0 ? "选择毕业时间" : "选择毕业时间（选填）"}
                    picker="month"
                    format="YYYY 年 MM 月"
                  />
                </Form.Item>
              </Col>

              {index > 0 && (
                <Col xs={24} sm={2}>
                  <Button
                    type="link"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(field.name)}
                  >
                    删除
                  </Button>
                </Col>
              )}
            </Row>
          ))}

          {fields.length < 4 && (
            <Button
              type="dashed"
              onClick={() => add()}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              disabled={fields.length >= 4}
            >
              添加学习经历
            </Button>
          )}
        </>
      )}
    </Form.List>
  </Card>

        {/* 工作经历 */}
        <Card title="工作经历" className="form-section">
          <Form.Item
            label="从事本职业年限"
            name="work_years"
            rules={[{ required: true, message: '请输入工作年限' }]}
            extra={workYearsHint}
          >
            <Input 
              type="number" 
              placeholder="请输入年限" 
              suffix="年"
              disabled={workYearsDisabled}
            />
          </Form.Item>

          <Form.List name="work_history">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Row gutter={16} key={field.key} align="middle">
                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...field}
                        label="工作时间"
                        name={[field.name, 'period']}
                        rules={[{ required: !workHistoryDisabled, message: '请输入工作时间' }]}
                      >
                        <Input 
                          placeholder="如: 2020年1月至2025年1月"
                          disabled={workHistoryDisabled}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={7}>
                      <Form.Item
                        {...field}
                        label="工作单位"
                        name={[field.name, 'company']}
                        rules={[{ required: !workHistoryDisabled, message: '请输入工作单位' }]}
                      >
                        <Input 
                          placeholder="请输入工作单位"
                          disabled={workHistoryDisabled}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={7}>
                      <Form.Item
                        {...field}
                        label="职务"
                        name={[field.name, 'position']}
                        rules={[{ required: !workHistoryDisabled, message: '请输入职务' }]}
                      >
                        <Input 
                          placeholder="请输入职务"
                          disabled={workHistoryDisabled}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={2}>
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                        disabled={workHistoryDisabled}
                      >
                        删除
                      </Button>
                    </Col>
                  </Row>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                  disabled={workHistoryDisabled}
                >
                  添加工作经历
                </Button>
              </>
            )}
          </Form.List>
        </Card>

  {/* 照片上传 */}
  <Card title="照片上传" className="form-section">
    <Form.Item
      label="1 寸白底照片"
      name="photo_url"
      rules={[{ required: true, message: '请上传照片' }]}
      extra={
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>✓ 要求：1 寸白底正面免冠照片</div>
          <div>✓ 格式：JPG 或 PNG</div>
          <div>✓ 大小：不超过 200KB</div>
          {photoUrl && (
            <div style={{ color: '#52c41a', marginTop: '4px' }}>
              ✓ 照片已上传，可预览
            </div>
          )}
        </div>
      }
    >
      <Upload
        name="photo"
        listType="picture-card"
        showUploadList={{
          showPreview: true,
          showRemove: true
        }}
        action="/api/upload/photo"
        beforeUpload={beforeUpload}
        onChange={handlePhotoUpload}
      >
        {photoUrl ? (
          <Image 
            src={photoUrl} 
            alt="照片预览" 
            style={{ 
              width: '100%', 
              borderRadius: '4px',
              border: '1px solid #e8e8e8'
            }} 
          />
        ) : (
          <div style={{ color: '#999' }}>
            <UploadOutlined style={{ fontSize: '24px' }} />
            <div style={{ marginTop: 8 }}>点击或拖拽上传照片</div>
          </div>
        )}
      </Upload>
    </Form.Item>
  </Card>

        {/* 操作按钮 */}
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

export default VocationalRegistrationForm;
