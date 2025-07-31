import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

/**
 * Composant modal pour sélectionner le type d'export CSV.
 * @param {Object} props - Les props du composant.
 * @param {function} props.onClose - Fonction de rappel pour fermer la modal.
 * @param {function} props.onExportClassement - Fonction de rappel pour exporter le classement.
 * @param {function} props.onExportRealisations - Fonction de rappel pour exporter les réalisations.
 */
function ExportSelectionModal({ onClose, onExportClassement, onExportRealisations }) {
  return (
    <ListAndInfoModal title="Exporter les Données" onClose={onClose} sizeClass="max-w-xs sm:max-w-md">
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
      </div>
    </ListAndInfoModal>
  );
}

export default ExportSelectionModal;
