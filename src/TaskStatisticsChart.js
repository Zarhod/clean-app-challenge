import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

/**
 * Composant pour afficher les statistiques des tâches sous forme de graphique.
 * Affiche les points totaux par catégorie de tâche.
 * @param {Object[]} realisations - Tableau de toutes les réalisations.
 * @param {Object[]} allRawTaches - Tableau de toutes les tâches brutes pour obtenir les catégories et points.
 */
function TaskStatisticsChart({ realisations, allRawTaches }) {
  // Ensure allRawTaches is an array before processing
  if (!Array.isArray(allRawTaches) || allRawTaches.length === 0) {
    return (
      <div className="bg-neutralBg p-4 rounded-2xl mb-6 shadow-inner border border-primary/20">
        <h3 className="text-xl font-bold text-primary mb-4 text-center">Points Totaux par Catégorie de Tâche</h3> 
        <p className="text-center text-lightText text-lg py-4">Aucune donnée de tâche disponible pour les statistiques.</p>
      </div>
    );
  }

  // Créer une carte pour un accès rapide aux points des tâches par ID
  const tachesPointsMap = new Map(allRawTaches.map(tache => [String(tache.ID_Tache), parseFloat(tache.Points) || 0]));

  // Calculer les points totaux par catégorie
  const categoryPointsCounts = {};
  realisations.forEach(real => {
    const category = real.Categorie_Tache || 'Non catégorisée';
    const pointsGagnes = parseFloat(real.Points_Gagnes) || 0; 
    
    categoryPointsCounts[category] = (categoryPointsCounts[category] || 0) + pointsGagnes;
  });

  // Convertir en tableau pour Recharts
  const chartData = Object.keys(categoryPointsCounts).map(category => ({
    name: category,
    "Points Totaux": categoryPointsCounts[category],
  }));

  // Trier par points totaux (décroissant)
  chartData.sort((a, b) => b["Points Totaux"] - a["Points Totaux"]);

  return (
    <div className="bg-neutralBg p-4 rounded-2xl mb-6 shadow-inner border border-primary/20">
      <h3 className="text-xl font-bold text-primary mb-4 text-center">Points Totaux par Catégorie de Tâche</h3> 
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
              <Label value="Points Totaux" angle={-90} position="insideLeft" offset={-10} fill="#555" style={{ textAnchor: 'middle' }} /> 
            </YAxis>
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.1)' }} 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
              itemStyle={{ color: '#666' }}
            />
            <Bar dataKey="Points Totaux" fill="#4CAF50" radius={[10, 10, 0, 0]} /> 
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-lightText text-lg py-4">Aucune donnée de tâche complétée pour les statistiques.</p>
      )}
    </div>
  );
}

export default TaskStatisticsChart;
