/**
 * MainLayout.tsx 是应用的主布局组件。
 * 它提供了一个固定的侧边栏（导航与工具）以及一个响应式的主要内容展示区。
 */
import { Layout, Button, Tooltip, Avatar, Typography, Dropdown, MenuProps } from 'antd';
import {
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    ReadOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslations } from "../i18n";
import { useTheme } from 'next-themes';
import logo from '../assets/images/logo.png';

const { Sider, Content } = Layout;
const { Text } = Typography;

type Props = {
    children: React.ReactNode;   // 嵌套的页面内容
    userInfo: { username: string; email: string; avatarUrl?: string } | null; // 当前登录用户信息
    onLogin: () => void;         // 触发登录回调
    onLogout: () => void;        // 触发退出登录回调
    onOpenTutorial: () => void;  // 开启教程对话框
    onOpenSettings: () => void;  // 导航至设置页面
    onOpenAbout: () => void;     // 导航至关于页面
};

/**
 * MainLayout 组件：定义了应用的核心壳层结构。
 */
export const MainLayout: React.FC<Props> = ({
    children,
    userInfo,
    onLogin,
    onLogout,
    onOpenTutorial,
    onOpenSettings,
    onOpenAbout
}) => {
    const { t } = useTranslations();
    const { theme } = useTheme();

    // 构建用户头像下拉菜单项
    const userMenuItems: MenuProps['items'] = [
        ...(userInfo ? [
            {
                key: 'user-info',
                label: (
                    <div className="flex flex-col px-2 py-1">
                        <Text strong>{userInfo.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{userInfo.email}</Text>
                    </div>
                ),
            },
            { type: 'divider' as const },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: t('loginButton.logout'),
                onClick: onLogout,
                danger: true,
            },
        ] : [
            {
                key: 'login',
                icon: <LoginOutlined />,
                label: t('loginButton.loginWithGitHub'),
                onClick: onLogin,
            }
        ])
    ];

    return (
        <Layout className="h-screen overflow-hidden">
            {/* 侧边导航栏 (Sider) - 提供设置、关于、教程及用户状态入口 */}
            <Sider
                width={60}
                theme={theme === 'dark' ? 'dark' : 'light'}
                className="border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4"
                style={{ background: theme === 'dark' ? '#141414' : '#fff' }}
            >
                <div className="flex flex-col gap-4 w-full items-center">
                    {/* 应用 Logo 面板 */}
                    <Tooltip title="GreenWall" placement="right">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg mb-4 overflow-hidden shadow-sm">
                            <img src={logo} alt="GreenWall Logo" className="w-full h-full object-cover" />
                        </div>
                    </Tooltip>

                    {/* 设置按钮 */}
                    <Tooltip title={t('settings.git')} placement="right">
                        <Button
                            type="text"
                            icon={<SettingOutlined style={{ fontSize: '20px' }} />}
                            onClick={onOpenSettings}
                            size="large"
                            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
                        />
                    </Tooltip>

                    {/* 关于按钮 */}
                    <Tooltip title={t('about.title')} placement="right">
                        <Button
                            type="text"
                            icon={<InfoCircleOutlined style={{ fontSize: '20px' }} />}
                            onClick={onOpenAbout}
                            size="large"
                            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
                        />
                    </Tooltip>
                </div>

                <div className="mt-auto flex flex-col gap-4 w-full items-center mb-4">
                    {/* 使用手册/教程按钮 */}
                    <Tooltip title={t('tutorial.title')} placement="right">
                        <Button
                            type="text"
                            icon={<ReadOutlined style={{ fontSize: '20px' }} />}
                            onClick={onOpenTutorial}
                            size="large"
                            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
                        />
                    </Tooltip>

                    {/* 用户头像与状态下拉菜单 */}
                    <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
                        <Avatar
                            src={userInfo?.avatarUrl}
                            icon={<UserOutlined />}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            // 登录后头像背景颜色变化以增加视觉反馈
                            style={{ backgroundColor: userInfo ? '#87d068' : undefined }}
                        />
                    </Dropdown>
                </div>
            </Sider>

            {/* 主要内容区域 - 填充剩余空间 */}
            <Layout>
                <Content className="bg-gray-50 dark:bg-[#0a0a0a] relative flex flex-col">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};
