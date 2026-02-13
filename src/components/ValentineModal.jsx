import React from 'react';

const ValentineModal = ({ show, onClose, gifUrl }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="relative bg-gradient-to-b from-white to-pink-50 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(236,72,153,0.3)] animate-in zoom-in-95 duration-500 border-8 border-white ring-4 ring-pink-200">
        <div className="absolute -top-6 -left-6 text-5xl animate-bounce delay-100 drop-shadow-md">💌</div>
        <div className="absolute -bottom-4 -right-4 text-5xl animate-bounce delay-700 drop-shadow-md">🧸</div>
        <div className="absolute top-10 -right-8 text-4xl animate-pulse text-pink-300">✨</div>
        <div className="absolute bottom-20 -left-8 text-4xl animate-pulse text-pink-300 delay-300">💖</div>

        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-pink-400 hover:text-pink-600 hover:scale-110 transition-all shadow-lg rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl border-2 border-pink-100 z-10">✕</button>

        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 mb-6 mt-2 drop-shadow-sm" style={{ fontFamily: "'Dancing Script', cursive" }}>
          Happy Valentine's Day!
        </h2>

        <div className="w-full aspect-[4/3] bg-white rounded-3xl overflow-hidden border-4 border-pink-100 shadow-inner flex items-center justify-center relative group transform transition-transform hover:scale-105 duration-300">
           <img src={gifUrl} alt="Valentine GIF" className="w-full h-full object-cover" />
        </div>
        
        <p className="mt-6 text-pink-400 font-medium text-sm tracking-wide">You are special to me! 💖</p>
      </div>
    </div>
  );
};
export default ValentineModal;