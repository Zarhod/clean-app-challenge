import React from 'react';

/**
 * Composant de modal pour l'ajout ou la modification d'une tâche.
 * @param {Object} taskData - Les données actuelles du formulaire de tâche.
 * @param {function} onFormChange - Fonction de rappel pour gérer les changements du formulaire.
 * @param {function} onSubmit - Fonction de rappel pour soumettre le formulaire.
 * @param {function} onClose - Fonction de rappel pour fermer le modal.
 * @param {boolean} loading - Indique si une opération est en cours (pour désactiver les boutons).
 * @param {Object|null} editingTask - L'objet tâche si nous sommes en mode édition, sinon null.
 */
function AdminTaskFormModal({ taskData, onFormChange, onSubmit, onClose, loading, editingTask }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-5 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
        </h3>

        {/* Conteneur du formulaire avec défilement pour les petits écrans */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="ID_Tache" className="block text-text font-medium mb-1 text-sm">ID Tâche:</label>
              <input
                id="ID_Tache"
                type="text"
                name="ID_Tache"
                value={taskData.ID_Tache}
                onChange={onFormChange}
                placeholder="Ex: TACHE001"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={!!editingTask} // Désactive l'édition de l'ID pour les tâches existantes
              />
            </div>
            <div>
              <label htmlFor="Nom_Tache" className="block text-text font-medium mb-1 text-sm">Nom Tâche:</label>
              <input
                id="Nom_Tache"
                type="text"
                name="Nom_Tache"
                value={taskData.Nom_Tache}
                onChange={onFormChange}
                placeholder="Ex: Nettoyer la cuisine"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            {/* Description est intentionnellement omise ici si elle a été retirée du frontend */}
            <div>
              <label htmlFor="Points" className="block text-text font-medium mb-1 text-sm">Points:</label>
              <input
                id="Points"
                type="number"
                name="Points"
                value={taskData.Points}
                onChange={onFormChange}
                placeholder="Ex: 10"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label htmlFor="Frequence" className="block text-text font-medium mb-1 text-sm">Fréquence:</label>
              <select
                id="Frequence"
                name="Frequence"
                value={taskData.Frequence}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
              >
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Quotidien">Quotidien</option>
                <option value="Ponctuel">Ponctuel</option>
              </select>
            </div>
            <div>
              <label htmlFor="Urgence" className="block text-text font-medium mb-1 text-sm">Urgence:</label>
              <select
                id="Urgence"
                name="Urgence"
                value={taskData.Urgence}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
              >
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </select>
            </div>
            <div>
              <label htmlFor="Categorie" className="block text-text font-medium mb-1 text-sm">Catégorie:</label>
              <select
                id="Categorie"
                name="Categorie"
                value={taskData.Categorie}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
              >
                <option value="Tous">Tous</option>
                <option value="Cuisine">Cuisine</option>
                <option value="Salle">Salle</option>
              </select>
            </div>
            <div>
              <label htmlFor="Sous_Taches_IDs" className="block text-text font-medium mb-1 text-sm">IDs Sous-Tâches (séparés par virgule):</label>
              <input
                id="Sous_Taches_IDs"
                type="text"
                name="Sous_Taches_IDs"
                value={taskData.Sous_Taches_IDs}
                onChange={onFormChange}
                placeholder="Ex: ST001, ST002"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label htmlFor="Parent_Task_ID" className="block text-text font-medium mb-1 text-sm">ID Tâche Parent:</label>
              <input
                id="Parent_Task_ID"
                type="text"
                name="Parent_Task_ID"
                value={taskData.Parent_Task_ID}
                onChange={onFormChange}
                placeholder="Ex: GT001"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
        </div> {/* Fin du conteneur scrollable */}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6"> {/* Responsive buttons */}
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Soumission...' : (editingTask ? 'Modifier' : 'Ajouter')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTaskFormModal;
