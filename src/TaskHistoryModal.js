// src/TaskHistoryModal.js
import React, { useState, useEffect } from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Assurez-vous que le chemin est correct

function TaskHistoryModal({ taskId, allRealisations, allTasks, onClose }) {
  const [taskDetails, setTaskDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Trouver les détails de la tâche à partir de allTasks
    const foundTask = allTasks.find(task => String(task.ID_Tache) === String(taskId));
    setTaskDetails(foundTask);

    // Filtrer l'historique des réalisations pour cette tâche
    const filteredHistory = allRealisations
      .filter(real => String(real.taskId) === String(taskId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Trier par date décroissante
    
    setHistory(filteredHistory);
    setLoading(false);
  }, [taskId, allRealisations, allTasks]);

  if (loading) {
    return (
      <ListAndInfoModal title="Historique de la Tâche" onClose={onClose}>
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="ml-3 text-lightText">Chargement de l'historique...</p>
        </div>
      </ListAndInfoModal>
    );
  }

  return (
    <ListAndInfoModal title={`Historique de la Tâche: ${taskDetails?.Nom_Tache || 'Inconnu'}`} onClose={onClose} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
      <div className="mb-4 text-center">
        <p className="text-lg font-semibold text-text">ID Tâche: <span className="text-primary">{taskId}</span></p>
        {taskDetails && (
          <p className="text-md text-lightText">Points: {taskDetails.Points} | Fréquence: {taskDetails.Frequence} | Catégorie: {taskDetails.Categorie}</p>
        )}
      </div>

      <h3 className="text-xl font-bold text-secondary mb-3 text-center">Réalisations Passées</h3>
      {history.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {history.map((real, index) => (
            <div key={real.id || index} className="bg-white rounded-lg p-3 shadow-sm border border-neutralBg/50">
              <p className="font-bold text-text text-base">{real.nomParticipant}</p>
              <p className="text-sm text-lightText">
                Le {new Date(real.timestamp).toLocaleDateString('fr-FR')} à {new Date(real.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-primary">{real.pointsGagnes} points</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-lightText text-lg">Aucune réalisation trouvée pour cette tâche.</p>
      )}
    </ListAndInfoModal>
  );
}

export default TaskHistoryModal;
