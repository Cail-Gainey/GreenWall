import React from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/solid';

/**
 * 主题切换组件
 * 提供亮色/暗色主题切换功能
 */
const ThemeToggle: React.FC = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	// 避免服务端渲染不匹配
	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<button
				className="inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white transition-colors"
				aria-label="主题切换"
			>
				<SunIcon className="h-5 w-5" />
			</button>
		);
	}

	const isDark = theme === 'dark';

	return (
		<button
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className="inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
			aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
		>
			{isDark ? (
				<SunIcon className="h-5 w-5" />
			) : (
				<MoonIcon className="h-5 w-5" />
			)}
		</button>
	);
};

export default ThemeToggle;
