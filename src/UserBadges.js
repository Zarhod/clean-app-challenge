// src/UserBadges.js
import React from 'react';

const UserBadges = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return <p className="text-sm text-gray-400">Aucun badge pour le moment.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="bg-background border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm text-sm"
        >
          <span className="text-lg">{badge.icon}</span>
          <div className="flex flex-col">
            <span className="font-semibold text-primary">{badge.name}</span>
            <span className="text-xs text-gray-500">{badge.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserBadges;
