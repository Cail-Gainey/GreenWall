// SettingsPage.tsx 提供了应用的全局设置界面。
// 用户可以在此调整主题外观、切换界面语言、配置 Git 路径以及清理本地缓存数据。
import React from 'react';
import { Card, Select, Button, Typography, Space, message } from 'antd';
import { useTranslations } from '../i18n';
import { useTheme } from 'next-themes';
import { GitSettingsCard } from '../components/Settings/GitSettingsCard';
import { DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

type Props = {
    onBack: () => void; // 点击返回按钮的回调函数
};

/**
 * SettingsPage 组件：管理应用的偏好设置。
 */
export const SettingsPage: React.FC<Props> = ({ onBack }) => {
    const { t, language, setLanguage } = useTranslations();
    const { theme, setTheme } = useTheme();

    /**
     * handleClearCache：清理 localStorage 中的所有本地数据并强制刷新页面。
     * 用于解决数据配置冲突或重置应用状态。
     */
    const handleClearCache = () => {
        localStorage.clear();
        message.success(t('settings.cacheCleared'));
        // 延迟刷新以确保用户看到成功提示
        setTimeout(() => window.location.reload(), 1000);
    };

    return (
        <div className="p-8 max-w-3xl mx-auto w-full">
            {/* 页面头部：包含返回按钮和标题 */}
            <div className="flex items-center mb-8">
                <Button
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={onBack}
                    className="mr-4"
                />
                <Title level={2} style={{ margin: 0 }}>{t('settings.title')}</Title>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 外观设置卡片：支持主题切换（系统、亮色、暗色） */}
                <Card title={t('settings.appearance')}>
                    <div className="flex justify-between items-center mb-4">
                        <Text>{t('settings.theme')}</Text>
                        <Select
                            value={theme}
                            onChange={setTheme}
                            style={{ width: 120 }}
                            options={[
                                { value: 'system', label: t('settings.themeSystem') },
                                { value: 'light', label: t('settings.themeLight') },
                                { value: 'dark', label: t('settings.themeDark') },
                            ]}
                        />
                    </div>
                </Card>

                {/* 语言设置卡片：支持中英文切换 */}
                <Card title={t('settings.language')}>
                    <div className="flex justify-between items-center">
                        <Text>{t('settings.languageLabel')}</Text>
                        <Select
                            value={language}
                            onChange={setLanguage}
                            style={{ width: 120 }}
                            options={[
                                { value: 'en', label: 'English' },
                                { value: 'zh', label: '中文' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Git 专用设置卡片：处理自定义 Git 可执行路径 */}
                <GitSettingsCard />

                {/* 危险操作区：清理缓存 */}
                <Card title={t('settings.data')}>
                    <div className="flex justify-between items-center">
                        <div>
                            <Text strong>{t('settings.clearCache')}</Text>
                            <br />
                            <Text type="secondary">{t('settings.clearCacheDesc')}</Text>
                        </div>
                        <Button danger icon={<DeleteOutlined />} onClick={handleClearCache}>
                            {t('settings.clear')}
                        </Button>
                    </div>
                </Card>
            </Space>
        </div>
    );
};
