import React, { useState } from "react";
import { XIcon, ExclamationIcon, ChevronUpIcon } from '@heroicons/react/solid';
import { useTranslations } from "../i18n";

interface GitInstallSidebarProps {
	onCheckAgain: () => void;
}

const GitInstallSidebar: React.FC<GitInstallSidebarProps> = ({ onCheckAgain }) => {
	const { t } = useTranslations();
	const [isExpanded, setIsExpanded] = useState(false);

	const isMac = navigator.platform.toLowerCase().includes("mac");
	const isLinux = navigator.platform.toLowerCase().includes("linux") || 
		navigator.platform.toLowerCase().includes("x11");

	const getInstructions = () => {
		if (isMac) return t("gitInstall.instructions.mac");
		if (isLinux) return t("gitInstall.instructions.linux");
		return t("gitInstall.instructions.windows");
	};

	const getDownloadUrl = () => {
		if (isMac) return "https://git-scm.com/download/mac";
		if (isLinux) return "https://git-scm.com/download/linux";
		return "https://git-scm.com/download/win";
	};

	return (
		<div className="fixed bottom-20 left-4 z-40 flex flex-col items-end gap-2">
			{/* 展开的侧边栏 */}
			{isExpanded && (
				<div className="w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-lg">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-bold text-gray-900 dark:text-white">
							{t("gitInstall.title")}
						</h3>
						<button
							onClick={() => setIsExpanded(false)}
							className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
							aria-label={t("gitInstall.close")}
						>
							<XIcon className="h-5 w-5" />
						</button>
					</div>

					<div className="space-y-4">
						<p className="text-sm text-gray-700 dark:text-gray-300">{t("gitInstall.notInstalled")}</p>
						<div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 text-sm text-gray-800 dark:text-gray-200">
							{getInstructions()}
						</div>

						<a
							href={getDownloadUrl()}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full rounded-lg bg-gray-900 dark:bg-gray-700 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
						>
							{t("gitInstall.downloadLink")}
						</a>

						<button
							onClick={onCheckAgain}
							className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
						>
							{t("gitInstall.checkAgain")}
						</button>
					</div>
				</div>
			)}

			{/* 提示按钮 */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black shadow-md transition-all hover:bg-yellow-600"
				aria-label={t("gitInstall.notInstalledLabel")}
			>
				<ExclamationIcon className="h-5 w-5" />
				<span>{t("gitInstall.notInstalledLabel")}</span>
				<ChevronUpIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
			</button>
		</div>
	);
};

export default GitInstallSidebar;

