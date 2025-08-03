import React, { useState } from 'react';

function AdminTaskFormModal({ taskData, onFormChange, onSubmit, onClose, loading, editingTask }) {
  const [isComplexTask, setIsComplexTask] = useState(taskData?.SousTaches?.length > 0);
  const [sousTaches, setSousTaches] = useState(taskData?.SousTaches || [{ nom: '', points: '' }]);

  const handleSousTacheChange = (index, field, value) => {
    const updated = [...sousTaches];
    updated[index][field] = field === 'points' ? Number(value) : value;
    setSousTaches(updated);
    updateTotalPoints(updated);
  };

  const addSousTache = () => {
    setSousTaches([...sousTaches, { nom: '', points: '' }]);
  };

  const updateTotalPoints = (sousTachesList) => {
    const total = sousTachesList.reduce((acc, t) => acc + (parseFloat(t.points) || 0), 0);
    onFormChange({ target: { name: 'Points', value: total } });
  };

  const handleSubmit = () => {
    if (isComplexTask) {
      const total = sousTaches.reduce((acc, t) => acc + (parseFloat(t.points) || 0), 0);
      onFormChange({ target: { name: 'Points', value: total } });
      onFormChange({ target: { name: 'SousTaches', value: sousTaches } });
    }
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md text-left animate-fade-in-scale max-h-[90vh] flex flex-col">
        {/* Header Sticky */}
        <div className="sticky top-0 bg-white z-10 pt-6 px-6">
          <h3 className="text-xl font-bold text-primary mb-4">
            {editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
          </h3>

          <div className="flex justify-center gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-full border text-sm font-semibold ${!isComplexTask ? 'bg-primary text-white' : 'bg-white text-text border-primary'}`}
              onClick={() => setIsComplexTask(false)}
            >
              Tâche Classique
            </button>
            <button
              className={`px-3 py-1 rounded-full border text-sm font-semibold ${isComplexTask ? 'bg-primary text-white' : 'bg-white text-text border-primary'}`}
              onClick={() => setIsComplexTask(true)}
            >
              Tâche Complexe
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 pb-4 space-y-4">
          <div>
            <label className="block font-medium mb-1 text-sm">ID de la tâche:</label>
            <input
              type="text"
              name="ID_Tache"
              value={taskData.ID_Tache || ''}
              onChange={onFormChange}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Nom de la tâche:</label>
            <input
              type="text"
              name="Nom_Tache"
              value={taskData.Nom_Tache || ''}
              onChange={onFormChange}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Fréquence:</label>
            <select
              name="Frequence"
              value={taskData.Frequence || ''}
              onChange={onFormChange}
              className="w-full p-2 border rounded text-sm bg-white"
            >
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Quotidien">Quotidien</option>
              <option value="Ponctuel">Ponctuel</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Urgence:</label>
            <select
              name="Urgence"
              value={taskData.Urgence || ''}
              onChange={onFormChange}
              className="w-full p-2 border rounded text-sm bg-white"
            >
              <option value="Faible">Faible</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Haute">Haute</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Catégorie:</label>
            <select
              name="Categorie"
              value={taskData.Categorie || ''}
              onChange={onFormChange}
              className="w-full p-2 border rounded text-sm bg-white"
            >
              <option value="Tous">Tous</option>
              <option value="Cuisine">Cuisine</option>
              <option value="Salle">Salle</option>
            </select>
          </div>
          {!isComplexTask && (
            <div>
              <label className="block font-medium mb-1 text-sm">Points:</label>
              <input
                type="number"
                name="Points"
                value={taskData.Points || ''}
                onChange={onFormChange}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          )}
          {isComplexTask && (
            <div>
              <label className="block font-medium mb-1 text-sm">Sous-tâches:</label>
              {sousTaches.map((sousTache, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={sousTache.nom}
                    onChange={(e) => handleSousTacheChange(index, 'nom', e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Pts"
                    value={sousTache.points}
                    onChange={(e) => handleSousTacheChange(index, 'points', e.target.value)}
                    className="w-20 p-2 border rounded text-sm"
                  />
                </div>
              ))}
              <button onClick={addSousTache} className="text-sm text-primary underline mt-1">+ Ajouter une sous-tâche</button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 mt-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full text-sm"
            >
              {loading ? 'Soumission...' : (editingTask ? 'Modifier' : 'Ajouter')}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminTaskFormModal;
