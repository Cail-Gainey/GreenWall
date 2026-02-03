import React from "react";
import { Modal, Tabs, Space, Typography, Tooltip, Card } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { getPatternsByCategory } from "../data/characterPatterns";
import { useTranslations } from "../i18n";
import { useTheme } from 'next-themes';
import { GITHUB_COLORS } from "../constants";

const { Text } = Typography;

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
	const [randomSeed, setRandomSeed] = React.useState<number>(0);
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';



	const handleCharacterClick = (char: string) => {
		onSelect(char, intensity);
		onClose();
	};

	const handleIntensityChange = (newIntensity: PatternIntensity) => {
		setIntensity(newIntensity);
		if (newIntensity === 'random') {
			setRandomSeed(prev => prev + 1);
		}
		if (onIntensityChange) {
			onIntensityChange(newIntensity);
		}
	};

	const renderContent = (tab: CharacterTab) => {
		const patterns = getPatternsByCategory(tab);
		const emptyBg = isDark ? '#161b22' : '#ebedf0';
		const palette = isDark ? GITHUB_COLORS.dark : GITHUB_COLORS.light;

		return (
			<div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8 p-1">
				{patterns.map((pattern) => (
					<div
						key={pattern.id}
						onClick={() => handleCharacterClick(pattern.id)}
						className="
                            flex flex-col items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300
                            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                            hover:shadow-lg hover:-translate-y-1 hover:border-green-500/50 dark:hover:border-green-500/50
                        "
					>
						<span className="font-medium text-slate-600 dark:text-slate-300 text-sm">{pattern.name}</span>

						<div className="grid grid-cols-5 gap-[2px] bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
							{pattern.grid.map((row, y) =>
								row.map((pixel, x) => {
									let pixelStyle: React.CSSProperties = {
										width: '8px',
										height: '8px',
										borderRadius: '1px',
										backgroundColor: emptyBg
									};

									if (pixel === 1) {
										if (intensity === 'random') {
											const hash = (y * 5 + x + pattern.id.charCodeAt(0) + randomSeed * 7) % 4;
											const levels = [1, 2, 3, 4] as const;
											pixelStyle.backgroundColor = palette[levels[hash]];
										} else {
											pixelStyle.backgroundColor = palette[intensity as 1 | 2 | 3 | 4];
										}
									}

									return <div key={`${y}-${x}`} style={pixelStyle} />;
								})
							)}
						</div>
					</div>
				))}
			</div>
		);
	};

	const tabItems = [
		{ key: 'uppercase', label: t('characterSelector.tabUppercase'), children: renderContent('uppercase') },
		{ key: 'lowercase', label: t('characterSelector.tabLowercase'), children: renderContent('lowercase') },
		{ key: 'numbers', label: t('characterSelector.tabNumbers'), children: renderContent('numbers') },
		{ key: 'symbols', label: t('characterSelector.tabSymbols'), children: renderContent('symbols') },
	];

	return (
		<Modal
			title={t('characterSelector.title')}
			open={true}
			onCancel={onClose}
			footer={null}
			width={900}
			bodyStyle={{ maxHeight: '70vh', overflow: 'auto', padding: '16px' }}
		>
			<div className="flex items-center gap-4 mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
				<span className="font-medium text-slate-700 dark:text-slate-200">{t("brushIntensity.label")}:</span>
				<div className="flex gap-2">
					{([1, 2, 3, 4, 'random'] as PatternIntensity[]).map((level) => {
						const isRandom = level === 'random';
						const palette = isDark ? GITHUB_COLORS.dark : GITHUB_COLORS.light;

						let style: React.CSSProperties = {};
						let className = "w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm border-2 "; // added border-2

						// Active state border
						const isActive = intensity === level;
						const activeBorderClass = isRandom
							? "border-purple-500"
							: "border-green-500";

						const inactiveBorderClass = isRandom
							? "border-slate-200 dark:border-slate-700 hover:border-purple-500/50"
							: "border-slate-200 dark:border-slate-700 hover:border-green-500/50";

						const borderClass = isActive ? activeBorderClass : inactiveBorderClass;

						if (isRandom) {
							className += `bg-white dark:bg-slate-800 ${borderClass}`;
						} else {
							style.backgroundColor = palette[level as 1 | 2 | 3 | 4];
							className += `${borderClass} opacity-80 hover:opacity-100`;
							if (isActive) className += " scale-110";
						}

						return (
							<Tooltip
								key={level}
								title={isRandom ? t("brushIntensity.random") : `${t("brushIntensity.level")} ${level}`}
							>
								<button
									type="button"
									onClick={() => handleIntensityChange(level)}
									className={className}
									style={style}
								>
									{isRandom && <ExperimentOutlined className="text-purple-600 dark:text-purple-500 text-xs" />}
								</button>
							</Tooltip>
						);
					})}
				</div>
			</div>

			<Tabs
				activeKey={activeTab}
				onChange={(key) => setActiveTab(key as CharacterTab)}
				items={tabItems}
				className="custom-tabs"
			/>
		</Modal>
	);
};
