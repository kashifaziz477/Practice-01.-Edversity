
import React from 'react';
import { Direction, GameStatus } from '../types';

interface Nokia3310Props {
  children: React.ReactNode;
  onControl: (cmd: Direction | 'RESET' | 'PAUSE') => void;
  status: GameStatus;
}

export const Nokia3310: React.FC<Nokia3310Props> = ({ children, onControl, status }) => {
  return (
    <div className="relative w-[380px] h-[780px] bg-[#1e2a4a] rounded-[60px] border-[12px] border-zinc-900 shadow-2xl flex flex-col items-center pt-10 pb-14 select-none transition-all duration-500">
      {/* Speaker grill */}
      <div className="w-20 h-2.5 bg-zinc-900 rounded-full mb-10 shadow-inner"></div>

      {/* Screen area - slightly larger to match Android proportions */}
      <div className="w-[300px] h-[220px] bg-zinc-800 rounded-2xl p-5 flex items-center justify-center shadow-[inset_0_4px_15px_rgba(0,0,0,0.6)] border-4 border-zinc-700">
        <div className="w-full h-full relative overflow-hidden bg-[#94a171]">
          {children}
        </div>
      </div>

      {/* Logo */}
      <div className="mt-6 mb-4 text-zinc-500 font-bold tracking-[0.2em] text-sm uppercase opacity-80">
        NOKIA
      </div>

      {/* Control buttons */}
      <div className="flex flex-col items-center gap-4 mt-4 w-full px-10">
        {/* Soft keys */}
        <div className="flex justify-between w-full mb-2">
          {/* Reset / Start Button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => onControl('RESET')}
              className="w-20 h-12 bg-zinc-700 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center group"
              title="Start / Reset"
            >
              <div className="w-5 h-5 rounded-full border-2 border-zinc-400 group-active:border-zinc-200"></div>
            </button>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Start</span>
          </div>

          {/* Pause Button */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => onControl('PAUSE')}
              className={`w-20 h-12 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center group ${status === GameStatus.PAUSED ? 'bg-orange-800' : 'bg-zinc-700'}`}
              title="Pause / Resume"
            >
              <div className="flex gap-1">
                <div className="w-1.5 h-4 bg-zinc-400 group-active:bg-zinc-200"></div>
                <div className="w-1.5 h-4 bg-zinc-400 group-active:bg-zinc-200"></div>
              </div>
            </button>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pause</span>
          </div>
        </div>

        {/* D-Pad controls */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          <div></div>
          <ControlButton icon="▲" onClick={() => onControl(Direction.UP)} />
          <div></div>
          
          <ControlButton icon="◄" onClick={() => onControl(Direction.LEFT)} />
          <div className="w-20 h-14 bg-zinc-800 rounded-xl shadow-lg border-b-4 border-zinc-950 flex items-center justify-center text-zinc-600 font-bold text-xl">5</div>
          <ControlButton icon="►" onClick={() => onControl(Direction.RIGHT)} />
          
          <div></div>
          <ControlButton icon="▼" onClick={() => onControl(Direction.DOWN)} />
          <div></div>
        </div>

        {/* Numpad aesthetic */}
        <div className="grid grid-cols-3 gap-3 w-full mt-6 opacity-40 pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((n) => (
                <div key={n} className="w-20 h-12 bg-zinc-800 rounded-lg shadow flex items-center justify-center text-zinc-500 text-base">{n}</div>
            ))}
        </div>
      </div>
      
      {/* Decorative charging port or something at the bottom */}
      <div className="absolute bottom-4 w-12 h-1 bg-zinc-900 rounded-full opacity-50"></div>
    </div>
  );
};

const ControlButton: React.FC<{ icon: string; onClick: () => void }> = ({ icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-20 h-14 bg-zinc-700 rounded-xl shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center text-zinc-300 text-2xl"
  >
    {icon}
  </button>
);
