import React from "react";

export type Language = "en" | "zh";

type TranslationDict = {
	languageName: string;
	labels: {
		githubUsername: string;
		githubEmail: string;
		repoName: string;
		year: string;
		drawMode: string;
		actions: string;
		language: string;
		dataActions: string;
	};
	placeholders: {
		githubUsername: string;
		githubEmail: string;
		repoName: string;
	};
	drawModes: {
		pen: string;
		eraser: string;
	};
	buttons: {
		allGreen: string;
		reset: string;
		generateRepo: string;
		generating: string;
		export: string;
		import: string;
	};
	titles: {
		pen: string;
		eraser: string;
		allGreen: string;
		reset: string;
		generate: string;
		export: string;
		import: string;
	};
	messages: {
		generateRepoMissing: string;
		generateRepoError: string;
		noContributions: string;
		exportSuccess: string;
		exportError: string;
		importSuccess: string;
		importError: string;
	};
	gitInstall: {
		title: string;
		notInstalled: string;
		notInstalledLabel: string;
		downloadLink: string;
		close: string;
		instructions: {
			windows: string;
			mac: string;
			linux: string;
		};
		checkAgain: string;
		version: string;
	};
	gitPathSettings: {
		title: string;
		description: string;
		label: string;
		placeholder: string;
		setPath: string;
		setting: string;
		reset: string;
		resetSuccess: string;
		setSuccess: string;
		setError: string;
		resetError: string;
		pathNotFound: string;
		noteTitle: string;
		noteEmpty: string;
		noteCustom: string;
		noteManualCheck: string;
		detectedOS: string;
		currentPath: string;
		currentPathDefault: string;
		newPath: string;
		clearInput: string;
		loading: string;
	};
	calendar: {
		totalContributions: string;
		tooltipNone: string;
		tooltipSome: string;
		tooltipFuture: string;
		legendLess: string;
		legendMore: string;
	};
	characterSelector: {
		title: string;
		selectCharacter: string;
		tabUppercase: string;
		tabLowercase: string;
		tabNumbers: string;
		tabSymbols: string;
		previewTooltip: string;
		characterTool: string;
		cancelPreview: string;
		character: string;
	};
	pushDialog: {
		title: string;
		newRepo: string;
		existingRepo: string;
		repoName: string;
		repoNamePlaceholder: string;
		selectRepo: string;
		selectRepoPlaceholder: string;
		privateRepo: string;
		forcePush: string;
		forcePushWarning: string;
		commitCount: string;
		cancel: string;
		push: string;
		pushing: string;
		nameRules: string;
		nameWarningChinese: string;
		nameWarningInvalid: string;
		emptyNameError: string;
		invalidNameError: string;
		language: string;
		languageHint: string;
		multiLanguageMode: string;
		multiLanguageModeHint: string;
		languageConfig: string;
		totalRatio: string;
		addLanguage: string;
		deleteLanguage: string;
		lockedTooltip: string;
		unlockedTooltip: string;
		ratioWarning: string;
		autoDistributeTip: string;
		ratioDistributeTip: string;
		noLanguageError: string;
		zeroRatioError: string;
	};
	loginButton: {
		logout: string;
		logoutTitle: string;
		loginWithGitHub: string;
		loggingIn: string;
		cancelLoginTitle: string;
		loginTitle: string;
		loginHint: string;
		logoutSuccess: string;
		logoutFailed: string;
	};
	months: string[];
	weekdays: {
		mon: string;
		wed: string;
		fri: string;
	};
	languageSwitcher: {
		english: string;
		chinese: string;
	};
	tutorial: {
		title: string;
		close: string;
		previous: string;
		next: string;
		finish: string;
		goToStep: string;
		stepCounter: string;
		keyboardHint: string;
		steps: Array<{
			title: string;
			content: string;
		}>;
	};
};

const translations: Record<Language, TranslationDict> = {
	en: {
		languageName: "English",
		labels: {
			githubUsername: "GitHub Username",
			githubEmail: "GitHub Email",
			repoName: "Repository Name",
			year: "Year",
			drawMode: "Draw Mode",
			actions: "Actions",
			language: "Language",
			dataActions: "Data Actions",
		},
		placeholders: {
			githubUsername: "octocat",
			githubEmail: "monalisa@github.com",
			repoName: "my-contributions",
		},
		drawModes: {
			pen: "Pen",
			eraser: "Eraser",
		},
		buttons: {
			allGreen: "All Green",
			reset: "Reset",
			generateRepo: "Generate Repo",
			generating: "Generating...",
			export: "Export",
			import: "Import",
		},
		titles: {
			pen: "Pen mode - click or drag to add contributions",
			eraser: "Eraser mode - click or drag to clear contributions",
			allGreen: "Set all contributions to green",
			reset: "Clear all customised contribution data",
			generate: "Create a local git repository matching this contribution calendar",
			export: "Export current contributions to a JSON file",
			import: "Import contributions from a JSON file",
		},
		messages: {
			generateRepoMissing:
				"Please provide a GitHub username and email before generating a repository.",
			noContributions: "No contributions to generate. Add contributions first.",
			generateRepoError: "Failed to generate repository: {{message}}",
			exportSuccess: "Contributions exported to {{filePath}}",
			exportError: "Failed to export contributions: {{message}}",
			importSuccess: "Contributions imported successfully",
			importError: "Failed to import contributions: {{message}}",
		},
		gitInstall: {
			title: "Git Installation Required",
			notInstalled: "Git is not installed on your system. Please install Git to use this application.",
			notInstalledLabel: "Git Not Installed",
			downloadLink: "Download Git",
			close: "Close",
			instructions: {
				windows: "For Windows: Download Git from the official website and run the installer.",
				mac: "For macOS: Use Homebrew with 'brew install git' or download from the official website.",
				linux: "For Linux: Use your package manager (e.g., 'sudo apt install git' for Ubuntu).",
			},
			checkAgain: "Check Again",
			version: "Git Version: {{version}}",
		},
		gitPathSettings: {
			title: "Git Path Settings",
			description: "If Git is installed but not added to system PATH, enter the full path to the Git executable.",
			label: "Git Executable Path",
			placeholder: "e.g.: C:\\Program Files\\Git\\bin\\git.exe",
			setPath: "Set Path",
			setting: "Setting...",
			reset: "Reset to Default",
			resetSuccess: "Reset to default successfully",
			setSuccess: "Git path set successfully",
			setError: "Failed to set path: {{message}}",
			resetError: "Failed to reset: {{message}}",
			pathNotFound: "Specified path does not exist",
			noteTitle: "Note:",
			noteEmpty: "Leave empty or click 'Reset to Default' to use the git command from system PATH",
			noteCustom: "Enter full path (e.g., C:\\Program Files\\Git\\bin\\git.exe) to use that git executable",
			noteManualCheck: "You need to manually check Git status after setting",
			detectedOS: "Detected system:",
			currentPath: "Current Git Path",
			currentPathDefault: "Use system default path (git)",
			newPath: "Set New Git Path",
			clearInput: "Clear input",
			loading: "Loading...",
		},
		calendar: {
			totalContributions: "{{count}} contributions in {{year}}",
			tooltipNone: "No contributions on {{date}} - Click to add!",
			tooltipSome: "{{count}} contributions on {{date}}",
			tooltipFuture: "Upcoming date {{date}} - editing disabled",
			legendLess: "Less",
			legendMore: "More",
		},
		characterSelector: {
			title: "Select Pattern",
			selectCharacter: "Select Character (A-Z, a-z, 0-9)",
			tabUppercase: "A-Z",
			tabLowercase: "a-z",
			tabNumbers: "0-9",
			tabSymbols: "🎨 Symbols",
			previewTooltip: "Preview character: {{char}}",
			characterTool: "Character Tool",
			cancelPreview: "Cancel Preview",
			character: "Character",
		},
		pushDialog: {
			title: "Push to GitHub",
			newRepo: "New Repository",
			existingRepo: "Existing Repository",
			repoName: "Repository Name",
			repoNamePlaceholder: "my-contributions",
			selectRepo: "Select Repository",
			selectRepoPlaceholder: "-- Select a repository --",
			privateRepo: "Make repository private",
			forcePush: "Force push (overwrite remote history)",
			forcePushWarning: "⚠️ Warning: Force push will overwrite the remote repository's commit history!",
			commitCount: "Will push: {{count}} commits",
			cancel: "Cancel",
			push: "Start Push",
			pushing: "Pushing...",
			nameRules: "Only letters, numbers, hyphens(-), underscores(_), and dots(.) are allowed",
			nameWarningChinese: "Contains Chinese or special characters, will be converted to: {{name}}",
			nameWarningInvalid: "Contains invalid characters, will be converted to: {{name}}",
			emptyNameError: "Please enter or select a repository name",
			invalidNameError: "Invalid repository name. Please use letters, numbers, hyphens, underscores, or dots",
			language: "Programming Language",
			languageHint: "Select the programming language for the generated repository",
			multiLanguageMode: "Enable Multi-Language Mode",
			multiLanguageModeHint: "Mix multiple programming languages with custom ratios",
			languageConfig: "Language Configuration",
			totalRatio: "Total Ratio",
			addLanguage: "+ Add Language",
			deleteLanguage: "Delete",
			lockedTooltip: "Locked - Won't be auto-adjusted",
			unlockedTooltip: "Auto-distributed - Will adjust based on other languages",
			ratioWarning: "⚠️ Warning: Total ratio exceeds 100%, please adjust",
			autoDistributeTip: "💡 After modifying ratio, it will be locked (🔒), and other unlocked languages will auto-adjust",
			ratioDistributeTip: "📊 System will distribute commits to different languages by ratio",
			noLanguageError: "Please add at least one language",
			zeroRatioError: "Total ratio cannot be 0",
		},
		loginButton: {
			logout: "Logout",
			logoutTitle: "Logout",
			loginWithGitHub: "GitHub Quick Login",
			loggingIn: "Logging in... (Click to cancel)",
			cancelLoginTitle: "Click to cancel login",
			loginTitle: "Login with GitHub account",
			loginHint: "Please complete authorization in browser, or click button to cancel",
			logoutSuccess: "Logged out successfully",
			logoutFailed: "Logout failed: {{message}}",
		},
		months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		weekdays: {
			mon: "Mon",
			wed: "Wed",
			fri: "Fri",
		},
		languageSwitcher: {
			english: "English",
			chinese: "中文",
		},
		tutorial: {
			title: "User Guide",
			close: "Close",
			previous: "Previous",
			next: "Next",
			finish: "Get Started",
			goToStep: "Go to step",
			stepCounter: "Step {{current}} of {{total}}",
			keyboardHint: "Use ← → arrow keys to navigate",
			steps: [
				{
					title: "Welcome to GreenWall!",
					content: "GreenWall is a powerful tool that helps you customize your GitHub contribution calendar. You can draw patterns, write text, or create any design you want on your contribution graph.\n\nLet's learn how to use it!"
				},
				{
					title: "Drawing Tools",
					content: "Use the drawing tools in the control panel to customize your contribution calendar:\n\n• Pen Mode: Click or drag on the calendar to add contributions\n• Eraser Mode: Click or drag to remove contributions\n• Character Tool: Quickly draw letters, numbers, or symbols\n\nYou can switch between different years to create multi-year patterns."
				},
				{
					title: "Quick Actions",
					content: "The action buttons help you quickly manage your contribution data:\n\n• All Green: Fill the entire calendar with contributions\n• Reset: Clear all customized contribution data\n• Export: Save your design as a JSON file\n• Import: Load a previously saved design"
				},
				{
					title: "Generate Repository",
					content: "Once you're satisfied with your design, click the 'Generate Repo' button:\n\n1. Enter your GitHub username and email\n2. Choose a repository name\n3. Select programming language (supports 20+ languages)\n4. Enable multi-language mode for mixed language projects\n5. Click 'Generate Repo' to create a local Git repository"
				},
				{
					title: "Push to GitHub",
					content: "After generating the repository, you can push it to GitHub:\n\n1. Use 'GitHub Quick Login' to authenticate (optional but recommended)\n2. Choose to create a new repository or select an existing one\n3. Configure repository settings (public/private)\n4. Click 'Start Push' to upload to GitHub\n\nYour custom contribution calendar will appear on your GitHub profile!"
				},
				{
					title: "Settings & Tips",
					content: "Additional features to enhance your experience:\n\n• Git Path Settings: Configure custom Git executable path\n• Theme Toggle: Switch between light and dark mode\n• Language Switcher: Choose between English and Chinese\n• Multi-year Support: Create patterns spanning multiple years"
				}
			]
		},
	},
	zh: {
		languageName: "中文",
		labels: {
			githubUsername: "GitHub 用户名",
			githubEmail: "GitHub 邮箱",
			repoName: "仓库名称",
			year: "年份",
			drawMode: "绘制模式",
			actions: "操作",
			language: "语言",
			dataActions: "数据操作",
		},
		placeholders: {
			githubUsername: "octocat",
			githubEmail: "monalisa@github.com",
			repoName: "my-contributions",
		},
		drawModes: {
			pen: "画笔",
			eraser: "橡皮擦",
		},
		buttons: {
			allGreen: "全绿",
			reset: "重置",
			generateRepo: "生成仓库",
			generating: "生成中...",
			export: "导出",
			import: "导入",
		},
		titles: {
			pen: "画笔模式 - 点击或拖拽添加贡献",
			eraser: "橡皮擦模式 - 点击或拖拽清除贡献",
			allGreen: "将所有贡献设置为绿色",
			reset: "清除所有自定义贡献数据",
			generate: "创建与当前贡献图匹配的本地 Git 仓库",
			export: "导出当前贡献数据到 JSON 文件",
			import: "从 JSON 文件导入贡献数据",
		},
		messages: {
			generateRepoMissing: "请先填写 GitHub 用户名和邮箱，然后再生成仓库。",
			noContributions: "没有可生成的贡献，请先添加贡献。",
			generateRepoError: "生成仓库失败：{{message}}",
			exportSuccess: "贡献数据已导出到 {{filePath}}",
			exportError: "导出贡献数据失败：{{message}}",
			importSuccess: "贡献数据已成功导入",
			importError: "导入贡献数据失败：{{message}}",
		},
		gitInstall: {
			title: "需要安装 Git",
			notInstalled: "系统未安装 Git。请安装 Git 以使用此应用程序。",
			notInstalledLabel: "Git 未安装",
			downloadLink: "下载 Git",
			close: "关闭",
			instructions: {
				windows: "Windows 系统：从官方网站下载 Git 并运行安装程序。",
				mac: "macOS 系统：使用 Homebrew 运行 'brew install git' 或从官方网站下载。",
				linux: "Linux 系统：使用包管理器安装（如 Ubuntu 使用 'sudo apt install git'）。",
			},
			checkAgain: "再次检测",
			version: "Git 版本：{{version}}",
		},
		gitPathSettings: {
			title: "Git 路径设置",
			description: "如果 Git 已安装但未添加到系统 PATH，请输入 Git 可执行文件的完整路径。",
			label: "Git 可执行文件路径",
			placeholder: "例如: C:\\Program Files\\Git\\bin\\git.exe",
			setPath: "设置路径",
			setting: "设置中...",
			reset: "重置为默认",
			resetSuccess: "已重置为默认路径",
			setSuccess: "Git 路径设置成功",
			setError: "设置失败：{{message}}",
			resetError: "重置失败：{{message}}",
			pathNotFound: "指定的路径不存在",
			noteTitle: "说明：",
			noteEmpty: "留空或点击'重置为默认'将使用系统 PATH 中的 git 命令",
			noteCustom: "输入完整路径（如 C:\\Program Files\\Git\\bin\\git.exe）将使用该路径的 git 可执行文件",
			noteManualCheck: "设置后需要手动检查 Git 状态",
			detectedOS: "检测到系统:",
			currentPath: "当前Git路径",
			currentPathDefault: "使用系统默认路径 (git)",
			newPath: "设置新的Git路径",
			clearInput: "清空输入",
			loading: "加载中...",
		},
		calendar: {
			totalContributions: "{{year}} 年共 {{count}} 次贡献",
			tooltipNone: "{{date}} 没有贡献 - 点击添加！",
			tooltipSome: "{{date}} 有 {{count}} 次贡献",
			tooltipFuture: "{{date}} 为未来日期，禁止编辑",
			legendLess: "较少",
			legendMore: "更多",
		},
		characterSelector: {
			title: "选择图案",
			selectCharacter: "选择字符 (A-Z, a-z, 0-9)",
			tabUppercase: "A-Z",
			tabLowercase: "a-z",
			tabNumbers: "0-9",
			tabSymbols: "🎨 符号",
			previewTooltip: "预览字符: {{char}}",
			characterTool: "字符工具",
			cancelPreview: "取消预览",
			character: "字符",
		},
		pushDialog: {
			title: "推送到 GitHub",
			newRepo: "新建仓库",
			existingRepo: "选择现有仓库",
			repoName: "仓库名称",
			repoNamePlaceholder: "my-contributions",
			selectRepo: "选择仓库",
			selectRepoPlaceholder: "-- 选择一个仓库 --",
			privateRepo: "设为私有仓库",
			forcePush: "强制推送（覆盖远程历史）",
			forcePushWarning: "⚠️ 警告：强制推送会覆盖远程仓库的提交历史！",
			commitCount: "将要推送：{{count}} 个提交",
			cancel: "取消",
			push: "开始推送",
			pushing: "推送中...",
			nameRules: "只能包含字母、数字、连字符(-)、下划线(_)、点(.)",
			nameWarningChinese: "包含中文或特殊字符，将自动转换为: {{name}}",
			nameWarningInvalid: "包含不允许的字符，将自动转换为: {{name}}",
			emptyNameError: "请输入或选择仓库名称",
			invalidNameError: "仓库名无效，请使用字母、数字、连字符、下划线或点",
			language: "编程语言",
			languageHint: "选择生成仓库使用的编程语言",
			multiLanguageMode: "启用多语言模式",
			multiLanguageModeHint: "混合使用多种编程语言，自定义每种语言的比例",
			languageConfig: "语言配置",
			totalRatio: "总比例",
			addLanguage: "+ 添加语言",
			deleteLanguage: "删除",
			lockedTooltip: "已锁定 - 不会自动调整",
			unlockedTooltip: "自动分配 - 会根据其他语言调整",
			ratioWarning: "⚠️ 警告：总比例超过100%，建议调整",
			autoDistributeTip: "💡 修改比例后会自动锁定（🔒），其他未锁定的语言会自动调整",
			ratioDistributeTip: "📊 系统会按比例循环分配提交到不同语言",
			noLanguageError: "请至少添加一种语言",
			zeroRatioError: "语言比例总和不能为0",
		},
		loginButton: {
			logout: "退出",
			logoutTitle: "退出登录",
			loginWithGitHub: "GitHub 快捷登录",
			loggingIn: "登录中... (点击取消)",
			cancelLoginTitle: "点击取消登录",
			loginTitle: "使用GitHub账号快捷登录",
			loginHint: "请在浏览器中完成授权，或点击按钮取消",
			logoutSuccess: "已退出登录",
			logoutFailed: "退出登录失败: {{message}}",
		},
		months: [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"11",
			"12",
		],
		weekdays: {
			mon: "一",
			wed: "三",
			fri: "五",
		},
		languageSwitcher: {
			english: "English",
			chinese: "中文",
		},
		tutorial: {
			title: "使用教程",
			close: "关闭",
			previous: "上一步",
			next: "下一步",
			finish: "开始使用",
			goToStep: "跳转到步骤",
			stepCounter: "第 {{current}} 步，共 {{total}} 步",
			keyboardHint: "使用 ← → 方向键导航",
			steps: [
				{
					title: "欢迎使用 GreenWall!",
					content: "GreenWall 是一个强大的工具，帮助您自定义 GitHub 贡献日历。您可以在贡献图上绘制图案、书写文字或创建任何您想要的设计。\n\n让我们开始学习如何使用它！"
				},
				{
					title: "绘图工具",
					content: "使用控制面板中的绘图工具来自定义您的贡献日历：\n\n• 画笔模式：点击或拖动日历来添加贡献\n• 橡皮擦模式：点击或拖动来移除贡献\n• 字符工具：快速绘制字母、数字或符号\n\n您可以切换不同年份来创建跨年图案。"
				},
				{
					title: "快捷操作",
					content: "操作按钮帮助您快速管理贡献数据：\n\n• 全绿：用贡献填充整个日历\n• 重置：清除所有自定义贡献数据\n• 导出：将您的设计保存为 JSON 文件\n• 导入：加载之前保存的设计"
				},
				{
					title: "生成仓库",
					content: "当您对设计满意后，点击「生成仓库」按钮：\n\n1. 输入您的 GitHub 用户名和邮箱\n2. 选择仓库名称\n3. 选择编程语言（支持 20+ 种语言）\n4. 启用多语言模式以混合多种语言项目\n5. 点击「生成仓库」创建本地 Git 仓库"
				},
				{
					title: "推送到 GitHub",
					content: "生成仓库后，您可以将其推送到 GitHub：\n\n1. 使用「GitHub 快捷登录」进行身份验证（可选但推荐）\n2. 选择创建新仓库或选择现有仓库\n3. 配置仓库设置（公开/私有）\n4. 点击「开始推送」上传到 GitHub\n\n您的自定义贡献日历将出现在您的 GitHub 个人资料中！"
				},
				{
					title: "设置与技巧",
					content: "增强您使用体验的额外功能：\n\n• Git 路径设置：配置自定义 Git 可执行文件路径\n• 主题切换：在亮色和暗色模式之间切换\n• 语言切换：在中英文之间选择\n• 多年支持：创建跨越多年的图案"
				}
			]
		},
	},
};

type TranslationContextValue = {
	language: Language;
	setLanguage: (language: Language) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
	dictionary: TranslationDict;
};

const LANGUAGE_STORAGE_KEY = "github-contributor.language";

const TranslationContext = React.createContext<TranslationContextValue | undefined>(undefined);

function interpolate(template: string, params?: Record<string, string | number>) {
	if (!params) {
		return template;
	}
	return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
		const key = rawKey.trim();
		const value = params[key];
		return value === undefined ? `{{${key}}}` : String(value);
	});
}

function resolveKey(dictionary: TranslationDict, key: string): string | undefined {
	const parts = key.split(".");
	let current: any = dictionary;

	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = current[part];
		} else {
			return undefined;
		}
	}

	return typeof current === "string" ? current : undefined;
}

export const TranslationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [language, setLanguageState] = React.useState<Language>(() => {
		if (typeof window === "undefined") {
			return "en";
		}
		const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
		return stored === "en" || stored === "zh" ? stored : "en";
	});

	const dictionary = translations[language];

	const setLanguage = React.useCallback((next: Language) => {
		setLanguageState(next);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
		}
	}, []);

	const translate = React.useCallback(
		(key: string, params?: Record<string, string | number>) => {
			const template = resolveKey(dictionary, key) ?? key;
			return interpolate(template, params);
		},
		[dictionary],
	);

	const contextValue = React.useMemo(
		() => ({
			language,
			setLanguage,
			t: translate,
			dictionary,
		}),
		[language, setLanguage, translate, dictionary],
	);

	return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export function useTranslations() {
	const context = React.useContext(TranslationContext);
	if (!context) {
		throw new Error("useTranslations must be used within a TranslationProvider");
	}
	return context;
}

export const AVAILABLE_LANGUAGES: { value: Language; label: string }[] = [
	{ value: "en", label: translations.en.languageName },
	{ value: "zh", label: translations.zh.languageName },
];
