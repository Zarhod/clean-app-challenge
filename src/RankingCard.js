import React from 'react';

const RankingCard = ({ user, rank, isCurrentUser, onClick }) => {
  const getRankColorClass = (rank) => {
    if (rank === 1) return 'bg-podium-gold';
    if (rank === 2) return 'bg-podium-silver';
    if (rank === 3) return 'bg-podium-bronze';
    return 'bg-gray-200';
  };

  const getRankTextColorClass = (rank) => {
    if (rank <= 3) return 'text-white';
    return 'text-text';
  };

  return (
    <div
      className={`relative flex items-center p-4 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer
        ${isCurrentUser ? 'border-2 border-primary bg-primary/10' : 'border border-gray-200 bg-card'}
      `}
      onClick={onClick}
    >
      {/* Rank Badge */}
      <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg
        ${getRankColorClass(rank)} ${getRankTextColorClass(rank)}`}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 mr-4 ml-6"> {/* Added ml-6 to push content right due to rank badge */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <span className="text-4xl leading-none w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 border-2 border-gray-300">
            {user.avatar || '👤'}
          </span>
        )}
      </div>

      {/* User Info */}
      <div className="flex-grow">
        <p className="font-semibold text-lg text-text truncate">{user.displayName}</p>
        <p className="text-lightText text-sm">Points: {user.totalCumulativePoints}</p>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 ml-4">
        <p className="font-bold text-xl text-accent">{user.totalCumulativePoints}</p>
      </div>
    </div>
  );
};

export default RankingCard;
