// src/HistoricalPodiums.js
import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const HistoricalPodiums = ({ historicalPodiums, onClose, children }) => {
  const validPodiums = historicalPodiums
    .filter(podium =>
      Array.isArray(podium.top3) &&
      podium.top3.some(entry => (parseFloat(entry.points) || 0) > 0)
    )
    .sort((a, b) => new Date(b.Date_Podium) - new Date(a.Date_Podium));

  const medals = ['🥇', '🥈', '🥉'];
  const bgColors = ['bg-yellow-300', 'bg-gray-300', 'bg-orange-300'];

  return (
    <ListAndInfoModal title="Historique des Podiums" onClose={onClose} sizeClass="max-w-4xl">
      {children}

      {validPodiums.length === 0 ? (
        <p className="text-center text-lightText text-lg py-4">
          Aucun podium historique disponible pour le moment.
        </p>
      ) : (
        <div className="space-y-6">
          {validPodiums.map((podium, index) => (
            <div
              key={podium.Date_Podium + index}
              className="bg-neutralBg p-4 rounded-2xl shadow-md border border-primary/10"
            >
              <h3 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">
                Podium du {new Date(podium.Date_Podium).toLocaleDateString('fr-FR')}
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {podium.top3.map((entry, i) => (
                  <div
                    key={entry.name + i}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl shadow-sm w-full sm:w-1/3 text-text ${bgColors[i] || 'bg-gray-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{medals[i]}</span>
                      <p className="font-semibold text-base sm:text-lg">{entry.name}</p>
                    </div>
                    <p className="font-bold text-base sm:text-lg">{entry.points} pts</p>
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
