import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { BookOutlined, SafetyCertificateOutlined, ReadOutlined } from '@ant-design/icons';
import './RegistrationTypeSelector.css';

const { Title, Paragraph } = Typography;

interface RegistrationTypeSelectorProps {
  onNavigate?: (tab: string) => void;
}

/**
 * 报名类型选择页面
 * 提供三种报名类型选项:学历教育、职业技能、大中小学科
 */
const RegistrationTypeSelector: React.FC<RegistrationTypeSelectorProps> = ({ onNavigate }) => {

  // 报名类型配置
  const registrationTypes = [
    {
      key: 'education',
      title: '学历教育',
      description: '提升学历,开启职业新篇章',
      icon: <BookOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      path: 'registration-education',
      available: true
    },
    {
      key: 'vocational',
      title: '职业技能',
      description: '职业技能等级认定申报',
      icon: <SafetyCertificateOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      path: 'registration-vocational',
      available: true
    },
    {
      key: 'k12',
      title: '大中小学科',
      description: '大中小学科培训报名',
      icon: <ReadOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      path: 'registration-k12',
      available: false
    }
  ];

  // 处理卡片点击
  const handleCardClick = (type: typeof registrationTypes[0]) => {
    if (!type.available) {
      return;
    }
    if (onNavigate) {
      onNavigate(type.path);
    }
  };

  // 返回登录页面
  const handleBackToLogin = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="registration-type-selector">
      <div className="selector-header">
        <button 
          onClick={handleBackToLogin}
          className="back-to-login-btn"
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
            fontWeight: 'bold'
          }}
        >
          ← 返回登录
        </button>
        <Title level={2}>选择报名类型</Title>
        <Paragraph>请根据您的需求选择相应的报名类型</Paragraph>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {registrationTypes.map((type) => (
          <Col xs={24} sm={12} md={8} key={type.key}>
            <Card
              hoverable={type.available}
              className={`type-card ${!type.available ? 'disabled' : ''}`}
              onClick={() => handleCardClick(type)}
            >
              <div className="card-content">
                <div className="card-icon">{type.icon}</div>
                <Title level={3}>{type.title}</Title>
                <Paragraph>{type.description}</Paragraph>
                {!type.available && (
                  <div className="coming-soon">待开发</div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RegistrationTypeSelector;
