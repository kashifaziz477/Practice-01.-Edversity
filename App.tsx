
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Nokia3310 } from './components/Nokia3310';
import { LCDScreen } from './components/LCDScreen';
import { Direction, GameStatus, Point, GameState } from './types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT } from './constants';

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
    highScore: parseInt(localStorage.getItem('snake_highscore') || '0', 10)
  });

  const directionRef = useRef<Direction>(Direction.RIGHT);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const spawnFood = useCallback((snake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (SCREEN_WIDTH / 2)),
        y: Math.floor(Math.random() * (SCREEN_HEIGHT / 2))
      };
      if (!snake.some(p => p.x === newFood.x && p.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    directionRef.current = Direction.RIGHT;
    setGameState(prev => ({
      ...prev,
      snake: initialSnake,
      food: spawnFood(initialSnake),
      direction: Direction.RIGHT,
      status: GameStatus.PLAYING,
      score: 0
    }));
  }, [spawnFood]);

  const togglePause = useCallback(() => {
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

      // Collision Detection: Walls
      if (newHead.x < 0 || newHead.x >= (SCREEN_WIDTH / 2) || 
          newHead.y < 0 || newHead.y >= (SCREEN_HEIGHT / 2)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      // Collision Detection: Self
      if (prev.snake.some(p => p.x === newHead.x && p.y === newHead.y)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      const newSnake = [newHead, ...prev.snake];
      
      // Collision Detection: Food
      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        return {
          ...prev,
          snake: newSnake,
          food: spawnFood(newSnake),
          score: prev.score + 10
        };
      }

      newSnake.pop();
      return { ...prev, snake: newSnake };
    });
  }, [spawnFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
        if (e.key === 'Enter' || e.key === ' ') resetGame();
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
      }

      if (gameState.status === GameStatus.PAUSED) return;

      switch (e.key) {
        case 'ArrowUp': 
          if (directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP; 
          break;
        case 'ArrowDown': 
          if (directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN; 
          break;
        case 'ArrowLeft': 
          if (directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT; 
          break;
        case 'ArrowRight': 
          if (directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT; 
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, resetGame, togglePause]);

  const tick = useCallback((time: number) => {
    const speed = Math.max(MIN_SPEED, INITIAL_SPEED - (gameState.score / 10) * SPEED_INCREMENT);
    
    if (time - lastUpdateRef.current > speed) {
      moveSnake();
      lastUpdateRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(tick);
  }, [moveSnake, gameState.score]);

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
    if (dir === 'RESET') {
      resetGame();
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
