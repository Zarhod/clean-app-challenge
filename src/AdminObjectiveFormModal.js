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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md animate-fade-in-scale border border-primary/20">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">
          {editingObjective ? 'Modifier l\'Objectif' : 'Ajouter un Objectif'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label htmlFor="ID_Objectif" className="block text-text text-sm font-medium mb-1">ID Objectif:</label>
            <input
              type="text"
              id="ID_Objectif"
              name="ID_Objectif"
              value={objectiveData.ID_Objectif || ''}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Ex: OBJ001"
              disabled={!!editingObjective} // Désactiver si en mode édition
              required
            />
          </div>
          <div>
            <label htmlFor="Nom_Objectif" className="block text-text text-sm font-medium mb-1">Nom de l'Objectif:</label>
            <input
              type="text"
              id="Nom_Objectif"
              name="Nom_Objectif"
              value={objectiveData.Nom_Objectif || ''}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Ex: Maître Nettoyeur"
              required
            />
          </div>
          <div>
            <label htmlFor="Description_Objectif" className="block text-text text-sm font-medium mb-1">Description:</label>
            <textarea
              id="Description_Objectif"
              name="Description_Objectif"
              value={objectiveData.Description_Objectif || ''}
              onChange={onFormChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Décrivez cet objectif..."
            ></textarea>
          </div>
          <div>
            <label htmlFor="Cible_Points" className="block text-text text-sm font-medium mb-1">Points Cible:</label>
            <input
              type="number"
              id="Cible_Points"
              name="Cible_Points"
              value={objectiveData.Cible_Points || ''}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Ex: 500"
              required
            />
          </div>
          <div>
            <label htmlFor="Type_Cible" className="block text-text text-sm font-medium mb-1">Type de Cible:</label>
            <select
              id="Type_Cible"
              name="Type_Cible"
              value={objectiveData.Type_Cible || 'Cumulatif'}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            >
              <option value="Cumulatif">Cumulatif (total des points)</option>
              <option value="Hebdomadaire">Hebdomadaire (points sur la semaine)</option>
              <option value="Par_Categorie">Par Catégorie (points dans une catégorie spécifique)</option>
            </select>
          </div>
          {objectiveData.Type_Cible === 'Par_Categorie' && (
            <div>
              <label htmlFor="Categorie_Cible" className="block text-text text-sm font-medium mb-1">Catégorie Cible:</label>
              <select
                id="Categorie_Cible"
                name="Categorie_Cible"
                value={objectiveData.Categorie_Cible || 'Tous'}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="Tous">Tous</option>
                <option value="Salle">Salle</option>
                <option value="Cuisine">Cuisine</option>
              </select>
            </div>
          )}
          {editingObjective && ( // Afficher les points actuels et l'état "atteint" seulement en mode édition
            <>
              <div>
                <label htmlFor="Points_Actuels" className="block text-text text-sm font-medium mb-1">Points Actuels:</label>
                <input
                  type="number"
                  id="Points_Actuels"
                  name="Points_Actuels"
                  value={objectiveData.Points_Actuels || 0}
                  onChange={onFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled // Normalement mis à jour par le système
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

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Envoi...' : (editingObjective ? 'Mettre à jour' : 'Ajouter')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
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
