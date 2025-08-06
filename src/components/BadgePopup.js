import React from 'react';
import Confetti from 'react-confetti';

const BadgePopup = ({ badge, onClose }) => {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 pointer-events-auto p-4">
      {/* Confettis animés */}
      <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />
      <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-primary max-w-xs animate-popin">
        {/* Badge stylisé comme dans BadgeCard */}
        <div className="relative mb-5">
          <div className="
            w-24 h-24 rounded-full
            flex items-center justify-center
            shadow-[0_3px_16px_0_rgba(90,70,120,0.16)]
            border-[3px] border-yellow-400
            bg-gradient-to-br from-[#ffd580] via-[#ffd6e7] to-[#cdedff]
            overflow-hidden
          ">
            {badge.icon ? (
              <img
                src={badge.icon}
                alt=""
                className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(255,220,140,0.17)]"
                draggable={false}
              />
            ) : (
              <span className="text-6xl drop-shadow-[0_3px_8px_#ffd70088]">{badge.emoji}</span>
            )}
          </div>
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-yellow-300 opacity-60 blur-[2px]"></span>
        </div>

        <h2 className="text-2xl font-extrabold mb-2 text-primary text-center">Nouveau badge débloqué !</h2>
        <div className="text-xl font-semibold mb-2 text-center text-gradient-gamify">{badge.name}</div>
        <div className="text-gray-600 text-center text-sm mb-4 max-w-[280px]">{badge.description}</div>
        <button
          onClick={onClose}
          className="mt-2 px-8 py-2 bg-green-500 rounded-full text-white font-bold shadow-md hover:bg-green-600 transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default BadgePopup;
