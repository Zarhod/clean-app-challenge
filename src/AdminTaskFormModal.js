import React, { useState } from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Importation du composant ListAndInfoModal

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
  const [keepOpen, setKeepOpen] = useState(false); // Nouvel état pour "garder ouvert"

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(keepOpen); // Passe l'état de 'keepOpen' à la fonction onSubmit parente
  };

  return (
    <ListAndInfoModal
      title={editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
      onClose={onClose}
      sizeClass="max-w-[95%] sm:max-w-md md:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4"> {/* Utilise le handleSubmit local */}
        {/* Conteneur du formulaire avec défilement pour les petits écrans */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          <div>
            <label htmlFor="Nom_Tache" className="block text-sm font-medium text-gray-700 text-left">Nom de la Tâche</label>
            <input
              type="text"
              id="Nom_Tache"
              name="Nom_Tache"
              value={taskData.Nom_Tache}
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
              value={taskData.Description}
              onChange={onFormChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm resize-y custom-scrollbar"
              disabled={loading}
            ></textarea>
          </div>
          <div>
            <label htmlFor="Points" className="block text-sm font-medium text-gray-700 text-left">Points</label>
            <input
              type="number"
              id="Points"
              name="Points"
              value={taskData.Points}
              onChange={onFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm"
              required
              min="0"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="Frequence" className="block text-sm font-medium text-gray-700 text-left">Fréquence</label>
            <select
              id="Frequence"
              name="Frequence"
              value={taskData.Frequence}
              onChange={onFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2 text-sm"
              required
              disabled={loading}
            >
              <option value="Quotidien">Quotidien</option>
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Mensuel">Mensuel</option>
              <option value="Unique">Unique</option>
            </select>
          </div>
          <div>
            <label htmlFor="Categorie" className="block text-sm font-medium text-gray-700 text-left">Catégorie</label>
            <input
              type="text"
              id="Categorie"
              name="Categorie"
              value={taskData.Categorie}
              onChange={onFormChange}
              placeholder="Ex: Ménage, Environnement"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="Parent_Task_ID" className="block text-sm font-medium text-gray-700 text-left">ID Tâche Parent (Optionnel)</label>
            <input
              id="Parent_Task_ID"
              type="text"
              name="Parent_Task_ID"
              value={taskData.Parent_Task_ID}
              onChange={onFormChange}
              placeholder="Ex: GT001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            />
          </div>
          {editingTask && ( // Option "Tâche terminée" visible seulement en mode édition
            <div className="flex items-center justify-center mt-4">
              <input
                id="Est_Terminee"
                type="checkbox"
                name="Est_Terminee"
                checked={taskData.Est_Terminee === true || String(taskData.Est_Terminee).toLowerCase() === 'true'}
                onChange={(e) => onFormChange({ target: { name: 'Est_Terminee', value: e.target.checked } })}
                className="form-checkbox h-5 w-5 text-primary rounded focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <label htmlFor="Est_Terminee" className="ml-2 text-text text-sm font-medium">Tâche Terminée</label>
            </div>
          )}
        </div> {/* Fin du conteneur scrollable */}

        {!editingTask && ( // Afficher "Ajouter une autre tâche" seulement en mode ajout
          <div className="flex items-center justify-center mt-4">
            <input
              id="keepOpen"
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <label htmlFor="keepOpen" className="ml-2 text-text text-sm font-medium">Ajouter une autre tâche après</label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6"> {/* Responsive buttons */}
          <button
            type="submit" // Changer en type="submit" pour déclencher le formulaire
            disabled={loading}
            className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Soumission...' : (editingTask ? 'Modifier' : 'Ajouter')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </form>
    </ListAndInfoModal>
  );
}

export default AdminTaskFormModal;
