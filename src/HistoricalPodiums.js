import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const HistoricalPodiums = ({ historicalPodiums, onClose, children }) => {
  // Filtrer les podiums qui n'ont pas de top3 ou dont le top3 est vide/ne contient que des 0 points
  const validPodiums = historicalPodiums.filter(podium =>
    podium.top3 &&
    Array.isArray(podium.top3) &&
    podium.top3.some(entry => (parseFloat(entry.points) || 0) > 0) // Au moins un participant avec des points > 0
  ).sort((a, b) => new Date(b.Date_Podium) - new Date(a.Date_Podium)); // Trie du plus récent au plus ancien

  const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze'];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <ListAndInfoModal title="Historique des Podiums" onClose={onClose} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
      {children}
      {validPodiums.length === 0 ? (
        <p className="text-center text-lightText text-lg py-4">Aucun podium historique disponible pour le moment.</p>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {validPodiums.map((podium, index) => (
            <div key={podium.Date_Podium + index} className="bg-neutralBg rounded-xl p-4 shadow-inner border border-primary/10">
              <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-4 text-center">
                Podium du {new Date(podium.Date_Podium).toLocaleDateString('fr-FR')}
              </h3>
              <div className="flex flex-col gap-3">
                {podium.top3.map((entry, entryIndex) => {
                  if ((parseFloat(entry.points) || 0) <= 0) return null;

                  return (
                    <div key={entry.name + entryIndex} className={`flex items-center p-3 rounded-lg shadow-sm
                      ${podiumColors[entryIndex] || 'bg-gray-100'} text-text`}>
                      <span className="text-2xl mr-3">{medals[entryIndex] || '🏅'}</span>
                      <p className="font-semibold text-lg flex-1">{entry.name}</p>
                      <p className="font-bold text-lg">{entry.points} pts</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ListAndInfoModal>
  );
};

export default HistoricalPodiums;
