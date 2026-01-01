
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Nokia3310 } from './components/Nokia3310';
import { LCDScreen } from './components/LCDScreen';
import { Direction, GameStatus, Point, GameState } from './types';
import { 
  SCREEN_WIDTH, SCREEN_HEIGHT, 
  INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT, 
  STAGE_OBSTACLES, POINTS_PER_LEVEL, MAX_STAGES,
  GRID_WIDTH, GRID_HEIGHT
} from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ],
    food: { x: 20, y: 20 },
    direction: Direction.RIGHT,
    status: GameStatus.IDLE,
    score: 0,
    highScore: parseInt(localStorage.getItem('snake_highscore') || '0', 10),
    stage: 1
  });

  const directionRef = useRef<Direction>(Direction.RIGHT);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playEatSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const playLevelUpSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.1);
    });
  }, []);

  const spawnFood = useCallback((snake: Point[], stage: number): Point => {
    let newFood: Point;
    const obstacles = STAGE_OBSTACLES[stage] || [];
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
      const onSnake = snake.some(p => p.x === newFood.x && p.y === newFood.y);
      const onObstacle = obstacles.some(p => p.x === newFood.x && p.y === newFood.y);
      if (!onSnake && !onObstacle) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    initAudio();
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    directionRef.current = Direction.RIGHT;
    setGameState(prev => ({
      ...prev,
      snake: initialSnake,
      food: spawnFood(initialSnake, 1),
      direction: Direction.RIGHT,
      status: GameStatus.PLAYING,
      score: 0,
      stage: 1
    }));
  }, [spawnFood]);

  const togglePause = useCallback(() => {
    initAudio();
    setGameState(prev => {
      if (prev.status === GameStatus.PLAYING) return { ...prev, status: GameStatus.PAUSED };
      if (prev.status === GameStatus.PAUSED) return { ...prev, status: GameStatus.PLAYING };
      return prev;
    });
  }, []);

  const moveSnake = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;

      const head = prev.snake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check boundaries
      if (newHead.x < 0 || newHead.x >= GRID_WIDTH || 
          newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      // Check obstacles
      const obstacles = STAGE_OBSTACLES[prev.stage] || [];
      if (obstacles.some(p => p.x === newHead.x && p.y === newHead.y)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      // Check self-collision
      if (prev.snake.some(p => p.x === newHead.x && p.y === newHead.y)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      const newSnake = [newHead, ...prev.snake];
      
      // Check food collision
      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        playEatSound();
        const newScore = prev.score + 10;
        
        // Advance stage on reaching 100 points increments
        if (newScore > 0 && newScore % POINTS_PER_LEVEL === 0 && prev.stage < MAX_STAGES) {
          playLevelUpSound();
          return {
            ...prev,
            status: GameStatus.LEVEL_UP,
            score: newScore,
            stage: prev.stage + 1
          };
        }

        return {
          ...prev,
          snake: newSnake,
          food: spawnFood(newSnake, prev.stage),
          score: newScore
        };
      }

      newSnake.pop();
      return { ...prev, snake: newSnake };
    });
  }, [spawnFood, playEatSound, playLevelUpSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
        if (e.key === 'Enter' || e.key === ' ') resetGame();
        return;
      }

      if (gameState.status === GameStatus.LEVEL_UP) {
        if (e.key === 'Enter' || e.key === ' ') {
          const initialSnake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
          ];
          directionRef.current = Direction.RIGHT;
          setGameState(prev => ({
            ...prev,
            status: GameStatus.PLAYING,
            snake: initialSnake,
            food: spawnFood(initialSnake, prev.stage)
          }));
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === ' ') {
        togglePause();
        return;
      }

      if (gameState.status === GameStatus.PAUSED) return;

      switch (e.key) {
        case 'ArrowUp': if (directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP; break;
        case 'ArrowDown': if (directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN; break;
        case 'ArrowLeft': if (directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT; break;
        case 'ArrowRight': if (directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, resetGame, togglePause, spawnFood]);

  const tick = useCallback((time: number) => {
    // Speed increases based on Stage and fractional score progress
    const stageDifficulty = (gameState.stage - 1) * 15;
    const scoreDifficulty = Math.floor((gameState.score % POINTS_PER_LEVEL) / 20) * 3;
    const speed = Math.max(MIN_SPEED, INITIAL_SPEED - stageDifficulty - scoreDifficulty);
    
    if (time - lastUpdateRef.current > speed) {
      moveSnake();
      lastUpdateRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(tick);
  }, [moveSnake, gameState.score, gameState.stage]);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      gameLoopRef.current = requestAnimationFrame(tick);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState.status, tick]);

  const handleControlClick = (dir: Direction | 'RESET' | 'PAUSE') => {
    initAudio();
    if (dir === 'RESET') {
      if (gameState.status === GameStatus.LEVEL_UP) {
        const initialSnake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 }
        ];
        directionRef.current = Direction.RIGHT;
        setGameState(prev => ({
          ...prev,
          status: GameStatus.PLAYING,
          snake: initialSnake,
          food: spawnFood(initialSnake, prev.stage)
        }));
      } else {
        resetGame();
      }
      return;
    }
    if (dir === 'PAUSE') {
      togglePause();
      return;
    }
    if (gameState.status !== GameStatus.PLAYING) return;
    
    switch (dir) {
      case Direction.UP: if (directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP; break;
      case Direction.DOWN: if (directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN; break;
      case Direction.LEFT: if (directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT; break;
      case Direction.RIGHT: if (directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT; break;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950">
      <Nokia3310 onControl={handleControlClick} status={gameState.status}>
        <LCDScreen state={gameState} />
      </Nokia3310>
    </div>
  );
};

export default App;
