import React from "react";
import { Button, Avatar, Card, Space, Typography, Spin } from 'antd';
import { UserOutlined, LogoutOutlined, GithubOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslations } from "../i18n";

const { Text } = Typography;

/**
 * LoginButton 组件
 * 显示登录按钮或已登录用户信息
 */
type Props = {
	userInfo: { username: string; email: string; avatarUrl?: string } | null;
	onLogin: () => void;
	onLogout: () => void;
	isLoggingIn?: boolean;
	loginProgress?: string;
};

export const LoginButton: React.FC<Props> = ({
	userInfo,
	onLogin,
	onLogout,
	isLoggingIn = false,
	loginProgress = "",
}) => {
	const { t } = useTranslations();

	if (userInfo) {
		// 已登录状态
		return (
			<Card size="small" style={{ width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
				<div className="flex items-center justify-between">
					<Space>
						<Avatar
							src={userInfo.avatarUrl}
							icon={<UserOutlined />}
							style={{ backgroundColor: '#87d068' }}
						/>
						<div className="flex flex-col">
							<Text strong>{userInfo.username}</Text>
							<Text type="secondary" style={{ fontSize: '12px' }}>{userInfo.email}</Text>
						</div>
					</Space>
					<Button
						type="text"
						danger
						icon={<LogoutOutlined />}
						onClick={onLogout}
						title={t("loginButton.logoutTitle")}
					/>
				</div>
			</Card>
		);
	}

	// 未登录状态
	return (
		<div className="flex flex-col gap-2 w-full">
			<Button
				block
				type={isLoggingIn ? "default" : "primary"}
				icon={isLoggingIn ? <LoadingOutlined /> : <GithubOutlined />}
				onClick={onLogin}
				size="large"
				loading={isLoggingIn}
				style={{ backgroundColor: isLoggingIn ? undefined : '#24292e' }}
			>
				{isLoggingIn ? t("loginButton.loggingIn") : t("loginButton.loginWithGitHub")}
			</Button>

			{isLoggingIn && (
				<div className="text-center">
					{loginProgress && (
						<div className="mb-2">
							<Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
							<Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
								{loginProgress}
							</Text>
						</div>
					)}
					<Text type="secondary" style={{ fontSize: '12px' }}>
						{t("loginButton.loginHint")}
					</Text>
				</div>
			)}
		</div>
	);
};
