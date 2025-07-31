import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaskStatisticsChart = ({ data }) => {
  // data should be an array of objects like:
  // [{ name: 'Tâche A', 'Points Gagnés': 100, 'Tâches Réalisées': 5 }, ...]

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-primary/10 mb-6">
      <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">Statistiques des Tâches</h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} interval={0} style={{ fontSize: '0.75rem' }} />
            <YAxis yAxisId="left" orientation="left" stroke="#4A90E2" label={{ value: 'Points Gagnés', angle: -90, position: 'insideLeft', fill: '#4A90E2', dy: 30 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#50E3C2" label={{ value: 'Tâches Réalisées', angle: 90, position: 'insideRight', fill: '#50E3C2', dy: -30 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
              labelStyle={{ fontWeight: 'bold', color: '#333' }}
              itemStyle={{ color: '#555' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar yAxisId="left" dataKey="Points Gagnés" fill="#4A90E2" name="Points Gagnés" barSize={20} radius={[10, 10, 0, 0]} />
            <Bar yAxisId="right" dataKey="Tâches Réalisées" fill="#50E3C2" name="Tâches Réalisées" barSize={20} radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-lightText text-md py-4">Aucune donnée de tâche disponible pour le graphique.</p>
      )}
    </div>
  );
};

export default TaskStatisticsChart;
