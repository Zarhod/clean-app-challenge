import React from 'react';

/**
 * Composant modal pour l'ajout ou l'édition d'une tâche.
 * @param {Object} taskData - Les données de la tâche en cours d'édition ou le modèle pour une nouvelle tâche.
 * @param {function} onFormChange - Fonction de rappel pour gérer les changements dans le formulaire.
 * @param {function} onSubmit - Fonction de rappel pour soumettre le formulaire (ajouter/modifier).
 * @param {function} onClose - Fonction de rappel pour fermer le modal.
 * @param {boolean} loading - Indique si une opération est en cours (pour désactiver les boutons).
 * @param {Object|null} editingTask - La tâche en cours d'édition, null si c'est une nouvelle tâche.
 */
function AdminTaskFormModal({ taskData, onFormChange, onSubmit, onClose, loading, editingTask }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">
          {editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
          <div>
            <label htmlFor="ID_Tache" className="block text-sm font-medium text-text text-left mb-0.5">ID Tâche</label>
            <input
              id="ID_Tache"
              type="text"
              name="ID_Tache"
              value={taskData.ID_Tache}
              onChange={onFormChange}
              placeholder="Ex: TACHE001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
              disabled={editingTask ? true : false} // Empêche la modification de l'ID si c'est une tâche existante
            />
          </div>
          <div>
            <label htmlFor="Nom_Tache" className="block text-sm font-medium text-text text-left mb-0.5">Nom de la Tâche</label>
            <input
              id="Nom_Tache"
              type="text"
              name="Nom_Tache"
              value={taskData.Nom_Tache}
              onChange={onFormChange}
              placeholder="Ex: Trier les déchets"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="Description" className="block text-sm font-medium text-text text-left mb-0.5">Description</label>
            <textarea
              id="Description"
              name="Description"
              value={taskData.Description}
              onChange={onFormChange}
              placeholder="Détaillez la tâche à réaliser..."
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y custom-scrollbar"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="Points_Gagnes" className="block text-sm font-medium text-text text-left mb-0.5">Points Gagnés</label>
            <input
              id="Points_Gagnes"
              type="number"
              name="Points_Gagnes"
              value={taskData.Points_Gagnes}
              onChange={onFormChange}
              placeholder="Ex: 10"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="Frequence" className="block text-sm font-medium text-text text-left mb-0.5">Fréquence</label>
            <select
              id="Frequence"
              name="Frequence"
              value={taskData.Frequence}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            >
              <option value="">Sélectionnez une fréquence</option>
              <option value="Quotidien">Quotidien</option>
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Mensuel">Mensuel</option>
              <option value="Unique">Unique</option>
            </select>
          </div>
          <div className="flex items-center justify-start mt-2">
            <input
              id="Est_Active"
              type="checkbox"
              name="Est_Active"
              checked={taskData.Est_Active === true || String(taskData.Est_Active).toLowerCase() === 'true'}
              onChange={(e) => onFormChange({ target: { name: 'Est_Active', value: e.target.checked } })}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="Est_Active" className="ml-2 text-text text-sm font-medium">Tâche Active</label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Envoi...' : (editingTask ? 'Mettre à jour' : 'Ajouter')}
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

export default AdminTaskFormModal;
