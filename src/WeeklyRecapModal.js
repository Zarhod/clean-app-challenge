// src/WeeklyRecapModal.js
import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const WeeklyRecapModal = ({ recapData, onClose }) => {
  if (!recapData) return null;

  return (
    <ListAndInfoModal
      title="" // On gère le header custom
      onClose={onClose}
      sizeClass="max-w-md sm:max-w-lg overflow-hidden"
    >
      {/* Header harmonisé */}
      <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <h3 className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-primary">
          📅 Résumé de la Semaine Précédente
        </h3>
      </div>

      <div className="text-center p-4 sm:p-6 animate-fade-in">
        {/* Nom */}
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
          Bravo, {recapData.displayName} !
        </h3>

        {/* Dates */}
        <p className="text-base sm:text-lg text-text mb-4">
          Voici votre performance pour la semaine du{' '}
          <span className="font-semibold text-secondary">{recapData.startDate}</span> au{' '}
          <span className="font-semibold text-secondary">{recapData.endDate}</span> :
        </p>

        {/* Bloc résumé */}
        <div className="bg-neutralBg p-4 rounded-xl shadow-inner border border-gray-200 mb-5">
          <p className="text-lg font-semibold text-text mb-2">
            Points gagnés :{' '}
            <span className="text-success font-bold">{recapData.pointsGained}</span>
          </p>
          <p className="text-sm text-lightText">
            Tâches complétées :{' '}
            <span className="font-semibold">{recapData.tasksCompleted.length}</span>
          </p>

          {recapData.tasksCompleted.length > 0 && (
            <ul className="list-disc list-inside text-sm text-lightText mt-2 max-h-32 overflow-y-auto custom-scrollbar text-left">
              {recapData.tasksCompleted.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Message de victoire */}
        {recapData.isWinner && (
          <p className="text-lg font-bold text-yellow-500 mb-4 animate-pulse">
            🏆 Vous étiez le vainqueur de la semaine !
          </p>
        )}

        {/* Info */}
        <p className="text-xs text-lightText italic">
          Ce résumé est affiché automatiquement chaque début de semaine.
        </p>

        {/* Bouton fermer */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-error hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-full shadow-md transition text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </ListAndInfoModal>
  );
};

export default WeeklyRecapModal;
