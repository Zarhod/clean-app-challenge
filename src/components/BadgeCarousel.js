import React, { useRef, useState } from "react";
import BadgeCard from "./BadgeCard";

const BadgeCarousel = ({ badges = [] }) => {
  const unlockedBadges = badges.filter(b => b.unlockedAt || b.isUnlocked);
  const totalBadgesCount = 50;

  const scrollRef = useRef(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceDirection, setBounceDirection] = useState(null); // 'left' or 'right'

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollLeft <= 0) {
      if (!isBouncing || bounceDirection !== 'left') {
        setBounceDirection('left');
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 300);
      }
    } else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) { // -1 pour tolérance
      if (!isBouncing || bounceDirection !== 'right') {
        setBounceDirection('right');
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 300);
      }
    }
  };

  if (!unlockedBadges.length) {
    return (
      <div className="text-gray-400 text-sm font-medium text-center w-full py-10">
        Aucun badge débloqué pour le moment.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden"> {/* Ici on masque le débordement */}
      {/* Compteur badges */}
      <div className="text-center text-sm font-semibold text-primary mb-3 select-none">
        {unlockedBadges.length} / {totalBadgesCount} badges débloqués
      </div>

      {/* Carrousel badges */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`
          flex gap-4
          overflow-x-auto
          no-scrollbar
          items-center
          w-full
          justify-start
          scroll-smooth
          py-2
          px-4
          transition-transform duration-300
          ${isBouncing && bounceDirection === 'left' ? 'translate-x-4' : ''}
          ${isBouncing && bounceDirection === 'right' ? '-translate-x-4' : ''}
        `}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
        }}
      >
        {unlockedBadges.map((badge, idx) => (
          <div
            key={badge.id || badge.name || idx}
            className="flex-shrink-0"
            style={{
              scrollSnapAlign: "center",
              minWidth: "110px",
              maxWidth: "145px",
              marginLeft: idx === 0 ? "12px" : "6px",   // réduit la marge à gauche sauf le 1er
              marginRight: idx === unlockedBadges.length - 1 ? "12px" : "6px", // pareil à droite
            }}
          >
            <BadgeCard
              emoji={badge.emoji}
              icon={badge.icon}
              name={badge.name}
              condition={badge.description}
              unlockedAt={badge.unlockedAt}
              ownersCount={badge.ownersCount}
              index={idx}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeCarousel;
