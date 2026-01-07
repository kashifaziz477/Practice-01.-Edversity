
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Nokia3310 } from './components/Nokia3310';
import { LCDScreen } from './components/LCDScreen';
import { Direction, GameStatus, Point, GameState, GameMode } from './types';
import { 
  SCREEN_WIDTH, SCREEN_HEIGHT, 
  INITIAL_SPEED, MIN_SPEED, 
  STAGE_OBSTACLES, POINTS_PER_LEVEL, MAX_STAGES,
  GRID_WIDTH, GRID_HEIGHT, NOKIA_PALETTE
} from './constants';

// Audio decoding helpers as per Gemini API requirements
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
    stage: 1,
    mode: GameMode.CLASSIC,
    menuOption: 0,
    menuContext: 'MAIN',
    snakeHue: 0
  });

  const directionRef = useRef<Direction>(Direction.RIGHT);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alphabetCache = useRef<Record<string, AudioBuffer>>({});
  const isFetchingRef = useRef<Set<string>>(new Set());

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const fetchAlphabetSound = useCallback(async (letter: string) => {
    if (alphabetCache.current[letter] || isFetchingRef.current.has(letter)) return;
    
    isFetchingRef.current.add(letter);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${letter}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContextRef.current) {
        const buffer = await decodeAudioBuffer(
          decodeBase64(base64Audio),
          audioContextRef.current,
          24000,
          1
        );
        alphabetCache.current[letter] = buffer;
      }
    } catch (error) {
      console.error(`Failed to fetch sound for ${letter}:`, error);
    } finally {
      isFetchingRef.current.delete(letter);
    }
  }, []);

  const playAlphabetSound = useCallback((index: number) => {
    if (!audioContextRef.current) return;
    const letter = String.fromCharCode(65 + (index % 26)); // A-Z cycle
    const buffer = alphabetCache.current[letter];
    
    if (buffer) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } else {
      // Fallback to classic beep if API hasn't returned yet
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600 + (index % 26) * 20, audioContextRef.current.currentTime);
      gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    }

    // Pre-fetch next 2 letters to ensure availability
    const nextLetter1 = String.fromCharCode(65 + ((index + 1) % 26));
    const nextLetter2 = String.fromCharCode(65 + ((index + 2) % 26));
    fetchAlphabetSound(nextLetter1);
    fetchAlphabetSound(nextLetter2);
  }, [fetchAlphabetSound]);

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

  const spawnFood = useCallback((snake: Point[], stage: number, mode: GameMode): Point => {
    let newFood: Point;
    const obstacles = mode === GameMode.STAGES ? (STAGE_OBSTACLES[stage] || []) : [];
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

  const resetGame = useCallback((forcedStage?: number, forcedMode?: GameMode) => {
    initAudio();
    const mode = forcedMode ?? gameState.mode;
    const stage = forcedStage ?? (mode === GameMode.CLASSIC ? 1 : gameState.stage);
    
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    directionRef.current = Direction.RIGHT;
    setGameState(prev => ({
      ...prev,
      snake: initialSnake,
      food: spawnFood(initialSnake, stage, mode),
      direction: Direction.RIGHT,
      status: GameStatus.PLAYING,
      score: 0,
      stage: stage,
      mode: mode,
      snakeHue: 0
    }));

    // Start pre-fetching alphabet
    fetchAlphabetSound('A');
    fetchAlphabetSound('B');
  }, [spawnFood, gameState.mode, gameState.stage, fetchAlphabetSound]);

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

      if (newHead.x < 0 || newHead.x >= GRID_WIDTH || 
          newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      const obstacles = prev.mode === GameMode.STAGES ? (STAGE_OBSTACLES[prev.stage] || []) : [];
      if (obstacles.some(p => p.x === newHead.x && p.y === newHead.y)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      if (prev.snake.some(p => p.x === newHead.x && p.y === newHead.y)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem('snake_highscore', newHighScore.toString());
        return { ...prev, status: GameStatus.GAME_OVER, highScore: newHighScore };
      }

      const newSnake = [newHead, ...prev.snake];
      
      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        // Play alphabet sound based on total balls eaten (score / 10)
        playAlphabetSound(prev.score / 10);
        
        const newScore = prev.score + 10;
        const nextHue = (prev.snakeHue + 1) % NOKIA_PALETTE.SNAKE_COLORS.length;

        if (prev.mode === GameMode.STAGES && newScore > 0 && newScore % POINTS_PER_LEVEL === 0 && prev.stage < MAX_STAGES) {
          playLevelUpSound();
          return {
            ...prev,
            status: GameStatus.LEVEL_UP,
            score: newScore,
            stage: prev.stage + 1,
            snakeHue: nextHue
          };
        }

        return {
          ...prev,
          snake: newSnake,
          food: spawnFood(newSnake, prev.stage, prev.mode),
          score: newScore,
          snakeHue: nextHue
        };
      }

      newSnake.pop();
      return { ...prev, snake: newSnake };
    });
  }, [spawnFood, playAlphabetSound, playLevelUpSound]);

  const handleMenuNav = useCallback((dir: 'UP' | 'DOWN' | 'SELECT') => {
    initAudio();
    setGameState(prev => {
      if (prev.status === GameStatus.IDLE) {
        if (dir === 'SELECT') return { ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 };
        return prev;
      }
      
      if (prev.status !== GameStatus.MENU) return prev;

      if (prev.menuContext === 'MAIN') {
        if (dir === 'UP') return { ...prev, menuOption: Math.max(0, prev.menuOption - 1) };
        if (dir === 'DOWN') return { ...prev, menuOption: Math.min(1, prev.menuOption + 1) };
        if (dir === 'SELECT') {
          if (prev.menuOption === 0) { // Classic
            return { ...prev, mode: GameMode.CLASSIC, stage: 1, status: GameStatus.IDLE }; 
          } else { // Stages select
            return { ...prev, menuContext: 'STAGE_SELECT', menuOption: 0 };
          }
        }
      }

      if (prev.menuContext === 'STAGE_SELECT') {
        if (dir === 'UP') return { ...prev, menuOption: Math.max(0, prev.menuOption - 1) };
        if (dir === 'DOWN') return { ...prev, menuOption: Math.min(MAX_STAGES - 1, prev.menuOption + 1) };
        if (dir === 'SELECT') {
          return { ...prev, mode: GameMode.STAGES, stage: prev.menuOption + 1, status: GameStatus.IDLE };
        }
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'm', 'M'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'm' || e.key === 'M') {
        setGameState(prev => ({ ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 }));
        return;
      }

      if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
        if (e.key === 'Enter' || e.key === ' ') {
           if (gameState.status === GameStatus.IDLE) {
              resetGame();
           } else {
              setGameState(prev => ({ ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 }));
           }
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') handleMenuNav(e.key === 'ArrowUp' ? 'UP' : 'DOWN');
        return;
      }

      if (gameState.status === GameStatus.MENU) {
        if (e.key === 'ArrowUp') handleMenuNav('UP');
        if (e.key === 'ArrowDown') handleMenuNav('DOWN');
        if (e.key === 'Enter' || e.key === ' ') handleMenuNav('SELECT');
        return;
      }

      if (gameState.status === GameStatus.LEVEL_UP) {
        if (e.key === 'Enter' || e.key === ' ') {
          const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
          directionRef.current = Direction.RIGHT;
          setGameState(prev => ({
            ...prev,
            status: GameStatus.PLAYING,
            snake: initialSnake,
            food: spawnFood(initialSnake, prev.stage, prev.mode)
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
  }, [gameState.status, resetGame, togglePause, spawnFood, handleMenuNav]);

  const tick = useCallback((time: number) => {
    const stageDifficulty = (gameState.stage - 1) * 15;
    const scoreDifficulty = Math.floor((gameState.score % POINTS_PER_LEVEL) / 10) * 2; 
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

  const handleControlClick = (dir: Direction | 'RESET' | 'PAUSE' | 'MENU') => {
    initAudio();
    
    if (dir === 'MENU') {
      setGameState(prev => ({ ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 }));
      return;
    }

    if (gameState.status === GameStatus.MENU) {
      if (dir === Direction.UP) handleMenuNav('UP');
      if (dir === Direction.DOWN) handleMenuNav('DOWN');
      if (dir === 'RESET') handleMenuNav('SELECT');
      return;
    }

    if (dir === 'RESET') {
      if (gameState.status === GameStatus.LEVEL_UP) {
        const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        directionRef.current = Direction.RIGHT;
        setGameState(prev => ({
          ...prev,
          status: GameStatus.PLAYING,
          snake: initialSnake,
          food: spawnFood(initialSnake, prev.stage, prev.mode)
        }));
      } else if (gameState.status === GameStatus.IDLE) {
        resetGame();
      } else if (gameState.status === GameStatus.GAME_OVER) {
        setGameState(prev => ({ ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 }));
      } else {
        setGameState(prev => ({ ...prev, status: GameStatus.MENU, menuContext: 'MAIN', menuOption: 0 }));
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
