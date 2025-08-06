import React from "react";
import BadgeCard from "./BadgeCard";

const BadgeCarousel = ({ badges = [] }) => {
  // Seuls les badges débloqués :
  const unlockedBadges = badges.filter(
    b => b.unlockedAt || b.isUnlocked
  );

  if (!unlockedBadges.length) {
    return (
      <div className="text-gray-400 text-sm font-medium text-center w-full py-10">
        Aucun badge débloqué pour le moment.
      </div>
    );
  }

  return (
    <div
      className="
        flex gap-4
        overflow-x-auto
        no-scrollbar
        items-center
        w-full
        justify-center
        scroll-smooth
        py-2
      "
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
            minWidth: "110px", // ajustable selon BadgeCard
            maxWidth: "145px",
          }}
        >
          <BadgeCard
            emoji={badge.emoji}
            icon={badge.icon}
            name={badge.name}
            condition={badge.description} // ou badge.condition selon ta source
            unlockedAt={badge.unlockedAt}
            ownersCount={badge.ownersCount}
            index={idx}
          />
        </div>
      ))}
    </div>
  );
};

export default BadgeCarousel;
