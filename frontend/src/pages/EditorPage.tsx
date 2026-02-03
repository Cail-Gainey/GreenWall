// EditorPage.tsx 是应用的核心页面，提供了类似 GitHub 贡献图的画布、绘制工具栏以及最终的仓库生成/推送入口。
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { notification, Select, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { GridCanvas } from '../components/Editor/GridCanvas';
import { EditorToolBar } from '../components/Editor/EditorToolBar';
import { EditorHeader } from '../components/Editor/EditorHeader';
import { CharacterSelector } from '../components/CharacterSelector';
import { PushRepoDialog } from '../components/PushRepoDialog';
import { MainLayout } from '../layouts/MainLayout';
import { OneDay, DrawMode, BrushIntensity, PatternIntensity } from '../types';
import { LEVEL_TO_COUNT, CONTRIBUTION_LEVELS, INTENSITY_LEVELS } from '../constants';
import { useTranslations } from '../i18n';
import {
    GenerateRepo,
    PushToGitHub,
    LoadUserInfo,
    StartOAuthLogin,
    Logout,
    GetUserRepos,
    ExportContributions
} from '../../wailsjs/go/main/App';
import * as models from '../../wailsjs/go/models';
import { getPatternById } from '../data/characterPatterns';

type Props = {
    contributions: OneDay[];      // 初始贡献数据
    onOpenSettings?: () => void;  // 打开设置回调
    onOpenAbout?: () => void;     // 打开关于回调
    onOpenTutorial?: () => void;  // 打开教程回调
    isGitInstalled?: boolean | null; // 本地 Git 安装状态
};

/**
 * EditorPage 组件：负责处理主要的编辑逻辑。
 * 包括：画布交互、工具切换、字符模式应用以及同步至 GitHub。
 */
export const EditorPage: React.FC<Props> = ({
    contributions,
    onOpenSettings = () => { },
    onOpenAbout = () => { },
    onOpenTutorial = () => { },
    isGitInstalled
}) => {
    const { t } = useTranslations();
    const [year, setYear] = useState(new Date().getFullYear());
    const [userContributions, setUserContributions] = useState<Map<string, number>>(new Map());

    // 绘制控制状态
    const [drawMode, setDrawMode] = useState<DrawMode>('pen'); // 'pen', 'eraser', 'bucket', 'pattern'
    const [brushIntensity, setBrushIntensity] = useState<BrushIntensity>('auto'); // 'auto', 'random' 或具体数值
    const [isDrawing, setIsDrawing] = useState(false); // 是否正在拖拽绘制

    // 对话框开关状态
    const [showCharSelector, setShowCharSelector] = useState(false);
    const [showPushDialog, setShowPushDialog] = useState(false);

    // 用户与系统交互状态
    const [userInfo, setUserInfo] = useState<{ username: string; email: string; avatarUrl?: string } | null>(null);
    const [userRepos, setUserRepos] = useState<any[]>([]);
    const [isPushing, setIsPushing] = useState(false);
    const [pushProgress, setPushProgress] = useState("");

    // 初始化：加载本地保存的用户登录信息
    useEffect(() => {
        LoadUserInfo().then(info => {
            if (info) setUserInfo(info);
        });
    }, []);

    // 记忆化的初始贡献用于快速查找
    const initialMap = useMemo(() => {
        const map = new Map<string, number>();
        contributions.forEach(c => map.set(c.date, c.count));
        return map;
    }, [contributions]);

    // State
    const [selectedPattern, setSelectedPattern] = useState<{ id: string; intensity: PatternIntensity } | null>(null);

    // Handlers
    /**
     * handleTileAction：处理磁贴的绘制操作。
     * @param dateStr 目标日期字符串 (YYYY-MM-DD)
     * @param mode 绘制模式
     */
    const handleTileAction = useCallback((dateStr: string, mode: DrawMode) => {
        if (mode === 'pen') {
            setUserContributions(prev => {
                const newMap = new Map(prev);
                let nextCount = 0;

                if (brushIntensity === 'auto') {
                    // 循环累加逻辑：获取当前（已编辑或初始）状态 -> 下一贡献等级
                    let currentCount = prev.get(dateStr);
                    if (currentCount === undefined) {
                        currentCount = initialMap.get(dateStr) ?? 0;
                    }

                    if (currentCount < CONTRIBUTION_LEVELS.L1) nextCount = CONTRIBUTION_LEVELS.L1;
                    else if (currentCount < CONTRIBUTION_LEVELS.L2) nextCount = CONTRIBUTION_LEVELS.L2;
                    else if (currentCount < CONTRIBUTION_LEVELS.L3) nextCount = CONTRIBUTION_LEVELS.L3;
                    else if (currentCount < CONTRIBUTION_LEVELS.L4) nextCount = CONTRIBUTION_LEVELS.L4;
                    else nextCount = 0; // 回到 0
                } else if (brushIntensity === 'random') {
                    // 随机等级
                    const levels = INTENSITY_LEVELS.map(l => LEVEL_TO_COUNT[l]);
                    nextCount = levels[Math.floor(Math.random() * levels.length)];
                } else {
                    // 使用选定的固定硬度
                    nextCount = LEVEL_TO_COUNT[brushIntensity as number];
                }

                newMap.set(dateStr, nextCount);
                return newMap;
            });
        } else if (mode === 'eraser') {
            setUserContributions(prev => {
                const newMap = new Map(prev);
                newMap.delete(dateStr); // 移除该日期的本地覆盖，回退到原始数据（或 0）
                return newMap;
            });
        } else if (mode === 'stamp' && selectedPattern) {
            // “印章/图案”模式：将选定的预设图案应用到点击的中心位置
            const pattern = getPatternById(selectedPattern.id);
            if (!pattern) return;

            // 辅助：将 YYYY-MM-DD 字符串作为 UTC 解析
            const parseUTC = (s: string) => {
                const [y, m, d] = s.split('-').map(Number);
                return new Date(Date.UTC(y, m - 1, d));
            };
            // 辅助：将日期转换为 UTC 格式字符串
            const formatUTC = (d: Date) => {
                const y = d.getUTCFullYear();
                const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                const day = String(d.getUTCDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const anchorDate = parseUTC(dateStr);
            const startOfYear = new Date(Date.UTC(year, 0, 1));
            const diffTime = anchorDate.getTime() - startOfYear.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const startDay = startOfYear.getUTCDay();

            // 计算该日期在 GitHub 1D 数组中的坐标空间位置 (row, col)
            const anchorIndex = diffDays;
            const anchorCol = Math.floor((anchorIndex + startDay) / 7);
            const anchorRow = (anchorIndex + startDay) % 7;

            const height = pattern.grid.length;
            const width = pattern.grid[0]?.length || 0;
            const centerY = Math.floor(height / 2);
            const centerX = Math.floor(width / 2);

            setUserContributions(prev => {
                const newMap = new Map(prev);
                pattern.grid.forEach((rowPixels, y) => {
                    rowPixels.forEach((pixel, x) => {
                        if (pixel === 1) {
                            // 计算相对于锚点的偏移坐标轴位置
                            const targetRow = anchorRow + y - centerY;
                            const targetCol = anchorCol + x - centerX;

                            // 磁贴行数垂直范围检查：0（周日）~ 6（周六）
                            if (targetRow < 0 || targetRow > 6) return;

                            // 反向转换为 1D 索引并找到日期
                            const targetIndex = (targetCol * 7) + targetRow - startDay;

                            if (targetIndex >= 0) {
                                const d = new Date(startOfYear);
                                d.setUTCDate(d.getUTCDate() + targetIndex);

                                // 仅修改当前年份内的磁贴
                                if (d.getUTCFullYear() === year) {
                                    const targetDateStr = formatUTC(d);

                                    let val = 1;
                                    if (selectedPattern.intensity === 'random') {
                                        const levels = INTENSITY_LEVELS.map(l => LEVEL_TO_COUNT[l]);
                                        val = levels[Math.floor(Math.random() * levels.length)];
                                    } else {
                                        val = LEVEL_TO_COUNT[selectedPattern.intensity as number];
                                    }
                                    newMap.set(targetDateStr, val);
                                }
                            }
                        }
                    });
                });
                return newMap;
            });
        }
    }, [brushIntensity, selectedPattern, year, t, initialMap]);

    // 处理字符/图案选择器的回调
    const handleCharacterSelect = (char: string, intensity: PatternIntensity) => {
        const pattern = getPatternById(char);
        if (!pattern) return;

        setSelectedPattern({ id: char, intensity });
        setDrawMode('stamp'); // 自动切换到印章模式
        setShowCharSelector(false); // 关闭选择器
    };

    // 预检并准备生成流程
    const handleGenerate = async () => {
        if (!userInfo) {
            notification.warning({ message: t('notifications.loginFirst') });
            return;
        }

        // 检查当年是否有任何修改过的贡献（防止推送空历史）
        const yearStr = `${year}-`;
        const hasContributions = Array.from(userContributions.entries()).some(([date, count]) => {
            return date.startsWith(yearStr) && count > 0;
        });

        if (!hasContributions) {
            notification.warning({
                message: t('notifications.noContributions'),
                duration: 4
            });
            return;
        }

        // 获取用户仓库列表并展示推送对话框
        const repos = await GetUserRepos();
        setUserRepos(repos || []);
        setShowPushDialog(true);
    };

    // 批量填充操作：将当前年份的所有日期填充为最大贡献等级（Level 4）
    const handleFillAll = useCallback(() => {
        setUserContributions(prev => {
            const newMap = new Map(prev);
            const start = new Date(Date.UTC(year, 0, 1));
            const end = new Date(Date.UTC(year, 11, 31));

            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                if (dateStr > todayStr) continue; // 不填充未来的日期
                newMap.set(dateStr, LEVEL_TO_COUNT[4]); // 设置为 Level 4
            }
            return newMap;
        });
        notification.success({ message: t('notifications.fillSuccess') });
    }, [year, t]);

    // 重置操作：清除当前年份在该应用中的所有绘图记录，恢复原始状态
    const handleReset = useCallback(() => {
        setUserContributions(prev => {
            const newMap = new Map(prev);
            // 仅删除属于当前年份的键
            for (const key of newMap.keys()) {
                if (key.startsWith(`${year}-`)) {
                    newMap.delete(key);
                }
            }
            return newMap;
        });
        notification.success({ message: t('titles.reset') });
    }, [year, t]);

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        const newMap = new Map();
                        json.forEach((item: any) => {
                            if (item.date && typeof item.count === 'number') {
                                newMap.set(item.date, item.count);
                            }
                        });
                        setUserContributions(newMap);
                        notification.success({ message: t('notifications.importSuccess') });
                    } else {
                        throw new Error("Invalid format");
                    }
                } catch (err) {
                    notification.error({ message: t('notifications.importFailed') });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleExport = async () => {
        try {
            const data = Array.from(userContributions.entries())
                .map(([date, count]: [string, number]) => new models.main.ContributionDay({ date, count }));

            const req = models.main.ExportContributionsRequest.createFrom({
                contributions: data
            });

            const res = await ExportContributions(req);

            if (res.success) {
                notification.success({
                    message: t('notifications.exportSuccess'),
                    description: res.message
                });
            } else {
                notification.error({
                    message: t('notifications.operationFailed'),
                    description: res.message
                });
            }
        } catch (e: any) {
            notification.error({
                message: t('notifications.operationFailed'),
                description: e.message || String(e)
            });
        }
    };

    const handlePush = async (params: any) => {
        setIsPushing(true);
        try {
            const contributionsForBackend = contributions
                .filter(c => new Date(c.date).getFullYear() === year)
                .map((c) => ({
                    date: c.date,
                    count: userContributions.get(c.date) ?? c.count,
                }))
                .filter((entry) => entry.count > 0);

            const generatePayload = models.main.GenerateRepoRequest.createFrom({
                year,
                githubUsername: userInfo?.username || '',
                githubEmail: userInfo?.email || '',
                repoName: params.repoName,
                contributions: contributionsForBackend,
                language: params.language || "",
                multiLanguage: params.multiLanguage || false,
                languageConfigs: params.languageConfigs || [],
            });

            const genResult = await GenerateRepo(generatePayload);

            const pushPayload = models.main.PushRepoRequest.createFrom({
                repoPath: genResult.repoPath,
                repoName: params.repoName,
                branch: params.branch,
                isNewRepo: params.isNewRepo,
                isPrivate: params.isPrivate,
                forcePush: params.forcePush,
                commitCount: genResult.commitCount,
            });

            const pushResult = await PushToGitHub(pushPayload);

            notification.success({
                message: t('notifications.pushSuccess'),
                description: `Repo: ${pushResult.repoUrl}`
            });
            setShowPushDialog(false);
        } catch (e: any) {
            notification.error({ message: t('notifications.operationFailed'), description: e.message });
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <MainLayout
            userInfo={userInfo}
            onLogin={async () => {
                const res = await StartOAuthLogin();
                if (res.userInfo) setUserInfo(res.userInfo);
            }}
            onLogout={async () => {
                await Logout();
                setUserInfo(null);
            }}
            onOpenSettings={onOpenSettings}
            onOpenAbout={onOpenAbout}
            onOpenTutorial={onOpenTutorial}
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a]">
                <EditorHeader
                    onImport={handleImport}
                    onExport={handleExport}
                    onGenerate={handleGenerate}
                    isGitInstalled={isGitInstalled}
                    onOpenSettings={onOpenSettings}
                />

                <div
                    className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-slate-900"
                    style={{
                        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        color: 'var(--dot-color, rgba(0,0,0,0.05))'
                    }}
                    onContextMenu={(e) => {
                        if (drawMode === 'stamp') {
                            e.preventDefault();
                            setSelectedPattern(null);
                            setDrawMode('pen');
                        }
                    }}
                >
                    <style>{`
                        .dark div[style*="radial-gradient"] { --dot-color: rgba(255,255,255,0.05); }
                        div[style*="radial-gradient"] { --dot-color: rgba(15, 23, 42, 0.05); }
                    `}</style>
                    <div className="flex-1 overflow-auto p-8 flex justify-center items-center">
                        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 mb-20 transition-all duration-300 flex flex-col items-center gap-6">
                            <GridCanvas
                                year={year}
                                contributions={contributions}
                                userContributions={userContributions}
                                onTileAction={handleTileAction}
                                drawMode={drawMode}
                                brushIntensity={brushIntensity}
                                isDrawing={isDrawing}
                                onSetIsDrawing={setIsDrawing}
                                selectedPattern={selectedPattern}
                                onCancelStamp={() => {
                                    setSelectedPattern(null);
                                    setDrawMode('pen');
                                }}
                                onImplicitModeChange={setDrawMode}
                            />

                            {/* Year Picker */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-display">
                                    {t('labels.year') || "Year"}:
                                </span>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<LeftOutlined />}
                                        onClick={() => setYear(y => Math.max(1990, y - 1))}
                                        disabled={year <= 1990}
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    />
                                    <Select
                                        value={year}
                                        onChange={setYear}
                                        variant="borderless"
                                        className="font-display font-medium min-w-[80px] text-center"
                                        popupMatchSelectWidth={false}
                                        suffixIcon={null}
                                        style={{ textAlign: 'center' }}
                                    >
                                        {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                            <Select.Option key={y} value={y}>{y}</Select.Option>
                                        ))}
                                    </Select>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<RightOutlined />}
                                        onClick={() => setYear(y => Math.min(new Date().getFullYear(), y + 1))}
                                        disabled={year >= new Date().getFullYear()}
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                        <EditorToolBar
                            drawMode={drawMode}
                            onDrawModeChange={(mode) => {
                                setDrawMode(mode);
                                if (mode !== 'stamp') setSelectedPattern(null);
                            }}
                            brushIntensity={brushIntensity}
                            onBrushIntensityChange={setBrushIntensity}
                            onCharacterSelect={() => setShowCharSelector(true)}
                            onReset={handleReset}
                            onFillAll={handleFillAll}
                        />
                    </div>
                </div>
            </div>

            {showCharSelector && (
                <CharacterSelector
                    onClose={() => setShowCharSelector(false)}
                    onSelect={handleCharacterSelect}
                />
            )}

            {showPushDialog && userInfo && (
                <PushRepoDialog
                    onClose={() => setShowPushDialog(false)}
                    onPush={handlePush}
                    repoPath=""
                    commitCount={0}
                    userRepos={userRepos}
                    isLoading={isPushing}
                    progressMessage={pushProgress}
                />
            )}
        </MainLayout>
    );
};
