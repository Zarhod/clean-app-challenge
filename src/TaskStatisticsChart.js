import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

/**
 * Composant pour afficher les statistiques des tâches sous forme de graphique.
 * Affiche le nombre de réalisations par catégorie de tâche.
 * @param {Object[]} realisations - Tableau de toutes les réalisations.
 * @param {Object[]} allRawTaches - Tableau de toutes les tâches brutes pour obtenir les catégories.
 */
function TaskStatisticsChart({ realisations, allRawTaches }) {
  // Calculer le nombre de réalisations par catégorie
  const categoryCompletionCounts = {};
  realisations.forEach(real => {
    const category = real.Categorie_Tache || 'Non catégorisée';
    categoryCompletionCounts[category] = (categoryCompletionCounts[category] || 0) + 1;
  });

  // Convertir en tableau pour Recharts
  const chartData = Object.keys(categoryCompletionCounts).map(category => ({
    name: category,
    "Tâches Complétées": categoryCompletionCounts[category],
  }));

  // Trier par nombre de tâches complétées (décroissant)
  chartData.sort((a, b) => b["Tâches Complétées"] - a["Tâches Complétées"]);

  return (
    <div className="bg-neutralBg p-4 rounded-2xl mb-6 shadow-inner border border-primary/20">
      <h3 className="text-xl font-bold text-primary mb-4 text-center">Statistiques des Tâches par Catégorie</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} stroke="#555">
              <Label value="Catégorie de Tâche" position="bottom" offset={5} fill="#555" />
            </XAxis>
            <YAxis stroke="#555">
              <Label value="Nombre de Tâches" angle={-90} position="insideLeft" offset={-10} fill="#555" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.1)' }} 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
              itemStyle={{ color: '#666' }}
            />
            <Bar dataKey="Tâches Complétées" fill="#4CAF50" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-lightText text-lg">Aucune donnée de tâche complétée pour les statistiques.</p>
      )}
    </div>
  );
}

export default TaskStatisticsChart;
