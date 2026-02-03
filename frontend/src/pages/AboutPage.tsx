// AboutPage.tsx 是应用的“关于”页面。
// 用于展示项目图标、版本号、功能介绍、GitHub 源码链接以及版权声明。
import React from 'react';
import { Card, Typography, Button, Divider } from 'antd';
import { useTranslations } from '../i18n';
import { GithubOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import * as pkg from '../../package.json';
import logo from '../assets/images/logo.png';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

const { Title, Text, Paragraph } = Typography;

type Props = {
    onBack: () => void; // 返回主界面的回调函数
};

/**
 * AboutPage 组件：展示软件信息与致谢。
 */
export const AboutPage: React.FC<Props> = ({ onBack }) => {
    const { t } = useTranslations();

    return (
        <div className="p-8 max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[60vh]">
            {/* 顶部导航区：返回按钮 */}
            <div className="w-full flex items-start mb-4">
                <Button
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={onBack}
                />
            </div>

            {/* 品牌信息区：Logo、应用名与版本号 */}
            <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white dark:border-gray-700">
                    <img src={logo} alt="GreenWall Logo" className="w-full h-full object-cover" />
                </div>
                <Title level={2}>GreenWall</Title>
                <Text type="secondary">{t('about.version', { version: pkg.version })}</Text>
            </div>

            {/* 功能介绍与外部链接 */}
            <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                <Paragraph className="text-center">
                    {t('about.description')}
                </Paragraph>

                <Divider />

                <div className="flex justify-center gap-4">
                    <Button
                        type="primary"
                        icon={<GithubOutlined />}
                        // 调用 Wails 运行时方法在系统默认浏览器中打开链接
                        onClick={() => BrowserOpenURL("https://github.com/Cail-Gainey/GreenWall")}
                    >
                        {t('about.github')}
                    </Button>
                </div>
            </Card>

            {/* 页脚：动态版权年份 */}
            <div className="mt-8 text-center text-gray-400 text-xs">
                <Text type="secondary">{t('about.copyright', { year: new Date().getFullYear() })}</Text>
            </div>
        </div>
    );
};
