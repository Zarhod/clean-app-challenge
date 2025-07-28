import React from 'react';

function AdminTaskFormModal({ 
  taskData, 
  onFormChange, 
  onSubmit, 
  onClose, 
  loading, 
  editingTask 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4"> 
          {editingTask ? 'Modifier la tâche' : 'Ajouter une nouvelle tâche'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"> 
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">ID Tâche (Unique):</label>
              <input
                type="text"
                name="ID_Tache"
                value={taskData.ID_Tache}
                onChange={onFormChange}
                placeholder="Ex: T001, ST001"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                disabled={!!editingTask} 
                required
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Nom de la Tâche:</label>
              <input
                type="text"
                name="Nom_Tache"
                value={taskData.Nom_Tache}
                onChange={onFormChange}
                placeholder="Ex: Nettoyer la cuisine"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
                required
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Description:</label>
              <textarea
                name="Description"
                value={taskData.Description}
                onChange={onFormChange}
                placeholder="Détails de la tâche..."
                rows="2" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              ></textarea>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Points:</label>
              <input
                type="number"
                name="Points"
                value={taskData.Points}
                onChange={onFormChange}
                placeholder="Ex: 10, 25.5"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Fréquence:</label>
              <select
                name="Frequence"
                value={taskData.Frequence}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              >
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Quotidien">Quotidien</option>
                <option value="Ponctuel">Ponctuel</option>
              </select>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Urgence:</label>
              <select
                name="Urgence"
                value={taskData.Urgence}
                onChange={onFormChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              >
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Catégorie:</label>
              <input
                type="text"
                name="Categorie"
                value={taskData.Categorie}
                onChange={onFormChange}
                placeholder="Ex: Cuisine, Salle, Tous"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">IDs Sous-Tâches (séparés par virgule):</label>
              <input
                type="text"
                name="Sous_Taches_IDs"
                value={taskData.Sous_Taches_IDs}
                onChange={onFormChange}
                placeholder="Ex: ST001, ST002"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">ID Tâche Parent (si sous-tâche):</label>
              <input
                type="text"
                name="Parent_Task_ID"
                value={taskData.Parent_Task_ID}
                onChange={onFormChange}
                placeholder="Ex: T001 (si c'est une sous-tâche)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4"> 
            <button
              type="submit"
              className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm" 
              disabled={loading}
            >
              {loading ? 'Envoi...' : (editingTask ? 'Mettre à jour' : 'Ajouter')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
              disabled={loading}
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
