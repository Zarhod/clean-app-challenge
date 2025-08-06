// src/utils/updateUserBadges.js
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Ajoute un ou plusieurs badges enrichis à l'utilisateur sur Firestore.
 * @param {string} userId - l'ID du user Firestore
 * @param {array} newBadgeIds - tableau d'ids de badges à ajouter
 * @param {object} db - l'instance Firestore
 */
export async function updateUserBadges(userId, newBadgeIds, db) {
  if (!userId || !db || !newBadgeIds?.length) return;
  const userRef = doc(db, 'users', userId);

  // Pour chaque nouveau badge, on set "badges.badgeId": {unlocked: true, unlockedAt: ...}
  const now = new Date().toISOString();
  const badgesUpdate = {};
  newBadgeIds.forEach(badgeId => {
    badgesUpdate[`badges.${badgeId}`] = {
      unlocked: true,
      unlockedAt: now
    };
  });

  await updateDoc(userRef, badgesUpdate);
}
