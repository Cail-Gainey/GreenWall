import React, { useState, useEffect } from "react";
import { XIcon, SaveIcon, RefreshIcon } from '@heroicons/react/solid';
import { useTranslations } from "../i18n";
import { GetGitPath } from "../../wailsjs/go/main/App";

interface GitPathSettingsProps {
	onClose: () => void;
	onCheckAgain: () => void;
}

// 检测操作系统
const detectOS = (): 'windows' | 'mac' | 'linux' => {
	const userAgent = window.navigator.userAgent.toLowerCase();
	if (userAgent.indexOf('win') !== -1) return 'windows';
	if (userAgent.indexOf('mac') !== -1) return 'mac';
	return 'linux';
};

const GitPathSettings: React.FC<GitPathSettingsProps> = ({ onClose, onCheckAgain }) => {
	const { t } = useTranslations();
	const [customGitPath, setCustomGitPath] = useState("");
	const [currentGitPath, setCurrentGitPath] = useState<string>("");
	const [isSettingPath, setIsSettingPath] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [setPathResult, setSetPathResult] = useState<{ success: boolean; message: string } | null>(null);
	const [os] = useState(detectOS());

	// 加载当前Git路径
	useEffect(() => {
		const loadCurrentPath = async () => {
			try {
				const path = await GetGitPath();
				setCurrentGitPath(path || "");
			} catch (error) {
				console.error("获取Git路径失败:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadCurrentPath();
	}, []);

	// 获取平台特定的示例路径
	const getExamplePath = () => {
		switch (os) {
			case 'windows':
				return 'C:\\Program Files\\Git\\bin\\git.exe';
			case 'mac':
				return '/usr/local/bin/git';
			case 'linux':
				return '/usr/bin/git';
		}
	};

	// 获取平台特定的说明
	const getPlatformInstructions = () => {
		switch (os) {
			case 'windows':
				return '在命令提示符中运行: where git';
			case 'mac':
				return '在终端中运行: which git';
			case 'linux':
				return '在终端中运行: which git';
		}
	};

	const handleSetGitPath = async () => {
		if (!customGitPath.trim()) {
			return;
		}

		setIsSettingPath(true);
		setSetPathResult(null);

		try {
			const { SetGitPath } = await import("../../wailsjs/go/main/App");
			const result = await SetGitPath({ gitPath: customGitPath });
			
			setSetPathResult({
				success: result.success,
				message: result.success ? `设置成功！Git版本: ${result.version}` : `设置失败: ${result.message}`,
			});

			if (result.success) {
				// 成功设置后，更新当前路径并重新检查git状态
				setCurrentGitPath(customGitPath);
				setCustomGitPath("");
				setTimeout(() => {
					onCheckAgain();
					onClose();
				}, 1000);
			}
		} catch (error) {
			console.error("Failed to set git path:", error);
			setSetPathResult({
				success: false,
				message: t("gitPathSettings.setError", { message: (error as Error).message }),
			});
		} finally {
			setIsSettingPath(false);
		}
	};

	const handleResetGitPath = async () => {
		try {
			const { SetGitPath } = await import("../../wailsjs/go/main/App");
			const result = await SetGitPath({ gitPath: "" });
			
			setSetPathResult({
				success: result.success,
				message: result.success ? `已重置为系统默认路径！Git版本: ${result.version}` : `重置失败: ${result.message}`,
			});

			if (result.success) {
				setCurrentGitPath("");
				setCustomGitPath("");
				setTimeout(() => {
					onCheckAgain();
				}, 1000);
			}
		} catch (error) {
			console.error("Failed to reset git path:", error);
			setSetPathResult({
				success: false,
				message: t("gitPathSettings.resetError", { message: (error as Error).message }),
			});
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 w-full max-w-lg border border-black dark:border-white bg-white dark:bg-gray-800 p-8">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-black dark:text-white">{t("gitPathSettings.title")}</h2>
					<button
						onClick={onClose}
						className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400"
						aria-label={t("gitInstall.close")}
					>
						<XIcon className="h-6 w-6" />
					</button>
				</div>

				<div className="space-y-6">
					{/* 平台信息 */}
					<div className="rounded-none border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
						<p className="text-xs font-medium text-gray-700 dark:text-gray-300">
							{t("gitPathSettings.detectedOS")} <span className="font-bold">{os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux'}</span>
						</p>
					</div>

					{/* 当前Git路径 */}
					{isLoading ? (
						<div className="text-sm text-gray-600 dark:text-gray-400">{t("gitPathSettings.loading")}</div>
					) : (
						<div className="space-y-2">
							<label className="block text-sm font-medium text-black dark:text-white">
								{t("gitPathSettings.currentPath")}
							</label>
							<div className="flex items-center gap-2">
								<div className="flex-1 rounded-none border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
									{currentGitPath || t("gitPathSettings.currentPathDefault")}
								</div>
								{currentGitPath && (
												<button
													onClick={() => {
														setCustomGitPath("");
														setSetPathResult(null);
													}}
													className="rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
													title={t("gitPathSettings.clearInput")}
												>
													<XIcon className="h-4 w-4" />
												</button>
								)}
							</div>
						</div>
					)}

					{/* 设置新路径 */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-black dark:text-white">
							{t("gitPathSettings.newPath")}
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={customGitPath}
								onChange={(e) => {
									setCustomGitPath(e.target.value);
									setSetPathResult(null);
								}}
								placeholder={getExamplePath()}
								className="flex-1 rounded-none border border-black dark:border-white bg-white dark:bg-gray-700 px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
							/>
								{customGitPath && (
									<button
										onClick={() => setCustomGitPath("")}
										className="rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
										title={t("gitPathSettings.clearInput")}
									>
										<XIcon className="h-4 w-4" />
									</button>
								)}
						</div>
						<p className="text-xs text-gray-600 dark:text-gray-400">
							💡 {getPlatformInstructions()}
						</p>
					</div>

					{setPathResult && (
						<p className={`text-sm ${
							setPathResult.success ? "text-black dark:text-white" : "text-red-600 dark:text-red-400"
						}`}>
							{setPathResult.message}
						</p>
					)}

					<div className="flex items-center justify-between gap-4">
						<button
							onClick={handleSetGitPath}
							disabled={!customGitPath.trim() || isSettingPath}
							className="border border-black dark:border-white bg-black dark:bg-white px-6 py-2 text-sm font-medium text-white dark:text-black transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:border-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
						>
							<SaveIcon className="h-4 w-4" />
							{isSettingPath ? t("gitPathSettings.setting") : t("gitPathSettings.setPath")}
						</button>
						<button
							onClick={handleResetGitPath}
							className="border border-black dark:border-white bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-black dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
						>
							<RefreshIcon className="h-4 w-4" />
							{t("gitPathSettings.reset")}
						</button>
					</div>

					<div className="border-t border-black dark:border-white pt-6">
						<p className="mb-3 text-sm text-black dark:text-white">
							<b>{t("gitPathSettings.noteTitle")}</b>
						</p>
						<ul className="list-inside list-disc space-y-1 text-xs text-black dark:text-white">
							<li>{t("gitPathSettings.noteEmpty")}</li>
							<li>{t("gitPathSettings.noteCustom")}</li>
							<li>{t("gitPathSettings.noteManualCheck")}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GitPathSettings;

