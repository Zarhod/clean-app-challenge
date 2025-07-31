import React, { useState, useEffect } from 'react';

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
  const [currentTaskData, setCurrentTaskData] = useState(taskData);
  const [keepOpen, setKeepOpen] = useState(false); // Nouvel état pour garder la modale ouverte

  useEffect(() => {
    setCurrentTaskData(taskData);
  }, [taskData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTaskData(prev => ({ ...prev, [name]: value }));
    onFormChange({ target: { name, value } }); // Passe le changement au parent
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Passe l'état de keepOpen à la fonction onSubmit du parent
    await onSubmit(keepOpen); 
    // Si keepOpen est vrai et que la soumission a réussi, réinitialise le formulaire
    if (keepOpen && !editingTask) { // Ne réinitialise que pour l'ajout, pas l'édition
      setCurrentTaskData({ Nom_Tache: '', Description: '', Points: 0, Frequence: 'Quotidien', Categorie: '', Parent_Task_ID: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-2">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-[95%] sm:max-w-md md:max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">
          {editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conteneur du formulaire avec défilement pour les petits écrans */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="Nom_Tache" className="block text-left text-sm font-medium text-gray-700 mb-1">Nom de la Tâche</label>
                <input
                  id="Nom_Tache"
                  type="text"
                  name="Nom_Tache"
                  value={currentTaskData.Nom_Tache}
                  onChange={handleChange}
                  placeholder="Ex: Nettoyer la cuisine"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="Description" className="block text-left text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="Description"
                  name="Description"
                  value={currentTaskData.Description}
                  onChange={handleChange}
                  placeholder="Détails de la tâche..."
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y custom-scrollbar"
                  disabled={loading}
                ></textarea>
              </div>
              <div>
                <label htmlFor="Points" className="block text-left text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  id="Points"
                  type="number"
                  name="Points"
                  value={currentTaskData.Points}
                  onChange={handleChange}
                  placeholder="Ex: 50"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                  min="0"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="Frequence" className="block text-left text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                <select
                  id="Frequence"
                  name="Frequence"
                  value={currentTaskData.Frequence}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                <label htmlFor="Categorie" className="block text-left text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input
                  id="Categorie"
                  type="text"
                  name="Categorie"
                  value={currentTaskData.Categorie}
                  onChange={handleChange}
                  placeholder="Ex: Ménage, Jardinage, Bricolage"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="Parent_Task_ID" className="block text-left text-sm font-medium text-gray-700 mb-1">ID Tâche Parent (Optionnel)</label>
                <input
                  id="Parent_Task_ID"
                  type="text"
                  name="Parent_Task_ID"
                  value={currentTaskData.Parent_Task_ID}
                  onChange={handleChange}
                  placeholder="Ex: GT001"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </div> {/* Fin du conteneur scrollable */}

          {!editingTask && ( // Option "Garder ouvert" seulement pour l'ajout de nouvelles tâches
            <div className="flex items-center justify-center mt-4">
              <input
                type="checkbox"
                id="keepOpen"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="form-checkbox h-5 w-5 text-primary rounded focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <label htmlFor="keepOpen" className="ml-2 text-text text-sm font-medium">Garder la modale ouverte après l'ajout</label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6"> {/* Responsive buttons */}
            <button
              type="submit"
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
      </div>
    </div>
  );
}

export default AdminTaskFormModal;
