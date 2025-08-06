import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const TaskConfirmModal = ({ task, onClose, onConfirm, loading, currentUser, isSubTaskAvailable }) => {
  const [participantName, setParticipantName] = useState(currentUser?.displayName || currentUser?.email || '');
  const [selectedSubTasks, setSelectedSubTasks] = useState([]);

  useEffect(() => {
    setParticipantName(currentUser?.displayName || currentUser?.email || '');
  }, [currentUser]);

  useEffect(() => {
    setSelectedSubTasks([]);
  }, [task]);

  const handleSubTaskChange = useCallback(
    (sub) => {
      if (isSubTaskAvailable && !isSubTaskAvailable(sub)) {
        toast.info(`La tâche "${sub.Nom_Tache}" est déjà complétée.`);
        return;
      }
      setSelectedSubTasks((prev) =>
        prev.some((t) => t.ID_Tache === sub.ID_Tache)
          ? prev.filter((t) => t.ID_Tache !== sub.ID_Tache)
          : [...prev, sub]
      );
    },
    [isSubTaskAvailable]
  );

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gradient-to-tr from-purple-400 via-pink-400 to-yellow-400 rounded-3xl w-full max-w-md p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] animate-popin relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 opacity-20 blur-3xl animate-tilt pointer-events-none rounded-3xl"></div>

        <header className="relative z-10 mb-6 text-center select-none">
          <h3 className="text-3xl font-extrabold text-white drop-shadow-lg mb-1 tracking-wide">
            🚀 Confirmer la Tâche
          </h3>
          <p className="text-sm text-white/90 max-w-xs mx-auto font-semibold drop-shadow-sm">
            Validez une tâche simple ou choisissez des sous-tâches.
          </p>
        </header>

        {task.isGroupTask && task.SousTaches?.length > 0 ? (
          <div className="relative z-10 mb-6 max-h-52 overflow-y-auto pr-3 space-y-2">
            <h4 className="text-xl font-bold text-white mb-3 text-center drop-shadow-md truncate">
              {task.Nom_Tache}
            </h4>
            {task.SousTaches.map((sub) => {
              const available = isSubTaskAvailable?.(sub);
              const checked = selectedSubTasks.some((t) => t.ID_Tache === sub.ID_Tache);
              return (
                <label
                  key={sub.ID_Tache}
                  className={`flex items-center p-2 rounded-xl border-2 transition-shadow cursor-pointer
                    ${checked ? 'bg-white/25 border-white shadow-[inset_0_0_10px_3px_rgba(255,255,255,0.75)]' : 'bg-white/10 border-transparent hover:bg-white/30 hover:border-white'}
                    ${!available ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!available}
                    onChange={() => handleSubTaskChange(sub)}
                    className="h-5 w-5 text-pink-400 rounded shadow-lg focus:ring-2 focus:ring-pink-500 mr-3 cursor-pointer"
                  />
                  <span className="flex-1 text-white font-semibold drop-shadow-md truncate">
                    {sub.Nom_Tache}{' '}
                    <span className="font-extrabold text-yellow-300">({sub.Points} pts)</span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="relative z-10 mb-6 text-white text-center font-bold text-2xl drop-shadow-lg">
            {task.Nom_Tache} <span className="text-yellow-300">({task.Calculated_Points} pts)</span>
          </div>
        )}

        <div className="relative z-10 mb-6">
          <label
            htmlFor="participantName"
            className="block text-white font-semibold mb-2 tracking-wide select-none text-center"
          >
            Validé par
          </label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            disabled
            className="w-full p-3 rounded-xl bg-white/90 text-center text-primary font-bold shadow-lg cursor-not-allowed focus:outline-none"
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={loading || !currentUser || (task.isGroupTask && selectedSubTasks.length === 0)}
            className="flex-1 sm:flex-auto bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white py-3 rounded-full shadow-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {loading ? 'Soumission...' : 'Valider'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-auto bg-red-600 hover:bg-red-700 text-white py-3 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskConfirmModal;
