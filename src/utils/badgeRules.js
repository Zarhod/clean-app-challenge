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

// ====== Règles badges ======
const badgeRulesList = [
  // Progression globale
  { id: "first_task", description: "Termine ta toute première tâche", rule: (user, realisations) => realisations.length >= 1 },
  { id: "task_5", description: "Termine 5 tâches", rule: (user, realisations) => realisations.length >= 5 },
  { id: "task_10", description: "Termine 10 tâches", rule: (user, realisations) => realisations.length >= 10 },
  { id: "task_25", description: "Termine 25 tâches", rule: (user, realisations) => realisations.length >= 25 },
  { id: "task_50", description: "Termine 50 tâches", rule: (user, realisations) => realisations.length >= 50 },
  { id: "task_100", description: "Termine 100 tâches", rule: (user, realisations) => realisations.length >= 100 },
  { id: "task_250", description: "Termine 250 tâches", rule: (user, realisations) => realisations.length >= 250 },
  { id: "task_500", description: "Termine 500 tâches", rule: (user, realisations) => realisations.length >= 500 },
  { id: "task_1000", description: "Termine 1000 tâches", rule: (user, realisations) => realisations.length >= 1000 },

  // Séries/jours consécutifs
  { id: "streak_2", description: "Réalise une tâche 2 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 2) },
  { id: "streak_3", description: "Réalise une tâche 3 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 3) },
  { id: "streak_5", description: "Réalise une tâche 5 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 5) },
  { id: "streak_7", description: "Réalise une tâche 7 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 7) },
  { id: "streak_14", description: "Réalise une tâche 14 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 14) },
  { id: "streak_30", description: "Réalise une tâche 30 jours d'affilée", rule: (user, realisations) => hasStreak(realisations, 30) },

  // Activité hebdo/mois
  { id: "week_5", description: "Termine 5 tâches dans la même semaine", rule: (user, realisations) => countTasksInPeriod(realisations, 7) >= 5 },
  { id: "week_10", description: "Termine 10 tâches dans la même semaine", rule: (user, realisations) => countTasksInPeriod(realisations, 7) >= 10 },
  { id: "week_15", description: "Termine 15 tâches dans la même semaine", rule: (user, realisations) => countTasksInPeriod(realisations, 7) >= 15 },
  { id: "month_30", description: "Termine 30 tâches dans le même mois", rule: (user, realisations) => countTasksInPeriod(realisations, 30) >= 30 },
  { id: "month_50", description: "Termine 50 tâches dans le même mois", rule: (user, realisations) => countTasksInPeriod(realisations, 30) >= 50 },

  // Points cumulés
  { id: "points_100", description: "Atteins 100 points cumulés", rule: (user) => user.Points >= 100 },
  { id: "points_500", description: "Atteins 500 points cumulés", rule: (user) => user.Points >= 500 },
  { id: "points_1000", description: "Atteins 1000 points cumulés", rule: (user) => user.Points >= 1000 },
  { id: "points_2000", description: "Atteins 2000 points cumulés", rule: (user) => user.Points >= 2000 },
  { id: "points_5000", description: "Atteins 5000 points cumulés", rule: (user) => user.Points >= 5000 },

  // Tâches par catégorie (adapte en fonction des vraies catégories)
  { id: "kitchen_10", description: "Termine 10 tâches 'Cuisine'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Cuisine") >= 10 },
  { id: "bathroom_10", description: "Termine 10 tâches 'Salle de bain'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Salle de bain") >= 10 },
  { id: "bedroom_10", description: "Termine 10 tâches 'Chambre'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Chambre") >= 10 },
  { id: "salon_10", description: "Termine 10 tâches 'Salon'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Salon") >= 10 },
  { id: "balcony_5", description: "Termine 5 tâches 'Balcon/Jardin'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Balcon/Jardin") >= 5 },
  { id: "laundry_5", description: "Termine 5 tâches 'Linge'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Linge") >= 5 },
  { id: "garage_5", description: "Termine 5 tâches 'Garage'", rule: (user, realisations, tasks) => countCategory(realisations, tasks, "Garage") >= 5 },

  // Tâches ponctuelles
  { id: "single_shot_5", description: "Termine 5 tâches ponctuelles", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Frequence === "Ponctuel"; }).length >= 5 },
  { id: "single_shot_10", description: "Termine 10 tâches ponctuelles", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Frequence === "Ponctuel"; }).length >= 10 },

  // Tâches récurrentes
  { id: "recurring_10", description: "Termine 10 tâches récurrentes", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Frequence !== "Ponctuel"; }).length >= 10 },
  { id: "recurring_25", description: "Termine 25 tâches récurrentes", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.Frequence !== "Ponctuel"; }).length >= 25 },

  // Tâches complexes / sous-tâches
  { id: "complex_5", description: "Termine 5 tâches complexes", rule: (user, realisations, tasks) => realisations.filter(r => { const t = tasks.find(t => t.ID_Tache === r.taskId); return t && t.isGroupTask; }).length >= 5 },
  { id: "all_subs_3", description: "Termine 3 tâches en validant toutes les sous-tâches", rule: (user, realisations, tasks) => {
    return tasks.filter(t => t.Sous_Taches_IDs && t.Sous_Taches_IDs.split(',').every(id => realisations.some(r => r.taskId === id))).length >= 3;
  } },

  // Jours/horaires particuliers
  { id: "sunday_5", description: "Termine 5 tâches un dimanche", rule: (user, realisations) => realisations.filter(r => new Date(r.date).getDay() === 0).length >= 5 },
  { id: "monday_5", description: "Termine 5 tâches un lundi", rule: (user, realisations) => realisations.filter(r => new Date(r.date).getDay() === 1).length >= 5 },
  { id: "night_10", description: "Termine 10 tâches après 21h", rule: (user, realisations) => realisations.filter(r => new Date(r.date).getHours() >= 21).length >= 10 },

  // Challenge mensuel
  { id: "challenge_month", description: "Termine une tâche le 1er du mois", rule: (user, realisations) => realisations.some(r => new Date(r.date).getDate() === 1) },

  // Nouvelle catégorie
  { id: "new_cat", description: "Termine une tâche dans une nouvelle catégorie", rule: (user, realisations, tasks) => {
    const catsDone = new Set(realisations.map(r => {
      const t = tasks.find(t => t.ID_Tache === r.taskId);
      return t?.Categorie;
    }));
    return catsDone.size >= 5;
  } },

  // Semaine sans tâche
  { id: "zero_week", description: "Fais une semaine sans aucune tâche", rule: (user, realisations) => {
    if (realisations.length === 0) return false;
    const days = Array.from(getUniqueDays(realisations))
      .map(d => new Date(d).setHours(0,0,0,0))
      .sort((a,b) => a-b);
    for (let i = 1; i < days.length; i++) {
      if ((days[i] - days[i-1]) > 7 * 24 * 3600 * 1000) return true;
    }
    return false;
  }},

  // Retour après pause
  { id: "come_back", description: "Termine une tâche après 10 jours d'absence", rule: (user, realisations) => {
    if (realisations.length < 2) return false;
    const sorted = realisations.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1].date);
      const curr = new Date(sorted[i].date);
      if ((curr - prev) >= 10 * 24 * 3600 * 1000) return true;
    }
    return false;
  }},

  // Régularité mensuelle
  { id: "month_streak", description: "Termine au moins 1 tâche chaque semaine sur 1 mois", rule: (user, realisations) => {
    if (realisations.length === 0) return false;
    const weeks = new Set();
    realisations.forEach(r => {
      const d = new Date(r.date);
      const y = d.getFullYear();
      const w = Math.floor((d.getTime() - new Date(y, 0, 1).getTime()) / (7*24*3600*1000));
      weeks.add(`${y}-${w}`);
    });
    return weeks.size >= 4;
  }},

  // Catégories multiples
  { id: "cat_master", description: "Termine 5 tâches dans 5 catégories différentes", rule: (user, realisations, tasks) => {
    const catsDone = new Set();
    realisations.forEach(r => {
      const t = tasks.find(t => t.ID_Tache === r.taskId);
      if (t?.Categorie) catsDone.add(t.Categorie);
    });
    return catsDone.size >= 5;
  }},
];

// ====== Exports ======
export const badgeRules = Object.fromEntries(
  badgeRulesList.map(b => [b.id, b.rule])
);

export const badgeRulesDescriptions = Object.fromEntries(
  badgeRulesList.map(b => [b.id, b.description || "Condition non spécifiée"])
);
