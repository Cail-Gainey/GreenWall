import React from "react";
import clsx from "clsx";
import { XIcon } from '@heroicons/react/solid';
import { characterPatterns, getPatternsByCategory, type CharacterPattern } from "../data/characterPatterns";
import { useTranslations } from "../i18n";

type CharacterTab = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';
type PatternIntensity = 1 | 2 | 3 | 4 | 'random';

type Props = {
	onSelect: (char: string, intensity: PatternIntensity) => void;
	onClose: () => void;
	initialIntensity?: PatternIntensity;
	onIntensityChange?: (intensity: PatternIntensity) => void;
};

/**
 * 字符选择弹窗组件
 * 显示A-Z、a-z、0-9和符号的选择界面，每个字符显示为像素图案预览
 */
export const CharacterSelector: React.FC<Props> = ({ 
	onSelect, 
	onClose, 
	initialIntensity = 4,
	onIntensityChange 
}) => {
	const { t } = useTranslations();
	const [activeTab, setActiveTab] = React.useState<CharacterTab>('uppercase');
	const [intensity, setIntensity] = React.useState<PatternIntensity>(initialIntensity);
	const [randomSeed, setRandomSeed] = React.useState<number>(0); // 随机种子，用于刷新预览

	// 获取当前标签页的字符图案
	const currentPatterns = React.useMemo(() => {
		return getPatternsByCategory(activeTab);
	}, [activeTab]);

	const handleCharacterClick = (char: string) => {
		onSelect(char, intensity);
		onClose();
	};

	const handleIntensityChange = (newIntensity: PatternIntensity) => {
		setIntensity(newIntensity);
		// 如果点击的是随机选项，刷新随机种子
		if (newIntensity === 'random') {
			setRandomSeed(prev => prev + 1);
		}
		if (onIntensityChange) {
			onIntensityChange(newIntensity);
		}
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

				{/* 强度选择器 */}
				<div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("brushIntensity.label")}</span>
					<div className="flex items-center gap-2">
						{([1, 2, 3, 4, 'random'] as PatternIntensity[]).map((level) => {
							// 使用与日历一致的 GitHub 颜色
							const colors: Record<number, string> = {
								1: '#9be9a8',
								2: '#40C463',
								3: '#30a14e',
								4: '#216e39'
							};
							
							// 随机选项显示渐变色
							const isRandom = level === 'random';
							const style = isRandom 
								? { background: 'linear-gradient(135deg, #9be9a8 0%, #40C463 33%, #30a14e 66%, #216e39 100%)' }
								: { backgroundColor: colors[level as number] };
							
							return (
								<button
									key={level}
									type="button"
									onClick={() => handleIntensityChange(level)}
									className={clsx(
										"w-8 h-8 rounded transition-all duration-200 flex items-center justify-center",
										intensity === level
											? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 scale-110"
											: "hover:scale-105 opacity-70 hover:opacity-100"
									)}
									style={style}
									title={isRandom ? t("brushIntensity.random") : `${t("brushIntensity.level")} ${level}`}
								>
									{isRandom && <span className="text-white text-xs font-bold">?</span>}
								</button>
							);
						})}
					</div>
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
											row.map((pixel, x) => {
												// 根据强度计算颜色 - 使用与日历一致的 GitHub 颜色
												let pixelStyle: React.CSSProperties = {};
												if (pixel === 1) {
													if (intensity === 'random') {
														// 随机模式：为每个像素生成随机颜色，使用randomSeed确保每次点击都刷新
														const hash = (y * 5 + x + pattern.id.charCodeAt(0) + randomSeed * 7) % 4;
														const colors = ['#9be9a8', '#40C463', '#30a14e', '#216e39'];
														pixelStyle = { backgroundColor: colors[hash] };
													} else if (intensity === 1) {
														pixelStyle = { backgroundColor: '#9be9a8' }; // 与 level 1 一致
													} else if (intensity === 2) {
														pixelStyle = { backgroundColor: '#40C463' }; // 与 level 2 一致
													} else if (intensity === 3) {
														pixelStyle = { backgroundColor: '#30a14e' }; // 与 level 3 一致
													} else {
														pixelStyle = { backgroundColor: '#216e39' }; // 与 level 4 一致
													}
												} else {
													pixelStyle = { backgroundColor: '#ebedf0' };
												}
												
												return (
													<div
														key={`${y}-${x}`}
														className={clsx(
															"h-2.5 w-2.5 rounded-sm transition-all duration-200",
															pixel === 1 && "shadow-sm group-hover:scale-110"
														)}
														style={pixelStyle}
													/>
												);
											})
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
