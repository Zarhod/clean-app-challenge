import React, { useState, useEffect } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, Fingerprint, ClipboardList } from 'lucide-react';

function AdminTaskFormModal({ taskData, onFormChange, onClose, loading, editingTask }) {
  const { db } = useUser();
  const [isComplexTask, setIsComplexTask] = useState(taskData?.isComplexTask || (taskData?.SousTaches?.length > 0));
  const [sousTaches, setSousTaches] = useState(taskData?.SousTaches || [{ nom: '', points: '' }]);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
  if (isComplexTask) {
      const total = sousTaches.reduce((acc, t) => acc + (parseFloat(t.points) || 0), 0);
      onFormChange({ target: { name: 'Points', value: total } });
      onFormChange({ target: { name: 'SousTaches', value: sousTaches } });
    }
  }, [sousTaches, isComplexTask, onFormChange]);

  const handleSousTacheChange = (index, field, value) => {
    const updated = [...sousTaches];
    updated[index][field] = field === 'points' ? Number(value) : value;
    setSousTaches(updated);
  };

  const addSousTache = () => {
    setSousTaches([...sousTaches, { nom: '', points: '' }]);
  };

  const removeSousTache = (index) => {
    const updated = sousTaches.filter((_, i) => i !== index);
    setSousTaches(updated);
  };

  const handleModeChange = (complexe) => {
    setIsComplexTask(complexe);
    if (!complexe) {
      onFormChange({ target: { name: 'SousTaches', value: [] } });
    }
  };

  const handleSubmit = async () => {
    if (!taskData.ID_Tache.trim() || !taskData.Nom_Tache.trim()) {
      toast.error("ID et Nom de la tâche sont requis.");
      return;
    }

    if (!isComplexTask && (taskData.Points === '' || isNaN(parseFloat(taskData.Points)))) {
      toast.error("Les points doivent être un nombre valide pour une tâche classique.");
      return;
    }

    try {
      const batch = writeBatch(db);
      let sousTachesIDs = [];

      if (isComplexTask) {
        for (let i = 0; i < sousTaches.length; i++) {
          const sous = sousTaches[i];
          if (!sous.nom || isNaN(parseFloat(sous.points))) continue;

          const subId = `ST_${taskData.ID_Tache}_${i}`;
          sousTachesIDs.push(subId);

          const subRef = doc(db, 'tasks', subId);
          batch.set(subRef, {
            ID_Tache: subId,
            Nom_Tache: sous.nom,
            Points: parseFloat(sous.points),
            Frequence: taskData.Frequence,
            Urgence: taskData.Urgence,
            Categorie: taskData.Categorie,
            Parent_Task_ID: taskData.ID_Tache,
          });
        }
      }

      const mainRef = doc(db, 'tasks', taskData.ID_Tache);
      batch.set(mainRef, {
        ...taskData,
        Points: isComplexTask
          ? sousTaches.reduce((acc, t) => acc + (parseFloat(t.points) || 0), 0)
          : parseFloat(taskData.Points),
        Sous_Taches_IDs: isComplexTask ? sousTachesIDs.join(',') : '',
        Parent_Task_ID: '',
      });

      await batch.commit();
      toast.success("Tâche créée avec succès.");
      handleCloseWithFade();
    } catch (err) {
      toast.error(`Erreur lors de la création : ${err.message}`);
    }
  };

  const handleCloseWithFade = () => {
    setFadeOut(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center px-2 sm:px-4 ${
        fadeOut ? 'animate-modal-out' : 'animate-modal-in'
      }`}
    >
      <div className="bg-white rounded-3xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col shadow-[0_15px_35px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-center text-2xl font-extrabold text-gray-800 mb-3 tracking-tight">
            {editingTask ? 'Modifier une tâche' : 'Nouvelle tâche'}
          </h2>
          <div className="flex items-center bg-gray-100 rounded-full p-1 relative">
            <button
              onClick={() => handleModeChange(false)}
              className={`flex-1 z-10 py-2 text-sm font-medium rounded-full transition-all duration-300 ${!isComplexTask ? 'text-white' : 'text-gray-600'}`}
            >
              Tâche classique
            </button>
            <button
              onClick={() => handleModeChange(true)}
              className={`flex-1 z-10 py-2 text-sm font-medium rounded-full transition-all duration-300 ${isComplexTask ? 'text-white' : 'text-gray-600'}`}
            >
              Tâche complexe
            </button>
            <div className={`absolute top-1 bottom-1 left-1 w-[48%] rounded-full bg-blue-500 transition-transform duration-300 ${isComplexTask ? 'translate-x-full' : ''}`}></div>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {[{ name: 'ID_Tache', icon: <Fingerprint /> }, { name: 'Nom_Tache', icon: <ClipboardList /> }].map(({ name, icon }, i) => (
            <div key={i} className="relative">
              <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
                {icon}
              </div>
              <input
                type="text"
                name={name}
                value={taskData[name] || ''}
                onChange={onFormChange}
                placeholder={name === 'ID_Tache' ? 'ID tâche' : 'Nom de la tâche'}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          {["Frequence", "Urgence", "Categorie"].map((field, i) => (
            <div key={i}>
              <label className="block text-xs font-semibold mb-1 uppercase text-gray-600">{field}</label>
              <select
                name={field}
                value={taskData[field] || ''}
                onChange={onFormChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {(field === 'Frequence'
                  ? ['Hebdomadaire', 'Quotidien', 'Ponctuel']
                  : field === 'Urgence'
                  ? ['Faible', 'Moyenne', 'Haute']
                  : ['Tous', 'Cuisine', 'Salle']
                ).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}

          {!isComplexTask && (
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-gray-600">Points</label>
              <input
                type="number"
                name="Points"
                value={taskData.Points || ''}
                onChange={onFormChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {isComplexTask && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Sous-tâches</label>
              {sousTaches.map((sousTache, i) => (
                <div key={i} className="flex gap-2 mb-3 bg-white rounded-2xl p-3 shadow-md border border-gray-200 items-center">
                  <button
                    onClick={() => removeSousTache(i)}
                    className="text-blue-500 hover:text-blue-700 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={sousTache.nom}
                    onChange={(e) => handleSousTacheChange(i, 'nom', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-inner"
                  />
                  <input
                    type="number"
                    placeholder="Pts"
                    value={sousTache.points}
                    onChange={(e) => handleSousTacheChange(i, 'points', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-inner"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSousTache}
                className="text-sm text-blue-600 mt-2 flex items-center gap-1 font-medium"
              >
                <PlusCircle size={16} /> Ajouter une sous-tâche
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3 bg-white">
          <button
            onClick={handleCloseWithFade}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full text-sm font-semibold shadow-md"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-full text-sm font-semibold shadow-md"
          >
            {loading ? 'Sauvegarde...' : editingTask ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTaskFormModal;
