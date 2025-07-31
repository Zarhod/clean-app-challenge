import React from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Importation du composant ListAndInfoModal

/**
 * Composant modal pour l'ajout ou l'édition d'un objectif.
 * @param {Object} objectiveData - Les données de l'objectif en cours d'édition ou le modèle pour un nouvel objectif.
 * @param {function} onFormChange - Fonction de rappel pour gérer les changements dans le formulaire.
 * @param {function} onSubmit - Fonction de rappel pour soumettre le formulaire (ajouter/modifier).
 * @param {function} onClose - Fonction de rappel pour fermer le modal.
 * @param {boolean} loading - Indique si une opération est en cours (pour désactiver les boutons).
 * @param {Object|null} editingObjective - L'objectif en cours d'édition, null si c'est un nouvel objectif.
 */
function AdminObjectiveFormModal({ objectiveData, onFormChange, onSubmit, onClose, loading, editingObjective }) {
  return (
    <ListAndInfoModal
      title={editingObjective ? 'Modifier l\'Objectif' : 'Ajouter un Objectif'}
      onClose={onClose}
      sizeClass="max-w-xs sm:max-w-md"
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <div>
          <label htmlFor="Nom_Objectif" className="block text-sm font-medium text-gray-700 text-left">Nom de l'Objectif</label>
          <input
            type="text"
            id="Nom_Objectif"
            name="Nom_Objectif"
            value={objectiveData.Nom_Objectif}
            onChange={onFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="Description" className="block text-sm font-medium text-gray-700 text-left">Description</label>
          <textarea
            id="Description"
            name="Description"
            value={objectiveData.Description}
            onChange={onFormChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm resize-y custom-scrollbar"
            disabled={loading}
          ></textarea>
        </div>
        <div>
          <label htmlFor="Date_Limite" className="block text-sm font-medium text-gray-700 text-left">Date Limite</label>
          <input
            type="date"
            id="Date_Limite"
            name="Date_Limite"
            value={objectiveData.Date_Limite}
            onChange={onFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm"
            required
            disabled={loading}
          />
        </div>

        {editingObjective && ( // Afficher "Objectif Atteint" seulement en mode édition
          <div className="flex items-center justify-center mt-4">
            <input
              id="Est_Atteint"
              type="checkbox"
              name="Est_Atteint"
              checked={objectiveData.Est_Atteint === true || String(objectiveData.Est_Atteint).toLowerCase() === 'true'}
              onChange={(e) => onFormChange({ target: { name: 'Est_Atteint', value: e.target.checked } })}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="Est_Atteint" className="ml-2 text-text text-sm font-medium">Objectif Atteint</label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Envoi...' : (editingObjective ? 'Mettre à jour' : 'Ajouter')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </form>
    </ListAndInfoModal>
  );
}

export default AdminObjectiveFormModal;
