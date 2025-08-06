// src/utils/checkAndAssignBadges.js
import BADGES from './badges';
import { badgeRules } from './badgeRules';
import { updateUserBadges } from './updateUserBadges';

/**
 * Attribue automatiquement les badges nouvellement gagnés.
 * @param {object} user - L'utilisateur courant (contenant user.id et user.badges)
 * @param {array} realisations - Liste des réalisations du user (tâches complétées)
 * @param {array} tasks - Liste des tâches (avec détails)
 * @param {object} db - Instance Firestore
 * @param {function} showBadgePopup - Callback à appeler pour chaque badge gagné (popup animée)
 * @param {object} [extra] - (optionnel) infos supplémentaires (ex : feedbacks)
 */
export default async function checkAndAssignBadges(user, realisations, tasks, db, showBadgePopup, extra = {}) {
  const badgesOwned = user.badges ? Object.keys(user.badges) : [];
  const newBadges = [];

  for (const badge of BADGES) {
    // Teste la règle, en passant tout ce qui pourrait être utile à la fonction règle
    if (
      !badgesOwned.includes(badge.id) &&
      badgeRules[badge.id]?.(user, realisations, tasks, extra.feedbacks || [])
    ) {
      newBadges.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    // MAJ Firestore
    await updateUserBadges(user.id, newBadges, db);

    // Affiche la popup pour chaque badge obtenu
    newBadges.forEach(badgeId => {
      if (typeof showBadgePopup === 'function') {
        showBadgePopup(BADGES.find(b => b.id === badgeId));
      }
    });
  }
}
