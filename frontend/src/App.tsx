// App.tsx 是前端 React 应用的根组件。
// 它负责：
// 1. 初始化跨越多年的贡献数据池；
// 2. 注入全局上下文（ThemeProvider, TranslationProvider, ConfigProvider）；
// 3. 实时监听系统/应用主题变化并同步给 Ant Design 组件库；
// 4. 执行全局环境检查 (如 Git 安装检测)。
import React, { useState, useEffect } from "react";
import "./App.css";
import { ThemeProvider } from 'next-themes';
import { ConfigProvider, theme as antTheme } from 'antd';
import { TranslationProvider, useTranslations, Language } from "./i18n";
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { EditorPage } from "./pages/EditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutPage } from "./pages/AboutPage";
import { OneDay } from "./types";
import GitInstallSidebar from "./components/GitInstallSidebar";

import Tutorial from "./components/Tutorial";
import { CheckGitInstalled } from "../wailsjs/go/main/App";

function App() {
	/**
	 * generateEmptyYearData：辅助函数，生成指定年份每一天的初始空白贡献数据。
	 */
	const generateEmptyYearData = (year: number): OneDay[] => {
		const data: OneDay[] = [];
		const start = new Date(year, 0, 1);
		const end = new Date(year, 11, 31);

		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			data.push({
				date: d.toISOString().slice(0, 10),
				count: 0,
				level: 0,
			});
		}
		return data;
	};

	/**
	 * generateMultiYearData：生成从 GitHub 诞生年 (2008) 到当前年份的全量空白数据。
	 */
	const generateMultiYearData = (): OneDay[] => {
		const data: OneDay[] = [];
		const currentYear = new Date().getFullYear();

		for (let year = 2008; year <= currentYear; year++) {
			data.push(...generateEmptyYearData(year));
		}
		return data;
	};

	const multiYearData: OneDay[] = generateMultiYearData();

	return (
		// ThemeProvider 处理 next-themes 亮暗色切换
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			{/* TranslationProvider 处理 i18n 国际化上下文 */}
			<TranslationProvider>
				<AppLayout contributions={multiYearData} />
			</TranslationProvider>
		</ThemeProvider>
	);
}

type AppLayoutProps = {
	contributions: OneDay[];
};

/**
 * AppLayout 组件：封装了实际的 UI 布局结构，并消费 TranslationContext。
 */
const AppLayout: React.FC<AppLayoutProps> = ({ contributions }) => {
	const { language } = useTranslations();
	// curTheme 用于向 AntD 的 ConfigProvider 传递算法（darkAlgorithm 或 defaultAlgorithm）
	const [curTheme, setCurTheme] = useState<'dark' | 'light'>('light');

	// 使用 MutationObserver 监听 <html> 标签上由 next-themes 注入的 'dark' 类名变化
	useEffect(() => {
		const observer = new MutationObserver(() => {
			if (document.documentElement.classList.contains('dark')) {
				setCurTheme('dark');
			} else {
				setCurTheme('light');
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	// 全局环境状态
	const [isGitInstalled, setIsGitInstalled] = useState<boolean | null>(null);
	const [showInstallGuide, setShowInstallGuide] = useState(false);
	const [showTutorial, setShowTutorial] = useState(false);

	// 模拟路由：通过 Overlay 状态显示不同的层级页面
	const [showSettingsPage, setShowSettingsPage] = useState(false);
	const [showAboutPage, setShowAboutPage] = useState(false);

	/**
	 * checkGit：调用 Wails 后端接口检查本机是否已配置 Git 环境。
	 */
	const checkGit = React.useCallback(async () => {
		try {
			const res = await CheckGitInstalled();
			// 兼容后端返回字段的大小写差异
			const isInstalled = !!(res.installed || (res as any).Installed);
			setIsGitInstalled(isInstalled);
			if (!isInstalled) setShowInstallGuide(true);
		} catch (e) {
			console.error("[App] CheckGitInstalled error:", e);
		}
	}, []);

	useEffect(() => { checkGit(); }, [checkGit]);

	return (
		<ConfigProvider
			theme={{
				// 自动根据全局主题选择 AntD 的算法
				algorithm: curTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
				token: {
					colorPrimary: '#1677ff',
					borderRadius: 6,
				},
				components: {
					Layout: {
						headerBg: curTheme === 'dark' ? '#141414' : '#fff',
						bodyBg: curTheme === 'dark' ? '#000' : '#f5f5f5',
					}
				}
			}}
			// 同步界面翻译语言
			locale={language === 'zh' ? zhCN : enUS}
		>
			<div className="h-screen w-screen overflow-hidden relative">
				{/* 默认渲染核心编辑器页面 */}
				<EditorPage
					contributions={contributions}
					onOpenSettings={() => setShowSettingsPage(true)}
					onOpenAbout={() => setShowAboutPage(true)}
					onOpenTutorial={() => setShowTutorial(true)}
					isGitInstalled={isGitInstalled}
				/>

				{/* 设置页面弹出层 */}
				{showSettingsPage && (
					<div className="absolute inset-0 z-50 bg-gray-50 dark:bg-black overflow-y-auto">
						<SettingsPage onBack={() => setShowSettingsPage(false)} />
					</div>
				)}

				{/* 关于页面弹出层 */}
				{showAboutPage && (
					<div className="absolute inset-0 z-50 bg-gray-50 dark:bg-black overflow-y-auto">
						<AboutPage onBack={() => setShowAboutPage(false)} />
					</div>
				)}
			</div>

			{/* Git 未安装时的引导说明栏 */}
			{showInstallGuide && (
				<GitInstallSidebar onCheckAgain={() => {
					checkGit();
					setShowInstallGuide(false);
				}} />
			)}

			{/* 初次进入或手动点击的新手教程 */}
			{showTutorial && (
				<Tutorial onClose={() => setShowTutorial(false)} />
			)}
		</ConfigProvider>
	);
};

export default App;


