import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	className?: string;
	placeholder?: string;
	disabled?: boolean;
}

/**
 * 美化的下拉选择组件
 * 使用TailwindCSS和Heroicons打造现代化UI
 */
export const Select: React.FC<SelectProps> = ({
	value,
	onChange,
	options,
	className = '',
	placeholder = '请选择',
	disabled = false,
}) => {
	const selectedOption = options.find(opt => opt.value === value);

	return (
		<div className={`relative ${className}`}>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className={`
					w-full appearance-none rounded border
					bg-white dark:bg-gray-800
					text-black dark:text-white
					px-4 py-2.5 pr-10
					text-sm font-medium
					border-gray-300 dark:border-gray-600
					focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
					disabled:opacity-50 disabled:cursor-not-allowed
					transition-all duration-200
					hover:border-gray-400 dark:hover:border-gray-500
					cursor-pointer
					${className}
				`}
			>
				{placeholder && !value && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			
			{/* 自定义下拉箭头 */}
			<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
				<ChevronDownIcon 
					className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${
						disabled ? 'opacity-50' : ''
					}`}
				/>
			</div>
		</div>
	);
};

/**
 * 紧凑版下拉选择组件
 * 用于空间受限的场景
 */
export const SelectCompact: React.FC<SelectProps> = ({
	value,
	onChange,
	options,
	className = '',
	placeholder = '请选择',
	disabled = false,
}) => {
	return (
		<div className={`relative ${className}`}>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className={`
					w-full appearance-none rounded
					bg-white dark:bg-gray-800
					text-black dark:text-white
					px-2 py-1 pr-8
					text-sm
					border border-gray-300 dark:border-gray-600
					focus:outline-none focus:ring-1 focus:ring-blue-500
					disabled:opacity-50 disabled:cursor-not-allowed
					transition-colors
					hover:border-gray-400 dark:hover:border-gray-500
					cursor-pointer
				`}
			>
				{placeholder && !value && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			
			<div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
				<ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
			</div>
		</div>
	);
};
