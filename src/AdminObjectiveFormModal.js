import React from 'react';

/**
 * Composant modal pour l'ajout ou l'édition d'un objectif.
 * @param {Object} objectiveData - Les données de l'objectif en cours d'édition ou le modèle pour un nouvel objectif.
 * @param {function} onFormChange - Fonction de rappel pour gérer les changements dans le formulaire.
 * @param {function} onSubmit - Fonction de rappel pour soumettre le formulaire (ajouter/modifier).
 * @param {function} onClose - Fonction de rappel pour fermer le modal.
 * @param {boolean} loading - Indique si une opération est en cours (pour désactiver les boutons).\
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
            <label htmlFor="ID_Objectif" className="block text-text text-sm font-medium mb-1 text-left">ID Objectif (Unique):</label>
            <input
              type="text"
              name="ID_Objectif"
              value={objectiveData.ID_Objectif}
              onChange={onFormChange}
              placeholder="Ex: OBJ001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              disabled={!!editingObjective} 
              required
            />
          </div>
          <div>
            <label htmlFor="Nom_Objectif" className="block text-text text-sm font-medium mb-1 text-left">Nom de l'Objectif:</label>
            <input
              type="text"
              name="Nom_Objectif"
              value={objectiveData.Nom_Objectif}
              onChange={onFormChange}
              placeholder="Ex: Atteindre 1000 points"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              required
            />
          </div>
          <div>
            <label htmlFor="Description_Objectif" className="block text-text text-sm font-medium mb-1 text-left">Description:</label>
            <textarea
              name="Description_Objectif"
              value={objectiveData.Description_Objectif}
              onChange={onFormChange}
              placeholder="Détails de l'objectif..."
              rows="2" 
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
            ></textarea>
          </div>
          <div>
            <label htmlFor="Cible_Points" className="block text-text text-sm font-medium mb-1 text-left">Points Cible:</label>
            <input
              type="number"
              name="Cible_Points"
              value={objectiveData.Cible_Points}
              onChange={onFormChange}
              placeholder="Ex: 1000"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              required
            />
          </div>
          <div>
            <label htmlFor="Type_Cible" className="block text-text text-sm font-medium mb-1 text-left">Type de Cible:</label>
            <select
              name="Type_Cible"
              value={objectiveData.Type_Cible}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
            >
              <option value="Cumulatif">Points Cumulatifs</option>
              <option value="Par_Categorie">Par Catégorie de Tâche</option>
            </select>
          </div>
          {objectiveData.Type_Cible === 'Par_Categorie' && (
            <div>
              <label htmlFor="Categorie_Cible" className="block text-text text-sm font-medium mb-1 text-left">Catégorie Cible:</label>
              <input
                type="text"
                name="Categorie_Cible"
                value={objectiveData.Categorie_Cible}
                onChange={onFormChange}
                placeholder="Ex: Cuisine, Salle"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                required={objectiveData.Type_Cible === 'Par_Categorie'}
              />
            </div>
          )}

          {editingObjective && ( 
            <>
              <div>
                <label htmlFor="Points_Actuels" className="block text-text text-sm font-medium mb-1 text-left">Points Actuels:</label>
                <input
                  type="number"
                  name="Points_Actuels"
                  value={objectiveData.Points_Actuels}
                  onChange={onFormChange}
                  placeholder="Points actuels"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="Est_Atteint"
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
