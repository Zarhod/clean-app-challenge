import React, { useState } from 'react';

/**
 * Composant de modal pour signaler une tâche.
 * @param {Object} props - Les props du composant.
 * @param {boolean} props.show - Indique si le modal doit être affiché.
 * @param {function} props.onClose - Fonction de rappel pour fermer le modal.
 * @param {function} props.onSubmit - Fonction de rappel pour soumettre le signalement.
 * @param {Object} props.reportedTaskDetails - Détails de la tâche signalée ({ id, name, participant }).
 * @param {boolean} props.loading - Indique si une opération est en cours (pour désactiver les boutons).
 */
function ReportTaskModal({ show, onClose, onSubmit, reportedTaskDetails, loading }) {
  const [reporterName, setReporterName] = useState('');

  if (!show || !reportedTaskDetails) return null;

  const handleSubmit = () => {
    onSubmit(reporterName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-error mb-4">Signaler une Tâche</h3>
        <p className="text-base sm:text-lg text-text mb-4">
          Vous êtes sur le point de signaler la tâche "<strong className="text-secondary">{reportedTaskDetails.name}</strong>"
          complétée par <strong className="text-secondary">{reportedTaskDetails.participant}</strong>.
        </p>
        <p className="text-sm sm:text-base text-lightText mb-6">
          Si deux personnes différentes signalent cette tâche, elle sera réinitialisée et
          <strong className="text-error"> {reportedTaskDetails.participant} perdra 5 points.</strong>
        </p>

        <label htmlFor="reporterName" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Votre Nom:</label>
        <input
          id="reporterName"
          type="text"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="Entrez votre nom"
          className="w-full p-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          autoFocus
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !reporterName.trim()}
            className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Signalement...' : 'Confirmer le Signalement'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportTaskModal;
