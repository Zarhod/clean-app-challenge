import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import ConfettiOverlay from './ConfettiOverlay';
import { toast } from 'react-toastify';
import { calculateLevelAndXP } from './utils/levelUtils';

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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 shadow-xl w-full max-w-xl text-center relative">
        <h2 className="text-2xl font-bold text-primary mb-4">Historique des tâches</h2>

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
                      setSelectedTask(task);
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
            <h3 className="text-xl font-semibold mb-3">Confirmer la Tâche</h3>
            <p className="mb-2">
              Tâche : <strong>{selectedTask.Nom_Tache}</strong>
            </p>

            {selectedTask.SousTaches?.length > 0 && (
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

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      {showConfetti && <ConfettiOverlay />}
    </div>
  );
};

export default TaskHistoryModal;