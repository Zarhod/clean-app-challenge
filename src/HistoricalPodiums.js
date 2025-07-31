import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const HistoricalPodiums = ({ onClose, historicalPodiums }) => {
  return (
    <ListAndInfoModal title="Podiums Historiques" onClose={onClose} sizeClass="max-w-xl sm:max-w-2xl">
      {historicalPodiums.length === 0 ? (
        <p className="text-center text-lightText text-md mt-4">Aucun podium historique pour le moment.</p>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
          {historicalPodiums
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Trie par date décroissante
            .map((podium) => (
              <div key={podium.id} className="bg-card rounded-xl shadow-lg p-4 border border-primary/10">
                <h4 className="text-lg font-bold text-primary mb-2 text-center">
                  Semaine du {new Date(podium.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  {podium.winners.map((winner, index) => (
                    <div key={index} className={`p-3 rounded-lg shadow-md ${
                      index === 0 ? 'bg-podium-gold text-white' :
                      index === 1 ? 'bg-podium-silver text-white' :
                      'bg-podium-bronze text-white'
                    }`}>
                      <p className="font-extrabold text-xl">{index + 1}{index === 0 ? 'er' : 'ème'}</p>
                      <p className="font-semibold text-lg mt-1">{winner.displayName}</p>
                      <p className="text-sm">Points: {winner.points}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </ListAndInfoModal>
  );
};

export default HistoricalPodiums;
