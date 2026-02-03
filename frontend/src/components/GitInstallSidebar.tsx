// GitInstallSidebar.tsx 是一个全局告警组件。
// 它在 App 检测到本地未安装 Git 时显示，负责引导用户完成 Git 的安装配置。
import React, { useState } from "react";
import { Card, Button, Typography, Space } from 'antd';
import { WarningOutlined, DownloadOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from "../i18n";

const { Text, Paragraph } = Typography;

interface GitInstallSidebarProps {
	onCheckAgain: () => void; // 重新检测 Git 状态的回调
}

/**
 * GitInstallSidebar 组件：提供多平台的 Git 安装指南。
 */
const GitInstallSidebar: React.FC<GitInstallSidebarProps> = ({ onCheckAgain }) => {
	const { t } = useTranslations();
	const [isExpanded, setIsExpanded] = useState(false); // 控制侧边栏展开/收起状态

	// 基于浏览器平台信息判断操作系统
	const isMac = navigator.platform.toLowerCase().includes("mac");
	const isLinux = navigator.platform.toLowerCase().includes("linux") ||
		navigator.platform.toLowerCase().includes("x11");

	/**
	 * getInstructions：返回符合当前操作系统的安装文本建议。
	 */
	const getInstructions = () => {
		if (isMac) return t("gitInstall.instructions.mac");
		if (isLinux) return t("gitInstall.instructions.linux");
		return t("gitInstall.instructions.windows");
	};

	/**
	 * getDownloadUrl：返回符合当前操作系统的官方下载页面链接。
	 */
	const getDownloadUrl = () => {
		if (isMac) return "https://git-scm.com/download/mac";
		if (isLinux) return "https://git-scm.com/download/linux";
		return "https://git-scm.com/download/win";
	};

	return (
		<div className="fixed bottom-20 left-4 z-40 flex flex-col items-start gap-2">
			{/* 1. 展开详情态：显示详细步骤和按钮 */}
			{isExpanded && (
				<Card
					style={{ width: 320, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
					title={t("gitInstall.title")}
					extra={
						<Button
							type="text"
							icon={<CloseOutlined />}
							onClick={() => setIsExpanded(false)}
							size="small"
						/>
					}
					size="small"
				>
					<Space direction="vertical" style={{ width: '100%' }}>
						<Paragraph type="secondary" style={{ marginBottom: 8 }}>
							{t("gitInstall.notInstalled")}
						</Paragraph>

						{/* 智能提示区域 */}
						<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm mb-2 border border-blue-100 dark:border-blue-800">
							<Text className="text-slate-700 dark:text-blue-100">{getInstructions()}</Text>
						</div>

						{/* 下载按钮 */}
						<Button
							type="primary"
							block
							href={getDownloadUrl()}
							target="_blank"
							icon={<DownloadOutlined />}
						>
							{t("gitInstall.downloadLink")}
						</Button>

						{/* 重新检测按钮：安装完成后用户可手动触发 */}
						<Button
							block
							onClick={onCheckAgain}
							icon={<ReloadOutlined />}
						>
							{t("gitInstall.checkAgain")}
						</Button>
					</Space>
				</Card>
			)}

			{/* 2. 收起告警态：显眼的危险提示按钮，引导用户点击展开 */}
			{!isExpanded && (
				<Button
					type="primary"
					danger
					shape="round"
					icon={<WarningOutlined />}
					onClick={() => setIsExpanded(true)}
					size="large"
					style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
				>
					{t("gitInstall.notInstalledLabel")}
				</Button>
			)}
		</div>
	);
};

export default GitInstallSidebar;

