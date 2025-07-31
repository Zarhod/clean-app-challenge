import React from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Importation de ListAndInfoModal

const ReportTaskModal = ({ show, onClose, onSubmit, reportedTaskDetails, loading }) => {
  if (!show) return null;

  return (
    <ListAndInfoModal title="Signaler une Tâche" onClose={onClose} sizeClass="max-w-xs sm:max-w-md">
      <p className="text-base sm:text-lg mb-6 text-text">
        Vous êtes sur le point de signaler la tâche "<strong className="text-primary">{reportedTaskDetails?.name || 'Inconnue'}</strong>"
        effectuée par <strong className="text-secondary">{reportedTaskDetails?.participant || 'Inconnu'}</strong>.
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
    </ListAndInfoModal>
  );
};

export default ReportTaskModal;
