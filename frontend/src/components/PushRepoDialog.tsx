// PushRepoDialog.tsx 提供了将本地生成的仓库推送到 GitHub 的核心对话框。
// 它支持：
// 1. 创建全新的（私有/公开）GitHub 仓库并推送；
// 2. 选择已有的 GitHub 仓库进行覆盖推送 (Force Push)；
// 3. 多语言混合模式配置：允许用户按比例分配不同语言的代码量；
// 4. 实时仓库名清洗与分支自动拉取逻辑。
import React from "react";
import {
	Modal, Form, Input, Checkbox, Select, Button,
	Space, Typography, Tooltip, InputNumber, Spin, notification
} from 'antd';
import {
	CloudUploadOutlined,
	PlusOutlined,
	DeleteOutlined,
	LockOutlined,
	CodeOutlined,
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	InfoCircleOutlined,
	CloseOutlined
} from '@ant-design/icons';
import { useTranslations } from "../i18n";
import { useTheme } from 'next-themes';
import { GetSupportedLanguagesAPI, GetRepoBranches } from "../../wailsjs/go/main/App";

const { Title } = Typography;
const { Option } = Select;

type GitHubRepo = {
	name: string;
	fullName: string;
	full_name?: string;
	private: boolean;
	htmlUrl: string;
	defaultBranch?: string;
	default_branch?: string;
};

type Props = {
	onClose: () => void; // 关闭对话框回调
	onPush: (params: {
		repoPath: string;
		repoName: string;
		branch: string;
		isNewRepo: boolean;
		isPrivate: boolean;
		forcePush: boolean;
		commitCount: number;
		language: string;
		multiLanguage?: boolean;
		languageConfigs?: Array<{ language: string; ratio: number }>;
	}) => void; // 确认推送回调
	repoPath: string;    // 本地仓库预览路径
	commitCount: number; // 预计 commits 总数
	userRepos: GitHubRepo[]; // 远程仓库列表（用于选择已有仓库）
	isLoading?: boolean; // 推送过程中的状态锁定
	progressMessage?: string; // 来自后端的进度描述
};

/**
 * sanitizeRepoName：根据 GitHub 命名规则清洗仓库名。
 * 将中文、空格及非法字符转换为连字符，确保创建仓库成功。
 */
const sanitizeRepoName = (name: string): string => {
	let sanitized = name
		.replace(/[^\x00-\x7F]/g, '') // 移除非 ASCII
		.replace(/[^a-zA-Z0-9\-_.]/g, '-') // 非法字符转连字符
		.replace(/^\.|\.$/g, '') // 不以点开头结尾
		.replace(/\.{2,}/g, '.') // 连续点
		.replace(/-{2,}/g, '-') // 连续连字符
		.replace(/^-+|-+$/g, ''); // 移除首尾连字符

	if (!sanitized) {
		sanitized = 'my-contributions';
	}
	return sanitized;
};

/**
 * PushRepoDialog 组件：封装复杂的推送逻辑配置。
 */
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
	const { resolvedTheme } = useTheme();
	const [form] = Form.useForm();

	// UI 交互状态
	const [isNewRepo, setIsNewRepo] = React.useState(true);
	const [multiLanguage, setMultiLanguage] = React.useState(false);
	const [languageConfigs, setLanguageConfigs] = React.useState<Array<{ language: string; ratio: number; locked?: boolean }>>([]);
	const [supportedLanguages, setSupportedLanguages] = React.useState<Array<{ value: string; label: string }>>([]);

	// 校验与分支状态
	const [nameWarning, setNameWarning] = React.useState("");
	const [totalRatio, setTotalRatio] = React.useState(0);
	const [branches, setBranches] = React.useState<string[]>([]);
	const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);

	// 获取后端支持的所有编程语言列表详情
	React.useEffect(() => {
		const loadLanguages = async () => {
			try {
				const langs = await GetSupportedLanguagesAPI();
				setSupportedLanguages(langs as Array<{ value: string; label: string }>);
			} catch (error) {
				console.error("加载语言列表失败:", error);
				// 回退兜底配置
				setSupportedLanguages([
					{ value: "markdown", label: "Markdown" },
					{ value: "javascript", label: "JavaScript" },
					{ value: "go", label: "Go" },
				]);
			}
		};
		loadLanguages();
	}, []);

	// 计算多语言模式下的实时百分比总数
	React.useEffect(() => {
		const total = languageConfigs.reduce((sum, config) => sum + config.ratio, 0);
		setTotalRatio(total);
	}, [languageConfigs]);

	/**
	 * handleRepoChange：当选择已有仓库时，自动拉取其全部分支。
	 */
	const handleRepoChange = async (repoValue: string) => {
		const repo = userRepos.find(r => (r.fullName || r.full_name || r.name) === repoValue);
		if (repo) {
			const fullName = repo.fullName || repo.full_name;
			if (!fullName) return;

			setIsFetchingBranches(true);
			setBranches([]);
			try {
				const [owner, name] = fullName.split('/');
				const branchList = await GetRepoBranches(owner, name);
				setBranches(branchList);

				if (branchList.length > 0) {
					// 智能默认分支选择逻辑
					const defaultBranch = repo.defaultBranch || repo.default_branch;
					const defaultSelect = (defaultBranch && branchList.includes(defaultBranch)) ? defaultBranch
						: (branchList.includes('main') ? 'main'
							: (branchList.includes('master') ? 'master' : branchList[0]));

					form.setFieldValue('branch', defaultSelect);
				}
			} catch (error: any) {
				notification.error({
					message: "获取分支列表失败",
					description: error.toString() || "请检查网络连接或 GitHub Token 权限"
				});
			} finally {
				setIsFetchingBranches(false);
			}
		}
	};

	/**
	 * redistributeRatios：辅助平衡算法。
	 * 当用户锁定了部分语言比例后，平均分配剩余的 100% 给未锁定的语言。
	 */
	const redistributeRatios = (configs: Array<{ language: string; ratio: number; locked?: boolean }>) => {
		const lockedConfigs = configs.filter(c => c.locked);
		const unlockedConfigs = configs.filter(c => !c.locked);

		if (unlockedConfigs.length === 0) return configs;

		const lockedTotal = lockedConfigs.reduce((sum, c) => sum + c.ratio, 0);
		const remaining = Math.max(0, 100 - lockedTotal);
		const averageRatio = Math.floor(remaining / unlockedConfigs.length);
		const remainder = remaining % unlockedConfigs.length;

		return configs.map((config, idx) => {
			if (config.locked) return config;
			const unlockedIndex = unlockedConfigs.findIndex(c => c.language === config.language);
			const ratio = averageRatio + (unlockedIndex < remainder ? 1 : 0);
			return { ...config, ratio };
		});
	};

	// --- 多语言增删改查处理 ---
	const addLanguageConfig = () => {
		if (supportedLanguages.length === 0) return;
		const newLang = supportedLanguages[0].value;
		const newConfigs = [...languageConfigs, { language: newLang, ratio: 0, locked: false }];
		setLanguageConfigs(redistributeRatios(newConfigs));
	};

	const removeLanguageConfig = (index: number) => {
		const newConfigs = languageConfigs.filter((_, i) => i !== index);
		setLanguageConfigs(redistributeRatios(newConfigs));
	};

	const updateLanguageConfig = (index: number, field: 'language' | 'ratio', value: string | number) => {
		const newConfigs = [...languageConfigs];
		if (field === 'ratio') {
			const ratio = Math.max(0, Math.min(100, Number(value)));
			newConfigs[index] = { ...newConfigs[index], ratio, locked: true };
			setLanguageConfigs(redistributeRatios(newConfigs));
		} else {
			newConfigs[index] = { ...newConfigs[index], language: value as string };
			setLanguageConfigs(newConfigs);
		}
	};

	/**
	 * handleRepoNameChange：实时仓库名合法性检查。
	 */
	const handleRepoNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
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

	/**
	 * handleFinish：最终表单提交处理。
	 * 包含仓库名确定、模式校验、参数封装并调用推送接口。
	 */
	const handleFinish = (values: any) => {
		let finalRepoName = isNewRepo ? values.repoName : values.selectedRepo;

		if (!finalRepoName?.trim()) {
			Modal.error({ title: t("pushDialog.emptyNameError") });
			return;
		}

		if (isNewRepo) {
			finalRepoName = sanitizeRepoName(finalRepoName);
			if (!finalRepoName) {
				Modal.error({ title: t("pushDialog.invalidNameError") });
				return;
			}
		}

		// 多语言模式的前置置条件校验
		if (multiLanguage) {
			if (languageConfigs.length === 0) {
				Modal.error({ title: t("pushDialog.noLanguageError") });
				return;
			}
			if (totalRatio === 0) {
				Modal.error({ title: t("pushDialog.zeroRatioError") });
				return;
			}
		}

		// 触发父组件的推送逻辑
		onPush({
			repoPath,
			repoName: finalRepoName,
			branch: values.branch || "main",
			isNewRepo,
			isPrivate: !!values.isPrivate,
			forcePush: !!values.forcePush,
			commitCount,
			language: multiLanguage ? "" : (values.language || "markdown"),
			multiLanguage,
			languageConfigs: multiLanguage ? languageConfigs : [],
		});
	};

	return (
		<Modal
			open={true}
			onCancel={onClose}
			footer={null}
			width={600}
			maskClosable={false}
			closable={false}
			className="pro-max-modal"
			// 使用自定义渲染增强 UI 质感（玻璃背景、全屏渲染）
			modalRender={(modal) => (
				<div className={`${resolvedTheme === 'dark' ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-gray-200'} backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden p-0`}>
					{/* 自定义头部 */}
					<div className={`px-8 py-6 border-b ${resolvedTheme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'} flex justify-between items-center`}>
						<Title level={4} className={`mb-0 font-display ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
							<span className="text-brand-green mr-3"><CloudUploadOutlined /></span>
							{t("pushDialog.title")}
						</Title>
						<button
							onClick={onClose}
							className={`p-2 rounded-full transition-colors ${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-100'}`}
						>
							<CloseOutlined className="text-lg" />
						</button>
					</div>

					<div className="p-8">
						{React.isValidElement(modal) ? React.cloneElement(modal as React.ReactElement, { style: { ...modal?.props?.style, background: 'transparent', boxShadow: 'none' } }) : modal}
					</div>
				</div>
			)}
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleFinish}
				initialValues={{
					repoType: 'new',
					branch: 'main',
					isPrivate: false,
					forcePush: false,
					language: 'markdown'
				}}
			>
				{/* 1. 仓库来源选择（新建 vs 已有） */}
				<Form.Item name="repoType" className="mb-8">
					<div className={`grid grid-cols-2 gap-4 p-1 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'}`}>
						<button
							type="button"
							onClick={() => { setIsNewRepo(true); form.setFieldValue('repoType', 'new') }}
							className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isNewRepo ? (resolvedTheme === 'dark' ? 'bg-slate-600/50 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : (resolvedTheme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
						>
							<PlusOutlined className="mr-2" />
							{t("pushDialog.newRepo")}
						</button>
						<button
							type="button"
							onClick={() => { setIsNewRepo(false); form.setFieldValue('repoType', 'existing') }}
							className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 ${!isNewRepo ? (resolvedTheme === 'dark' ? 'bg-slate-600/50 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : (resolvedTheme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
						>
							<CloudUploadOutlined className="mr-2" />
							{t("pushDialog.existingRepo")}
						</button>
					</div>
				</Form.Item>

				{isNewRepo ? (
					<>
						{/* 新建仓库：配置名及隐私性 */}
						<Form.Item
							label={<span className={resolvedTheme === 'dark' ? "text-slate-300" : "text-slate-600"}>{t("pushDialog.repoName")}</span>}
							name="repoName"
							className="mb-6"
							help={
								<div className="mt-2">
									{nameWarning && <div className="text-amber-400 text-xs mb-1"><ExclamationCircleOutlined /> {nameWarning}</div>}
									<div className="text-slate-500 text-xs">{t("pushDialog.nameRules")}</div>
								</div>
							}
						>
							<Input
								placeholder={t("pushDialog.repoNamePlaceholder")}
								onChange={handleRepoNameChange}
								className={`${resolvedTheme === 'dark' ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400"} py-3 rounded-lg hover:border-brand-green focus:border-brand-green`}
							/>
						</Form.Item>

						<Form.Item name="isPrivate" valuePropName="checked" className="mb-8">
							<Checkbox className={`${resolvedTheme === 'dark' ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
								<LockOutlined className="mr-1" /> {t("pushDialog.privateRepo")}
							</Checkbox>
						</Form.Item>
					</>
				) : (
					<>
						{/* 已有仓库：从列表选择并支持强制推送选项 */}
						<Form.Item
							label={<span className={resolvedTheme === 'dark' ? "text-slate-300" : "text-slate-600"}>{t("pushDialog.selectRepo")}</span>}
							name="selectedRepo"
							rules={[{ required: true, message: t("pushDialog.selectRepoPlaceholder") }]}
							className="mb-8"
						>
							<Select
								placeholder={t("pushDialog.selectRepoPlaceholder")}
								className="h-11"
								onChange={handleRepoChange}
								classNames={{ popup: { root: `${resolvedTheme === 'dark' ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"} font-sans` } }}
							>
								{userRepos.map((repo) => {
									const repoValue = repo.fullName || repo.full_name || repo.name;
									return (
										<Option key={repoValue} value={repoValue}>
											<span className={resolvedTheme === 'dark' ? "text-slate-200" : "text-slate-800"}>{repo.name}</span>
											<span className={`text-xs ml-2 ${resolvedTheme === 'dark' ? "text-slate-500" : "text-gray-400"}`}>{repo.private ? "(Private)" : "(Public)"}</span>
										</Option>
									);
								})}
							</Select>
						</Form.Item>

						<Form.Item name="forcePush" valuePropName="checked" className="mb-6">
							<Checkbox className="text-rose-400 hover:text-rose-300">
								<ExclamationCircleOutlined className="mr-1" /> {t("pushDialog.forcePush")}
							</Checkbox>
						</Form.Item>
					</>
				)}

				{/* 目标分支配置 */}
				<Form.Item
					label={
						<Space>
							<span className={resolvedTheme === 'dark' ? "text-slate-300" : "text-slate-600"}>{t("pushDialog.branchLabel")}</span>
							{isFetchingBranches && <Spin size="small" />}
						</Space>
					}
					name="branch"
					className="mb-6"
					rules={[{ required: true, message: t("pushDialog.branchPlaceholder") }]}
				>
					{isNewRepo ? (
						<Input
							placeholder={t("pushDialog.branchPlaceholder")}
							className={`${resolvedTheme === 'dark' ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400"} py-2 rounded-lg hover:border-brand-green focus:border-brand-green`}
						/>
					) : (
						<Select
							showSearch
							loading={isFetchingBranches}
							placeholder={t("pushDialog.branchPlaceholder")}
							className="h-11"
							classNames={{ popup: { root: `${resolvedTheme === 'dark' ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"} font-sans` } }}
						>
							{branches.map(b => (
								<Option key={b} value={b} className={resolvedTheme === 'dark' ? "text-slate-200" : "text-slate-800"}>
									{b}
								</Option>
							))}
						</Select>
					)}
				</Form.Item>

				<div className={`border-t my-6 ${resolvedTheme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'}`} />

				{/* 2. 推送内容的负载语言配置 */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-4">
						<Space align="center">
							<Checkbox
								checked={multiLanguage}
								onChange={(e) => {
									setMultiLanguage(e.target.checked);
									if (e.target.checked && languageConfigs.length === 0) {
										// 首次开启多语言时默认添加 Markdown 100%
										setLanguageConfigs([{ language: "markdown", ratio: 100, locked: false }]);
									}
								}}
								className={resolvedTheme === 'dark' ? "text-slate-200" : "text-slate-800"}
							>
								<span className="font-medium">{t("pushDialog.multiLanguageMode")}</span>
							</Checkbox>
							<Tooltip title={t("pushDialog.multiLanguageModeHint")} classNames={{ root: "font-sans" }}>
								<InfoCircleOutlined className="text-slate-500 hover:text-slate-300" />
							</Tooltip>
						</Space>
					</div>

					{!multiLanguage ? (
						// 单语言模式直接展示下拉框
						<Form.Item label={<span className={resolvedTheme === 'dark' ? "text-slate-300" : "text-slate-600"}>{t("pushDialog.language")}</span>} name="language">
							<Select options={supportedLanguages} className="h-11" classNames={{ popup: { root: `${resolvedTheme === 'dark' ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"}` } }} />
						</Form.Item>
					) : (
						// 多语言混合模式：动态列表与比例校验
						<div className={`p-4 border rounded-xl ${resolvedTheme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
							<div className="flex justify-between mb-3 text-sm">
								<span className="text-slate-400"><CodeOutlined /> {t("pushDialog.languageConfig")}</span>
								<span className={totalRatio > 100 ? "text-rose-400" : totalRatio === 100 ? "text-brand-green" : "text-amber-400"}>
									{totalRatio === 100 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />} {t("pushDialog.totalRatio")}: {totalRatio}%
								</span>
							</div>

							<div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-1">
								{languageConfigs.map((config, index) => (
									<div key={index} className={`flex gap-2 items-center p-2 rounded-lg border ${resolvedTheme === 'dark' ? 'bg-slate-900/50 border-slate-700/30' : 'bg-white border-gray-200'}`}>
										<div className="flex-1">
											<Select
												value={config.language}
												onChange={(val) => updateLanguageConfig(index, 'language', val)}
												options={supportedLanguages}
												style={{ width: '100%' }}
												variant="borderless"
												className={resolvedTheme === 'dark' ? "text-white" : "text-slate-900"}
												classNames={{ popup: { root: `${resolvedTheme === 'dark' ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"} font-sans` } }}
											/>
										</div>
										<div className="w-24">
											<InputNumber
												min={0}
												max={100}
												value={config.ratio}
												onChange={(val) => updateLanguageConfig(index, 'ratio', val || 0)}
												addonAfter="%"
												prefix={config.locked ? <LockOutlined className="text-blue-400 text-[10px]" /> : null}
												className={`${resolvedTheme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-900"} w-full`}
												variant="borderless"
											/>
										</div>
										<Button
											type="text"
											danger
											icon={<DeleteOutlined />}
											onClick={() => removeLanguageConfig(index)}
											disabled={languageConfigs.length === 1}
											className="hover:bg-rose-900/20"
										/>
									</div>
								))}
							</div>

							<Button type="dashed" block onClick={addLanguageConfig} className="border-slate-600 text-slate-400 hover:text-brand-green hover:border-brand-green">
								{t("pushDialog.addLanguage")}
							</Button>
						</div>
					)}
				</div>

				{/* 运行中的进度消息展示 */}
				{progressMessage && (
					<div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg flex items-center gap-3 text-blue-200">
						<Spin size="small" />
						<span>{progressMessage}</span>
					</div>
				)}

				<div className="flex justify-end gap-4 pt-2">
					<Button onClick={onClose} disabled={isLoading} className={`border-slate-600 ${resolvedTheme === 'dark' ? 'text-slate-300 hover:text-white hover:border-white' : 'text-slate-600 hover:text-slate-900 hover:border-slate-400'} bg-transparent h-10 px-6`}>
						{t("pushDialog.cancel")}
					</Button>
					<Button
						type="primary"
						htmlType="submit"
						loading={isLoading}
						icon={isLoading ? null : <CloudUploadOutlined />}
						className="bg-brand-green hover:bg-green-500 border-none h-10 px-6 font-medium shadow-lg shadow-green-900/20"
					>
						{isLoading ? t("pushDialog.pushing") : t("pushDialog.push")}
					</Button>
				</div>
			</Form>
		</Modal>
	);
}
