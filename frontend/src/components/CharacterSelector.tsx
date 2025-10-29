import React from "react";
import clsx from "clsx";
import { XIcon } from '@heroicons/react/solid';
import { characterPatterns, getPatternsByCategory, type CharacterPattern } from "../data/characterPatterns";
import { useTranslations } from "../i18n";

type CharacterTab = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

type Props = {
	onSelect: (char: string) => void;
	onClose: () => void;
};

/**
 * 字符选择弹窗组件
 * 显示A-Z、a-z、0-9和符号的选择界面，每个字符显示为像素图案预览
 */
export const CharacterSelector: React.FC<Props> = ({ onSelect, onClose }) => {
	const { t } = useTranslations();
	const [activeTab, setActiveTab] = React.useState<CharacterTab>('uppercase');

	// 获取当前标签页的字符图案
	const currentPatterns = React.useMemo(() => {
		return getPatternsByCategory(activeTab);
	}, [activeTab]);

	const handleCharacterClick = (char: string) => {
		onSelect(char);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="relative w-full max-w-4xl rounded-none border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-2xl">
				{/* 标题栏 */}
				<div className="flex items-center justify-between border-b-2 border-black dark:border-white px-6 py-4">
					<h2 className="text-2xl font-bold text-black dark:text-white">{t('characterSelector.title')}</h2>
					<button
						onClick={onClose}
						className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
						aria-label={t('gitInstall.close')}
					>
						<XIcon className="h-6 w-6" />
					</button>
				</div>

				{/* 标签页 */}
				<div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
					<button
						onClick={() => setActiveTab('uppercase')}
						className={clsx(
							"rounded-t-lg px-6 py-2 text-sm font-medium transition-all",
							activeTab === 'uppercase'
								? "bg-black dark:bg-white text-white dark:text-black"
								: "bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
						)}
					>
						{t('characterSelector.tabUppercase')}
					</button>
					<button
						onClick={() => setActiveTab('lowercase')}
						className={clsx(
							"rounded-t-lg px-6 py-2 text-sm font-medium transition-all",
							activeTab === 'lowercase'
								? "bg-black dark:bg-white text-white dark:text-black"
								: "bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
						)}
					>
						{t('characterSelector.tabLowercase')}
					</button>
					<button
						onClick={() => setActiveTab('numbers')}
						className={clsx(
							"rounded-t-lg px-6 py-2 text-sm font-medium transition-all",
							activeTab === 'numbers'
								? "bg-black dark:bg-white text-white dark:text-black"
								: "bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
						)}
					>
						{t('characterSelector.tabNumbers')}
					</button>
					<button
						onClick={() => setActiveTab('symbols')}
						className={clsx(
							"rounded-t-lg px-6 py-2 text-sm font-medium transition-all",
							activeTab === 'symbols'
								? "bg-black dark:bg-white text-white dark:text-black"
								: "bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
						)}
					>
						{t('characterSelector.tabSymbols')}
					</button>
				</div>

				{/* 字符网格 */}
				<div className="max-h-[500px] overflow-y-auto p-6">
					<div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
						{currentPatterns.map((pattern) => {
							return (
								<button
									key={pattern.id}
									onClick={() => handleCharacterClick(pattern.id)}
									className="group flex flex-col items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 p-3 transition-all hover:border-black dark:hover:border-cyan-400 hover:shadow-lg dark:hover:shadow-cyan-500/20"
									title={`${t('characterSelector.selectCharacter')} ${pattern.name}`}
								>
									{/* 字符标签 */}
									<div className="text-sm font-bold text-black dark:text-gray-100">{pattern.name}</div>
									
									{/* 像素预览 */}
									<div className="grid grid-cols-5 gap-[2px] rounded-md bg-gray-100 dark:bg-gray-800 p-1.5">
										{pattern.grid.map((row, y) =>
											row.map((pixel, x) => (
												<div
													key={`${y}-${x}`}
													className={clsx(
														"h-2.5 w-2.5 rounded-sm transition-all duration-200",
														pixel === 1
															? "bg-[#216e39] dark:bg-[#2ea043] shadow-sm group-hover:bg-[#1a5a2e] dark:group-hover:bg-[#3fb950] group-hover:scale-110"
															: "bg-[#ebedf0] dark:bg-[#57606a] group-hover:bg-gray-300 dark:group-hover:bg-gray-500"
													)}
													style={{
														boxShadow: pixel === 1 ? '0 1px 2px rgba(33, 110, 57, 0.2)' : 'none'
													}}
												/>
											))
										)}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};
