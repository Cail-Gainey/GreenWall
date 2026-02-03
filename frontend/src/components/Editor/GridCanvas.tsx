// GridCanvas.tsx 是贡献图编辑器的核心渲染画布。
// 它模仿了 GitHub 贡献图的 7x53 网格布局，并支持复杂的交互：
// 1. 点击与拖拽绘制 (笔刷/橡皮擦)
// 2. 印章预览与应用 (字符图案模式)
// 3. 实时坐标转换与未来日期禁用逻辑
import React from 'react';
import { Tooltip } from 'antd';
import { useTranslations } from '../../i18n';
import { useTheme } from 'next-themes';
import { OneDay, DrawMode, BrushIntensity, PatternIntensity } from '../../types';
import { getPatternById } from '../../data/characterPatterns';
import { getContributionLevel, getLevelColor, GITHUB_COLORS } from '../../constants';

type Props = {
    contributions: OneDay[];           // 原始贡献数据
    userContributions: Map<string, number>; // 用户当前编辑的贡献覆盖图
    onTileAction: (date: string, mode: DrawMode) => void; // 交互指令回调
    drawMode: DrawMode;                // 当前选择的绘制模式
    brushIntensity: BrushIntensity;    // 笔刷强度配置
    isDrawing: boolean;                // 是否正处于鼠标按下后的拖拽状态
    onSetIsDrawing: (isDrawing: boolean) => void; // 切换绘制状态的回调
    year: number;                      // 当前显示的年份
    selectedPattern?: { id: string; intensity: PatternIntensity } | null; // 印章模式选中的图案
    onCancelStamp?: () => void;        // 取消印章模式的回调
    onImplicitModeChange?: (mode: DrawMode) => void; // 用于处理左右键切换引起的状态变化
};

/**
 * GridCanvas 组件：负责渲染可交互的贡献网格。
 */
export const GridCanvas: React.FC<Props> = ({
    contributions,
    userContributions,
    onTileAction,
    drawMode,
    isDrawing,
    onSetIsDrawing,
    year,
    selectedPattern,
    onCancelStamp,
    onImplicitModeChange
}) => {
    const { t, dictionary } = useTranslations();
    const { resolvedTheme } = useTheme();
    // 追踪鼠标最后悬停的日期，用于印章预览
    const [lastHoveredDate, setLastHoveredDate] = React.useState<string | null>(null);

    // 辅助函数：解析与格式化带有 UTC 偏移的日期字符串
    const parseUTC = (s: string) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d));
    };
    const formatUTC = (d: Date) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // 辅助计算：快速查找原始数据中的贡献数
    const contributionMap = React.useMemo(() => {
        const map = new Map<string, number>();
        contributions.forEach(c => map.set(c.date, c.count));
        return map;
    }, [contributions]);

    // 构建该年份的完整日期序列网格数据
    const yearDays = React.useMemo(() => {
        const days: { date: string; count: number }[] = [];
        const start = new Date(Date.UTC(year, 0, 1));
        const temp = new Date(start);
        while (temp.getUTCFullYear() === year) {
            const dateStr = formatUTC(temp);
            const count = contributionMap.get(dateStr) || 0;
            days.push({ date: dateStr, count });
            temp.setUTCDate(temp.getUTCDate() + 1);
        }
        return days;
    }, [year, contributionMap]);

    // 检查日期是否属于不可编辑的“未来”
    const isFutureDate = (dateStr: string) => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return dateStr > `${y}-${m}-${d}`;
    };

    // 追踪当前拖拽时的鼠标意图（左键-添加，右键-擦除）
    const dragModeRef = React.useRef<DrawMode>('pen');

    /**
     * handleMouseDown：处理磁贴点击。
     * 支持区分鼠标左键（绘制）与右键（擦除/取消模式）。
     */
    const handleMouseDown = (dateStr: string, e: React.MouseEvent) => {
        if (isFutureDate(dateStr)) return;

        // 印章模式专用逻辑
        if (drawMode === 'stamp') {
            if (e.button === 2) {
                // 右键：取消印章模式
                if (onCancelStamp) {
                    onCancelStamp();
                    setLastHoveredDate(null);
                }
            } else if (e.button === 0 && selectedPattern) {
                // 左键：在当前位置应用图案
                onTileAction(dateStr, 'stamp');
            }
            return;
        }

        // 普通绘图（笔刷/橡皮擦）模式
        if (e.button === 0) {
            dragModeRef.current = 'pen';
        } else if (e.button === 2) {
            dragModeRef.current = 'eraser';
        } else {
            return;
        }

        if (onImplicitModeChange) {
            onImplicitModeChange(dragModeRef.current);
        }

        onSetIsDrawing(true); // 进入拖拽状态
        setLastHoveredDate(dateStr);
        onTileAction(dateStr, dragModeRef.current);
    };

    /**
     * handleMouseEnter：支持拖拽绘图，滑入磁贴时触发。
     */
    const handleMouseEnter = (dateStr: string) => {
        setLastHoveredDate(dateStr);
        if (isFutureDate(dateStr)) return;

        // 如果正处于拖拽中且不是印章模式，则继续绘制
        if (isDrawing && lastHoveredDate !== dateStr && drawMode !== 'stamp') {
            onTileAction(dateStr, dragModeRef.current);
        }
    };

    const handleMouseUp = () => {
        onSetIsDrawing(false);
    };
    const handleMouseLeaveContainer = () => setLastHoveredDate(null);

    React.useEffect(() => {
        // 全局监听 mouseup，防止鼠标在网格外松开导致状态不一致
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // 坐标计算基础
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const startDay = startOfYear.getUTCDay(); // 年初是周几 (0-6)

    // 生成月份刻度条 (Jan, Feb...)
    const monthLabels = React.useMemo(() => {
        const labels: { label: string; col: number }[] = [];
        let currentMonth = -1;

        yearDays.forEach((day, index) => {
            const d = parseUTC(day.date);
            const m = d.getUTCMonth();
            if (m !== currentMonth) {
                currentMonth = m;
                const col = Math.floor((index + startDay) / 7);
                labels.push({ label: dictionary.months[m], col });
            }
        });
        return labels;
    }, [yearDays, startDay, dictionary.months]);

    /**
     * stampPreviewCells：核心计算逻辑。
     * 根据当前选中的印章图案和鼠标悬停位置，计算预计会影响到的日期集合。
     */
    const stampPreviewCells = React.useMemo(() => {
        if (!selectedPattern || !lastHoveredDate || drawMode !== 'stamp') return new Set<string>();

        const pattern = getPatternById(selectedPattern.id);
        if (!pattern) return new Set<string>();

        const preview = new Set<string>();
        const anchorDate = parseUTC(lastHoveredDate);
        const diffTime = anchorDate.getTime() - startOfYear.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // 磁贴映射到 2D 坐标系的算法与后端保持高度一致
        const anchorIndex = diffDays;
        const anchorCol = Math.floor((anchorIndex + startDay) / 7);
        const anchorRow = (anchorIndex + startDay) % 7;

        const height = pattern.grid.length;
        const width = pattern.grid[0]?.length || 0;
        const centerY = Math.floor(height / 2);
        const centerX = Math.floor(width / 2);

        pattern.grid.forEach((rowPixels, y) => {
            rowPixels.forEach((pixel, x) => {
                if (pixel === 1) {
                    const targetRow = anchorRow + y - centerY;
                    const targetCol = anchorCol + x - centerX;

                    // 越界检查
                    if (targetRow < 0 || targetRow > 6) return;

                    const targetIndex = (targetCol * 7) + targetRow - startDay;

                    if (targetIndex >= 0) {
                        const d = new Date(startOfYear);
                        d.setUTCDate(d.getUTCDate() + targetIndex);
                        if (d.getUTCFullYear() === year) {
                            preview.add(formatUTC(d));
                        }
                    }
                }
            });
        });
        return preview;
    }, [selectedPattern, lastHoveredDate, drawMode, year, startDay]);


    const gridCells = [];

    // 1. 插入开头空白格（对齐星期）
    for (let i = 0; i < startDay; i++) {
        gridCells.push(<div key={`empty-${i}`} className="w-3 h-3" />);
    }

    // 2. 依次渲染核心磁贴
    yearDays.forEach((day) => {
        const userVal = userContributions.get(day.date);
        const count = userVal !== undefined ? userVal : day.count;
        const isPreview = stampPreviewCells.has(day.date);

        const isDark = resolvedTheme === 'dark';
        const level = getContributionLevel(count);
        const bg = getLevelColor(level, isDark);

        let style: React.CSSProperties = { backgroundColor: bg };

        // 假如处于预览状态，叠加高亮虚影
        if (isPreview) {
            const previewColor = GITHUB_COLORS.light[4];
            style = {
                backgroundColor: previewColor,
                opacity: 0.6,
                boxShadow: `0 0 4px ${previewColor}`
            };
        }

        gridCells.push(
            <Tooltip
                key={day.date}
                title={t('calendar.tooltipSome', { date: day.date, count: count })}
                mouseEnterDelay={0.5}
                classNames={{ root: "font-sans" }}
            >
                <div
                    onMouseDown={(e) => handleMouseDown(day.date, e)}
                    onMouseEnter={() => handleMouseEnter(day.date)}
                    className={`
              w-3 h-3 rounded-[3px] cursor-pointer transition-all duration-300
              border border-black/5 dark:border-white/5
              ${count > 0 && !isPreview ? 'hover:shadow-[0_0_8px_rgba(34,197,94,0.6)] hover:brightness-110' : ''}
              ${!isPreview && !isFutureDate(day.date) ? 'hover:scale-125 hover:border-black/50 dark:hover:border-white/50 hover:z-20' : ''}
              ${isFutureDate(day.date) ? 'opacity-30 cursor-not-allowed' : ''}
              ${isPreview ? 'z-10 scale-110' : ''}
            `}
                    style={style}
                />
            </Tooltip>
        );
    });

    return (
        <div
            className="flex flex-col gap-2 select-none overflow-x-auto pb-4"
            onMouseLeave={handleMouseLeaveContainer}
            onContextMenu={(e) => {
                // 全局拦截上下文菜单，确保右键能用于画板操作（擦除/取消）
                e.preventDefault();
                if (drawMode === 'stamp' && onCancelStamp) {
                    onCancelStamp();
                    setLastHoveredDate(null);
                }
            }}
        >
            {/* 月份头部刻度 */}
            <div className="flex mb-1">
                <div className="w-8 shrink-0 mr-2" />
                <div className="relative flex-1 h-5 pl-4">
                    {monthLabels.map(({ label, col }) => (
                        <span
                            key={label}
                            className="absolute text-xs text-gray-400 font-sans"
                            style={{ left: `${col * 15 + 16}px` }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                {/* 星期左侧刻度 */}
                <div className="grid grid-rows-7 gap-[3px] pt-[17px] pb-4 text-[10px] font-medium text-slate-500 font-sans text-right w-8 shrink-0 leading-none">
                    <div /> {/* Sun */}
                    <div className="flex items-center justify-end">{t('weekdays.mon')}</div>
                    <div /> {/* Tue */}
                    <div className="flex items-center justify-end">{t('weekdays.wed')}</div>
                    <div /> {/* Thu */}
                    <div className="flex items-center justify-end">{t('weekdays.fri')}</div>
                    <div /> {/* Sat */}
                </div>

                {/* 网格核心容器：带玻璃拟态样式的面板 */}
                <div
                    className="grid grid-flow-col gap-[3px] p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner backdrop-blur-sm"
                    style={{ gridTemplateRows: 'repeat(7, 1fr)' }}
                >
                    {gridCells}
                </div>
            </div>
        </div>
    );
};
