import React from "react";
import clsx from "clsx";
import { DownloadIcon, UploadIcon, CheckCircleIcon, RefreshIcon, CloudIcon, PencilIcon, TrashIcon, TemplateIcon } from '@heroicons/react/solid';
import { useTranslations } from "../i18n";
import { CharacterSelector } from "./CharacterSelector";
import { LoginButton } from "./LoginButton";

type Props = {
	drawMode?: "pen" | "eraser";
	onDrawModeChange: (mode: "pen" | "eraser") => void;
	onReset?: () => void;
	onFillAllGreen?: () => void;
	onGenerateRepo?: () => void;
	isGeneratingRepo?: boolean;
	onExportContributions?: () => void;
	onImportContributions?: () => void;
	// 字符预览相关
	onStartCharacterPreview?: (char: string) => void;
	previewMode?: boolean;
	onCancelCharacterPreview?: () => void;
	// 登录相关
	userInfo: { username: string; email: string } | null;
	onLogin: () => void;
	onLogout: () => void;
	isLoggingIn?: boolean;
};

export const CalendarControls: React.FC<Props> = ({
	drawMode,
	onDrawModeChange,
	onReset,
	onFillAllGreen,
	onGenerateRepo,
	isGeneratingRepo,
	onExportContributions,
	onImportContributions,
	// 字符预览相关
	onStartCharacterPreview,
	previewMode,
	onCancelCharacterPreview,
	// 登录相关
	userInfo,
	onLogin,
	onLogout,
	isLoggingIn,
}) => {
	const { t } = useTranslations();
	const [showCharacterSelector, setShowCharacterSelector] = React.useState(false);

	const disableGenerateRepo =
		!onGenerateRepo ||
		isGeneratingRepo ||
		!userInfo;

	const handleGenerateRepo = () => {
		if (!onGenerateRepo) return;
		onGenerateRepo();
	};

	const handleCharacterSelect = (char: string) => {
		if (onStartCharacterPreview) {
			onStartCharacterPreview(char);
		}
	};

	const handleCharacterButtonClick = () => {
		if (previewMode && onCancelCharacterPreview) {
			onCancelCharacterPreview();
		} else {
			setShowCharacterSelector(true);
		}
	};

	return (
		<div className="flex w-full flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-700">
			{/* 功能按钮横向排列 */}
			{/* 绘制模式 */}
			<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => onDrawModeChange("pen")}
							className={clsx(
								"flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition-all duration-200",
								drawMode === "pen"
									? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
									: "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600",
							)}
							title={t("titles.pen")}
						>
							<PencilIcon className="h-4 w-4" />
							{t("drawModes.pen")}
						</button>
						<button
							type="button"
							onClick={() => onDrawModeChange("eraser")}
							className={clsx(
								"flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition-all duration-200",
								drawMode === "eraser"
									? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
									: "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600",
							)}
							title={t("titles.eraser")}
						>
							<TrashIcon className="h-4 w-4" />
							{t("drawModes.eraser")}
						</button>
			</div>

			{/* 字符工具 */}
			<button
					type="button"
					onClick={handleCharacterButtonClick}
					className={clsx(
						"flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all duration-200",
						previewMode
							? "border-2 border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
							: "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600",
					)}
					title={previewMode ? t("characterSelector.cancelPreview") : t("characterSelector.character")}
				>
					<TemplateIcon className="h-4 w-4" />
					{previewMode ? t("characterSelector.cancelPreview") : t("characterSelector.character")}
				</button>

			{/* 数据操作 */}
			<button
				type="button"
				onClick={onExportContributions}
				className="flex items-center justify-center gap-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
				title={t("titles.export")}
			>
				<UploadIcon className="h-4 w-4" />
				{t("buttons.export")}
			</button>
			<button
				type="button"
				onClick={onImportContributions}
				className="flex items-center justify-center gap-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
				title={t("titles.import")}
			>
				<DownloadIcon className="h-4 w-4" />
				{t("buttons.import")}
			</button>

			{/* 操作按钮 */}
			<button
				type="button"
				onClick={onFillAllGreen}
				className="flex items-center justify-center gap-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
				title={t("titles.allGreen")}
			>
				<CheckCircleIcon className="h-4 w-4" />
				{t("buttons.allGreen")}
			</button>
			<button
				type="button"
				onClick={onReset}
				className="flex items-center justify-center gap-2 rounded border border-red-500 dark:border-red-600 bg-red-600 dark:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:hover:bg-red-700"
				title={t("titles.reset")}
			>
				<RefreshIcon className="h-4 w-4" />
				{t("buttons.reset")}
			</button>

			{/* 字符选择弹窗 */}
			{showCharacterSelector && (
				<CharacterSelector
					onSelect={handleCharacterSelect}
					onClose={() => setShowCharacterSelector(false)}
				/>
			)}
		</div>
	);
};
