import React from 'react';

function RankingCard({ participant, rank, type, onParticipantClick, getParticipantBadges }) {
  const isWeekly = type === 'weekly';
  const score = isWeekly ? participant.Points_Total_Semaine_Courante : participant.Points_Total_Cumulatif;
  const rankColorClass = rank === 1 ? 'text-podium-gold' : rank === 2 ? 'text-podium-silver' : rank === 3 ? 'text-podium-bronze' : 'text-text';
  const bgColorClass = rank === 1 ? 'bg-podium-gold/20' : rank === 2 ? 'bg-podium-silver/20' : rank === 3 ? 'bg-podium-bronze/20' : 'bg-neutralBg';

  const badges = getParticipantBadges(participant);

  return (
    <div
      className={`w-full max-w-sm flex items-center p-4 rounded-2xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer border border-primary/10 ${bgColorClass}`}
      onClick={() => onParticipantClick(participant)}
    >
      <div className="flex-shrink-0 mr-4">
        <span className={`text-4xl font-extrabold ${rankColorClass}`}>{rank}.</span>
      </div>
      <div className="flex-shrink-0 mr-4">
        {participant.PhotoURL ? (
          <img src={participant.PhotoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <span className="text-5xl">{participant.Avatar || '👤'}</span>
        )}
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-secondary truncate">{participant.Nom_Participant}</h3>
        <p className="text-text text-sm">
          {isWeekly ? 'Points Semaine:' : 'Points Cumulatifs:'} <span className="font-semibold text-primary">{score}</span>
        </p>
        <p className="text-text text-sm">
          Niveau: <span className="font-semibold text-primary">{participant.Level || 1}</span> | XP: <span className="font-semibold text-primary">{participant.XP || 0}</span>
        </p>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {badges.slice(0, 3).map(badge => (
              <span key={badge.name} title={badge.description} className="text-xs">{badge.icon}</span>
            ))}
            {badges.length > 3 && <span className="text-xs text-lightText">+{badges.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default RankingCard;
