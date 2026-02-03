import React, { useState, useEffect } from "react";
import { Card, Input, Button, Alert, Typography, Space, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslations } from "../../i18n";
import { GetGitPath, SetGitPath } from "../../../wailsjs/go/main/App";

const { Text } = Typography;

// Detect OS helper
const detectOS = (): 'windows' | 'mac' | 'linux' => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') !== -1) return 'windows';
    if (userAgent.indexOf('mac') !== -1) return 'mac';
    return 'linux';
};

export const GitSettingsCard: React.FC = () => {
    const { t } = useTranslations();
    const [customGitPath, setCustomGitPath] = useState("");
    const [currentGitPath, setCurrentGitPath] = useState<string>("");
    const [isSettingPath, setIsSettingPath] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [messageState, setMessageState] = useState<{ type: 'success' | 'error', content: string } | null>(null);
    const [os] = useState(detectOS());

    // Load current Git path
    const loadCurrentPath = async () => {
        try {
            const path = await GetGitPath();
            setCurrentGitPath(path || "");
        } catch (error) {
            console.error("Failed to get Git path:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentPath();
    }, []);

    const getExamplePath = () => {
        switch (os) {
            case 'windows': return 'C:\\Program Files\\Git\\bin\\git.exe';
            case 'mac': return '/usr/local/bin/git';
            case 'linux': return '/usr/bin/git';
        }
    };

    const getPlatformInstructions = () => {
        switch (os) {
            case 'windows': return t('gitPathSettings.cmdWindows');
            case 'mac': return t('gitPathSettings.cmdMac');
            case 'linux': return t('gitPathSettings.cmdLinux');
        }
    };

    const handleSetGitPath = async () => {
        if (!customGitPath.trim()) return;

        setIsSettingPath(true);
        setMessageState(null);

        try {
            const result = await SetGitPath({ gitPath: customGitPath });

            if (result.success) {
                setMessageState({
                    type: 'success',
                    content: t("gitPathSettings.setSuccessWithVersion", { version: result.version })
                });
                setCurrentGitPath(customGitPath);
                setCustomGitPath("");
            } else {
                setMessageState({
                    type: 'error',
                    content: t("gitPathSettings.setError", { message: result.message })
                });
            }
        } catch (error) {
            setMessageState({
                type: 'error',
                content: t("gitPathSettings.setError", { message: (error as Error).message })
            });
        } finally {
            setIsSettingPath(false);
        }
    };

    const handleResetGitPath = async () => {
        setIsSettingPath(true); // Re-use loading state for reset
        setMessageState(null);

        try {
            const result = await SetGitPath({ gitPath: "" });

            if (result.success) {
                setMessageState({
                    type: 'success',
                    content: t("gitPathSettings.resetSuccessWithVersion", { version: result.version })
                });
                setCurrentGitPath("");
                setCustomGitPath("");
            } else {
                setMessageState({
                    type: 'error',
                    content: t("gitPathSettings.resetError", { message: result.message })
                });
            }
        } catch (error) {
            setMessageState({
                type: 'error',
                content: t("gitPathSettings.resetError", { message: (error as Error).message })
            });
        } finally {
            setIsSettingPath(false);
        }
    };

    return (
        <Card title={t('settings.git')}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">

                {/* OS Info & Intro */}
                <Alert
                    message={
                        <Space>
                            <InfoCircleOutlined />
                            <span>{t("gitPathSettings.detectedOS")} <Text strong>{os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux'}</Text></span>
                        </Space>
                    }
                    type="info"
                    className="border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900"
                />

                {/* Current Path Display */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div>
                        <Text type="secondary" className="text-xs uppercase font-bold tracking-wider block mb-1">
                            {t("gitPathSettings.currentPath")}
                        </Text>
                        <Text strong className={!currentGitPath ? "text-slate-400 italic" : "font-mono text-slate-700 dark:text-slate-300"}>
                            {isLoading ? t("gitPathSettings.loading") : (currentGitPath || t("gitPathSettings.currentPathDefault"))}
                        </Text>
                    </div>
                    {currentGitPath && (
                        <Tooltip title={t("gitPathSettings.reset")}>
                            <Button
                                type="text"
                                icon={<ReloadOutlined />}
                                onClick={handleResetGitPath}
                                loading={isSettingPath}
                            />
                        </Tooltip>
                    )}
                </div>

                {/* Set New Path Input */}
                <div>
                    <Text className="mb-2 block">{t("gitPathSettings.newPath")}</Text>
                    <div className="flex gap-2">
                        <Input
                            value={customGitPath}
                            onChange={(e) => {
                                setCustomGitPath(e.target.value);
                                setMessageState(null);
                            }}
                            placeholder={getExamplePath()}
                            allowClear
                            status={messageState?.type === 'error' ? 'error' : ''}
                        />
                        <Button
                            type="primary"
                            onClick={handleSetGitPath}
                            disabled={!customGitPath.trim() || isSettingPath}
                            loading={isSettingPath}
                            icon={<SaveOutlined />}
                        >
                            {t("gitPathSettings.setPath")}
                        </Button>
                    </div>
                    <Text type="secondary" className="text-xs mt-1 block">
                        💡 {getPlatformInstructions()}
                    </Text>
                </div>

                {/* Feedback Message */}
                {messageState && (
                    <Alert
                        message={messageState.content}
                        type={messageState.type}
                        showIcon
                        closable
                        onClose={() => setMessageState(null)}
                    />
                )}
            </Space>
        </Card>
    );
};
