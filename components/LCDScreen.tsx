
import React from 'react';
import { GameState, GameStatus } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, NOKIA_PALETTE, STAGE_OBSTACLES, PIXEL_SCALE } from '../constants';

interface LCDScreenProps {
  state: GameState;
}

export const LCDScreen: React.FC<LCDScreenProps> = ({ state }) => {
  const obstacles = STAGE_OBSTACLES[state.stage] || [];

  return (
    <div className="w-full h-full font-nokia relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {state.status === GameStatus.IDLE && (
        <div className="flex flex-col items-center justify-center h-full space-y-2 animate-pulse">
          <div className="text-4xl font-bold text-[#2a311d] tracking-widest">SNAKE</div>
          <div className="text-base text-[#2a311d]">PRESS START</div>
          <div className="text-xs text-[#2a311d] mt-4">HI: {state.highScore}</div>
        </div>
      )}

      {state.status === GameStatus.LEVEL_UP && (
        <div className="flex flex-col items-center justify-center h-full bg-[#94a171] space-y-2">
          <div className="text-2xl font-bold text-[#2a311d] animate-bounce">LEVEL UP!</div>
          <div className="text-xl text-[#2a311d] uppercase tracking-tighter">NOW IN STAGE {state.stage}</div>
          <div className="text-sm text-[#2a311d] animate-pulse mt-4">PRESS START TO CONT.</div>
        </div>
      )}

      {(state.status === GameStatus.PLAYING || state.status === GameStatus.PAUSED) && (
        <>
          <svg 
            viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`} 
            className="w-full h-full"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Stage Obstacles */}
            {obstacles.map((p, i) => (
              <rect 
                key={`obs-${state.stage}-${i}`}
                x={p.x * PIXEL_SCALE} 
                y={p.y * PIXEL_SCALE} 
                width={PIXEL_SCALE} 
                height={PIXEL_SCALE} 
                fill={NOKIA_PALETTE.PIXEL_ON}
                opacity="0.85"
              />
            ))}

            {/* Food Item */}
            <rect 
              x={state.food.x * PIXEL_SCALE} 
              y={state.food.y * PIXEL_SCALE} 
              width={PIXEL_SCALE} 
              height={PIXEL_SCALE} 
              fill={NOKIA_PALETTE.PIXEL_ON}
              className={state.status === GameStatus.PLAYING ? "animate-pulse" : ""}
            />
            
            {/* Snake Body */}
            {state.snake.map((p, i) => (
              <rect 
                key={`snake-${i}`}
                x={p.x * PIXEL_SCALE} 
                y={p.y * PIXEL_SCALE} 
                width={PIXEL_SCALE} 
                height={PIXEL_SCALE} 
                fill={NOKIA_PALETTE.PIXEL_ON}
                opacity={state.status === GameStatus.PAUSED ? 0.6 : 1}
              />
            ))}

            {/* Footer Divider */}
            <rect x="0" y={SCREEN_HEIGHT - 6} width={SCREEN_WIDTH} height="1" fill={NOKIA_PALETTE.PIXEL_ON} opacity="0.15" />
          </svg>
          
          <div className="absolute top-1 left-2 text-[10px] text-[#2a311d] font-bold opacity-70 uppercase tracking-tighter">
            STAGE:{state.stage}
          </div>
          <div className="absolute top-1 right-2 text-sm text-[#2a311d] font-bold">
            {state.score}
          </div>

          {state.status === GameStatus.PAUSED && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#94a171] bg-opacity-40 backdrop-blur-[1px]">
              <div className="bg-[#2a311d] text-[#94a171] px-4 py-1 text-2xl font-bold shadow-lg">
                PAUSED
              </div>
            </div>
          )}
        </>
      )}

      {state.status === GameStatus.GAME_OVER && (
        <div className="flex flex-col items-center justify-center h-full bg-[#94a171]">
          <div className="text-3xl font-bold text-[#2a311d]">GAME OVER</div>
          <div className="text-xl text-[#2a311d] mt-1">SCORE: {state.score}</div>
          <div className="text-sm text-[#2a311d] mt-2 opacity-70">TOP: {state.highScore}</div>
          <div className="text-xs text-[#2a311d] mt-8 animate-bounce">PRESS START</div>
        </div>
      )}

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );
};
