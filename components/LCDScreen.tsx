
import React from 'react';
import { GameState, GameStatus, GameMode } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, NOKIA_PALETTE, STAGE_OBSTACLES, PIXEL_SCALE, MAX_STAGES } from '../constants';

interface LCDScreenProps {
  state: GameState;
}

export const LCDScreen: React.FC<LCDScreenProps> = ({ state }) => {
  const obstacles = state.mode === GameMode.STAGES ? (STAGE_OBSTACLES[state.stage] || []) : [];

  // Determine which stages to show in the menu to prevent overflow
  const getVisibleMenuOptions = () => {
    if (state.menuContext === 'MAIN') return ['CLASSIC', 'STAGES'];
    
    // For Stage selection, we might want to show a window of options if there are many
    const all = Array.from({ length: MAX_STAGES }, (_, i) => `STAGE ${i + 1}`);
    if (MAX_STAGES <= 5) return all;
    
    // Simple logic to keep the selected item visible
    const start = Math.max(0, Math.min(state.menuOption - 2, MAX_STAGES - 5));
    return all.slice(start, start + 5);
  };

  const visibleOptions = getVisibleMenuOptions();

  return (
    <div className="w-full h-full font-nokia relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {state.status === GameStatus.IDLE && (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
          <div className="text-4xl font-bold text-[#2a311d] tracking-widest animate-pulse">SNAKE</div>
          <div className="text-sm text-[#2a311d] uppercase opacity-80">{state.mode} MODE - STAGE {state.stage}</div>
          <div className="text-base text-[#2a311d] mt-2">PRESS START</div>
          <div className="text-xs text-[#2a311d] mt-4 opacity-60 font-mono">HI-SCORE: {state.highScore}</div>
        </div>
      )}

      {state.status === GameStatus.MENU && (
        <div className="flex flex-col items-center justify-center h-full bg-[#94a171] p-2">
          <div className="text-lg font-bold text-[#2a311d] mb-2 border-b-2 border-[#2a311d] w-full text-center">
            {state.menuContext === 'MAIN' ? 'SELECT MODE' : 'SELECT STAGE'}
          </div>
          <div className="flex flex-col items-center space-y-1 w-full">
            {state.menuContext === 'MAIN' ? (
              ['CLASSIC', 'STAGES'].map((opt, i) => (
                <div key={opt} className={`w-full text-center py-1 text-lg font-bold transition-colors ${state.menuOption === i ? 'bg-[#2a311d] text-[#94a171]' : 'text-[#2a311d]'}`}>
                  {state.menuOption === i ? `> ${opt} <` : opt}
                </div>
              ))
            ) : (
              Array.from({length: MAX_STAGES}).map((_, i) => {
                // Only show a subset of stages if needed to avoid overflow
                const isVisible = Math.abs(state.menuOption - i) <= 2 || (state.menuOption < 2 && i < 5) || (state.menuOption > MAX_STAGES - 3 && i > MAX_STAGES - 6);
                if (!isVisible) return null;
                
                return (
                  <div key={i} className={`w-full text-center py-0.5 text-base font-bold transition-colors ${state.menuOption === i ? 'bg-[#2a311d] text-[#94a171]' : 'text-[#2a311d]'}`}>
                    {state.menuOption === i ? `> STAGE ${i+1} <` : `STAGE ${i+1}`}
                  </div>
                );
              })
            )}
          </div>
          <div className="text-[9px] mt-2 opacity-50 uppercase font-bold">ARROWS TO NAV • START TO PLAY</div>
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
                opacity="0.9"
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
            
            {/* Snake Body - Dynamic Color based on last meal */}
            {state.snake.map((p, i) => {
              const color = NOKIA_PALETTE.SNAKE_COLORS[state.snakeHue];
              return (
                <rect 
                  key={`snake-${i}`}
                  x={p.x * PIXEL_SCALE} 
                  y={p.y * PIXEL_SCALE} 
                  width={PIXEL_SCALE} 
                  height={PIXEL_SCALE} 
                  fill={color}
                  opacity={state.status === GameStatus.PAUSED ? 0.6 : 1}
                  rx={i === 0 ? 0.5 : 0} // Slight round for head
                />
              );
            })}

            {/* Footer Divider */}
            <rect x="0" y={SCREEN_HEIGHT - 6} width={SCREEN_WIDTH} height="1" fill={NOKIA_PALETTE.PIXEL_ON} opacity="0.15" />
          </svg>
          
          <div className="absolute top-1 left-2 text-[10px] text-[#2a311d] font-bold opacity-70 uppercase tracking-tighter flex flex-col">
            <span>{state.mode.substring(0, 1)}:{state.stage}</span>
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
          <div className="text-xs text-[#2a311d] mt-8 animate-bounce">PRESS START TO MENU</div>
        </div>
      )}

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );
};
