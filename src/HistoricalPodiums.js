import React from 'react';

/**
 * Composant pour afficher l'historique des podiums.
 * @param {Object[]} historicalPodiums - Tableau des podiums historiques, trié par date décroissante.
 * @param {function} onClose - Fonction de rappel pour fermer la vue.
 */
function HistoricalPodiums({ historicalPodiums, onClose }) {
  if (!Array.isArray(historicalPodiums) || historicalPodiums.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Historique des Podiums</h2>
        <p className="text-center text-lightText text-lg">Aucun historique de podium disponible pour le moment.</p>
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

  const latestPodium = historicalPodiums[0];
  const olderPodiums = historicalPodiums.slice(1);

  const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze'];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Historique des Podiums</h2>

      {/* Dernier Podium (affichage détaillé) */}
      <div className="mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Dernier Podium ({latestPodium.date})</h3>
        <div className="flex justify-center items-end mt-4 sm:mt-6 gap-2 sm:gap-4">
          {/* 2ème Place */}
          {latestPodium.top3.length > 1 && (
            <div className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg ${podiumColors[1]} order-1 w-1/3 sm:w-auto`}>
              <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[1]}</span>
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{latestPodium.top3[1].name}</p>
              <p className="text-xs sm:text-base text-lightText">{latestPodium.top3[1].score} pts</p>
            </div>
          )}

          {/* 1ère Place */}
          {latestPodium.top3.length > 0 && (
            <div className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg ${podiumColors[0]} order-2 w-1/3 sm:w-auto -translate-y-2`}>
              <span className={`text-5xl sm:text-6xl mb-0.5 sm:mb-1`}>{medals[0]}</span>
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{latestPodium.top3[0].name}</p>
              <p className="text-xs sm:text-base text-lightText">{latestPodium.top3[0].score} pts</p>
            </div>
          )}

          {/* 3ème Place */}
          {latestPodium.top3.length > 2 && (
            <div className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg ${podiumColors[2]} order-3 w-1/3 sm:w-auto`}>
              <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[2]}</span>
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{latestPodium.top3[2].name}</p>
              <p className="text-xs sm:text-base text-lightText">{latestPodium.top3[2].score} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Anciens Podiums (affichage compact) */}
      {olderPodiums.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Podiums Précédents</h3>
          <div className="space-y-4">
            {olderPodiums.map((podium, index) => (
              <div key={podium.date} className="bg-neutralBg rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between shadow-md border border-neutralBg/50">
                <div className="flex-1 min-w-0 mb-2 sm:mb-0 text-left">
                  <p className="font-bold text-secondary text-lg">Semaine du {podium.date}</p>
                  <p className="text-sm text-lightText truncate">
                    {podium.top3.length > 0 && <span>🥇 {podium.top3[0].name} ({podium.top3[0].score} pts)</span>}
                    {podium.top3.length > 1 && <span> | 🥈 {podium.top3[1].name} ({podium.top3[1].score} pts)</span>}
                    {podium.top3.length > 2 && <span> | 🥉 {podium.top3[2].name} ({podium.top3[2].score} pts)</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default HistoricalPodiums;