import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext'; // Pour isAdmin

const ExportSelectionModal = ({ onClose, allRawTaches, allObjectives, realisations }) => {
  const { isAdmin } = useUser();
  const [loading, setLoading] = useState(false);

  const convertToCsv = useCallback((data, headers) => {
    if (!data || data.length === 0) {
      return '';
    }

    const headerRow = headers.join(',');
    const dataRows = data.map(row =>
      headers.map(header => {
        const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
        // Gérer les valeurs booléennes
        if (typeof value === 'boolean') {
          return value ? 'Oui' : 'Non';
        }
        // Gérer les dates si elles sont au format ISO string
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return new Date(value).toLocaleDateString('fr-FR');
        }
        // Gérer les chaînes avec des virgules ou des guillemets
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  }, []);

  const downloadCsv = useCallback((csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    } else {
      toast.error("Votre navigateur ne supporte pas le téléchargement direct. Veuillez copier le contenu.");
      console.error("Download attribute not supported.");
    }
  }, []);

  const handleExport = useCallback((dataType) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }

    setLoading(true);
    let dataToExport = [];
    let headers = [];
    let filename = '';

    try {
      if (dataType === 'tasks') {
        dataToExport = allRawTaches;
        headers = ['ID_Tache', 'Nom_Tache', 'Description', 'Points_Gagnes', 'Frequence', 'Est_Active'];
        filename = 'taches.csv';
      } else if (dataType === 'objectives') {
        dataToExport = allObjectives;
        headers = ['ID_Objectif', 'Nom_Objectif', 'Description', 'Points_Objectif', 'Date_Debut', 'Date_Fin', 'Progress_Current', 'Progress_Target', 'Est_Atteint'];
        filename = 'objectifs.csv';
      } else if (dataType === 'realisations') {
        dataToExport = realisations;
        // Pour les réalisations, nous pourrions vouloir inclure le nom de l'utilisateur et de la tâche si possible
        // Pour l'instant, utilisons les champs bruts
        headers = ['userId', 'taskId', 'pointsGagnes', 'timestamp', 'statut'];
        filename = 'realisations.csv';
      } else {
        toast.error("Type d'exportation inconnu.");
        setLoading(false);
        return;
      }

      const csvContent = convertToCsv(dataToExport, headers);
      downloadCsv(csvContent, filename);
      toast.success(`Données ${dataType} exportées avec succès !`);
    } catch (error) {
      toast.error(`Erreur lors de l'exportation des données ${dataType}.`);
      console.error(`Error exporting ${dataType}:`, error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, allRawTaches, allObjectives, realisations, convertToCsv, downloadCsv]);

  return (
    <ListAndInfoModal title="Exporter les Données" onClose={onClose} sizeClass="max-w-md sm:max-w-lg">
      <p className="text-lightText text-center mb-4">Sélectionnez le type de données à exporter au format CSV.</p>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => handleExport('tasks')}
          disabled={loading || allRawTaches.length === 0}
          className="btn-primary py-2.5 text-md"
        >
          {loading ? 'Exportation des tâches...' : 'Exporter les Tâches'}
        </button>
        <button
          onClick={() => handleExport('objectives')}
          disabled={loading || allObjectives.length === 0}
          className="btn-primary py-2.5 text-md"
        >
          {loading ? 'Exportation des objectifs...' : 'Exporter les Objectifs'}
        </button>
        <button
          onClick={() => handleExport('realisations')}
          disabled={loading || realisations.length === 0}
          className="btn-primary py-2.5 text-md"
        >
          {loading ? 'Exportation des réalisations...' : 'Exporter les Réalisations'}
        </button>
      </div>
      <button
        onClick={onClose}
        disabled={loading}
        className="mt-6 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-md"
      >
        Fermer
      </button>
    </ListAndInfoModal>
  );
};

export default ExportSelectionModal;
