export const generateRecapDataFromStats = (usersData, realisations, allRawTaches) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() + mondayOffset);

  const startOfPreviousWeek = new Date(startOfCurrentWeek);
  startOfPreviousWeek.setDate(startOfCurrentWeek.getDate() - 7);

  const endOfPreviousWeek = new Date(startOfPreviousWeek);
  endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);

  const recapRange = `du ${startOfPreviousWeek.toLocaleDateString('fr-FR')} au ${endOfPreviousWeek.toLocaleDateString('fr-FR')}`;

  const realisationsPrevWeek = realisations.filter(r => {
    const date = new Date(r.date);
    return date >= startOfPreviousWeek && date <= endOfPreviousWeek;
  });

  const pointsPerUser = {};
  const tasksPerUser = {};

  realisationsPrevWeek.forEach(r => {
    const id = r.userId;
    pointsPerUser[id] = (pointsPerUser[id] || 0) + (r.points || 0);
    tasksPerUser[id] = (tasksPerUser[id] || 0) + 1;
  });

  const usersMap = {};
  usersData.forEach(u => {
    usersMap[u.id] = u;
  });

  const sortedUsers = Object.entries(pointsPerUser)
    .map(([id, points]) => ({ id, points, name: usersMap[id]?.displayName || 'Inconnu' }))
    .sort((a, b) => b.points - a.points);

  const podium = sortedUsers.slice(0, 3).map(u => ({ name: u.name, points: u.points }));

  const mostActive = Object.entries(tasksPerUser)
    .map(([id, count]) => ({ id, count, name: usersMap[id]?.displayName || 'Inconnu' }))
    .sort((a, b) => b.count - a.count)[0] || { name: '—', count: 0 };

  const mostImproved = usersData
    .map(u => ({
      name: u.displayName || 'Inconnu',
      delta: (u.weeklyPoints || 0) - (u.previousWeeklyPoints || 0)
    }))
    .sort((a, b) => b.delta - a.delta)[0] || { name: '—', delta: 0 };

  const newParticipant = usersData.find(u => {
    const joined = new Date(u.dateJoined);
    return joined >= startOfPreviousWeek && joined <= endOfPreviousWeek;
  }) || { name: '—' };

  const totalTasks = realisationsPrevWeek.length;
  const totalPoints = realisationsPrevWeek.reduce((acc, r) => acc + (r.points || 0), 0);
  const averagePoints = usersData.length ? Math.round(totalPoints / usersData.length) : 0;

  const dailyTasks = realisationsPrevWeek.filter(r => {
    const task = allRawTaches.find(t => t.ID_Tache === r.taskId);
    return (task?.Frequence || '').toLowerCase() === 'quotidien';
  }).length;

  const weeklyTasks = realisationsPrevWeek.filter(r => {
    const task = allRawTaches.find(t => t.ID_Tache === r.taskId);
    return (task?.Frequence || '').toLowerCase() === 'hebdomadaire';
  }).length;

  // Comparaison avec semaine précédente
  const realisationsWeekBefore = realisations.filter(r => {
    const date = new Date(r.date);
    return date >= new Date(startOfPreviousWeek.getTime() - 7 * 24 * 60 * 60 * 1000) &&
           date < startOfPreviousWeek;
  });

  const tasksWeekBefore = realisationsWeekBefore.length;
  const pointsWeekBefore = realisationsWeekBefore.reduce((acc, r) => acc + (r.points || 0), 0);

  const engagementDelta = tasksWeekBefore > 0
    ? Math.round(((totalTasks - tasksWeekBefore) / tasksWeekBefore) * 100)
    : 0;

  const tasksDelta = tasksWeekBefore > 0
    ? Math.round(((totalTasks - tasksWeekBefore) / tasksWeekBefore) * 100)
    : 0;

  const pointsDelta = pointsWeekBefore > 0
    ? Math.round(((totalPoints - pointsWeekBefore) / pointsWeekBefore) * 100)
    : 0;

  return {
    weekRange: recapRange,
    podium,
    mostActive,
    mostImproved,
    newParticipant,
    totalTasks,
    totalPoints,
    averagePoints,
    dailyTasks,
    weeklyTasks,
    comparison: {
      engagement: engagementDelta,
      tasks: tasksDelta,
      points: pointsDelta
    }
  };
};
