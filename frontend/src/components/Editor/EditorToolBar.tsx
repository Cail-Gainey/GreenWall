// EditorToolBar.tsx 是磁贴画板顶部的工具栏组件。
// 它集中了绘制模式切换、笔刷硬度（贡献等级）选择以及快捷操作（字符图案、一键填充、重置）等核心交互功能。
import React from 'react';
import { Button, Tooltip, Space, Segmented } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    FormatPainterOutlined,
    ClearOutlined,
    BgColorsOutlined,
    ThunderboltOutlined,
    ExperimentOutlined
} from '@ant-design/icons';
import { useTranslations } from '../../i18n';
import { DrawMode, BrushIntensity } from '../../types';
import { GITHUB_COLORS } from '../../constants';

type Props = {
    drawMode: DrawMode;                        // 当前绘制模式 ('pen', 'eraser', 'stamp' 等)
    onDrawModeChange: (mode: DrawMode) => void; // 模式切换回调
    brushIntensity: BrushIntensity;            // 当前笔刷硬度 (1-4, 'auto', 'random')
    onBrushIntensityChange: (val: BrushIntensity) => void; // 硬度切换回调
    onCharacterSelect: () => void;             // 点击“字符/图案”按钮的回调
    onReset: () => void;                      // 点击“重置当前年份”的回调
    onFillAll: () => void;                    // 点击“一键全满”的回调
};

/**
 * EditorToolBar 组件：提供可视化的工具切换界面。
 */
export const EditorToolBar: React.FC<Props> = ({
    drawMode,
    onDrawModeChange,
    brushIntensity,
    onBrushIntensityChange,
    onCharacterSelect,
    onReset,
    onFillAll,
}) => {
    const { t } = useTranslations();

    // 辅助函数：根据等级获取预览颜色，用于强度按钮的背景显示
    const getPreviewColor = (level: number) => GITHUB_COLORS.light[level as 1 | 2 | 3 | 4] || GITHUB_COLORS.light[1];

    return (
        <div className="flex items-center gap-4 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-slate-700/50 transition-transform duration-200 hover:scale-[1.02]">

            {/* 1. 模式选择组：使用 AntD Segmented 实现互斥切换 */}
            <Segmented
                value={drawMode}
                onChange={(val) => onDrawModeChange(val as DrawMode)}
                options={[
                    {
                        value: 'pen',
                        icon: <EditOutlined />,
                        label: t('drawModes.pen')
                    },
                    {
                        value: 'eraser',
                        icon: <DeleteOutlined />,
                        label: t('drawModes.eraser')
                    }
                ]}
                className="bg-slate-100 dark:bg-slate-900 font-medium"
                size="large"
            />

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* 2. 强度/颜色选择器：模拟 GitHub 不同等级的绿色磁贴 */}
            <div className="flex items-center gap-2">
                <Tooltip title={t('brushIntensity.label')}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500">
                        <BgColorsOutlined />
                    </div>
                </Tooltip>

                {/* 固定等级按钮 (1-4) */}
                {[1, 2, 3, 4].map((level) => (
                    <Tooltip key={level} title={`${t('brushIntensity.level')} ${level}`}>
                        <button
                            onClick={() => onBrushIntensityChange(level as BrushIntensity)}
                            className={`
                w-8 h-8 rounded-lg transition-all duration-200 border-2 
                ${brushIntensity === level
                                    ? 'border-brand-green scale-110 shadow-sm'
                                    : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}
              `}
                            style={{ backgroundColor: getPreviewColor(level) }}
                        />
                    </Tooltip>
                ))}

                {/* 智能增量模式：点击磁贴时自动在等级间循环 */}
                <Tooltip title={t('brushIntensity.auto')}>
                    <button
                        onClick={() => onBrushIntensityChange('auto')}
                        className={`
                w-8 h-8 rounded-lg transition-all duration-200 border-2 flex items-center justify-center
                bg-slate-100 dark:bg-slate-900
                ${brushIntensity === 'auto'
                                ? 'border-green-500 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-green-500/50'}
              `}
                    >
                        <ThunderboltOutlined className="text-green-600 dark:text-green-500 text-xs" />
                    </button>
                </Tooltip>

                {/* 随机硬度模式：每次点击磁贴产生随机贡献等级 */}
                <Tooltip title={t('brushIntensity.random')}>
                    <button
                        onClick={() => onBrushIntensityChange('random')}
                        className={`
                w-8 h-8 rounded-lg transition-all duration-200 border-2 flex items-center justify-center
                bg-slate-100 dark:bg-slate-900
                ${brushIntensity === 'random'
                                ? 'border-purple-500 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-purple-500/50'}
              `}
                    >
                        <ExperimentOutlined className="text-purple-600 dark:text-purple-500 text-xs" />
                    </button>
                </Tooltip>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* 3. 辅助功能组 */}
            <Space size={2}>
                {/* 弹出字符/字符图案选择器 */}
                <Tooltip title={t('characterSelector.title')}>
                    <Button type="text" size="large" icon={<FormatPainterOutlined />} onClick={onCharacterSelect}>
                        ABC
                    </Button>
                </Tooltip>

                {/* 一键全满：快速铺满当年贡献 */}
                <Tooltip title={t('titles.fillAll')}>
                    <Button type="text" size="large" icon={<FormatPainterOutlined className="text-brand-green" />} onClick={onFillAll} />
                </Tooltip>

                {/* 重置：清空当前编辑缓存 */}
                <Tooltip title={t('titles.reset')}>
                    <Button type="text" size="large" danger icon={<ClearOutlined />} onClick={onReset} />
                </Tooltip>
            </Space>
        </div>
    );
};
