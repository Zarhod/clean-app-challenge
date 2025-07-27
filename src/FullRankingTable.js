import React from 'react';

/**
 * Composant pour afficher le classement complet des participants.
 * @param {Object[]} classement - Le tableau des données de classement.
 * @param {function} onClose - Fonction de rappel pour fermer le tableau.
 * @param {function} onParticipantClick - Fonction de rappel pour afficher le profil d'un participant.
 * @param {Object[]} realisations - Tableau de toutes les réalisations pour le calcul des badges.
 * @param {Object[]} historicalPodiums - Tableau des podiums historiques pour le calcul des badges.
 */
function FullRankingTable({ classement, onClose, onParticipantClick, realisations, historicalPodiums }) {

  // Fonction de logique des badges (dupliquée ici pour l'autonomie du composant)
  const getParticipantBadges = (participant) => {
    const badges = [];
    const participantRealisations = realisations.filter(r => String(r.Nom_Participant).trim() === String(participant.Nom_Participant).trim());
    
    const totalPoints = parseFloat(participant.Points_Total_Cumulatif) || 0;
    
    // Badge: Nettoyeur Débutant (ex: > 50 points cumulés)
    if (totalPoints >= 50) {
      badges.push({ name: 'Nettoyeur Débutant', icon: '✨', description: 'Atteint 50 points cumulés.' });
    }
    // Badge: Nettoyeur Pro (ex: > 200 points cumulés)
    if (totalPoints >= 200) {
      badges.push({ name: 'Nettoyeur Pro', icon: '🌟', description: 'Atteint 200 points cumulés.' });
    }
    // Badge: Maître de la Propreté (ex: > 500 points cumulés)
    if (totalPoints >= 500) {
      badges.push({ name: 'Maître de la Propreté', icon: '👑', description: 'Atteint 500 points cumulés.' });
    }

    // Badge: Actif de la Semaine (au moins 3 tâches cette semaine)
    const tasksThisWeek = participantRealisations.filter(real => {
        const realDate = new Date(real.Timestamp);
        realDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfCurrentWeek.setHours(0, 0, 0, 0);
        return realDate >= startOfCurrentWeek;
    }).length;
    if (tasksThisWeek >= 3) {
        badges.push({ name: 'Actif de la Semaine', icon: '🔥', description: '3 tâches ou plus complétées cette semaine.' });
    }

    // Badge: Spécialiste Cuisine (ex: 5 tâches de cuisine complétées)
    const kitchenTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'cuisine').length;
    if (kitchenTasks >= 5) {
      badges.push({ name: 'Spécialiste Cuisine', icon: '🍳', description: '5 tâches de cuisine complétées.' });
    }

    // Badge: Spécialiste Salle (ex: 5 tâches de salle complétées)
    const roomTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'salle').length;
    if (roomTasks >= 5) {
      badges.push({ name: 'Spécialiste Salle', icon: '🛋️', description: '5 tâches de salle complétées.' });
    }

    // Badge: Ancien Champion (si a été 1er au moins une fois)
    const hasBeenFirst = historicalPodiums.some(podium => 
      podium.top3.length > 0 && String(podium.top3[0].name).trim() === String(participant.Nom_Participant).trim()
    );
    if (hasBeenFirst) {
      badges.push({ name: 'Ancien Champion', icon: '🥇', description: 'A déjà été premier du podium.' });
    }

    return badges;
  };


  if (!Array.isArray(classement) || classement.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Classement Complet</h2>
        <p className="text-center text-lightText text-lg">Aucun classement disponible pour le moment.</p>
        <button
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base"
          onClick={onClose}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Classement Complet</h2>
      <div className="overflow-x-auto rounded-lg shadow-md mb-6 border border-blue-100">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Rang</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Nom du Participant</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Points Semaine</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Points Cumulés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {classement.map((participant, index) => (
              <tr 
                key={participant.Nom_Participant} 
                className="hover:bg-neutralBg transition duration-150 ease-in-out cursor-pointer"
                onClick={() => onParticipantClick(participant)}
              >
                <td className="py-3 px-4 whitespace-nowrap text-sm text-text font-medium">
                  {index + 1}
                  {index === 0 && <span className="ml-1">🥇</span>}
                  {index === 1 && <span className="ml-1">🥈</span>}
                  {index === 2 && <span className="ml-1">🥉</span>}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-secondary font-semibold">
                  {participant.Nom_Participant}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getParticipantBadges(participant).map(badge => (
                      <span key={badge.name} title={badge.description} className="text-lg leading-none">{badge.icon}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-primary font-bold">{participant.Points_Total_Semaine_Courante}</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-primary font-bold">{participant.Points_Total_Cumulatif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg
                   transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base"
        onClick={onClose}
      >
        Retour à l'accueil
      </button>
    </div>
  );
}

export default FullRankingTable;
