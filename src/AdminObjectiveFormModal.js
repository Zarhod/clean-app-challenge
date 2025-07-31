import React from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg animate-fade-in-scale border border-primary/20 mx-auto"> 
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center"> 
          {editingObjective ? 'Modifier l\'Objectif' : 'Ajouter un Objectif'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3"> 
          <div>
            <label htmlFor="ID_Objectif" className="block text-sm font-medium text-text text-left mb-0.5">ID Objectif</label>
            <input
              id="ID_Objectif"
              type="text"
              name="ID_Objectif"
              value={objectiveData.ID_Objectif}
              onChange={onFormChange}
              placeholder="Ex: OBJ001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
              disabled={editingObjective ? true : false} 
            />
          </div>
          <div>
            <label htmlFor="Nom_Objectif" className="block text-sm font-medium text-text text-left mb-0.5">Nom de l'Objectif</label>
            <input
              id="Nom_Objectif"
              type="text"
              name="Nom_Objectif"
              value={objectiveData.Nom_Objectif}
              onChange={onFormChange}
              placeholder="Ex: Réduire les déchets plastiques"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="Description" className="block text-sm font-medium text-text text-left mb-0.5">Description</label>
            <textarea
              id="Description"
              name="Description"
              value={objectiveData.Description}
              onChange={onFormChange}
              placeholder="Détaillez l'objectif à atteindre..."
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y custom-scrollbar"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="Points_Objectif" className="block text-sm font-medium text-text text-left mb-0.5">Points de l'Objectif</label>
            <input
              id="Points_Objectif"
              type="number"
              name="Points_Objectif"
              value={objectiveData.Points_Objectif}
              onChange={onFormChange}
              placeholder="Ex: 500"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="Date_Debut" className="block text-sm font-medium text-text text-left mb-0.5">Date de Début</label>
            <input
              id="Date_Debut"
              type="date"
              name="Date_Debut"
              value={objectiveData.Date_Debut}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="Date_Fin" className="block text-sm font-medium text-text text-left mb-0.5">Date de Fin</label>
            <input
              id="Date_Fin"
              type="date"
              name="Date_Fin"
              value={objectiveData.Date_Fin}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          {editingObjective && (
            <>
              <div>
                <label htmlFor="Progress_Current" className="block text-sm font-medium text-text text-left mb-0.5">Progression Actuelle</label>
                <input
                  id="Progress_Current"
                  type="number"
                  name="Progress_Current"
                  value={objectiveData.Progress_Current}
                  onChange={onFormChange}
                  placeholder="Ex: 250"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="Progress_Target" className="block text-sm font-medium text-text text-left mb-0.5">Cible de Progression</label>
                <input
                  id="Progress_Target"
                  type="number"
                  name="Progress_Target"
                  value={objectiveData.Progress_Target}
                  onChange={onFormChange}
                  placeholder="Ex: 500"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>
              <div className="flex items-center justify-start mt-2">
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
            </>
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
      </div>
    </div>
  );
}

export default AdminObjectiveFormModal;
