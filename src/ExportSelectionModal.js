import React from 'react';

/**
 * Composant modal pour sélectionner le type d'export CSV.
 * @param {Object} props - Les props du composant.
 * @param {function} props.onClose - Fonction de rappel pour fermer la modal.
 * @param {function} props.onExportClassement - Fonction de rappel pour exporter le classement.
 * @param {function} props.onExportRealisations - Fonction de rappel pour exporter les réalisations.
 */
function ExportSelectionModal({ onClose, onExportClassement, onExportRealisations }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4"> 
          Exporter les Données
        </h3>
        <p className="text-base sm:text-lg text-text mb-4"> 
          Quel type de données souhaitez-vous exporter ?
        </p>
        <div className="flex flex-col gap-3 mt-4"> 
          <button
            onClick={onExportClassement}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
          >
            Exporter le Classement
          </button>
          <button
            onClick={onExportRealisations}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
          >
            Exporter les Réalisations
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportSelectionModal;
