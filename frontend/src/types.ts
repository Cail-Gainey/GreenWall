export type OneDay = {
    level: number;
    count: number;
    date: string
};

export type DrawMode = 'pen' | 'eraser' | 'stamp';
export type BrushIntensity = 1 | 2 | 3 | 4 | 'auto' | 'random';
export type PatternIntensity = 1 | 2 | 3 | 4 | 'random';
