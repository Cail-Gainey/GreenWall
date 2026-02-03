// Tutorial.tsx 提供了一个多步骤的交互式新手引导对话框。
// 它通过读取 i18n 字典中的配置，向用户解释应用的核心概念（绘图、生成、推送等）。
import React, { useState, useMemo } from 'react';
import { Modal, Button, Steps, Typography } from 'antd';
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslations } from '../i18n';

const { Title, Paragraph, Text } = Typography;

interface TutorialProps {
  onClose: () => void; // 教程关闭回调
}

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

/**
 * Tutorial 组件：使用 Ant Design 的 Steps 和 Modal 构建的引导流。
 */
const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const { t, dictionary } = useTranslations();
  const [currentStep, setCurrentStep] = useState(0); // 当前进行到的步数索引

  // 从国际化字典中提取教程步骤配置
  const steps: TutorialStep[] = useMemo(() => {
    if (!dictionary || !dictionary.tutorial || !Array.isArray(dictionary.tutorial.steps)) {
      console.error('Tutorial steps not found or invalid:', dictionary?.tutorial);
      return [];
    }
    return dictionary.tutorial.steps;
  }, [dictionary]);

  // 如果没有配置好的步骤，则不进行渲染
  if (steps.length === 0) {
    return null;
  }

  // --- 导航处理函数 ---
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * handleKeyDown：支持使用键盘左右方向键进行快速翻页，Esc 键退出。
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal
      title={t('tutorial.title')}
      open={true}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 50 }}
      bodyStyle={{ padding: '24px 24px 0' }}
      // 捕获键盘事件以实现快捷导航
      wrapProps={{ onKeyDown: handleKeyDown }}
    >
      <div className="flex flex-col gap-6">
        {/* 指示进度条 */}
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          size="small"
          items={steps.map((step, index) => ({ title: `Step ${index + 1}` }))}
        />

        {/* 内容展示区 */}
        <div className="min-h-[200px] py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
          <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>{steps[currentStep].title}</Title>
          <Paragraph
            style={{
              fontSize: '16px',
              lineHeight: '1.8',
              textAlign: 'left',
              whiteSpace: 'pre-line' // 保证翻译中的换行符生效
            }}
          >
            {steps[currentStep].content}
          </Paragraph>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('tutorial.stepCounter', { current: currentStep + 1, total: steps.length })}
            </Text>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            icon={<LeftOutlined />}
          >
            {t('tutorial.previous')}
          </Button>

          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('tutorial.keyboardHint')}
          </Text>

          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={handleNext}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              {t('tutorial.next')}
            </Button>
          ) : (
            // 最后一步显示“完成”样式的按钮
            <Button
              type="primary"
              onClick={onClose}
              style={{ backgroundColor: '#52c41a' }}
              icon={<CheckOutlined />}
            >
              {t('tutorial.finish')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Tutorial;
