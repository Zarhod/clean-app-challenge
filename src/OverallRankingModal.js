import React from 'react';
import RankingCard from './RankingCard';
import ListAndInfoModal from './ListAndInfoModal'; // Importation de ListAndInfoModal

/**
 * Composant modal pour afficher le classement général (cumulatif).
 * @param {Object[]} classement - Le tableau des données de classement.
 * @param {function} onClose - Fonction de rappel pour fermer la modale.
 * @param {function} onParticipantClick - Fonction de rappel pour afficher le profil d'un participant.
 * @param {function} getParticipantBadges - Fonction pour obtenir les badges d'un participant.
 */
function OverallRankingModal({ classement, onClose, onParticipantClick, getParticipantBadges }) {
  // Trier le classement par points cumulatifs pour cette vue
  const sortedClassement = [...classement].sort((a, b) => b.Points_Total_Cumulatif - a.Points_Total_Cumulatif);

  return (
    <ListAndInfoModal title="Classement Général Cumulatif" onClose={onClose} sizeClass="max-w-xs sm:max-w-md md:max-w-lg">
      <div className="flex flex-col gap-3 mb-4 max-h-[70vh] overflow-y-auto custom-scrollbar items-center">
        {sortedClassement.length === 0 ? (
          <p className="text-center text-lightText text-lg col-span-full">Aucun classement général disponible pour le moment.</p>
        ) : (
          sortedClassement.map((participant, index) => (
            <RankingCard
              key={participant.Nom_Participant}
              participant={participant}
              rank={index + 1}
              type="overall"
              onParticipantClick={onParticipantClick}
              getParticipantBadges={getParticipantBadges}
            />
          ))
        )}
      </div>
    </ListAndInfoModal>
  );
}

export default OverallRankingModal;
