// src/TaskStatisticsChart.js
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TaskStatisticsChart = ({ realisations }) => {
  const [statType, setStatType] = useState("pointsByCategory");
  const [animKey, setAnimKey] = useState(0); // Force le rerender animé

  const chartData = useMemo(() => {
    if (!realisations || realisations.length === 0) return [];

    const reducers = {
      pointsByCategory: (acc, real) => {
        const category = real.categorieTache || 'Non catégorisé';
        const points = parseFloat(real.pointsGagnes) || 0;
        acc[category] = (acc[category] || 0) + points;
        return acc;
      },
      tasksByCategory: (acc, real) => {
        const category = real.categorieTache || 'Non catégorisé';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      pointsByUser: (acc, real) => {
        const user = real.nomParticipant || 'Anonyme';
        const points = parseFloat(real.pointsGagnes) || 0;
        acc[user] = (acc[user] || 0) + points;
        return acc;
      }
    };

    const result = realisations.reduce(reducers[statType], {});
    const arr = Object.keys(result).map(key => ({
      label: key,
      value: result[key]
    }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [statType, realisations]);

  const handleChangeStatType = (e) => {
    setStatType(e.target.value);
    setAnimKey(prev => prev + 1); // Recrée le composant du graphique pour relancer l'anim
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-neutralBg rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
          <h4 className="text-lg sm:text-xl font-bold text-purple-700 text-center">
            📊 Statistiques des Tâches
          </h4>
        </div>
        <div className="text-center p-6 text-lightText">
          <p>Aucune donnée disponible.</p>
          <p className="text-sm mt-1">Effectuez des tâches pour voir vos stats !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutralBg rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 gap-3">
        <h4 className="text-lg sm:text-xl font-bold text-purple-700 text-center sm:text-left">
          📊 Statistiques des Tâches
        </h4>

        {/* Select personnalisé */}
        <div className="relative inline-block">
          <select
            value={statType}
            onChange={handleChangeStatType}
            className="appearance-none pl-4 pr-10 py-2 rounded-full border border-purple-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="pointsByCategory">Points par Catégorie</option>
            <option value="tasksByCategory">Tâches par Catégorie</option>
            <option value="pointsByUser">Points par Utilisateur</option>
          </select>

          {/* Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-purple-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Graph avec animation */}
      <div className="w-full h-72 sm:h-96 p-4 transition-all duration-500 ease-in-out">
        <ResponsiveContainer key={animKey} width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              angle={-15}
              textAnchor="end"
              height={50}
              tick={{ fill: '#4b5563', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [
                `${value}`,
                statType === "tasksByCategory" ? "Tâches" : "Points"
              ]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
              dataKey="value"
              fill="#8b5cf6"
              name={statType === "tasksByCategory" ? "Tâches" : "Points"}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskStatisticsChart;
