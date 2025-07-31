import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const WeeklyRecapModal = ({ recapData, onClose }) => {
  if (!recapData) return null;

  return (
    <ListAndInfoModal
      title="Résumé de la Semaine Précédente !"
      onClose={onClose}
      sizeClass="max-w-md sm:max-w-lg"
    >
      <div className="text-center p-4">
        <h3 className="text-2xl font-bold text-primary mb-4">Bravo, {recapData.displayName} !</h3>
        <p className="text-lg text-text mb-3">
          Voici votre performance pour la semaine du <strong className="text-secondary">{recapData.startDate}</strong> au <strong className="text-secondary">{recapData.endDate}</strong> :
        </p>
        <div className="bg-neutralBg p-4 rounded-lg shadow-inner mb-4">
          <p className="text-xl font-semibold text-text mb-2">Points gagnés : <span className="text-success font-bold">{recapData.pointsGained}</span></p>
          <p className="text-md text-lightText">Tâches complétées : <span className="font-semibold">{recapData.tasksCompleted.length}</span></p>
          {recapData.tasksCompleted.length > 0 && (
            <ul className="list-disc list-inside text-sm text-lightText mt-2 max-h-24 overflow-y-auto custom-scrollbar">
              {recapData.tasksCompleted.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          )}
        </div>
        {recapData.isWinner && (
          <p className="text-xl font-bold text-yellow-500 mb-4 animate-pulse">
            Vous étiez le vainqueur de la semaine ! 🏆
          </p>
        )}
        <p className="text-sm text-lightText italic">
          Ce récapitulatif est basé sur les tâches complétées et les points gagnés la semaine dernière.
        </p>
      </div>
    </ListAndInfoModal>
  );
};

export default WeeklyRecapModal;
