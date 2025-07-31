// src/OverallRankingModal.js
// Modale pour afficher le classement général cumulatif.
// Mis à jour pour afficher correctement les avatars (emoji ou URL Supabase Storage).

import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';
import RankingCard from './RankingCard';

const OverallRankingModal = ({ classement, onClose, onParticipantClick, getParticipantBadges }) => {
  // Tri par points cumulatifs
  const sortedOverallClassement = [...classement].sort((a, b) => b.Points_Total_Cumulatif - a.Points_Total_Cumulatif);

  return (
    <ListAndInfoModal title="Classement Général" onClose={onClose} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
      {sortedOverallClassement.length === 0 ? (
        <p className="text-center text-lightText text-lg py-4">Aucun classement général disponible pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedOverallClassement.map((participant, index) => (
            <RankingCard
              key={participant.Nom_Participant}
              participant={participant}
              rank={index + 1}
              type="overall" // Indique que c'est le classement général
              onParticipantClick={onParticipantClick}
              getParticipantBadges={getParticipantBadges}
            />
          ))}
        </div>
      )}
    </ListAndInfoModal>
  );
};

export default OverallRankingModal;
