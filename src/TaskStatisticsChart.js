// src/TaskStatisticsChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaskStatisticsChart = ({ realisations, allRawTaches }) => {
  // Calculer les points gagnés par catégorie
  const pointsByCategory = realisations.reduce((acc, real) => {
    const category = real.categorieTache || 'Non catégorisé';
    const points = parseFloat(real.pointsGagnes) || 0;
    acc[category] = (acc[category] || 0) + points;
    return acc;
  }, {});

  // Convertir en tableau pour Recharts
  const chartData = Object.keys(pointsByCategory).map(category => ({
    category: category,
    points: pointsByCategory[category],
  }));

  // Trier par points décroissants
  chartData.sort((a, b) => b.points - a.points);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-lightText py-4">
        <p>Aucune donnée de réalisation pour afficher les statistiques.</p>
        <p>Terminez des tâches pour voir votre progression !</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 sm:h-96 bg-white rounded-lg p-4 shadow-inner border border-gray-100">
      <h4 className="text-lg font-bold text-primary mb-4 text-center">Points Gagnés par Catégorie</h4>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="category" angle={-15} textAnchor="end" height={50} tick={{ fill: '#4a5568', fontSize: 12 }} />
          <YAxis tick={{ fill: '#4a5568', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value} points`, 'Total']}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px' }}
            labelStyle={{ color: '#2d3748', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="points" fill="#6a0dad" name="Points" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskStatisticsChart;
