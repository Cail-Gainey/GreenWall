import React from 'react';
import { Button, Space, Typography, Tooltip, Segmented } from 'antd';
import {
    CloudUploadOutlined,
    ImportOutlined,
    ExportOutlined,
    SunOutlined,
    MoonOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { useTranslations } from '../../i18n';
import { useTheme } from 'next-themes';

const { Text } = Typography;

type Props = {
    onImport: () => void;
    onExport: () => void;
    onGenerate: () => void;
    isGitInstalled?: boolean | null;
    onOpenSettings: () => void;
};

export const EditorHeader: React.FC<Props> = ({
    onImport,
    onExport,
    onGenerate,
    isGitInstalled,
    onOpenSettings
}) => {
    const { t, language, setLanguage } = useTranslations();
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors duration-300 sticky top-0 z-50" >
            {/* Left: View Settings */}
            < div className="flex items-center gap-6" >
                {/* Language Switcher */}
                < Segmented
                    value={language}
                    onChange={(val) => setLanguage(val as 'en' | 'zh')}
                    options={
                        [
                            { label: 'English', value: 'en' },
                            { label: '中文', value: 'zh' },
                        ]}
                    size="small"
                />

                {/* Theme Toggle */}
                < Tooltip title={t('settings.theme')} >
                    <Button
                        type="text"
                        icon={theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="text-gray-500 hover:text-blue-500"
                    />
                </Tooltip >

                <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

                {/* Git Status */}
                {
                    isGitInstalled === false ? (
                        <Tooltip title={t('gitInstall.notInstalled')}>
                            <Button
                                type="text"
                                danger
                                icon={<WarningOutlined />}
                                onClick={onOpenSettings}
                                className="flex items-center"
                            >
                                <Text type="danger" className="text-xs font-semibold ml-1 hidden sm:inline">{t('gitInstall.notInstalledLabel')}</Text>
                            </Button>
                        </Tooltip>
                    ) : (
                        <Tooltip title={isGitInstalled === true ? t('gitStatus.installed') : t('gitStatus.checking')}>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded ${isGitInstalled ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400'}`}>
                                {isGitInstalled ? <CheckCircleOutlined /> : <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />}
                                <span className="text-xs font-medium hidden sm:inline">Git</span>
                            </div>
                        </Tooltip>
                    )
                }
            </div >

            {/* Right: Actions */}
            < div className="flex items-center gap-3" >
                <Space>
                    <Tooltip title={t('titles.import')}>
                        <Button type="text" icon={<ImportOutlined />} onClick={onImport} size="middle">
                            {t('buttons.import')}
                        </Button>
                    </Tooltip>
                    <Tooltip title={t('titles.export')}>
                        <Button type="text" icon={<ExportOutlined />} onClick={onExport} size="middle">
                            {t('buttons.export')}
                        </Button>
                    </Tooltip>
                </Space>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={onGenerate}
                    className="bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-none shadow-none"
                >
                    {t('buttons.generate')}
                </Button>
            </div >
        </div >
    );
};
