
export const SCREEN_WIDTH = 84;
export const SCREEN_HEIGHT = 70;
export const GRID_WIDTH = 42; 
export const GRID_HEIGHT = 35; 
export const PIXEL_SCALE = 2; 

export const INITIAL_SPEED = 120;
export const MIN_SPEED = 40;
export const SPEED_INCREMENT = 5;
export const POINTS_PER_LEVEL = 70; // Changed from 100 to 70

export const NOKIA_PALETTE = {
  LCD_BG: '#94a171',
  PIXEL_ON: '#2a311d',
  PIXEL_OFF: '#8b976a',
  // Dynamic colors for the "colorful snake" request
  SNAKE_COLORS: [
    '#2a311d', // Classic
    '#5d2a1d', // Reddish
    '#1d3d5d', // Bluish
    '#4d5d1d', // Goldish
    '#1d5d3d', // Emerald
    '#5d1d5d'  // Purplish
  ]
};

export const STAGE_OBSTACLES: Record<number, { x: number, y: number }[]> = {
  1: [], // Open Field
  2: [ // Corners
    {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
    {x: 34, y: 5}, {x: 35, y: 5}, {x: 36, y: 5}, {x: 36, y: 6}, {x: 36, y: 7},
    {x: 5, y: 27}, {x: 5, y: 28}, {x: 5, y: 29}, {x: 6, y: 29}, {x: 7, y: 29},
    {x: 36, y: 27}, {x: 36, y: 28}, {x: 36, y: 29}, {x: 35, y: 29}, {x: 34, y: 29},
  ],
  3: [ // Parallel Bars
    ...Array.from({length: 22}, (_, i) => ({x: i + 10, y: 11})),
    ...Array.from({length: 22}, (_, i) => ({x: i + 10, y: 23})),
  ],
  4: [ // The Cross (X)
    ...Array.from({length: 10}, (_, i) => ({x: 16 + i, y: 12 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 25 - i, y: 12 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 16 + i, y: 22 - i})),
    ...Array.from({length: 10}, (_, i) => ({x: 25 - i, y: 22 - i})),
  ],
  5: [ // The Box
    ...Array.from({length: 30}, (_, i) => ({x: 6 + i, y: 6})),
    ...Array.from({length: 30}, (_, i) => ({x: 6 + i, y: 28})),
    ...Array.from({length: 10}, (_, i) => ({x: 6, y: 6 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 6, y: 19 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 35, y: 6 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 35, y: 19 + i})),
  ],
  6: [ // The Pillars
    {x: 10, y: 8}, {x: 11, y: 8}, {x: 10, y: 9}, {x: 11, y: 9},
    {x: 30, y: 8}, {x: 31, y: 8}, {x: 30, y: 9}, {x: 31, y: 9},
    {x: 10, y: 25}, {x: 11, y: 25}, {x: 10, y: 26}, {x: 11, y: 26},
    {x: 30, y: 25}, {x: 31, y: 25}, {x: 30, y: 26}, {x: 31, y: 26},
  ],
  7: [ // The Zig-Zag
    ...Array.from({length: 15}, (_, i) => ({x: 0 + i, y: 10})),
    ...Array.from({length: 15}, (_, i) => ({x: 26 + i, y: 10})),
    ...Array.from({length: 15}, (_, i) => ({x: 13 + i, y: 22})),
  ],
  8: [ // The Fortress
    ...Array.from({length: 42}, (_, i) => i % 4 !== 0 ? {x: i, y: 0} : null).filter(Boolean) as {x:number,y:number}[],
    ...Array.from({length: 42}, (_, i) => i % 4 !== 0 ? {x: i, y: 34} : null).filter(Boolean) as {x:number,y:number}[],
    ...Array.from({length: 6}, (_, i) => ({x: 21, y: 14 + i})),
    ...Array.from({length: 6}, (_, i) => ({x: 18 + i, y: 17})),
  ]
};

export const MAX_STAGES = 8;
