import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { updateDoc, doc } from 'firebase/firestore';
import ConfettiOverlay from './ConfettiOverlay';
import { toast } from 'react-toastify';
import { calculateLevelAndXP } from './utils/levelUtils';
import ListAndInfoModal from './ListAndInfoModal';

const TaskHistoryModal = ({ taskId, allRealisations, allTasks, onClose }) => {
  const { currentUser, db, setCurrentUser } = useUser();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [checkedSubs, setCheckedSubs] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (Array.isArray(allTasks)) {
      setTasks(allTasks);
    }
  }, [allTasks]);

  const handleCheckboxChange = (index) => {
    setCheckedSubs(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const calculatePoints = (task) => {
    const subs = task.SousTaches || [];
    const checkedCount = Object.values(checkedSubs).filter(Boolean).length;
    if (subs.length === 0) return task.Points || 0;
    if (checkedCount === subs.length) return task.Points || 0;

    return subs.reduce((sum, sub, i) => {
      return checkedSubs[i] ? sum + (parseFloat(sub.points) || 0) : sum;
    }, 0);
  };

  const handleCompleteTask = async (task) => {
    const pointsToAdd = calculatePoints(task);
    const isUrgent = task.Urgence === 'Élevée';
    const bonusXP = isUrgent ? 5 : 0;
    const xpGained = pointsToAdd + bonusXP;

    const newXp = (currentUser.xp || 0) + xpGained;
    const previousLevel = currentUser.level || 1;
    const { level: newLevel } = calculateLevelAndXP(newXp);

    const updatedUser = {
      ...currentUser,
      weeklyPoints: (currentUser.weeklyPoints || 0) + pointsToAdd,
      totalCumulativePoints: (currentUser.totalCumulativePoints || 0) + pointsToAdd,
      xp: newXp,
      level: newLevel,
      lastReadTimestamp: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'users', currentUser.uid), {
      weeklyPoints: updatedUser.weeklyPoints,
      totalCumulativePoints: updatedUser.totalCumulativePoints,
      xp: updatedUser.xp,
      level: updatedUser.level,
      lastReadTimestamp: updatedUser.lastReadTimestamp,
    });

    setCurrentUser(updatedUser);
    setSelectedTask(null);
    setCheckedSubs({});

    if (newLevel > previousLevel) {
      toast.success(`🎉 Niveau ${newLevel} atteint !`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      toast.success(`+${pointsToAdd} pts & +${xpGained} XP`);
    }
  };

  return (
    <ListAndInfoModal
      title={!selectedTask ? 'Historique des tâches' : 'Confirmer la Tâche'}
      onClose={onClose}
      sizeClass="max-w-xl"
    >
      {!selectedTask ? (
        tasks.length === 0 ? (
          <p className="text-lightText">Aucune tâche trouvée.</p>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
            {tasks.map((task) => (
              <li key={task.id} className="bg-background rounded-lg p-4 shadow flex justify-between items-center">
                <div className="text-left">
                  <p className="text-sm font-semibold">{task.Nom_Tache}</p>
                  <p className="text-xs text-gray-400">Points: {task.Points}</p>
                </div>
                <button
                  onClick={() => {
                    const sousTaches = task.SousTaches
                      ? Array.isArray(task.SousTaches)
                        ? task.SousTaches
                        : (() => {
                            try {
                              return JSON.parse(task.SousTaches);
                            } catch {
                              return [];
                            }
                          })()
                      : [];

                    setSelectedTask({ ...task, SousTaches: sousTaches });
                    setCheckedSubs({});
                  }}
                  className="bg-primary hover:bg-secondary text-white font-semibold py-1 px-4 rounded-full text-sm"
                >
                  Valider
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div>
          <p className="mb-2">
            Tâche : <strong>{selectedTask.Nom_Tache}</strong>
          </p>

          {selectedTask.SousTaches?.length > 0 ? (
            <div className="text-left max-h-48 overflow-y-auto border p-3 rounded-md bg-muted mb-4">
              <p className="font-semibold text-sm mb-2">Coche les sous-tâches réalisées :</p>
              {selectedTask.SousTaches.map((sub, i) => (
                <label key={i} className="flex items-center gap-2 text-sm mb-1">
                  <input
                    type="checkbox"
                    checked={!!checkedSubs[i]}
                    onChange={() => handleCheckboxChange(i)}
                  />
                  {sub.nom} ({sub.points} pts)
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mb-4">Aucune sous-tâche à sélectionner.</p>
          )}

          <p className="text-sm mb-4">
            Total à gagner : <span className="font-bold">{calculatePoints(selectedTask)} points</span>
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleCompleteTask(selectedTask)}
              className="bg-success hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow text-sm"
            >
              Valider
            </button>
            <button
              onClick={() => setSelectedTask(null)}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full shadow text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {showConfetti && <ConfettiOverlay />}
    </ListAndInfoModal>
  );
};

export default TaskHistoryModal;
