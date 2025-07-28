import React from 'react';
import RankingCard from './RankingCard'; 

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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4"> 
          Classement Général Cumulatif
        </h3>
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
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default OverallRankingModal;
