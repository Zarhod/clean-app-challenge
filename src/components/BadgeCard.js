import React, { useRef } from "react";
import confetti from "canvas-confetti";

const BadgeCard = ({
  emoji,
  icon,
  name,
  unlockedAt,
  ownersCount,
  index,
}) => {
  const badgeRef = useRef(null);

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString("fr-FR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  const handleBadgeClick = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      confetti({
        particleCount: 70,
        spread: 75,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        scalar: 0.92,
        colors: ["#FFD700", "#b49cf0", "#fd5bff", "#8fd3ff"],
      });
    }
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-between
        bg-transparent
        px-2 py-1
        w-[105px] sm:w-[120px] md:w-[138px]
        min-h-[150px] max-h-[175px]
        animate-fade-in-scale
        cursor-pointer
        relative
        select-none
      `}
      style={{
        animationDelay: `${0.05 * (index ?? 0)}s`,
        transition: 'all 0.25s cubic-bezier(.8,.2,.2,1.2)',
      }}
      onClick={handleBadgeClick}
      tabIndex={0}
      ref={badgeRef}
    >
      {/* Indicateur owners en haut, centré */}
      <span className="
        absolute left-1/2 -translate-x-1/2 -top-3
        flex items-center px-2 py-0.5
        rounded-full bg-white/90 border border-[#e4d7ff] text-[0.73rem] font-semibold
        shadow-sm text-[#b49cf0] z-20
      ">
        <svg width="13" height="13" fill="none" viewBox="0 0 20 20" className="inline align-text-bottom mr-1">
          <path fill="#b49cf0" d="M10 10c2.3 0 6.9 1.15 6.9 3.43V17H3.1v-3.57C3.1 11.15 7.7 10 10 10Zm0-2a3.43 3.43 0 1 1 0-6.86 3.43 3.43 0 0 1 0 6.86Z"/>
        </svg>
        {ownersCount ?? 1}
      </span>

      {/* Badge Apple-style */}
      <div className="relative mb-2 mt-3 flex items-center justify-center">
        <div className="
          w-[78px] h-[78px] sm:w-[90px] sm:h-[90px] rounded-full
          flex items-center justify-center
          shadow-[0_3px_16px_0_rgba(90,70,120,0.16)]
          border-[3px] border-yellow-400
          bg-gradient-to-br from-[#ffd580] via-[#ffd6e7] to-[#cdedff]
          overflow-hidden
          relative
        ">
          {icon ? (
            <img
              src={icon}
              alt=""
              className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] drop-shadow-[0_2px_8px_rgba(255,220,140,0.17)]"
              draggable={false}
            />
          ) : (
            <span className="text-4xl drop-shadow-[0_3px_8px_#ffd70088]">{emoji}</span>
          )}
        </div>
        <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-yellow-300 opacity-60 blur-[2px]"></span>
      </div>
      {/* Titre */}
      <span className="text-[0.99rem] font-extrabold text-gradient-gamify text-center mb-1 leading-tight drop-shadow-sm">{name}</span>
      {/* Footer: Date centrée */}
      <div className="flex flex-col w-full items-center mt-1">
        {formattedDate && (
          <span className="text-[0.7rem] text-gray-400 font-medium text-center">{formattedDate}</span>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
