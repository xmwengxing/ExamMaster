import React from 'react';
import { Steps } from 'antd';
import { UserOutlined, BookOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Step } = Steps;

interface StepsNavigatorProps {
  currentStep: number;
  onStepChange?: (step: number) => void;
}

/**
 * 分步表单导航组件
 * 用于展示表单进度和步骤切换
 */
const StepsNavigator: React.FC<StepsNavigatorProps> = ({ currentStep, onStepChange }) => {
  return (
    <div style={{ marginBottom: 24, padding: '0 20px' }}>
      <Steps
        current={currentStep}
        onChange={onStepChange}
        size="small"
      >
        <Step
          title="基本信息"
          icon={<UserOutlined />}
          description="填写个人基本信息"
        />
        <Step
          title="教育/申报信息"
          icon={<BookOutlined />}
          description="填写教育背景或申报信息"
        />
        <Step
          title="确认提交"
          icon={<CheckCircleOutlined />}
          description="确认信息并提交"
        />
      </Steps>
    </div>
  );
};

export default StepsNavigator;
