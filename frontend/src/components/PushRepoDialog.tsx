import React from "react";
import { XIcon, CloudUploadIcon, PlusIcon, TrashIcon, LockClosedIcon, CodeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/solid';
import { useTranslations } from "../i18n";
import { GetSupportedLanguagesAPI } from "../../wailsjs/go/main/App";
import { Select, SelectCompact } from "./Select";

type GitHubRepo = {
	name: string;
	fullName: string;
	private: boolean;
	htmlUrl: string;
};

type Props = {
	onClose: () => void;
	onPush: (params: {
		repoPath: string;
		repoName: string;
		isNewRepo: boolean;
		isPrivate: boolean;
		forcePush: boolean;
		commitCount: number;
		language: string;
		multiLanguage?: boolean;
		languageConfigs?: Array<{language: string; ratio: number}>;
	}) => void;
	repoPath: string;
	commitCount: number;
	userRepos: GitHubRepo[];
	isLoading?: boolean;
	progressMessage?: string;
};

// 将仓库名转换为GitHub兼容格式
const sanitizeRepoName = (name: string): string => {
	// GitHub仓库名规则：
	// - 只能包含字母、数字、连字符(-)、下划线(_)、点(.)
	// - 不能以点(.)开头或结尾
	// - 不能包含连续的点(..)
	
	let sanitized = name
		// 移除所有非ASCII字符（包括中文）
		.replace(/[^\x00-\x7F]/g, '')
		// 移除不允许的字符，只保留字母、数字、-、_、.
		.replace(/[^a-zA-Z0-9\-_.]/g, '-')
		// 移除开头和结尾的点
		.replace(/^\.|\.$/g, '')
		// 替换连续的点
		.replace(/\.{2,}/g, '.')
		// 替换连续的连字符
		.replace(/-{2,}/g, '-')
		// 移除开头和结尾的连字符
		.replace(/^-+|-+$/g, '');
	
	// 如果清理后为空，使用默认名称
	if (!sanitized) {
		sanitized = 'my-contributions';
	}
	
	return sanitized;
};

export const PushRepoDialog: React.FC<Props> = ({
	onClose,
	onPush,
	repoPath,
	commitCount,
	userRepos,
	isLoading = false,
	progressMessage = "",
}) => {
	const { t } = useTranslations();
	const [isNewRepo, setIsNewRepo] = React.useState(true);
	const [repoName, setRepoName] = React.useState("");
	const [selectedRepo, setSelectedRepo] = React.useState("");
	const [isPrivate, setIsPrivate] = React.useState(false);
	const [forcePush, setForcePush] = React.useState(false);
	const [nameWarning, setNameWarning] = React.useState("");
	const [language, setLanguage] = React.useState("markdown");
	const [supportedLanguages, setSupportedLanguages] = React.useState<Array<{value: string; label: string}>>([]);
	
	// 多语言模式状态
	const [multiLanguage, setMultiLanguage] = React.useState(false);
	const [languageConfigs, setLanguageConfigs] = React.useState<Array<{language: string; ratio: number; locked?: boolean}>>([]);

	// 处理仓库名输入
	const handleRepoNameChange = (value: string) => {
		setRepoName(value);
		
		// 检查是否包含非ASCII字符
		if (/[^\x00-\x7F]/.test(value)) {
			const sanitized = sanitizeRepoName(value);
			setNameWarning(t("pushDialog.nameWarningChinese", { name: sanitized }));
		} else if (/[^a-zA-Z0-9\-_.]/.test(value)) {
			const sanitized = sanitizeRepoName(value);
			setNameWarning(t("pushDialog.nameWarningInvalid", { name: sanitized }));
		} else {
			setNameWarning("");
		}
	};

	// 加载支持的语言列表
	React.useEffect(() => {
		const loadLanguages = async () => {
			try {
				const langs = await GetSupportedLanguagesAPI();
				setSupportedLanguages(langs as Array<{value: string; label: string}>);
			} catch (error) {
				console.error("加载语言列表失败:", error);
				// 设置默认语言列表
				setSupportedLanguages([
					{ value: "markdown", label: "Markdown" },
					{ value: "java", label: "Java" },
					{ value: "python", label: "Python" },
					{ value: "javascript", label: "JavaScript" },
					{ value: "typescript", label: "TypeScript" },
					{ value: "go", label: "Go" },
				]);
			}
		};
		loadLanguages();
	}, []);
	
	// 自动分配比例给未锁定的语言
	const redistributeRatios = (configs: Array<{language: string; ratio: number; locked?: boolean}>) => {
		const lockedConfigs = configs.filter(c => c.locked);
		const unlockedConfigs = configs.filter(c => !c.locked);
		
		if (unlockedConfigs.length === 0) {
			return configs;
		}
		
		// 计算已锁定的总比例
		const lockedTotal = lockedConfigs.reduce((sum, c) => sum + c.ratio, 0);
		// 剩余可分配的比例
		const remaining = Math.max(0, 100 - lockedTotal);
		// 平均分配给未锁定的语言
		const averageRatio = Math.floor(remaining / unlockedConfigs.length);
		const remainder = remaining % unlockedConfigs.length;
		
		return configs.map((config, idx) => {
			if (config.locked) {
				return config;
			}
			// 前几个语言多分配1%来处理余数
			const unlockedIndex = unlockedConfigs.findIndex(c => c.language === config.language);
			const ratio = averageRatio + (unlockedIndex < remainder ? 1 : 0);
			return { ...config, ratio };
		});
	};
	
	// 添加语言配置
	const addLanguageConfig = () => {
		if (supportedLanguages.length === 0) return;
		const newLang = supportedLanguages[0].value;
		const newConfigs = [...languageConfigs, { language: newLang, ratio: 0, locked: false }];
		setLanguageConfigs(redistributeRatios(newConfigs));
	};
	
	// 删除语言配置
	const removeLanguageConfig = (index: number) => {
		const newConfigs = languageConfigs.filter((_, i) => i !== index);
		setLanguageConfigs(redistributeRatios(newConfigs));
	};
	
	// 更新语言配置
	const updateLanguageConfig = (index: number, field: 'language' | 'ratio', value: string | number) => {
		const newConfigs = [...languageConfigs];
		if (field === 'ratio') {
			// 限制比例在0-100之间
			const ratio = Math.max(0, Math.min(100, Number(value)));
			// 标记为已锁定（用户手动修改过）
			newConfigs[index] = { ...newConfigs[index], ratio, locked: true };
			// 重新分配其他未锁定语言的比例
			setLanguageConfigs(redistributeRatios(newConfigs));
		} else {
			newConfigs[index] = { ...newConfigs[index], language: value as string };
			setLanguageConfigs(newConfigs);
		}
	};
	
	// 计算总比例
	const totalRatio = languageConfigs.reduce((sum, config) => sum + config.ratio, 0);

	const handleSubmit = () => {
		let finalRepoName = isNewRepo ? repoName : selectedRepo;
		
		if (!finalRepoName.trim()) {
			alert(t("pushDialog.emptyNameError"));
			return;
		}

		// 对新仓库名进行清理
		if (isNewRepo) {
			finalRepoName = sanitizeRepoName(finalRepoName);
			
			if (!finalRepoName) {
				alert(t("pushDialog.invalidNameError"));
				return;
			}
		}

		// 验证多语言配置
		if (multiLanguage) {
			if (languageConfigs.length === 0) {
				alert(t("pushDialog.noLanguageError"));
				return;
			}
			if (totalRatio === 0) {
				alert(t("pushDialog.zeroRatioError"));
				return;
			}
		}
		
		onPush({
			repoPath,
			repoName: finalRepoName,
			isNewRepo,
			isPrivate,
			forcePush,
			commitCount,
			language: multiLanguage ? "" : language,
			multiLanguage,
			languageConfigs: multiLanguage ? languageConfigs : [],
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-none border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-xl">
				<div className="p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-2xl font-bold text-black dark:text-white">{t("pushDialog.title")}</h2>
				</div>
				
				<div className="flex-1 overflow-y-auto p-6">{/* 可滚动内容区 */}

				{/* 选择新建或现有仓库 */}
				<div className="mb-6">
					<div className="flex gap-4">
						<label className="flex items-center gap-2">
							<input
								type="radio"
								checked={isNewRepo}
								onChange={() => setIsNewRepo(true)}
								className="h-4 w-4"
							/>
							<span className="font-medium text-black dark:text-white">{t("pushDialog.newRepo")}</span>
						</label>
						<label className="flex items-center gap-2">
							<input
								type="radio"
								checked={!isNewRepo}
								onChange={() => setIsNewRepo(false)}
								className="h-4 w-4"
							/>
							<span className="font-medium text-black dark:text-white">{t("pushDialog.existingRepo")}</span>
						</label>
					</div>
				</div>

				{isNewRepo ? (
					<>
						{/* 新建仓库 */}
						<div className="mb-4">
							<label className="mb-2 block text-sm font-medium text-black dark:text-white">
								{t("pushDialog.repoName")}
							</label>
							<input
								type="text"
								value={repoName}
								onChange={(e) => handleRepoNameChange(e.target.value)}
								placeholder={t("pushDialog.repoNamePlaceholder")}
								className="w-full rounded-none border border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
							/>
							{nameWarning && (
								<p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
									⚠️ {nameWarning}
								</p>
							)}
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{t("pushDialog.nameRules")}
							</p>
						</div>

						<div className="mb-6">
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={isPrivate}
									onChange={(e) => setIsPrivate(e.target.checked)}
									className="h-4 w-4"
								/>
								<span className="text-sm text-black dark:text-white">{t("pushDialog.privateRepo")}</span>
							</label>
						</div>

						{/* 多语言模式切换 */}
						<div className="mb-6">
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={multiLanguage}
									onChange={(e) => {
										setMultiLanguage(e.target.checked);
										if (e.target.checked && languageConfigs.length === 0) {
											// 初始化
											const initialConfigs = [
												{ language: "Markdown", ratio: 100, locked: false },
											];
											setLanguageConfigs(initialConfigs);
										}
									}}
									className="h-4 w-4"
								/>
								<span className="text-sm font-medium text-black dark:text-white">{t("pushDialog.multiLanguageMode")}</span>
							</label>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{t("pushDialog.multiLanguageModeHint")}
							</p>
						</div>

						{/* 单语言选择 */}
						{!multiLanguage && (
							<div className="mb-6">
								<label className="mb-2 block text-sm font-medium text-black dark:text-white">
									{t("pushDialog.language")}
								</label>
								<Select
									value={language}
									onChange={setLanguage}
									options={supportedLanguages}
								/>
								<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{t("pushDialog.languageHint")}
								</p>
							</div>
						)}

						{/* 多语言配置 */}
						{multiLanguage && (
							<div className="mb-6">
								<div className="flex items-center justify-between mb-2">
									<label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
										<CodeIcon className="h-4 w-4" />
										{t("pushDialog.languageConfig")}
									</label>
									<span className={`text-sm font-medium flex items-center gap-1 ${totalRatio > 100 ? 'text-red-600' : totalRatio === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
										{totalRatio === 100 ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />}
										{t("pushDialog.totalRatio")}: {totalRatio}%
									</span>
								</div>
								
								<div className="max-h-60 overflow-y-auto space-y-2 mb-3 p-2 border border-gray-200 dark:border-gray-600 rounded">
									{languageConfigs.map((config, index) => (
										<div key={index} className={`flex items-center gap-2 p-2 rounded transition-all ${config.locked ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
											<SelectCompact
												value={config.language}
												onChange={(value) => updateLanguageConfig(index, 'language', value)}
												options={supportedLanguages}
												className="flex-1"
											/>
											<div className="relative">
												<input
													type="number"
													min="0"
													max="100"
													value={config.ratio}
													onChange={(e) => updateLanguageConfig(index, 'ratio', parseInt(e.target.value) || 0)}
													className={`w-16 rounded border ${config.locked ? 'border-blue-400 dark:border-blue-600' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-black dark:text-white px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
													title={config.locked ? t("pushDialog.lockedTooltip") : t("pushDialog.unlockedTooltip")}
												/>
												{config.locked && (
													<span className="absolute -top-1 -right-1" title={t("pushDialog.lockedTooltip")}>
														<LockClosedIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
													</span>
												)}
											</div>
											<span className="text-xs text-gray-600 dark:text-gray-400">%</span>
											<button
												onClick={() => removeLanguageConfig(index)}
												disabled={languageConfigs.length === 1}
												className="rounded border border-red-500 bg-white dark:bg-gray-800 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
												title={t("pushDialog.deleteLanguage")}
											>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
								
								<button
									onClick={addLanguageConfig}
									className="w-full rounded border border-dashed border-gray-400 dark:border-gray-500 bg-transparent px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
								>
									<PlusIcon className="h-4 w-4" />
									{t("pushDialog.addLanguage")}
								</button>
								
								{totalRatio > 100 && (
									<p className="mt-2 text-xs text-red-600 flex items-center gap-1">
										<ExclamationCircleIcon className="h-4 w-4" />
										{t("pushDialog.ratioWarning")}
									</p>
								)}
								<div className="mt-2 space-y-1">
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("pushDialog.autoDistributeTip")}
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("pushDialog.ratioDistributeTip")}
									</p>
								</div>
							</div>
						)}
					</>
				) : (
					<>
						{/* 选择现有仓库 */}
						<div className="mb-4">
							<label className="mb-2 block text-sm font-medium text-black dark:text-white">
								{t("pushDialog.selectRepo")}
							</label>
							<select
								value={selectedRepo}
								onChange={(e) => setSelectedRepo(e.target.value)}
								className="w-full rounded-none border border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
							>
								<option value="">{t("pushDialog.selectRepoPlaceholder")}</option>
								{userRepos.map((repo) => (
									<option key={repo.name} value={repo.name}>
										{repo.name} {repo.private ? "(私有)" : "(公开)"}
									</option>
								))}
							</select>
						</div>

						<div className="mb-6">
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={forcePush}
									onChange={(e) => setForcePush(e.target.checked)}
									className="h-4 w-4"
								/>
								<span className="text-sm text-black dark:text-white">{t("pushDialog.forcePush")}</span>
							</label>
							{forcePush && (
								<p className="mt-1 text-xs text-red-600 dark:text-red-400">
									{t("pushDialog.forcePushWarning")}
								</p>
							)}
						</div>

						{/* 多语言模式切换 - 现有仓库 */}
						<div className="mb-6">
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={multiLanguage}
									onChange={(e) => {
										setMultiLanguage(e.target.checked);
										if (e.target.checked && languageConfigs.length === 0) {
											const initialConfigs = [
												{ language: "markdown", ratio: 100, locked: false },
											];
											setLanguageConfigs(initialConfigs);
										}
									}}
									className="h-4 w-4"
								/>
								<span className="text-sm font-medium text-black dark:text-white">{t("pushDialog.multiLanguageMode")}</span>
							</label>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{t("pushDialog.multiLanguageModeHint")}
							</p>
						</div>

						{/* 单语言选择 - 现有仓库 */}
						{!multiLanguage && (
							<div className="mb-6">
								<label className="mb-2 block text-sm font-medium text-black dark:text-white">
									{t("pushDialog.language")}
								</label>
								<Select
									value={language}
									onChange={setLanguage}
									options={supportedLanguages}
								/>
								<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{t("pushDialog.languageHint")}
								</p>
							</div>
						)}

						{/* 多语言配置 - 现有仓库 */}
						{multiLanguage && (
							<div className="mb-6">
								<div className="flex items-center justify-between mb-2">
									<label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
										<CodeIcon className="h-4 w-4" />
										{t("pushDialog.languageConfig")}
									</label>
									<span className={`text-sm font-medium flex items-center gap-1 ${totalRatio > 100 ? 'text-red-600' : totalRatio === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
										{totalRatio === 100 ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />}
										{t("pushDialog.totalRatio")}: {totalRatio}%
									</span>
								</div>
								
								<div className="max-h-60 overflow-y-auto space-y-2 mb-3 p-2 border border-gray-200 dark:border-gray-600 rounded">
									{languageConfigs.map((config, index) => (
										<div key={index} className={`flex items-center gap-2 p-2 rounded transition-all ${config.locked ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
											<SelectCompact
												value={config.language}
												onChange={(value) => updateLanguageConfig(index, 'language', value)}
												options={supportedLanguages}
												className="flex-1"
											/>
											<div className="relative">
												<input
													type="number"
													min="0"
													max="100"
													value={config.ratio}
													onChange={(e) => updateLanguageConfig(index, 'ratio', parseInt(e.target.value) || 0)}
													className={`w-16 rounded border ${config.locked ? 'border-blue-400 dark:border-blue-600' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-black dark:text-white px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
													title={config.locked ? t("pushDialog.lockedTooltip") : t("pushDialog.unlockedTooltip")}
												/>
												{config.locked && (
													<span className="absolute -top-1 -right-1" title={t("pushDialog.lockedTooltip")}>
														<LockClosedIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
													</span>
												)}
											</div>
											<span className="text-xs text-gray-600 dark:text-gray-400">%</span>
											<button
												onClick={() => removeLanguageConfig(index)}
												disabled={languageConfigs.length === 1}
												className="rounded border border-red-500 bg-white dark:bg-gray-800 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
												title={t("pushDialog.deleteLanguage")}
											>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
								
								<button
									onClick={addLanguageConfig}
									className="w-full rounded border border-dashed border-gray-400 dark:border-gray-500 bg-transparent px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
								>
									<PlusIcon className="h-4 w-4" />
									{t("pushDialog.addLanguage")}
								</button>
								
								{totalRatio > 100 && (
									<p className="mt-2 text-xs text-red-600 flex items-center gap-1">
										<ExclamationCircleIcon className="h-4 w-4" />
										{t("pushDialog.ratioWarning")}
									</p>
								)}
								<div className="mt-2 space-y-1">
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("pushDialog.autoDistributeTip")}
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("pushDialog.ratioDistributeTip")}
									</p>
								</div>
							</div>
						)}
					</>
				)}

				{/* 提交信息 */}
				<div className="mb-6 rounded-none border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-4">
					<p className="text-sm text-gray-700 dark:text-gray-300">
						<strong>{t("pushDialog.commitCount", { count: commitCount })}</strong>
					</p>
				</div>
				
				</div>{/* 结束可滚动内容区 */}

				{/* 按钮区域 - 固定在底部 */}
				<div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
					{/* 推送进度提示 */}
					{progressMessage && (
						<div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
							<p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
								<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								{progressMessage}
							</p>
						</div>
					)}

					<div className="flex justify-end gap-3">
						<button
							onClick={onClose}
							disabled={isLoading}
							className="rounded-none border border-black dark:border-white bg-white dark:bg-gray-700 px-6 py-2 font-medium text-black dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
						>
							<XIcon className="h-4 w-4" />
							{t("pushDialog.cancel")}
						</button>
						<button
							onClick={handleSubmit}
							disabled={isLoading}
							className="rounded-none border border-black dark:border-white bg-black dark:bg-white px-6 py-2 font-medium text-white dark:text-black transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
						>
							<CloudUploadIcon className="h-4 w-4" />
							{isLoading ? t("pushDialog.pushing") : t("pushDialog.push")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
