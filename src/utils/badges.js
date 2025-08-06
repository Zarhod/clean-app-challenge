const BADGES = [
  // Progression globale
  { id: "first_task", name: "Première tâche", description: "Termine ta toute première tâche", emoji: "🌟" },
  { id: "task_5", name: "5 au compteur", description: "Termine 5 tâches", emoji: "🖐️" },
  { id: "task_10", name: "Dix sur dix", description: "Termine 10 tâches", emoji: "🔟" },
  { id: "task_25", name: "Petit rythme", description: "Termine 25 tâches", emoji: "🏃" },
  { id: "task_50", name: "Première étape", description: "Termine 50 tâches", emoji: "🎯" },
  { id: "task_100", name: "Centenaire", description: "Termine 100 tâches", emoji: "💯" },
  { id: "task_250", name: "Expert", description: "Termine 250 tâches", emoji: "🥈" },
  { id: "task_500", name: "Pro du ménage", description: "Termine 500 tâches", emoji: "🥇" },
  { id: "task_1000", name: "Machine de guerre", description: "Termine 1000 tâches", emoji: "🏆" },

  // Séries/jours consécutifs
  { id: "streak_2", name: "Coup double", description: "Réalise une tâche 2 jours d'affilée", emoji: "🥈" },
  { id: "streak_3", name: "Triplé", description: "Réalise une tâche 3 jours d'affilée", emoji: "🥉" },
  { id: "streak_5", name: "Série 5", description: "Réalise une tâche 5 jours d'affilée", emoji: "🥅" },
  { id: "streak_7", name: "Semaine pleine", description: "Réalise une tâche 7 jours d'affilée", emoji: "📆" },
  { id: "streak_14", name: "Fortnite", description: "Réalise une tâche 14 jours d'affilée", emoji: "🔥" },
  { id: "streak_30", name: "Assidu", description: "Réalise une tâche 30 jours d'affilée", emoji: "📅" },

  // Semaine/Mois d'activité
  { id: "week_5", name: "Semaine active", description: "Termine 5 tâches dans la même semaine", emoji: "🗓️" },
  { id: "week_10", name: "Semaine productive", description: "Termine 10 tâches dans la même semaine", emoji: "⏳" },
  { id: "week_15", name: "Semaine marathon", description: "Termine 15 tâches dans la même semaine", emoji: "🏁" },
  { id: "month_30", name: "Mois solide", description: "Termine 30 tâches dans le même mois", emoji: "🗓" },
  { id: "month_50", name: "Mois turbo", description: "Termine 50 tâches dans le même mois", emoji: "⚡️" },

  // Points cumulés
  { id: "points_100", name: "100 points", description: "Atteins 100 points cumulés", emoji: "🔢" },
  { id: "points_500", name: "500 points", description: "Atteins 500 points cumulés", emoji: "💹" },
  { id: "points_1000", name: "1000 points", description: "Atteins 1000 points cumulés", emoji: "💸" },
  { id: "points_2000", name: "2000 points", description: "Atteins 2000 points cumulés", emoji: "🤑" },
  { id: "points_5000", name: "5000 points", description: "Atteins 5000 points cumulés", emoji: "💰" },

  // Tâches par catégorie (adapte les noms à tes vraies catégories)
  { id: "kitchen_10", name: "Pro de la cuisine", description: "Termine 10 tâches 'Cuisine'", emoji: "🍳" },
  { id: "bathroom_10", name: "Salle de bain clean", description: "Termine 10 tâches 'Salle de bain'", emoji: "🛁" },
  { id: "bedroom_10", name: "Chambre nickel", description: "Termine 10 tâches 'Chambre'", emoji: "🛏️" },
  { id: "salon_10", name: "Salon au top", description: "Termine 10 tâches 'Salon'", emoji: "🛋️" },
  { id: "balcony_5", name: "Balcon/jardinier", description: "Termine 5 tâches 'Balcon/Jardin'", emoji: "🌳" },
  { id: "laundry_5", name: "Pro du linge", description: "Termine 5 tâches 'Linge'", emoji: "🧺" },
  { id: "garage_5", name: "Garage boss", description: "Termine 5 tâches 'Garage'", emoji: "🚗" },

  // Tâches ponctuelles
  { id: "single_shot_5", name: "Ponctuel", description: "Termine 5 tâches ponctuelles", emoji: "🎲" },
  { id: "single_shot_10", name: "Imprévu géré", description: "Termine 10 tâches ponctuelles", emoji: "🎯" },

  // Tâches récurrentes
  { id: "recurring_10", name: "Habitude", description: "Termine 10 tâches récurrentes", emoji: "🔁" },
  { id: "recurring_25", name: "Routine", description: "Termine 25 tâches récurrentes", emoji: "⏰" },

  // Complexes / Sous-tâches
  { id: "complex_5", name: "Gestionnaire", description: "Termine 5 tâches complexes", emoji: "🧩" },
  { id: "all_subs_3", name: "Détaillé", description: "Termine 3 tâches en validant toutes les sous-tâches", emoji: "🗂️" },

  // Jours/horaires particuliers
  { id: "sunday_5", name: "Dimanche studieux", description: "Termine 5 tâches un dimanche", emoji: "🌞" },
  { id: "monday_5", name: "Lundi efficace", description: "Termine 5 tâches un lundi", emoji: "🌱" },
  { id: "night_10", name: "Oiseau de nuit", description: "Termine 10 tâches après 21h", emoji: "🌙" },

  // Challenge régulier
  { id: "challenge_month", name: "Challenge du mois", description: "Termine une tâche le 1er du mois", emoji: "🥳" },
  { id: "new_cat", name: "Explorateur", description: "Termine une tâche dans une nouvelle catégorie", emoji: "🧭" },

  // Divers
  { id: "zero_week", name: "Semaine blanche", description: "Fais une semaine sans aucune tâche", emoji: "❄️" },
  { id: "come_back", name: "Retour gagnant", description: "Termine une tâche après 10 jours d'absence", emoji: "🔙" },
  { id: "month_streak", name: "Régulier du mois", description: "Termine au moins 1 tâche chaque semaine sur 1 mois", emoji: "📈" },
  { id: "cat_master", name: "Maître des catégories", description: "Termine 5 tâches dans 5 catégories différentes", emoji: "🧠" }
];

export default BADGES;
