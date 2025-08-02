// src/UserBadgeDisplay.js
import React from 'react';

const UserBadgeDisplay = ({ badges }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold text-primary mb-2">🎖️ Vos Badges :</h4>
      <div className="flex flex-wrap justify-center gap-2">
        {badges.map((badge) => (
          <span
            key={badge.name}
            title={badge.description}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm transition-all hover:scale-105"
          >
            {badge.icon} {badge.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default UserBadgeDisplay;
