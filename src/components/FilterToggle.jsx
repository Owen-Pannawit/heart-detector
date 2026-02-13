import React from 'react';
const FilterToggle = ({ currentFilter, onCycle }) => (
  <button 
    onClick={onCycle}
    className="absolute top-6 right-6 z-40 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 flex items-center gap-2 hover:bg-black/60 transition-all shadow-lg"
  >
    <span className="text-xl">{currentFilter.icon}</span>
    <span className="text-xs font-bold tracking-wide uppercase">{currentFilter.name}</span>
  </button>
);
export default FilterToggle;