import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const TaskHistoryModal = ({ taskId, allRealisations, allTasks, onClose }) => {
  // Trouver la tâche spécifique par son ID_Tache
  const task = allTasks.find(t => t.ID_Tache === taskId);
  const taskName = task ? task.Nom_Tache : 'Tâche inconnue';

  // Filtrer les réalisations pour cette tâche et les trier par date décroissante
  const taskRealisations = allRealisations
    .filter(real => real.taskId === taskId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <ListAndInfoModal title={`Historique de la Tâche: ${taskName}`} onClose={onClose} sizeClass="max-w-md sm:max-w-lg">
      {taskRealisations.length === 0 ? (
        <p className="text-center text-lightText text-md mt-4">Aucune réalisation enregistrée pour cette tâche.</p>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
          {taskRealisations.map((real, index) => (
            <div
              key={real.id || index} // Utiliser real.id si disponible, sinon l'index comme fallback
              className="bg-white rounded-lg p-3 shadow-sm border border-neutralBg/50 flex flex-col sm:flex-row items-start sm:items-center justify-between"
            >
              <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                <p className="font-semibold text-text text-md">{real.nomParticipant}</p>
                <p className="text-lightText text-sm">
                  Points: {real.pointsGagnes}
                </p>
                <p className="text-lightText text-xs">
                  Date: {new Date(real.timestamp).toLocaleDateString('fr-FR')} à {new Date(real.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {/* Vous pouvez ajouter des actions ici si nécessaire, par exemple "Voir le profil" */}
            </div>
          ))}
        </div>
      )}
    </ListAndInfoModal>
  );
};

export default TaskHistoryModal;
