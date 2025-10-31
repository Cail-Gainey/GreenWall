import React, { useState, useMemo } from 'react';
import { useTranslations } from '../i18n';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid';

/**
 * 教程组件属性接口
 */
interface TutorialProps {
  onClose: () => void;
}

/**
 * 教程步骤接口
 */
interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

/**
 * Tutorial 组件 - 提供应用使用教程的交互式指南
 * 
 * 功能:
 * - 多步骤教程导航
 * - 中英文双语支持
 * - 响应式设计
 * - 键盘快捷键支持
 */
const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const { t, dictionary } = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);

  // 获取教程步骤 - 使用useMemo确保稳定性
  const steps: TutorialStep[] = useMemo(() => {
    if (!dictionary || !dictionary.tutorial || !Array.isArray(dictionary.tutorial.steps)) {
      console.error('Tutorial steps not found or invalid:', dictionary?.tutorial);
      return [];
    }
    return dictionary.tutorial.steps;
  }, [dictionary]);

  // 如果没有步骤数据，不渲染
  if (steps.length === 0) {
    return null;
  }

  /**
   * 处理下一步
   */
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * 处理上一步
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * 处理键盘事件
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

  /**
   * 跳转到指定步骤
   */
  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tutorial.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('tutorial.close')}
          >
            <XIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 步骤指示器 */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-blue-600 dark:bg-blue-500'
                      : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`${t('tutorial.goToStep')} ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 当前步骤内容 */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('tutorial.stepCounter', { current: currentStep + 1, total: steps.length })}
              </p>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {steps[currentStep].content}
              </p>
            </div>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
            {t('tutorial.previous')}
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('tutorial.keyboardHint')}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {t('tutorial.next')}
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              {t('tutorial.finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
