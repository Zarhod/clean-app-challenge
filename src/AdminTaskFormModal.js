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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-2xl text-center animate-fade-in-scale border border-primary/20">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {editingTask ? 'Modifier la tâche' : 'Ajouter une nouvelle tâche'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">ID Tâche (Unique):</label>
              <input
                type="text"
                name="ID_Tache"
                value={taskData.ID_Tache}
                onChange={onFormChange}
                placeholder="Ex: T001, ST001"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={!!editingTask} // Disable ID editing for existing tasks
                required
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Nom Tâche:</label>
              <input
                type="text"
                name="Nom_Tache"
                value={taskData.Nom_Tache}
                onChange={onFormChange}
                placeholder="Ex: Nettoyer la cuisine"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-text text-sm font-medium mb-1 text-left">Description:</label>
              <textarea
                name="Description"
                value={taskData.Description}
                onChange={onFormChange}
                placeholder="Description détaillée de la tâche"
                className="w-full p-2.5 border border-gray-300 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              ></textarea>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Points:</label>
              <input
                type="number"
                name="Points"
                value={taskData.Points}
                onChange={onFormChange}
                placeholder="Ex: 10"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]" // Added min-h
                required
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Fréquence:</label>
              <select
                name="Frequence"
                value={taskData.Frequence}
                onChange={onFormChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]" // Added min-h
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
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]" // Added min-h
              >
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">Catégorie:</label>
              <select
                name="Categorie"
                value={taskData.Categorie}
                onChange={onFormChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[44px]" // Added min-h
              >
                <option value="Tous">Tous</option>
                <option value="Salle">Salle</option>
                <option value="Cuisine">Cuisine</option>
              </select>
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-1 text-left">IDs Sous-Tâches (csv):</label>
              <input
                type="text"
                name="Sous_Taches_IDs"
                value={taskData.Sous_Taches_IDs}
                onChange={onFormChange}
                placeholder="Ex: ST001,ST002 (pour les tâches de groupe)"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="submit"
              className="bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-6 rounded-full shadow-lg transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              disabled={loading}
            >
              {loading ? 'Envoi...' : (editingTask ? 'Mettre à jour' : 'Ajouter')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-full shadow-lg transition duration-300 text-sm"
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
