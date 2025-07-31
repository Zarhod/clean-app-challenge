import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const WeeklyRecapModal = ({ onClose, recapData }) => {
  if (!recapData) {
    return null; // Ne rien rendre si recapData est null
  }

  const { date, topUsers, userRank, userPoints } = recapData;

  return (
    <ListAndInfoModal title={`Récapitulatif Hebdomadaire du ${new Date(date).toLocaleDateString('fr-FR')}`} onClose={onClose} sizeClass="max-w-md sm:max-w-lg">
      <div className="text-center mb-6">
        <p className="text-lightText text-md mb-2">Vos points cette semaine : <span className="font-bold text-primary text-xl">{userPoints}</span></p>
        <p className="text-lightText text-md">Votre classement : <span className="font-bold text-accent text-xl">{userRank}</span></p>
      </div>

      <h4 className="text-lg font-bold text-secondary mb-3 text-center">Top 3 de la Semaine</h4>
      {topUsers && topUsers.length > 0 ? (
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div
              key={user.uid}
              className={`flex items-center p-3 rounded-lg shadow-sm border ${
                index === 0
                  ? 'bg-podium-gold/20 border-podium-gold'
                  : index === 1
                  ? 'bg-podium-silver/20 border-podium-silver'
                  : index === 2
                  ? 'bg-podium-bronze/20 border-podium-bronze'
                  : 'bg-white border-neutralBg'
              }`}
            >
              <span className="font-bold text-lg text-primary mr-3 w-8 text-center">{index + 1}.</span>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200" />
              ) : (
                <span className="text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 mr-3">
                  {user.avatar || '👤'}
                </span>
              )}
              <div className="flex-1">
                <p className="font-semibold text-text text-md">{user.displayName}</p>
                <p className="text-lightText text-sm">Points: {user.weeklyPoints}</p>
              </div>
              <p className="font-bold text-lg text-accent ml-4">{user.weeklyPoints}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-lightText text-md">Aucun top utilisateur pour cette semaine.</p>
      )}

      <button
        onClick={onClose}
        className="mt-6 w-full bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 text-md"
      >
        Fermer
      </button>
    </ListAndInfoModal>
  );
};

export default WeeklyRecapModal;
