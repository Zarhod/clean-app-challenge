import React from 'react';

function AdminObjectiveFormModal({
  objectiveData,
  onFormChange,
  onSubmit,
  onClose,
  loading,
  editingObjective,
  categories = [],  // <-- Liste des catégories imposée
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center p-2 sm:p-4 pointer-events-none">
      <div className="bg-white rounded-3xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col shadow-[0_15px_35px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">
        <h3 className="text-2xl font-bold text-primary text-center py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          {editingObjective ? 'Modifier un objectif' : 'Nouvel Objectif'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="px-6 py-4 space-y-4 overflow-y-auto"
        >
          <div>
            <label htmlFor="ID_Objectif" className="block text-sm font-semibold mb-1 text-gray-600">
              ID Objectif (Unique)
            </label>
            <input
              type="text"
              name="ID_Objectif"
              value={objectiveData.ID_Objectif}
              onChange={onFormChange}
              placeholder="Ex: OBJ001"
              disabled={!!editingObjective}
              required
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="Nom_Objectif" className="block text-sm font-semibold mb-1 text-gray-600">
              Nom de l'Objectif
            </label>
            <input
              type="text"
              name="Nom_Objectif"
              value={objectiveData.Nom_Objectif}
              onChange={onFormChange}
              placeholder="Ex: Atteindre 1000 points"
              required
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="Description_Objectif" className="block text-sm font-semibold mb-1 text-gray-600">
              Description
            </label>
            <textarea
              name="Description_Objectif"
              value={objectiveData.Description_Objectif}
              onChange={onFormChange}
              rows="2"
              placeholder="Détails de l'objectif..."
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="Cible_Points" className="block text-sm font-semibold mb-1 text-gray-600">
              Points Cible
            </label>
            <input
              type="number"
              name="Cible_Points"
              value={objectiveData.Cible_Points}
              onChange={onFormChange}
              placeholder="Ex: 1000"
              required
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="Type_Cible" className="block text-sm font-semibold mb-1 text-gray-600">
              Type de Cible
            </label>
            <select
              name="Type_Cible"
              value={objectiveData.Type_Cible}
              onChange={onFormChange}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Cumulatif">Points Cumulatifs</option>
              <option value="Par_Categorie">Par Catégorie de Tâche</option>
              <option value="Hebdomadaire">Hebdomadaire</option>
            </select>
          </div>

          {objectiveData.Type_Cible === 'Par_Categorie' && (
            <div>
              <label htmlFor="Categorie_Cible" className="block text-sm font-semibold mb-1 text-gray-600">
                Catégorie Cible
              </label>
              <select
                name="Categorie_Cible"
                value={objectiveData.Categorie_Cible || ''}
                onChange={onFormChange}
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>
                  -- Sélectionnez une catégorie --
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {editingObjective && (
            <>
              <div>
                <label htmlFor="Points_Actuels" className="block text-sm font-semibold mb-1 text-gray-600">
                  Points Actuels
                </label>
                <input
                  type="number"
                  name="Points_Actuels"
                  value={objectiveData.Points_Actuels}
                  onChange={onFormChange}
                  placeholder="Points actuels"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label htmlFor="Est_Atteint" className="ml-2 text-sm text-gray-700">
                  Objectif Atteint
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-full text-sm font-semibold shadow-md transition duration-300"
            >
              {loading ? 'Envoi...' : editingObjective ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full text-sm font-semibold shadow-md transition duration-300"
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
