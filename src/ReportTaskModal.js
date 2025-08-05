// src/ReportTaskModal.js
import React from 'react';

const ReportTaskModal = ({ show, onClose, onSubmit, reportedTaskDetails, loading }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
          <h3 className="text-center text-xl font-extrabold text-red-700">
            Signaler une Tâche
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-5 text-sm text-gray-700 text-center space-y-3">
          <p>
            Vous êtes sur le point de signaler la tâche
            <span className="font-semibold text-primary"> « {reportedTaskDetails?.name} »</span>
            effectuée par
            <span className="font-semibold text-secondary"> {reportedTaskDetails?.participant}</span>.
          </p>
          <p className="text-sm text-lightText">
            Cette action supprimera la réalisation et déduira des points à l'utilisateur concerné.
          </p>
          <p className="text-sm font-semibold text-error mt-2">
            Êtes-vous sûr de vouloir continuer ?
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition shadow-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Signalement...' : 'Confirmer le Signalement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportTaskModal;
