import React, { useState } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-toastify';

const AdminTaskFormModal = ({ onClose }) => {
  const [taskData, setTaskData] = useState({
    ID_Tache: '',
    Nom_Tache: '',
    Description: '',
    Points: '',
    Frequence: '',
    Urgence: '',
    Categorie: '',
    Sous_Taches_IDs: '',
    Parent_Task_ID: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Nettoyage des valeurs invalides
    const cleanTask = {
      ...taskData,
      Points: parseInt(taskData.Points, 10) || 0,
      Sous_Taches_IDs: taskData.Sous_Taches_IDs?.trim()
        ? taskData.Sous_Taches_IDs.split(',').map((id) => id.trim())
        : null,
      Parent_Task_ID: taskData.Parent_Task_ID?.trim() || null,
    };

    const { error } = await supabase.from('tasks').insert(cleanTask);

    if (error) {
      console.error('Erreur lors de la création de la tâche :', error.message);
      toast.error('Erreur lors de la création de la tâche.');
    } else {
      toast.success('✅ Tâche créée avec succès.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">Créer une tâche</h2>

        {[
          ['ID_Tache', 'ID de la tâche'],
          ['Nom_Tache', 'Nom'],
          ['Description', 'Description'],
          ['Points', 'Points'],
          ['Frequence', 'Fréquence'],
          ['Urgence', 'Urgence'],
          ['Categorie', 'Catégorie'],
          ['Sous_Taches_IDs', 'IDs sous-tâches (séparés par des virgules)'],
          ['Parent_Task_ID', "ID tâche parente"],
        ].map(([name, label]) => (
          <div className="mb-3" key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              type="text"
              name={name}
              value={taskData[name]}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ))}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Créer
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTaskFormModal;
