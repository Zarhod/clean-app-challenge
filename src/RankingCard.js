import React from 'react';

/**
 * Composant pour afficher une carte de classement individuelle.
 * @param {Object} participant - Les données du participant.
 * @param {number} rank - Le rang du participant.
 * @param {string} type - 'weekly' ou 'overall' pour déterminer les points à afficher.
 * @param {function} onParticipantClick - Fonction de rappel pour afficher le profil.
 * @param {function} getParticipantBadges - Fonction pour obtenir les badges.
 */
function RankingCard({ participant, rank, type, onParticipantClick, getParticipantBadges }) {
  const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze'];
  const medals = ['🥇', '🥈', '🥉'];

  const isPodium = rank <= 3;
  const cardColorClass = isPodium ? podiumColors[rank - 1] : 'bg-neutralBg';
  const points = type === 'weekly' ? participant.Points_Total_Semaine_Courante : participant.Points_Total_Cumulatif;
  const pointsLabel = type === 'weekly' ? 'pts cette semaine' : 'pts cumulés';

  return (
    <div 
      className={`relative p-3 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                 ${cardColorClass} flex flex-row items-center justify-between border border-primary/20 w-full max-w-2xl`} /* Increased max-w to 2xl for wider cards */
      onClick={() => onParticipantClick(participant)}
    >
      {isPodium && (
        <span className="absolute -top-3 -left-3 text-4xl leading-none transform rotate-[-15deg]">{medals[rank - 1]}</span> 
      )}
      <div className="flex items-center flex-1 min-w-0"> {/* Container for rank and name */}
        <p className="text-xl font-extrabold text-primary flex-shrink-0 w-8 text-left">{rank}</p> {/* Smaller, fixed width */}
        <h3 className="text-lg font-bold text-secondary truncate ml-2">{participant.Nom_Participant}</h3> {/* Smaller, with margin */}
      </div>
      
      <div className="flex flex-col items-end flex-shrink-0 ml-2"> {/* Container for points and badges */}
        <p className="text-base text-text font-semibold whitespace-nowrap">{points} {pointsLabel}</p> 
        {getParticipantBadges(participant).length > 0 && (
          <div className="flex flex-wrap justify-end gap-0.5 mt-1"> 
            {getParticipantBadges(participant).map(badge => (
              <span key={badge.name} title={badge.description} className="text-lg leading-none bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"> 
                {badge.icon}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RankingCard;
