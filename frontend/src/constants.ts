/**
 * GitHub 贡献图常量
 *
 * 定义每个强度级别的提交数量和颜色。
 * Level 0: 0 commit
 * Level 1: 1 commit
 * Level 2: 5 commits
 * Level 3: 10 commits
 * Level 4: 20 commits
 */

// Commit count thresholds for each level
export const CONTRIBUTION_LEVELS = {
    L0: 0,
    L1: 1,
    L2: 5,
    L3: 10,
    L4: 20,
} as const;

// Helper to determine usage/rendering level based on count
export const getContributionLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count <= 0) return 0;
    if (count < CONTRIBUTION_LEVELS.L2) return 1;
    if (count < CONTRIBUTION_LEVELS.L3) return 2;
    if (count < CONTRIBUTION_LEVELS.L4) return 3;
    return 4;
};

// Colors for each level (GitHub palette)
export const GITHUB_COLORS = {
    light: {
        0: '#ebedf0',
        1: '#9be9a8',
        2: '#40c463',
        3: '#30a14e',
        4: '#216e39',
    },
    dark: {
        0: '#161b22',
        1: '#0e4429',
        2: '#006d32',
        3: '#26a641',
        4: '#39d353',
    },
} as const;

// Standard levels array for iteration
export const INTENSITY_LEVELS = [1, 2, 3, 4] as const;

// Helper to get color safely
export const getLevelColor = (level: 0 | 1 | 2 | 3 | 4, isDark: boolean): string => {
    const palette = isDark ? GITHUB_COLORS.dark : GITHUB_COLORS.light;
    return palette[level] || palette[0];
};

// Mapping from Level (1-4) to Commit Count
export const LEVEL_TO_COUNT: Record<number, number> = {
    1: CONTRIBUTION_LEVELS.L1,
    2: CONTRIBUTION_LEVELS.L2,
    3: CONTRIBUTION_LEVELS.L3,
    4: CONTRIBUTION_LEVELS.L4
};
