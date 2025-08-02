import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export const checkAndAwardBadges = async (user, db) => {
  if (!user || !user.uid || !db) return;

  const userRef = doc(db, 'users', user.uid);
  const userBadges = user.badges || [];
  const badgesRef = collection(db, 'badges');
  const snapshot = await getDocs(badgesRef);
  const allBadges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const newBadges = [];

  for (const badge of allBadges) {
    const condition = badge.condition;
    const alreadyHasBadge = userBadges.some(b => b.name === badge.name);
    if (alreadyHasBadge || !condition) continue;

    if (condition === 'level-2' && user.level >= 2) newBadges.push(badge);
    if (condition === 'first-task' && (user.totalCumulativePoints || 0) >= 1) newBadges.push(badge);
    if (condition === 'weekly-50' && (user.weeklyPoints || 0) >= 50) newBadges.push(badge);
    if (condition === 'urgent-task' && (user.urgentTasksCompleted || 0) >= 1) newBadges.push(badge);
  }

  if (newBadges.length > 0) {
    const updatedBadges = [...userBadges, ...newBadges];
    await updateDoc(userRef, { badges: updatedBadges });
  }
};
