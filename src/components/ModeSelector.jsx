import React from 'react';
const ModeSelector = ({ currentMode, setMode }) => (
  <div className="absolute bottom-10 z-40 w-full flex flex-col items-center gap-4">
    <div className="flex gap-4 bg-black/30 backdrop-blur-lg p-3 rounded-full border border-white/20">
      <button 
        onClick={() => setMode("heart")}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${currentMode === "heart" ? "bg-white scale-110 shadow-[0_0_15px_rgba(255,105,180,0.6)]" : "bg-white/20 grayscale"}`}
      >
        🫶
      </button>
      <button 
        onClick={() => setMode("mini")}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${currentMode === "mini" ? "bg-white scale-110 shadow-[0_0_15px_rgba(255,105,180,0.6)]" : "bg-white/20 grayscale"}`}
      >
        🫰
      </button>
      <button 
        onClick={() => setMode("flower")}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${currentMode === "flower" ? "bg-white scale-110 shadow-[0_0_15px_rgba(136,201,153,0.6)]" : "bg-white/20 grayscale"}`}
      >
        🌸
      </button>
    </div>
  </div>
);
export default ModeSelector;