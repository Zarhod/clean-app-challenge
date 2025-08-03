// src/TaskHistoryModal.js
import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import ConfettiOverlay from './ConfettiOverlay';
import { toast } from 'react-toastify';
import { calculateLevelAndXP } from './utils/levelUtils';

const TaskHistoryModal = ({ onClose }) => {
  const { currentUser, db, setCurrentUser } = useUser();
  const [tasks, setTasks] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!db || !currentUser) return;
      try {
        const tasksRef = collection(db, 'tasks');
        const snapshot = await getDocs(tasksRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(data);
      } catch (err) {
        console.error("Erreur Firestore tasks :", err.message);
      }
    };

    fetchTasks();
  }, [db, currentUser]);

  const handleCompleteTask = async (task) => {
    if (!currentUser || !db) return;

    const basePoints = task.Points || 1;
    const isUrgent = task.Urgence === 'Élevée';
    const bonusXP = isUrgent ? 5 : 0;

    const pointsToAdd = basePoints;
    const xpGained = basePoints + bonusXP;
    const newXp = (currentUser.xp || 0) + xpGained;
    const previousLevel = currentUser.level || 1;

    const { level: newLevel } = calculateLevelAndXP(newXp);

    const stats = currentUser.stats || {};
    const updatedStats = {
      ...stats,
      urgentTasksCompleted: isUrgent
        ? (stats.urgentTasksCompleted || 0) + 1
        : (stats.urgentTasksCompleted || 0),
      maxXpInOneTask: Math.max(stats.maxXpInOneTask || 0, xpGained),
    };

    const updatedUser = {
      ...currentUser,
      weeklyPoints: (currentUser.weeklyPoints || 0) + pointsToAdd,
      totalCumulativePoints: (currentUser.totalCumulativePoints || 0) + pointsToAdd,
      xp: newXp,
      level: newLevel,
      lastReadTimestamp: new Date().toISOString(),
      stats: updatedStats,
    };

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      weeklyPoints: updatedUser.weeklyPoints,
      totalCumulativePoints: updatedUser.totalCumulativePoints,
      xp: updatedUser.xp,
      level: updatedUser.level,
      lastReadTimestamp: updatedUser.lastReadTimestamp,
      stats: updatedUser.stats,
    });

    setCurrentUser(updatedUser);

    if (newLevel > previousLevel) {
      toast.success(`🎉 Bravo ! Vous avez atteint le niveau ${newLevel} !`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      toast.success(`+${pointsToAdd} points & +${xpGained} XP ajoutés !`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-xl p-6 shadow-lg w-full max-w-xl text-center relative">
        <h2 className="text-2xl font-bold text-primary mb-4">Historique des tâches</h2>
        {tasks.length === 0 ? (
          <p className="text-lightText">Aucune tâche trouvée.</p>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
            {tasks.map((task) => (
              <li key={task.id} className="bg-background rounded-lg p-4 shadow flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-left">{task.Nom_Tache}</p>
                  <p className="text-xs text-gray-400 text-left">Points: {task.Points}</p>
                </div>
                <button
                  onClick={() => handleCompleteTask(task)}
                  className="bg-primary hover:bg-secondary text-white font-semibold py-1 px-4 rounded-full text-sm transition"
                >
                  Valider
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>
      {showConfetti && <ConfettiOverlay />}
    </div>
  );
};

export default TaskHistoryModal;
