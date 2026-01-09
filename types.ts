
export type Point = {
  x: number;
  y: number;
};

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_UP = 'LEVEL_UP',
  MENU = 'MENU'
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  STAGES = 'STAGES'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  stage: number;
  mode: GameMode;
  difficulty: Difficulty;
  menuOption: number;
  menuContext: 'MAIN' | 'STAGE_SELECT' | 'DIFFICULTY_SELECT';
  snakeHue: number;
}
