// src/utils/badgeRules.js

// ====== Fonctions utilitaires ======
function getUniqueDays(realisations) {
  return new Set(realisations.map(r => new Date(r.date).toDateString()));
}

function countCategory(realisations, tasks, category) {
  return realisations.filter(r => {
    const t = tasks.find(t => t.ID_Tache === r.taskId);
    return t && t.Categorie === category;
  }).length;
}

function hasStreak(realisations, daysRequired) {
  const days = Array.from(getUniqueDays(realisations))
    .map(d => new Date(d).setHours(0,0,0,0))
    .sort((a, b) => a - b);
  if (days.length === 0) return false;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === 24 * 3600 * 1000) streak++;
    else streak = 1;
    if (streak >= daysRequired) return true;
  }
  return false;
}

function countTasksInPeriod(realisations, periodDays) {
  const dateList = realisations.map(r => new Date(r.date).setHours(0,0,0,0));
  dateList.sort((a, b) => a - b);
  let maxCount = 0;
  for (let i = 0; i < dateList.length; i++) {
    let count = 1;
    const start = dateList[i];
    for (let j = i + 1; j < dateList.length; j++) {
      if (dateList[j] - start < periodDays * 24 * 3600 * 1000) count++;
    }
    if (count > maxCount) maxCount = count;
  }
  return maxCount;
}

// ====== TABLEAU DE 50 BADGES ======
const badgeRulesList = [
  // DÉBUTANT / PROGRESSION
  { id: "first_task", description: "Valide ta première tâche", rule: (user, realisations) => realisations.length >= 1 },
  { id: "five_tasks", description: "Valide 5 tâches", rule: (user, realisations) => realisations.length >= 5 },
  { id: "ten_tasks", description: "Valide 10 tâches", rule: (user, realisations) => realisations.length >= 10 },
  { id: "twentyfive_tasks", description: "Valide 25 tâches", rule: (user, realisations) => realisations.length >= 25 },
  { id: "fifty_tasks", description: "Valide 50 tâches", rule: (user, realisations) => realisations.length >= 50 },
  { id: "hundred_tasks", description: "Valide 100 tâches", rule: (user, realisations) => realisations.length >= 100 },
  { id: "first_group", description: "Valide ta première tâche complexe/groupe", rule: (user, realisations, tasks) => realisations.some(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.isGroupTask; }) },
  { id: "group_hero", description: "Valide 10 tâches complexes/groupe", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.isGroupTask; }).length >= 10 },

  // SÉRIES / RÉGULARITÉ
  { id: "streak_3", description: "3 jours de suite avec au moins une tâche validée", rule: (user, realisations) => hasStreak(realisations, 3) },
  { id: "streak_7", description: "7 jours de suite avec au moins une tâche validée", rule: (user, realisations) => hasStreak(realisations, 7) },
  { id: "streak_14", description: "14 jours de suite avec au moins une tâche validée", rule: (user, realisations) => hasStreak(realisations, 14) },
  { id: "streak_30", description: "30 jours de suite avec au moins une tâche validée", rule: (user, realisations) => hasStreak(realisations, 30) },
  { id: "comeback_hero", description: "Après une pause de 7j, reviens valider une tâche", rule: (user, realisations) => { if (realisations.length < 2) return false; const sorted = realisations.slice().sort((a, b) => new Date(a.date) - new Date(b.date)); for (let i = 1; i < sorted.length; i++) { const prev = new Date(sorted[i-1].date); const curr = new Date(sorted[i].date); if ((curr - prev) >= 7 * 24 * 3600 * 1000) return true; } return false; } },

  // CATÉGORIES
  { id: "kitchen_king", description: "Valide 10 tâches Cuisine", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Cuisine") >= 10 },
  { id: "bathroom_boss", description: "Valide 10 tâches Salle de bain", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Salle de bain") >= 10 },
  { id: "bedroom_boss", description: "Valide 10 tâches Chambre", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Chambre") >= 10 },
  { id: "livingroom_boss", description: "Valide 10 tâches Salon", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Salon") >= 10 },
  { id: "laundry_boss", description: "Valide 10 tâches Linge", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Linge") >= 10 },
  { id: "animal_friend", description: "Valide 10 tâches Animaux", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Animaux") >= 10 },
  { id: "garden_king", description: "Valide 10 tâches Extérieur", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Extérieur") >= 10 },
  { id: "all_categories", description: "Valide au moins 1 tâche dans chaque catégorie", rule: (user, realisations, tasks) => { const cats = new Set(); realisations.forEach(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (t && t.Categorie) cats.add(t.Categorie); }); const allCats = ["Cuisine", "Salle de bain", "Chambre", "Salon", "Linge", "Animaux", "Extérieur"]; return allCats.every(cat => cats.has(cat)); } },

  // SOUS-TÂCHES
  { id: "three_sous", description: "Valide 3 sous-tâches différentes", rule: (user, realisations, tasks) => tasks.some(t => t.Sous_Taches_IDs && t.Sous_Taches_IDs.split(',').filter(id => realisations.some(r => r.taskId === id)).length >= 3) },
  { id: "sous_taches_boss", description: "Valide toutes les sous-tâches d'une tâche complexe", rule: (user, realisations, tasks) => tasks.some(t => t.Sous_Taches_IDs && t.Sous_Taches_IDs.split(',').every(id => realisations.some(r => r.taskId === id))) },
  { id: "sous_10", description: "Valide 10 sous-tâches", rule: (user, realisations, tasks) => realisations.filter(r => r.taskId && r.taskId.startsWith('ST_')).length >= 10 },

  // VITESSE ET HORAIRE
  { id: "quick_clean", description: "Termine une tâche en moins de 10 minutes", rule: (user, realisations) => realisations.some(r => r.duration && r.duration < 10) },
  { id: "late_night", description: "Valide une tâche entre 23h et 6h", rule: (user, realisations) => realisations.some(r => { const h = new Date(r.date).getHours(); return h >= 23 || h < 6; }) },
  { id: "early_bird", description: "Valide une tâche avant 7h", rule: (user, realisations) => realisations.some(r => new Date(r.date).getHours() < 7) },
  { id: "sunday_worker", description: "Valide une tâche un dimanche", rule: (user, realisations) => realisations.some(r => new Date(r.date).getDay() === 0) },
  { id: "challenge_day", description: "Valide une tâche le 1er du mois", rule: (user, realisations) => realisations.some(r => new Date(r.date).getDate() === 1) },
  { id: "mega_day", description: "Valide 10 tâches le même jour", rule: (user, realisations) => { const dayCounts = {}; realisations.forEach(r => { const d = new Date(r.date).toDateString(); dayCounts[d] = (dayCounts[d] || 0) + 1; }); return Object.values(dayCounts).some(v => v >= 10); } },

  // DEADLINE & URGENCE
  { id: "urgent_finish", description: "Valide 5 tâches Urgence Haute", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Urgence === "Haute"; }).length >= 5 },
  { id: "slow_but_sure", description: "Valide une tâche plus de 5j après création", rule: (user, realisations, tasks) => realisations.some(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (!t) return false; const created = new Date(t.createdAt || t.Date_Creation || t.dateCreation); const done = new Date(r.date); return (done - created) > 5 * 24 * 3600 * 1000; }) },
  { id: "always_ready", description: "Valide 10 tâches avant deadline", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (!t || !t.deadline) return false; return new Date(r.date) < new Date(t.deadline); }).length >= 10 },
  { id: "never_late", description: "Valide 30 tâches avant deadline", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (!t || !t.deadline) return false; return new Date(r.date) < new Date(t.deadline); }).length >= 30 },
  { id: "late_finish", description: "Valide une tâche dans l'heure avant deadline", rule: (user, realisations, tasks) => realisations.some(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (!t || !t.deadline) return false; return (new Date(t.deadline) - new Date(r.date)) < 60*60*1000 && (new Date(t.deadline) - new Date(r.date)) > 0; }) },

  // ENGAGEMENT / PLANNING
  { id: "planner", description: "Planifie 5 tâches à l'avance", rule: (user, realisations, tasks) => tasks.filter(t => t.datePlanifiee && new Date(t.datePlanifiee) > new Date()).length >= 5 },
  { id: "full_sprint", description: "Valide 20 tâches en 7 jours glissants", rule: (user, realisations) => countTasksInPeriod(realisations, 7) >= 20 },
  { id: "fast_week", description: "7 tâches validées en 2 jours", rule: (user, realisations) => { if (realisations.length < 7) return false; const sorted = realisations.slice().sort((a, b) => new Date(a.date) - new Date(b.date)); for (let i = 0; i <= sorted.length - 7; i++) { const diff = new Date(sorted[i+6].date) - new Date(sorted[i].date); if (diff < 2*24*3600*1000) return true; } return false; } },
  { id: "streak_breaker", description: "2 séries de 3 jours séparées par une pause", rule: (user, realisations) => { const days = Array.from(getUniqueDays(realisations)).map(d => new Date(d).setHours(0,0,0,0)).sort((a, b) => a - b); let streak = 1, broken = false; for (let i = 1; i < days.length; i++) { if (days[i] - days[i - 1] === 24*3600*1000) streak++; else { if (streak >= 3) broken = true; streak = 1; } } return broken && streak >= 3; } },

  // GROUPE & AIDE
  { id: "duo_win", description: "Valide une tâche de groupe à 2", rule: (user, realisations, tasks) => realisations.some(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.isGroupTask && t.participants && t.participants.length === 2; }) },
  { id: "helper", description: "Aide une autre personne", rule: (user, realisations, tasks) => realisations.some(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Responsable && t.Responsable !== user.displayName; }) },
  { id: "mega_helper", description: "Aide 3 personnes différentes", rule: (user, realisations, tasks) => { const others = new Set(); realisations.forEach(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); if (t && t.Responsable && t.Responsable !== user.displayName) others.add(t.Responsable); }); return others.size >= 3; } },

  // INTERACTION & FEEDBACK
  { id: "feedback_giver", description: "Laisse un feedback ou avis", rule: (user, realisations, tasks, feedbacks) => (feedbacks && feedbacks.length > 0) || user.leftFeedback },
  { id: "cleaning_party", description: "Participe à un évènement spécial", rule: (user, realisations, tasks) => realisations.some(r => { const d = new Date(r.date); return d && [/* à remplir avec tes dates */].some(ev => ev === d.toDateString()); }) },
  { id: "photo_proof", description: "Upload une photo de réalisation", rule: (user, realisations, tasks) => realisations.some(r => r.photoUrl || r.hasPhoto) },

  // POINTS / COLLECTION
  { id: "points_500", description: "Atteins 500 points cumulés", rule: (user) => user.Points >= 500 },
  { id: "points_1000", description: "Atteins 1000 points cumulés", rule: (user) => user.Points >= 1000 },
  { id: "points_3000", description: "Atteins 3000 points cumulés", rule: (user) => user.Points >= 3000 },
  { id: "badge_collector", description: "Débloque 10 badges", rule: (user) => Object.keys(user.badges || {}).length >= 10 },
  { id: "legend", description: "Débloque 49 badges", rule: (user) => Object.keys(user.badges || {}).length >= 49 },
  { id: "beta_legend", description: "Badge réservé aux bêta testeurs", rule: (user) => !!user.betaTester },

  // WEEK-END & DATES SPÉCIALES
  { id: "super_weekend", description: "Valide 3 tâches le week-end", rule: (user, realisations) => { let count = 0; realisations.forEach(r => { const day = new Date(r.date).getDay(); if (day === 0 || day === 6) count++; }); return count >= 3; } },
];

// ====== Génère les exports ======
export const badgeRules = Object.fromEntries(
  badgeRulesList.map(b => [b.id, b.rule])
);

export const badgeRulesDescriptions = Object.fromEntries(
  badgeRulesList.map(b => [b.id, b.description || "Condition non spécifiée"])
);
