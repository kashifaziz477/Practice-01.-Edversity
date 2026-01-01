
export const SCREEN_WIDTH = 84;
export const SCREEN_HEIGHT = 70;
export const GRID_WIDTH = 42; // Logic units (SCREEN_WIDTH / 2)
export const GRID_HEIGHT = 35; // Logic units (SCREEN_HEIGHT / 2)
export const PIXEL_SCALE = 2; 

export const INITIAL_SPEED = 120;
export const MIN_SPEED = 40;
export const SPEED_INCREMENT = 5;
export const POINTS_PER_LEVEL = 100; // Change level every 100 points

export const NOKIA_PALETTE = {
  LCD_BG: '#94a171', // Classic greenish-gray
  PIXEL_ON: '#2a311d', // Dark pixel
  PIXEL_OFF: '#8b976a' // Faded pixel
};

// Map obstacles for different stages
// Coordinates are in logic units (0-41 for x, 0-34 for y)
export const STAGE_OBSTACLES: Record<number, { x: number, y: number }[]> = {
  1: [], // Clear field
  2: [ // Corner L-shapes
    // Top Left
    {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
    // Top Right
    {x: 34, y: 5}, {x: 35, y: 5}, {x: 36, y: 5}, {x: 36, y: 6}, {x: 36, y: 7},
    // Bottom Left
    {x: 5, y: 27}, {x: 5, y: 28}, {x: 5, y: 29}, {x: 6, y: 29}, {x: 7, y: 29},
    // Bottom Right
    {x: 36, y: 27}, {x: 36, y: 28}, {x: 36, y: 29}, {x: 35, y: 29}, {x: 34, y: 29},
  ],
  3: [ // The "Three Lanes" - Two horizontal bars
    ...Array.from({length: 22}, (_, i) => ({x: i + 10, y: 11})),
    ...Array.from({length: 22}, (_, i) => ({x: i + 10, y: 23})),
  ],
  4: [ // The "X" Cross
    ...Array.from({length: 10}, (_, i) => ({x: 16 + i, y: 12 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 25 - i, y: 12 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 16 + i, y: 22 - i})),
    ...Array.from({length: 10}, (_, i) => ({x: 25 - i, y: 22 - i})),
  ],
  5: [ // The Maze / Box
    ...Array.from({length: 30}, (_, i) => ({x: 6 + i, y: 6})),
    ...Array.from({length: 30}, (_, i) => ({x: 6 + i, y: 28})),
    ...Array.from({length: 10}, (_, i) => ({x: 6, y: 6 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 6, y: 19 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 35, y: 6 + i})),
    ...Array.from({length: 10}, (_, i) => ({x: 35, y: 19 + i})),
    // Middle pillars
    {x: 20, y: 16}, {x: 21, y: 16}, {x: 20, y: 17}, {x: 21, y: 17},
    {x: 20, y: 18}, {x: 21, y: 18}
  ]
};

export const MAX_STAGES = 5;
