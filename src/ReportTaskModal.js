// src/ReportTaskModal.js
import React from 'react';

const ReportTaskModal = ({ show, onClose, onSubmit, reportedTaskDetails, loading }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-error mb-4">Signaler une Tâche</h3>
        <p className="text-base sm:text-lg mb-6 text-text">
          Vous êtes sur le point de signaler la tâche "<strong className="text-primary">{reportedTaskDetails?.name}</strong>"
          effectuée par <strong className="text-secondary">{reportedTaskDetails?.participant}</strong>.
          Cette action supprimera la réalisation et déduira des points à l'utilisateur concerné.
        </p>
        <p className="text-sm text-lightText mb-8">
          Êtes-vous sûr de vouloir continuer ?
        </p>
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full sm:w-auto bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Signalement...' : 'Confirmer le Signalement'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportTaskModal;
