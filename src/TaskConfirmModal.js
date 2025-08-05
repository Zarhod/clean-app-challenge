import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * TaskConfirmModal
 */
const TaskConfirmModal = ({ task, onClose, onConfirm, loading, currentUser, isSubTaskAvailable }) => {
  const [participantName, setParticipantName] = useState(currentUser?.displayName || currentUser?.email || '');
  const [selectedSubTasks, setSelectedSubTasks] = useState([]);

  useEffect(() => {
    setParticipantName(currentUser?.displayName || currentUser?.email || '');
  }, [currentUser]);

  useEffect(() => {
    setSelectedSubTasks([]);
  }, [task]);

  const handleSubTaskChange = useCallback((sub) => {
    if (isSubTaskAvailable && !isSubTaskAvailable(sub)) {
      toast.info(`La tâche "${sub.Nom_Tache}" est déjà complétée.`);
      return;
    }
    setSelectedSubTasks(prev => 
      prev.some(t => t.ID_Tache === sub.ID_Tache)
        ? prev.filter(t => t.ID_Tache !== sub.ID_Tache)
        : [...prev, sub]
    );
  }, [isSubTaskAvailable]);

  const handleConfirm = () => {
    if (task.isGroupTask) {
      if (selectedSubTasks.length === 0) {
        toast.warn('Sélectionnez au moins une sous-tâche.');
        return;
      }
      const totalPoints = selectedSubTasks.reduce((sum, s) => sum + parseFloat(s.Points || 0), 0);
      onConfirm({ selectedSubs: selectedSubTasks, points: totalPoints });
    } else {
      onConfirm({ selectedSubs: [], points: parseFloat(task.Calculated_Points) || 0 });
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-fade-in-scale">
        <header className="mb-4">
          <h3 className="text-2xl font-bold text-primary">Confirmer la Tâche</h3>
          <p className="text-sm text-gray-500">Validez une tâche simple ou choisissez des sous-tâches.</p>
        </header>

        {task.isGroupTask && task.SousTaches?.length > 0 ? (
          <div className="mb-6">
            <div className="text-left text-gray-700 mb-3">
              <strong>{task.Nom_Tache}</strong>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {task.SousTaches.map(sub => {
                const available = isSubTaskAvailable?.(sub);
                const checked = selectedSubTasks.some(t => t.ID_Tache === sub.ID_Tache);
                return (
                  <label
                    key={sub.ID_Tache}
                    className={`flex items-center p-3 rounded-lg border transition-shadow ${
                      checked ? 'bg-primary/10 border-primary shadow-inner' : 'bg-gray-50 hover:shadow'}
                      ${!available && 'opacity-60 cursor-not-allowed'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!available}
                      onChange={() => handleSubTaskChange(sub)}
                      className="h-5 w-5 text-primary rounded focus:ring-0 mr-3"
                    />
                    <span className="flex-1 text-gray-800 truncate">
                      {sub.Nom_Tache} <span className="font-semibold text-primary">({sub.Points} pts)</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 text-gray-800">
            <strong>Tâche:</strong> {task.Nom_Tache} <span className="font-semibold text-primary">({task.Calculated_Points} pts)</span>
          </div>
        )}

        <div className="mb-6 text-left">
          <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-1">
            Validé par
          </label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            disabled
            className="w-full p-2 border border-gray-300 rounded-lg text-gray-800 bg-gray-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading || (!currentUser) || (task.isGroupTask && selectedSubTasks.length === 0)}
            className="flex-1 sm:flex-auto bg-success text-white py-2 px-4 rounded-full shadow hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Soumission...' : 'Valider'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-auto bg-error text-white py-2 px-4 rounded-full shadow hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskConfirmModal;