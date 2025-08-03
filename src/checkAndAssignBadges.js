const checkAndAssignBadges = async (user, db) => {
  if (!badgeRules || badgeRules.length === 0) return;

  const userRef = doc(db, 'users', user.uid);
  const userBadges = user.badges || [];
  console.log("✅ Badges utilisateur actuels :", userBadges);
  const newBadges = [];

  for (const rule of badgeRules) {
    const alreadyHasBadge = userBadges.includes(rule.id);
    const conditionMet = rule.condition(user);

    if (!alreadyHasBadge && conditionMet) {
      newBadges.push(rule.id);
    }
  }

  if (newBadges.length > 0) {
    const updatedBadges = [...userBadges, ...newBadges];
    await updateDoc(userRef, { badges: updatedBadges });

    setCurrentUser(prev => ({
      ...prev,
      badges: updatedBadges,
    }));

    console.log('🎖️ Nouveaux badges attribués :', newBadges);
    toast.success(`🌟 ${newBadges.length} badge(s) débloqué(s) !`);
  }
};
