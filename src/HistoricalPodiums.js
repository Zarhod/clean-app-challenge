// src/HistoricalPodiums.js
import React from 'react';

const HistoricalPodiums = ({ historicalPodiums, onClose }) => {
  const validPodiums = historicalPodiums
    .filter(podium =>
      Array.isArray(podium.top3) &&
      podium.top3.some(entry => (parseFloat(entry.points) || 0) > 0)
    )
    .sort((a, b) => new Date(b.Date_Podium) - new Date(a.Date_Podium));

  const medals = ['🥇', '🥈', '🥉'];
  const bgColors = ['bg-yellow-300', 'bg-gray-300', 'bg-orange-300'];

  const lastPodium = validPodiums[0];
  const olderPodiums = validPodiums.slice(1);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-center text-xl sm:text-2xl font-extrabold text-primary">Historique des Podiums</h2>
          <p className="text-sm text-lightText text-center mt-2">
            Consultez ici les résultats hebdomadaires précédents. Le podium le plus récent est affiché en haut.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Podium le plus récent */}
          {lastPodium && (
            <div className="bg-white p-4 rounded-2xl shadow-md border border-primary/10">
              <h3 className="text-center text-lg sm:text-xl font-bold text-secondary mb-3">
                Podium de la Semaine : {new Date(lastPodium.Date_Podium).toLocaleDateString('fr-FR')}
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {lastPodium.top3.map((entry, i) => (
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
          )}

          {/* Podiums précédents */}
          {olderPodiums.length > 0 && (
            <div>
              <h4 className="text-center font-semibold text-lightText text-sm mb-2">Podiums des Semaines Précédentes</h4>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {olderPodiums.map((podium, index) => (
                  <div
                    key={podium.Date_Podium + index}
                    className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between"
                  >
                    <p className="text-sm font-semibold text-text">
                      {new Date(podium.Date_Podium).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex gap-3">
                      {podium.top3.map((entry, i) => (
                        <span key={entry.name + i} className="text-xs flex items-center gap-1 text-lightText">
                          {medals[i]} <span className="font-medium">{entry.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-sm shadow-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricalPodiums;
