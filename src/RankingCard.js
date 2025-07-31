// src/RankingCard.js
// Composant pour afficher une carte de classement d'un participant.
// Mis à jour pour afficher correctement les avatars (emoji ou URL Supabase Storage).

import React from 'react';

const RankingCard = ({ participant, rank, type, onParticipantClick, getParticipantBadges }) => {
  const isWeekly = type === 'weekly';
  const points = isWeekly ? participant.Points_Total_Semaine_Courante : participant.Points_Total_Cumulatif;
  const rankColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  const badges = getParticipantBadges(participant);

  return (
    <div
      className={`bg-card rounded-2xl p-4 flex items-center justify-between w-full shadow-lg 
                  transition duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-xl cursor-pointer 
                  ${rank <= 3 && isWeekly ? rankColors[rank - 1] : 'border border-blue-100'}`}
      onClick={() => onParticipantClick(participant)}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full bg-neutralBg flex items-center justify-center text-2xl flex-shrink-0 mr-3 overflow-hidden">
          {participant.Avatar && participant.Avatar.startsWith('http') ? (
            <img src={participant.Avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{participant.Avatar || '👤'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg text-text truncate">
            {rankEmojis[rank - 1] && isWeekly && rank <= 3 ? `${rankEmojis[rank - 1]} ` : `#${rank} `}
            {participant.Nom_Participant}
          </p>
          <p className="text-sm text-lightText truncate">
            Niveau: {participant.Level} (XP: {participant.XP})
          </p>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {badges.slice(0, 3).map((badge, index) => ( // Afficher max 3 badges ici
                <span key={index} title={badge.description} className="text-xs px-1 py-0.5 rounded-full bg-primary/10 text-primary">
                  {badge.icon}
                </span>
              ))}
              {badges.length > 3 && (
                <span className="text-xs px-1 py-0.5 rounded-full bg-primary/10 text-primary">
                  +{badges.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="text-xl font-extrabold text-primary">{points} pts</p>
        <p className="text-xs text-lightText">
          {isWeekly ? 'cette semaine' : 'au total'}
        </p>
      </div>
    </div>
  );
};

export default RankingCard;
