import React, { useState, useEffect, useCallback } from 'react'; // 'useCallback' est maintenant utilisé
import './App.css'; 
import FullRankingTable from './FullRankingTable'; 
import HistoricalPodiums from './HistoricalPodiums'; 
import AdminLoginButton from './AdminLoginButton'; 
import AdminTaskFormModal from './AdminTaskFormModal'; 
import ConfirmActionModal from './ConfirmActionModal'; 
import ConfettiOverlay from './ConfettiOverlay'; 
import TaskStatisticsChart from './TaskStatisticsChart'; 
import AdminObjectiveFormModal from './AdminObjectiveFormModal'; 

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// --- CONFIGURATION DE L'API ---
const API_URL = 'https://clean-app-challenge-api.jassairbus.workers.dev/'; 
const AUTH_TOKEN = '6f36b6b0-0ed4-4b2b-a45c-b70f8145c1f2'; // IMPORTANT: À changer pour la production !       

// Nom du fichier logo (assurez-vous qu'il est dans le dossier public/)
const LOGO_FILENAME = 'logo.png'; 

// Mot de passe administrateur (IMPORTANT: À changer pour la production !)
const ADMIN_PASSWORD = 'Bombardier111'; 

function App() {
  const [taches, setTaches] = useState([]); 
  const [allRawTaches, setAllRawTaches] = useState([]); // Toutes les tâches brutes, y compris les sous-tâches
  const [realisations, setRealisations] = useState([]); 
  const [classement, setClassement] = useState([]); 
  const [historicalPodiums, setHistoricalPodiums] = useState([]); 
  const [objectives, setObjectives] = useState([]); 
  const [congratulatoryMessages, setCongratulatoryMessages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); // Tâche sélectionnée pour confirmation
  const [participantName, setParticipantName] = useState(''); 
  const [showThankYouPopup, setShowThankYouPopup] = useState(null); // Gère l'affichage du popup de remerciement
  const [showConfetti, setShowConfetti] = useState(false); // Gère l'affichage des confettis
  
  const [activeMainView, setActiveMainView] = useState('home'); // Vue principale active (accueil, classement, admin, etc.)
  const [activeTaskCategory, setActiveTaskCategory] = useState('tous'); // Catégorie de tâches active (tous, salle, cuisine)

  const [selectedParticipantProfile, setSelectedParticipantProfile] = useState(null); // Profil du participant sélectionné
  const [participantWeeklyTasks, setParticipantWeeklyTasks] = useState([]); // Tâches hebdomadaires du participant sélectionné
  const [totalGlobalCumulativePoints, setTotalGlobalCumulativePoints] = useState(0); // Total des points cumulatifs de tous les participants

  const [showSplitTaskDialog, setShowSplitTaskDialog] = useState(false); // Affiche la boîte de dialogue pour les tâches de groupe
  const [subTasks, setSubTasks] = useState([]); // Sous-tâches d'une tâche de groupe
  const [selectedSubTasks, setSelectedSubTasks] = useState([]); // Sous-tâches sélectionnées par le participant
  
  // États pour les modales de confirmation/formulaire admin
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false); 
  const [showAdminTaskFormModal, setShowAdminTaskFormModal] = useState(false); 
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); 
  const [taskToDelete, setTaskToDelete] = useState(null); 

  // États pour la gestion des objectifs via le panneau admin
  const [showAdminObjectiveFormModal, setShowAdminObjectiveFormModal] = useState(false); 
  const [newObjectiveData, setNewObjectiveData] = useState({ 
    ID_Objectif: '',
    Nom_Objectif: '',
    Description_Objectif: '',
    Cible_Points: '',
    Type_Cible: 'Cumulatif',
    Categorie_Cible: '', 
    Points_Actuels: 0, 
    Est_Atteint: false 
  });
  const [editingObjective, setEditingObjective] = useState(null); 
  const [showDeleteObjectiveConfirmModal, setShowDeleteObjectiveConfirmModal] = useState(false); 
  const [objectiveToDelete, setObjectiveToDelete] = useState(null); 

  // États pour le panneau d'administration
  const [isAdmin, setIsAdmin] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ 
    ID_Tache: '',
    Nom_Tache: '',
    Description: '',
    Points: '', 
    Frequence: 'Hebdomadaire', 
    Urgence: 'Faible', 
    Categorie: 'Tous', 
    Sous_Taches_IDs: '',
    Parent_Task_ID: ''
  });
  const [editingTask, setEditingTask] = null; // Changed from useState(null) to null directly as it's set by handleEditTask

  // États pour la visibilité des sections déroulantes
  const [showHighlightsSection, setShowHighlightsSection] = useState(false); // Tendances actuelles
  const [showObjectivesSection, setShowObjectivesSection] = useState(false); // Objectifs communs sur la page d'accueil
  const [showAdminObjectivesManagement, setShowAdminObjectivesManagement] = useState(false); // Gestion des objectifs dans l'admin
  const [showAdminTasksManagement, setShowAdminTasksManagement] = useState(false); // Gestion des tâches dans l'admin


  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  });

  // --- Fonctions d'appel API (enveloppées dans useCallback) ---

  const fetchTaches = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getTaches`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const rawData = await response.json(); 
      
      const cleanedRawData = rawData.filter(tache => tache && tache.ID_Tache);
      setAllRawTaches(cleanedRawData); 

      const tachesMap = new Map(cleanedRawData.map(t => [String(t.ID_Tache), t]));

      const processedAndFilteredTaches = cleanedRawData
        .map(tache => {
          if (!tache) return null; 

          if (tache.Sous_Taches_IDs && String(tache.Sous_Taches_IDs).trim() !== '') {
            const subTaskIds = String(tache.Sous_Taches_IDs).split(',').map(id => id.trim());
            let totalSubTaskPoints = 0;
            subTaskIds.forEach(subId => {
              const subTask = tachesMap.get(subId);
              if (subTask && subTask.Points) { 
                totalSubTaskPoints += parseFloat(subTask.Points);
              }
            });
            return { ...tache, Calculated_Points: totalSubTaskPoints, isGroupTask: true }; 
          }
          return { ...tache, Calculated_Points: parseFloat(tache.Points) || 0, isGroupTask: false };
        })
        .filter(tache => tache !== null) 
        .filter(tache => String(tache.Parent_Task_ID || '').trim() === ''); 
      
      setTaches(processedAndFilteredTaches);
    } catch (err) {
      setError(`Erreur lors de la récupération des tâches: ${err.message}`);
      toast.error(`Erreur: ${err.message}`); 
    } finally {
      setLoading(false); 
    }
  }, [setAllRawTaches, setTaches, setError, setLoading]);

  const fetchClassement = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getClassement`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const rawData = await response.json(); 

      const currentClassement = rawData.map(row => ({
        Nom_Participant: row.Nom_Participant,
        Points_Total_Semaine_Courante: parseFloat(row.Points_Total_Semaine_Courante) || 0, 
        Points_Total_Cumulatif: parseFloat(row.Points_Total_Cumulatif) || 0,
        Points_Total_Semaine_Precedente: parseFloat(row.Points_Total_Semaine_Precedente || 0) || 0 
      })).sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
      
      setClassement(currentClassement);

      const globalCumulative = rawData.reduce((sum, row) => sum + (parseFloat(row.Points_Total_Cumulatif) || 0), 0); 
      setTotalGlobalCumulativePoints(globalCumulative);

    } catch (err) {
      setError(`Erreur lors de la récupération du classement: ${err.message}`);
      toast.error(`Erreur: ${err.message}`); 
    }
  }, [setClassement, setTotalGlobalCumulativePoints, setError]);

  const fetchRealisations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getRealisations`, { 
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setRealisations(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des réalisations: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setRealisations, setError]);

  const fetchParticipantWeeklyTasks = useCallback(async (participantName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getParticipantWeeklyTasks&nomParticipant=${encodeURIComponent(participantName)}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setParticipantWeeklyTasks(data);

    } catch (err) {
      setError(`Erreur lors de la récupération des tâches de ${participantName}: ${err.message}`);
      toast.error(`Erreur lors du chargement du profil: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [setParticipantWeeklyTasks, setLoading, setError]);

  const fetchSubTasks = useCallback(async (parentTaskId) => {
    setLoading(true); 
    try {
      const response = await fetch(`${API_URL}?action=getSousTaches&parentTaskId=${encodeURIComponent(parentTaskId)}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setSubTasks(Array.isArray(data) ? data : []); 
    } catch (err) {
      setError(`Erreur lors de la récupération des sous-tâches: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
      setSubTasks([]); 
    } finally {
      setLoading(false);
    }
  }, [setSubTasks, setLoading, setError]);

  const fetchObjectives = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getObjectives`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setObjectives(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des objectifs: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setObjectives, setError]);

  const fetchCongratulatoryMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getCongratulatoryMessages`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCongratulatoryMessages(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des messages de félicitations: ${err.message}`);
      setCongratulatoryMessages([{ Texte_Message: "Bravo pour votre excellent travail !" }]);
    }
  }, [setCongratulatoryMessages, setError]);

  const fetchHistoricalPodiums = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getHistoricalPodiums`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setHistoricalPodiums(data);
    } catch (err) {
      setError(`Erreur lors de la récupération de l'historique des podiums: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setHistoricalPodiums, setError]);


  const recordTask = async (idTacheToRecord, isSubTask = false) => {
    if (!participantName.trim()) {
      toast.warn('Veuillez entrer votre nom.'); 
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'recordTask',
          idTache: idTacheToRecord,
          nomParticipant: participantName.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        const completedTask = taches.find(t => t.ID_Tache === idTacheToRecord);
        if (completedTask && String(completedTask.Frequence || '').toLowerCase() === 'ponctuel') {
            // Si la tâche est ponctuelle, la supprimer après enregistrement
            await handleDeleteTask(idTacheToRecord, true); 
            toast.success(`Tâche ponctuelle "${completedTask.Nom_Tache}" enregistrée et supprimée.`);
        } else {
            toast.success(`Tâche "${completedTask ? completedTask.Nom_Tache : 'inconnue'}" enregistrée avec succès.`);
        }

        if (!isSubTask) { 
          // Affiche un message de félicitations aléatoire et les confettis pour les tâches principales
          const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
          setShowThankYouPopup({ name: participantName.trim(), task: completedTask ? completedTask.Nom_Tache : 'Tâche inconnue', message: randomMessage }); 
          setShowConfetti(true); 
          setParticipantName('');
          setSelectedTask(null); 
        }
        // Rafraîchir toutes les données pertinentes après l'enregistrement
        fetchClassement(); 
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
      } else {
        toast.error(`Erreur: ${result.message}`); 
      }
    } catch (err) {
      setError(`Erreur lors de l'enregistrement de la tâche: ${err.message}`);
      toast.error(`Une erreur est survenue: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const recordMultipleTasks = async () => {
    // Filtre les sous-tâches sélectionnées pour n'inclure que celles qui sont disponibles
    const availableSelectedSubTasks = selectedSubTasks.filter(subTask => isSubTaskAvailable(subTask));

    if (!participantName.trim() || availableSelectedSubTasks.length === 0) {
      toast.warn('Veuillez entrer votre nom et sélectionner au moins une sous-tâche disponible.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'recordMultipleTasks',
          idTaches: availableSelectedSubTasks.map(task => task.ID_Tache), 
          nomParticipant: participantName.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        const completedTaskNames = availableSelectedSubTasks.map(st => st.Nom_Tache).join(', ');
        const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
        setShowThankYouPopup({ name: participantName.trim(), task: completedTaskNames, message: randomMessage });
        setShowConfetti(true); 

        for (const subTask of availableSelectedSubTasks) {
            const fullSubTaskData = allRawTaches.find(t => String(t.ID_Tache) === String(subTask.ID_Tache));
            if (fullSubTaskData && String(fullSubTaskData.Frequence || '').toLowerCase() === 'ponctuel') {
                await handleDeleteTask(subTask.ID_Tache, true); 
            }
        }
        toast.success(`Tâches enregistrées avec succès.`);

        // Réinitialiser les états du dialogue
        setParticipantName('');
        setSelectedTask(null);
        setShowSplitTaskDialog(false); 
        setSelectedSubTasks([]);
        // Rafraîchir toutes les données pertinentes
        fetchClassement();
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      setError(`Erreur lors de l'enregistrement des sous-tâches: ${err.message}`);
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetWeeklyPoints = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'resetWeeklyPoints' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        // Rafraîchir toutes les données après la réinitialisation
        fetchClassement(); 
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
        fetchHistoricalPodiums(); // Recharger l'historique après réinitialisation
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      setError(`Erreur lors de la réinitialisation des points: ${err.message}`);
      toast.error(`Une erreur est survenue lors de la réinitialisation: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmResetModal(false); 
    }
  };

  // --- Fonctions d'administration des TÂCHES ---
  const handleAdminLogin = (passwordInput) => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setActiveMainView('adminPanel');
      toast.success('Connecté en tant qu\'administrateur !');
    } else {
      toast.error('Mot de passe incorrect.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveMainView('home');
    toast.info('Déconnecté du panneau administrateur.');
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData(prev => ({
      ...prev,
      [name]: name === 'Points' ? (value === '' ? '' : parseFloat(value) || '') : value 
    }));
  };

  const handleSubmitTask = async () => {
    if (!newTaskData.ID_Tache.trim()) {
      toast.error('L\'ID de la tâche est requis.');
      return;
    }
    if (!newTaskData.Nom_Tache.trim()) {
      toast.error('Le nom de la tâche est requis.');
      return;
    }
    if (newTaskData.Points !== '' && isNaN(newTaskData.Points)) {
      toast.error('Les points doivent être un nombre valide.');
      return;
    }
    // Vérification pour éviter qu'une tâche soit à la fois un groupe et une sous-tâche
    if (newTaskData.Parent_Task_ID.trim() !== '' && newTaskData.Sous_Taches_IDs.trim() !== '') {
        toast.error('Une tâche ne peut pas être à la fois une sous-tâche et un groupe de tâches.');
        return;
    }
    if (newTaskData.Sous_Taches_IDs.trim() !== '' && newTaskData.Parent_Task_ID.trim() !== '') {
        toast.error('Une tâche ne peut pas être à la fois un groupe de tâches et une sous-tâche.');
        return;
    }

    setLoading(true);
    try {
      const action = editingTask ? 'updateTask' : 'addTask';
      const payload = { 
        action: action, 
        task: {
          ...newTaskData,
          Points: newTaskData.Points === '' ? '' : parseFloat(newTaskData.Points) 
        }
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchTaches(); // Rafraîchir la liste des tâches
        setShowAdminTaskFormModal(false); 
        setEditingTask(null);
        // Réinitialiser le formulaire
        setNewTaskData({ 
          ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
          Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
        });
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, skipConfirmation = false) => {
    if (!skipConfirmation) {
      setTaskToDelete(taskId);
      setShowDeleteConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'deleteTask', idTache: taskId })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchTaches(); // Rafraîchir la liste des tâches
        fetchRealisations(); // Rafraîchir les réalisations car une tâche a pu être supprimée
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false); 
      setTaskToDelete(null);
    }
  };

  // --- Fonctions d'administration des OBJECTIFS ---
  const handleObjectiveFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewObjectiveData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitObjective = async () => {
    if (!newObjectiveData.ID_Objectif.trim()) {
      toast.error('L\'ID de l\'objectif est requis.');
      return;
    }
    if (!newObjectiveData.Nom_Objectif.trim()) {
      toast.error('Le nom de l\'objectif est requis.');
      return;
    }
    if (isNaN(parseFloat(newObjectiveData.Cible_Points))) {
      toast.error('Les points cible doivent être un nombre valide.');
      return;
    }
    if (newObjectiveData.Type_Cible === 'Par_Categorie' && !newObjectiveData.Categorie_Cible.trim()) {
      toast.error('La catégorie cible est requise pour le type "Par Catégorie".');
      return;
    }

    setLoading(true);
    try {
      const action = editingObjective ? 'updateObjectif' : 'addObjectif';
      const payload = { 
        action: action, 
        objective: {
          ...newObjectiveData,
          Cible_Points: parseFloat(newObjectiveData.Cible_Points),
          Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
          Est_Atteint: newObjectiveData.Est_Atteint
        }
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchObjectives(); // Rafraîchir la liste des objectifs
        setShowAdminObjectiveFormModal(false); 
        setEditingObjective(null);
        // Réinitialiser le formulaire
        setNewObjectiveData({ 
          ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '', 
          Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
        });
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObjective = async (objectiveId, skipConfirmation = false) => {
    if (!skipConfirmation) {
      setObjectiveToDelete(objectiveId);
      setShowDeleteObjectiveConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'deleteObjectif', idObjectif: objectiveId })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchObjectives(); // Rafraîchir la liste des objectifs
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteObjectiveConfirmModal(false); 
      setObjectiveToDelete(null);
    }
  };


  // Effet pour charger les données initiales au montage du composant
  // Les fonctions fetch sont ajoutées aux dépendances pour respecter la règle react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTaches();
    fetchClassement();
    fetchRealisations(); 
    fetchObjectives(); 
    fetchCongratulatoryMessages(); 
    fetchHistoricalPodiums(); 
  }, [fetchTaches, fetchClassement, fetchRealisations, fetchObjectives, fetchCongratulatoryMessages, fetchHistoricalPodiums]);

  // Gère le clic sur un participant dans le classement pour afficher son profil
  const handleParticipantClick = async (participant) => {
    setSelectedParticipantProfile(participant);
    setActiveMainView('participantProfile');
    await fetchParticipantWeeklyTasks(participant.Nom_Participant);
  };

  // Gère le clic sur une tâche pour ouvrir le dialogue de confirmation ou de sous-tâches
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    if (task.Sous_Taches_IDs && String(task.Sous_Taches_IDs).trim() !== '') {
      fetchSubTasks(task.ID_Tache); 
      setShowSplitTaskDialog(true); 
    } else {
      setShowSplitTaskDialog(false); 
    }
  };

  // Vérifie si une sous-tâche est disponible (non complétée pour sa période)
  const isSubTaskAvailable = (subTask) => {
    const frequence = subTask.Frequence ? String(subTask.Frequence).toLowerCase() : 'hebdomadaire';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0); 

    return !realisations.some(real => {
      if (String(real.ID_Tache_Effectuee || '') === String(subTask.ID_Tache)) {
        const realDate = new Date(real.Timestamp);
        realDate.setHours(0, 0, 0, 0);

        if (frequence === 'quotidien') {
          return realDate.toDateString() === today.toDateString();
        } else if (frequence === 'hebdomadaire') {
          return realDate >= startOfCurrentWeek;
        } else if (frequence === 'ponctuel') {
          return true; 
        }
      }
      return false;
    });
  };

  // --- Logique des Badges ---
  const getParticipantBadges = (participant) => {
    const badges = [];
    const participantRealisations = realisations.filter(r => String(r.Nom_Participant).trim() === String(participant.Nom_Participant).trim());
    
    const totalPoints = parseFloat(participant.Points_Total_Cumulatif) || 0;
    
    if (totalPoints >= 50) {
      badges.push({ name: 'Nettoyeur Débutant', icon: '✨', description: 'Atteint 50 points cumulés.' });
    }
    if (totalPoints >= 200) {
      badges.push({ name: 'Nettoyeur Pro', icon: '🌟', description: 'Atteint 200 points cumulés.' });
    }
    if (totalPoints >= 500) {
      badges.push({ name: 'Maître de la Propreté', icon: '👑', description: 'Atteint 500 points cumulés.' });
    }

    const tasksThisWeek = participantRealisations.filter(real => {
        const realDate = new Date(real.Timestamp);
        realDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfCurrentWeek.setHours(0, 0, 0, 0);
        return realDate >= startOfCurrentWeek;
    }).length;
    if (tasksThisWeek >= 3) {
        badges.push({ name: 'Actif de la Semaine', icon: '🔥', description: '3 tâches ou plus complétées cette semaine.' });
    }

    const kitchenTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'cuisine').length;
    if (kitchenTasks >= 5) {
      badges.push({ name: 'Spécialiste Cuisine', icon: '🍳', description: '5 tâches de cuisine complétées.' });
    }

    const roomTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'salle').length;
    if (roomTasks >= 5) {
      badges.push({ name: 'Spécialiste Salle', icon: '🛋️', description: '5 tâches de salle complétées.' });
    }

    const hasBeenFirst = historicalPodiums.some(podium => 
      podium.top3.length > 0 && String(podium.top3[0].name).trim() === String(participant.Nom_Participant).trim()
    );
    if (hasBeenFirst) {
      badges.push({ name: 'Ancien Champion', icon: '🥇', description: 'A déjà été premier du podium.' });
    }

    return badges;
  };


  // Classes Tailwind pour l'affichage de l'urgence
  const getUrgencyClasses = (urgency) => {
    switch (urgency ? String(urgency).toLowerCase() : '') { 
        case 'haute':
            return 'bg-error text-white shadow-md'; 
        case 'moyenne':
            return 'bg-warning text-text shadow-md'; 
        case 'faible':
            return 'bg-success text-white shadow-md'; 
        default:
            return 'bg-neutralBg text-lightText shadow-sm'; 
    }
  };

  // Classes Tailwind pour l'affichage de la fréquence
  const getFrequencyClasses = (frequency) => {
    switch (frequency ? String(frequency).toLowerCase() : '') { 
      case 'hebdomadaire':
        return 'bg-blue-100 text-blue-800'; 
      case 'quotidien':
        return 'bg-green-100 text-green-800'; 
      case 'ponctuel':
        return 'bg-red-100 text-red-800'; 
      default:
        return 'bg-gray-100 text-gray-800'; 
    }
  };

  // Classes Tailwind pour l'affichage de la catégorie
  const getCategoryClasses = (category) => {
    switch (String(category || '').toLowerCase()) { 
      case 'tous':
        return 'bg-purple-100 text-purple-800';
      case 'salle':
        return 'bg-orange-100 text-orange-800';
      case 'cuisine':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // --- Composants de rendu ---

  // Rendu de la section Podium et Tendances
  const renderPodiumSection = () => {
    if (!Array.isArray(classement) || classement.length === 0) return <p className="text-center text-lightText text-lg">Aucun classement disponible pour le moment.</p>;

    const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze']; 
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl text-center"> 
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary mb-6 sm:mb-8 whitespace-nowrap overflow-hidden text-ellipsis">🏆 Podium de la semaine 🏆</h2> 
        <div className="flex justify-center items-end mt-4 sm:mt-6 gap-2 sm:gap-4"> 
          {/* 2ème Place */}
          {classement.length > 1 && (
            <div 
              key={classement[1].Nom_Participant || `anon-silver`} 
              className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                ${podiumColors[1]} order-1 w-1/3 sm:w-auto`} 
              onClick={() => handleParticipantClick(classement[1])} 
            >
              <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[1]}</span> 
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{classement[1].Nom_Participant}</p> 
              <p className="text-xs sm:text-base text-lightText">{classement[1].Points_Total_Semaine_Courante} pts</p> 
            </div>
          )}

          {/* 1ère Place */}
          {classement.length > 0 && (
            <div 
              key={classement[0].Nom_Participant || `anon-gold`} 
              className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                ${podiumColors[0]} order-2 w-1/3 sm:w-auto -translate-y-2`} 
              onClick={() => handleParticipantClick(classement[0])} 
            >
              <span className={`text-5xl sm:text-6xl mb-0.5 sm:mb-1`}>{medals[0]}</span> 
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{classement[0].Nom_Participant}</p> 
              <p className="text-xs sm:text-base text-lightText">{classement[0].Points_Total_Semaine_Courante} pts</p> 
            </div>
          )}

          {/* 3ème Place */}
          {classement.length > 2 && (
            <div 
              key={classement[2].Nom_Participant || `anon-bronze`} 
              className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                ${podiumColors[2]} order-3 w-1/3 sm:w-auto`} 
              onClick={() => handleParticipantClick(classement[2])} 
            >
              <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[2]}</span> 
              <p className="font-bold text-xs sm:text-lg mb-0.5 text-text truncate w-full px-1 text-center">{classement[2].Nom_Participant}</p> 
              <p className="text-xs sm:text-base text-lightText">{classement[2].Points_Total_Semaine_Courante} pts</p> 
            </div>
          )}
        </div>
        {classement.length > 0 && (
          <button 
            className="mt-6 sm:mt-8 bg-success hover:bg-green-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base" 
            onClick={() => setActiveMainView('fullRanking')} 
          >
            Voir le classement complet
          </button>
        )}
        {renderHighlights()} 
        {renderObjectivesSection()} {/* Objectifs communs ici */}
      </div>
    );
  };

  // Rendu de la section Tendances Actuelles
  const renderHighlights = () => {
    let mostImproved = null;
    let maxImprovement = -1;

    // Calcul du participant le plus amélioré (si l'historique est disponible)
    const lastPodium = historicalPodiums.length > 0 ? historicalPodiums[0] : null;

    if (lastPodium) {
        classement.forEach(currentP => {
            const previousScore = parseFloat(currentP.Points_Total_Semaine_Precedente) || 0;
            const currentScore = parseFloat(currentP.Points_Total_Semaine_Courante) || 0;
            const improvement = currentScore - previousScore;

            if (improvement > maxImprovement) {
                maxImprovement = improvement;
                mostImproved = currentP;
            }
        });
    }

    let mostActive = null;
    let maxTasksCompleted = -1;
    const tasksByParticipantThisWeek = new Map();

    // Calcul du participant le plus actif cette semaine
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // Dimanche = 0, Lundi = 1, etc.
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Début de semaine (Lundi)
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    realisations.forEach(real => {
        const realDate = new Date(real.Timestamp);
        realDate.setHours(0, 0, 0, 0);
        if (realDate >= startOfCurrentWeek) {
            const name = String(real.Nom_Participant).trim();
            tasksByParticipantThisWeek.set(name, (tasksByParticipantThisWeek.get(name) || 0) + 1);
        }
    });

    tasksByParticipantThisWeek.forEach((count, name) => {
        if (count > maxTasksCompleted) {
            maxTasksCompleted = count;
            mostActive = classement.find(p => String(p.Nom_Participant).trim() === name);
        }
    });

    if (!mostImproved && !mostActive) {
        return null; 
    }

    return (
      <div className="mt-6 border-t border-neutralBg pt-4"> 
        <button
          onClick={() => setShowHighlightsSection(!showHighlightsSection)}
          className="w-full bg-neutralBg hover:bg-neutralBg/80 text-text font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base"
        >
          <span>✨ Tendances Actuelles ✨</span>
          <span>{showHighlightsSection ? '▲' : '▼'}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showHighlightsSection ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
            {mostImproved && maxImprovement > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50"> 
                <h3 className="text-base font-bold text-primary mb-1">Plus Amélioré</h3>
                <p className="text-text text-sm font-semibold">{mostImproved.Nom_Participant}</p>
                <p className="text-lightText text-xs">+{maxImprovement} pts cette semaine</p>
              </div>
            )}
            {mostActive && maxTasksCompleted > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50">
                <h3 className="text-base font-bold text-primary mb-1">Plus Actif</h3>
                <p className="text-text text-sm font-semibold">{mostActive.Nom_Participant}</p>
                <p className="text-lightText text-xs">{maxTasksCompleted} tâches complétées cette semaine</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Rendu de la section Objectifs Communs sur la page d'accueil
  const renderObjectivesSection = () => {
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 border-t border-neutralBg pt-4"> {/* Marge et bordure pour séparer des tendances */}
        <button
          onClick={() => setShowObjectivesSection(!showObjectivesSection)}
          className="w-full bg-neutralBg hover:bg-neutralBg/80 text-text font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base"
        >
          <span>🎯 Objectifs Communs 🎯</span>
          <span>{showObjectivesSection ? '▲' : '▼'}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showObjectivesSection ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-2"> {/* Espacement plus compact */}
            {objectives.map(obj => {
              const currentPoints = parseFloat(obj.Points_Actuels) || 0;
              const targetPoints = parseFloat(obj.Cible_Points) || 0;
              const progress = targetPoints > 0 ? (currentPoints / targetPoints) * 100 : 0;
              const isCompleted = obj.Est_Atteint === true || String(obj.Est_Atteint).toLowerCase() === 'true' || currentPoints >= targetPoints;

              return (
                <div key={obj.ID_Objectif} className={`bg-white rounded-lg p-3 shadow-sm border 
                  ${isCompleted ? 'border-success' : 'border-primary/10'}`}> {/* Couleurs plus douces */}
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-bold text-primary truncate">{obj.Nom_Objectif}</h3> {/* Texte plus petit */}
                    {isCompleted ? (
                      <span className="text-success font-bold text-sm">✅ Atteint !</span>
                    ) : (
                      <span className="text-text font-semibold text-sm">{currentPoints} / {targetPoints} pts</span>
                    )}
                  </div>
                  <p className="text-lightText text-xs mb-2 truncate">{obj.Description_Objectif}</p> {/* Texte encore plus petit */}
                  <div className="w-full bg-gray-200 rounded-full h-2"> {/* Barre de progression plus fine */}
                    <div 
                      className={`h-2 rounded-full ${isCompleted ? 'bg-success' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };


  // Rendu des catégories de tâches
  const renderTaskCategories = () => {
    const categories = [
      { name: 'tous', label: 'Tâches Communes' },
      { name: 'salle', label: 'Tâches Salle' },
      { name: 'cuisine', label: 'Tâches Cuisine' }
    ];

    const currentCategoryTasks = taches.filter(tache => {
      if (activeTaskCategory === 'tous') {
        return tache.Categorie && String(tache.Categorie).toLowerCase() === 'tous'; 
      } else {
        return tache.Categorie && String(tache.Categorie).toLowerCase() === activeTaskCategory; 
      }
    });

    const ponctuelTasks = currentCategoryTasks.filter(t => (String(t.Frequence || '')).toLowerCase() === 'ponctuel');
    const quotidienTasks = currentCategoryTasks.filter(t => (String(t.Frequence || '')).toLowerCase() === 'quotidien');
    const hebdomadaireTasks = currentCategoryTasks.filter(t => (String(t.Frequence || '')).toLowerCase() === 'hebdomadaire' || !(t.Frequence)); 

    const renderTasksList = (tasks) => {
      if (tasks.length === 0) {
        return <p className="text-center text-lightText text-md py-2">Aucune tâche disponible dans cette section.</p>;
      }
      return (
        <div className="space-y-3">
          {tasks.map(tache => {
            const isCompletedForPeriod = !isSubTaskAvailable(tache); 

            if (isCompletedForPeriod) {
              return null; // Ne pas afficher les tâches déjà complétées pour la période
            }

            const cardClasses = `bg-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center justify-between 
                                 cursor-pointer shadow-lg hover:shadow-xl transition duration-200 ease-in-out transform hover:-translate-y-1 border border-blue-100`; 

            return (
              <div 
                key={tache.ID_Tache} 
                className={cardClasses}
                onClick={() => handleTaskClick(tache)} 
              >
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-center sm:items-center mb-2 sm:mb-0"> 
                    <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight truncate mr-2 text-center sm:text-left"> 
                        {tache.Nom_Tache}
                    </h4> 
                    {tache.isGroupTask && (
                        <span className="ml-0 sm:ml-2 px-1 py-0.5 text-[0.4rem] sm:text-xs font-semibold rounded-full bg-primary text-white shadow-sm whitespace-nowrap mt-1 sm:mt-0">
                            Groupe de tâches
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1 sm:gap-2 w-full sm:w-auto"> 
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getUrgencyClasses(tache.Urgence)}`}> 
                        {tache.Urgence || 'Normal'} 
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getFrequencyClasses(tache.Frequence)}`}> 
                        {tache.Frequence || 'Hebdomadaire'}
                    </span>
                    <div className="border border-primary text-primary font-bold text-xs sm:text-base px-1.5 py-0.5 rounded-md bg-primary/10"> 
                        {tache.Calculated_Points} pts
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl"> 
        <div className="flex justify-center gap-2 sm:gap-4 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`py-2 px-5 rounded-full font-semibold text-sm sm:text-base transition duration-300 ease-in-out transform hover:scale-105 shadow-md
                ${activeTaskCategory === cat.name 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
              onClick={() => setActiveTaskCategory(cat.name)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {ponctuelTasks.filter(t => isSubTaskAvailable(t)).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Ponctuelles</h3> 
            {renderTasksList(ponctuelTasks)}
          </div>
        )}

        {quotidienTasks.filter(t => isSubTaskAvailable(t)).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Quotidiennes</h3> 
            {renderTasksList(quotidienTasks)}
          </div>
        )}

        {hebdomadaireTasks.filter(t => isSubTaskAvailable(t)).length > 0 && ( 
          <div className="mb-6"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Hebdomadaires</h3> 
            {renderTasksList(hebdomadaireTasks)}
          </div>
        )}

        {currentCategoryTasks.filter(t => isSubTaskAvailable(t)).length === 0 && (
          <p className="text-center text-lightText text-lg py-4">Aucune tâche disponible dans cette catégorie.</p>
        )}
      </div>
    );
  };

  // Rendu des tâches terminées
  const renderCompletedTasks = () => {
    if (!Array.isArray(realisations) || realisations.length === 0) {
      return (
        <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
          <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Tâches Terminées</h2>
          <p className="text-center text-lightText text-lg">Aucune tâche n'a été terminée pour le moment.</p>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Tâches Terminées</h2>
        <div className="space-y-3 text-left"> 
          {realisations.map((real, index) => (
            <div key={real.Timestamp + real.Nom_Participant + index} 
                 className="bg-card rounded-2xl p-3 sm:p-4 flex flex-col shadow-lg border border-blue-100"> 
              <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight mb-1">
                  {real.Nom_Tache_Effectuee}
              </h4>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-lightText">
                  <span>par <strong className="text-text">{real.Nom_Participant}</strong></span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(real.Categorie_Tache)}`}>
                      {real.Categorie_Tache || 'Non catégorisée'}
                  </span>
                  <span>le {new Date(real.Timestamp).toLocaleDateString('fr-FR')} à {new Date(real.Timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base"
          onClick={() => setActiveMainView('home')}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  };

  // Rendu du popup de remerciement après la validation d'une tâche
  const renderThankYouPopup = () => {
    if (!showThankYouPopup) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20"> 
          <h3 className="text-3xl sm:text-4xl font-bold text-success mb-6 sm:mb-8">🎉 Bravo ! 🎉</h3> 
          <p className="text-lg sm:text-xl text-text mb-6 sm:mb-8">
            {showThankYouPopup.message}
            <br/>
            Tâche: "<strong className="text-primary">{showThankYouPopup.task}</strong>" réalisée par <strong className="text-secondary">{showThankYouPopup.name}</strong>.
          </p>
          <button 
            onClick={() => setShowThankYouPopup(null)} 
            className="bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base"
          >
            Super !
          </button>
        </div>
      </div>
    );
  };


  // Rendu du dialogue de confirmation de tâche (pour tâches simples)
  const renderTaskDialog = () => {
    if (!selectedTask || selectedTask.isGroupTask) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20"> 
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Confirmer la tâche</h3> 
          <p className="text-base sm:text-lg mb-4">Tâche: <strong className="text-text">{selectedTask.Nom_Tache}</strong> (<span className="font-semibold text-primary">{selectedTask.Calculated_Points} points</span>)</p>
          <label htmlFor="participantName" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Votre nom:</label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            autoFocus
          />
          <div className="flex flex-col gap-3 sm:gap-4 mt-4"> 
            <button 
              onClick={() => recordTask(selectedTask.ID_Tache)} 
              disabled={loading}
              className="bg-success hover:bg-green-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              {loading ? 'Envoi...' : 'Valider la tâche'} 
            </button>
            <button 
              onClick={() => { setSelectedTask(null); setParticipantName(''); }} 
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSplitTaskDialog = () => {
    if (!showSplitTaskDialog || !selectedTask || !selectedTask.isGroupTask) {
      return null;
    }

    const handleSubTaskChange = (subTask) => {
      if (isSubTaskAvailable(subTask)) {
        setSelectedSubTasks(prev => 
          prev.some(t => String(t.ID_Tache) === String(subTask.ID_Tache)) 
            ? prev.filter(t => String(t.ID_Tache) !== String(subTask.ID_Tache))
            : [...prev, subTask]
        );
      } else {
        toast.info(`La tâche "${subTask.Nom_Tache}" a déjà été réalisée pour sa période.`);
      }
    };

    const handleClose = () => {
      setShowSplitTaskDialog(false);
      setSelectedTask(null);
      setSubTasks([]);
      setSelectedSubTasks([]);
      setParticipantName('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
            Compléter: {selectedTask.Nom_Tache}
          </h3>
          <p className="text-base sm:text-lg mb-4 text-lightText">
            Sélectionnez les parties que vous avez réalisées :
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des sous-tâches...</p>
            </div>
          ) : (
            Array.isArray(subTasks) && subTasks.length > 0 ? (
              <div className="space-y-3 mb-6 text-left">
                {subTasks.map(subTask => {
                  const available = isSubTaskAvailable(subTask);
                  const isChecked = selectedSubTasks.some(t => String(t.ID_Tache) === String(subTask.ID_Tache));
                  return (
                    <label 
                      key={subTask.ID_Tache} 
                      className={`flex items-center p-3 rounded-lg shadow-sm cursor-pointer transition duration-150 
                                  ${available ? 'bg-neutralBg hover:bg-neutralBg/80' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSubTaskChange(subTask)}
                        disabled={!available} 
                        className={`form-checkbox h-5 w-5 rounded focus:ring-primary mr-3 
                                    ${available ? 'text-primary' : 'text-gray-400'}`}
                      />
                      <span className={`font-medium text-base sm:text-lg flex-1 ${!available ? 'line-through' : 'text-text'}`}>
                        {subTask.Nom_Tache} ({subTask.Points} pts)
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-lightText text-md py-2">Aucune sous-tâche disponible pour cette tâche, ou erreur de chargement.</p>
            )
          )}

          <label htmlFor="participantNameSplit" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Votre nom:</label>
          <input
            id="participantNameSplit"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            autoFocus
          />

          <div className="flex flex-col gap-3 sm:gap-4 mt-4">
            <button
              onClick={recordMultipleTasks}
              disabled={loading || selectedSubTasks.length === 0}
              className="bg-success hover:bg-green-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              {loading ? 'Envoi...' : 'Valider les tâches sélectionnées'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Rendu du profil du participant
  const renderParticipantProfile = () => {
    if (!selectedParticipantProfile) return null;

    const participantCumulativePoints = selectedParticipantProfile.Points_Total_Cumulatif || 0;
    const engagementPercentage = totalGlobalCumulativePoints > 0 
      ? ((participantCumulativePoints / totalGlobalCumulativePoints) * 100).toFixed(2) 
      : 0;

    const participantBadges = getParticipantBadges(selectedParticipantProfile);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Profil de {selectedParticipantProfile.Nom_Participant}</h2>
        <div className="mb-6 p-4 bg-neutralBg rounded-xl shadow-inner"> 
          <p className="text-lg sm:text-xl font-semibold text-text">
            Score d'implication global : <span className="text-primary font-bold">{engagementPercentage}%</span>
          </p>
          <p className="text-base sm:text-lg text-lightText mt-2">
            Points cumulés : <span className="font-bold">{participantCumulativePoints}</span>
          </p>
          {participantBadges.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-primary mb-2">Vos Badges :</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {participantBadges.map(badge => (
                  <span 
                    key={badge.name} 
                    title={badge.description} 
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm"
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">Tâches réalisées cette semaine :</h3>
        {participantWeeklyTasks.length > 0 ? (
          <div className="space-y-3 text-left"> 
            {participantWeeklyTasks.map((task, index) => (
              <div key={task.Timestamp + task.ID_Tache_Effectuee + index} className="bg-card rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between 
                         shadow-lg border border-blue-100"> 
                <div className="flex-1 min-w-0"> 
                    <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight truncate"> 
                        {task.Nom_Tache_Effectuee}
                    </h4> 
                    <div className="flex items-center space-x-2 mt-1"> 
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(task.Categorie_Tache)}`}>
                            {task.Categorie_Tache || 'Non catégorisée'}
                        </span>
                        <span className="text-sm text-lightText">
                            {new Date(task.Timestamp).toLocaleDateString('fr-FR')} 
                        </span>
                    </div>
                </div>
                <p className="text-primary font-bold text-sm sm:text-base flex-shrink-0 ml-2"> 
                    {task.Points_Gagnes} pts
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lightText text-md sm:text-lg">Aucune tâche réalisée cette semaine.</p>
        )}

        <button 
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg 
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base" 
          onClick={() => setActiveMainView('home')}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  };

  // Rendu de la modale de confirmation de réinitialisation
  const renderConfirmResetModal = () => {
    if (!showConfirmResetModal) return null;

    return (
      <ConfirmActionModal
        title="Confirmer la Réinitialisation"
        message="Êtes-vous sûr de vouloir réinitialiser les points hebdomadaires et enregistrer le podium ? Cette action est irréversible."
        confirmText="Oui, Réinitialiser"
        cancelText="Non, Annuler"
        onConfirm={resetWeeklyPoints}
        onCancel={() => setShowConfirmResetModal(false)}
        loading={loading}
      />
    );
  };

  // Rendu de la modale de confirmation de suppression de tâche
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || !taskToDelete) return null;

    return (
      <ConfirmActionModal
        title="Confirmer la Suppression"
        message={`Êtes-vous sûr de vouloir supprimer la tâche avec l'ID "${taskToDelete}" ? Cette action est irréversible.`}
        confirmText="Oui, Supprimer"
        cancelText="Non, Annuler"
        onConfirm={() => handleDeleteTask(taskToDelete, true)} 
        onCancel={() => { setShowDeleteConfirmModal(false); setTaskToDelete(null); }}
        loading={loading}
      />
    );
  };

  // Rendu de la modale de confirmation de suppression d'objectif
  const renderDeleteObjectiveConfirmModal = () => {
    if (!showDeleteObjectiveConfirmModal || !objectiveToDelete) return null;

    return (
      <ConfirmActionModal
        title="Confirmer la Suppression de l'Objectif"
        message={`Êtes-vous sûr de vouloir supprimer l'objectif avec l'ID "${objectiveToDelete}" ? Cette action est irréversible.`}
        confirmText="Oui, Supprimer"
        cancelText="Non, Annuler"
        onConfirm={() => handleDeleteObjective(objectiveToDelete, true)}
        onCancel={() => { setShowDeleteObjectiveConfirmModal(false); setObjectiveToDelete(null); }}
        loading={loading}
      />
    );
  };

  // --- Fonctions d'export CSV ---
  const exportToCsv = (filename, dataArray, headers) => {
    if (!dataArray || dataArray.length === 0) {
      toast.info(`Aucune donnée à exporter pour ${filename}.`);
      return;
    }

    const processedData = dataArray.map(row => 
      headers.map(header => {
        let value = row[header];
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    const csvContent = [
      headers.join(','), 
      ...processedData
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`"${filename}" exporté avec succès !`);
    } else {
      toast.error("Votre navigateur ne supporte pas l'export CSV direct.");
    }
  };

  const handleExportClassement = () => {
    const baseHeaders = ['Nom_Participant', 'Points_Total_Semaine_Courante', 'Points_Total_Cumulatif', 'Points_Total_Semaine_Precedente'];
    const allHeaders = [...baseHeaders]; 

    const dataToExport = classement.map(p => ({
        Nom_Participant: p.Nom_Participant,
        Points_Total_Semaine_Courante: p.Points_Total_Semaine_Courante,
        Points_Total_Cumulatif: p.Points_Total_Cumulatif,
        Points_Total_Semaine_Precedente: p.Points_Total_Semaine_Precedente 
    }));

    exportToCsv('classement_clean_app.csv', dataToExport, allHeaders);
  };

  const handleExportRealisations = () => {
    const headers = ['Timestamp', 'Nom_Participant', 'ID_Tache_Effectuee', 'Nom_Tache_Effectuee', 'Categorie_Tache', 'Points_Gagnes'];
    exportToCsv('realisations_clean_app.csv', realisations, headers);
  };


  // Rendu du panneau d'administration
  const renderAdminPanel = () => {
    if (!isAdmin) {
      return null; 
    }

    const adminButtonClasses = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300";

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-6 text-center">Panneau d'Administration</h2>
        
        {/* Actions générales */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowConfirmResetModal(true)}
            className={adminButtonClasses}
          >
            Réinitialiser Points Hebdo
          </button>
          <button
            onClick={handleExportClassement}
            className={adminButtonClasses}
          >
            Exporter Classement CSV
          </button>
          <button
            onClick={handleExportRealisations}
            className={adminButtonClasses}
          >
            Exporter Réalisations CSV
          </button>
        </div>

        {/* Section Graphique des statistiques des tâches */}
        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">Statistiques des Tâches</h3>
            <TaskStatisticsChart realisations={realisations} allRawTaches={allRawTaches} />
        </div>

        {/* Section de gestion des OBJECTIFS (avec menu déroulant) */}
        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowAdminObjectivesManagement(!showAdminObjectivesManagement)}
            className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base mb-4"
          >
            <span>🎯 Gestion des Objectifs 🎯</span>
            <span>{showAdminObjectivesManagement ? '▲' : '▼'}</span>
          </button>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdminObjectivesManagement ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <button
              onClick={() => {
                setShowAdminObjectiveFormModal(true);
                setEditingObjective(null);
                setNewObjectiveData({ 
                  ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
                  Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
                });
              }}
              className={`${adminButtonClasses} w-full mb-4`}
            >
              Ajouter un nouvel objectif
            </button>

            {showAdminObjectiveFormModal && (
              <AdminObjectiveFormModal
                objectiveData={newObjectiveData}
                onFormChange={handleObjectiveFormChange}
                onSubmit={handleSubmitObjective}
                onClose={() => {
                  setShowAdminObjectiveFormModal(false);
                  setEditingObjective(null);
                  setNewObjectiveData({
                    ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
                    Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
                  });
                }}
                loading={loading}
                editingObjective={editingObjective}
              />
            )}

            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">Tous les Objectifs</h4>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                <p className="ml-3 text-lightText">Chargement des objectifs...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {objectives.length === 0 ? (
                  <p className="text-center text-lightText text-lg">Aucun objectif disponible.</p>
                ) : (
                  objectives.map(obj => (
                    <div key={obj.ID_Objectif} className="bg-white rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                        <p className="font-bold text-text text-lg truncate">{obj.Nom_Objectif} <span className="text-sm text-lightText">({obj.ID_Objectif})</span></p>
                        <p className="text-sm text-lightText">Cible: {obj.Cible_Points} | Actuel: {obj.Points_Actuels} | Type: {obj.Type_Cible} {obj.Categorie_Cible && `(${obj.Categorie_Cible})`}</p>
                        <p className="text-sm text-lightText">Atteint: {obj.Est_Atteint ? 'Oui' : 'Non'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                        <button
                          onClick={() => {
                            setEditingObjective(obj);
                            setNewObjectiveData(obj);
                            setShowAdminObjectiveFormModal(true);
                          }}
                          className={`${adminButtonClasses} !bg-accent hover:!bg-yellow-600`}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteObjective(obj.ID_Objectif)}
                          className={`${adminButtonClasses} !bg-error hover:!bg-red-700`}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section de gestion des TÂCHES (avec menu déroulant) */}
        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowAdminTasksManagement(!showAdminTasksManagement)}
            className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base mb-4"
          >
            <span>📝 Gestion des Tâches 📝</span>
            <span>{showAdminTasksManagement ? '▲' : '▼'}</span>
          </button>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdminTasksManagement ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <button
              onClick={() => { 
                setShowAdminTaskFormModal(true); 
                setEditingTask(null); 
                setNewTaskData({ 
                  ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
                  Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
                }); 
              }}
              className={`${adminButtonClasses} w-full mb-4`}
            >
              Ajouter une nouvelle tâche
            </button>

            {showAdminTaskFormModal && (
              <AdminTaskFormModal
                taskData={newTaskData}
                onFormChange={handleTaskFormChange}
                onSubmit={handleSubmitTask}
                onClose={() => { 
                  setShowAdminTaskFormModal(false); 
                  setEditingTask(null); 
                  setNewTaskData({
                    ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
                    Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
                  }); 
                }}
                loading={loading}
                editingTask={editingTask}
              />
            )}

            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">Toutes les Tâches</h4>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                <p className="ml-3 text-lightText">Chargement des tâches...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRawTaches.length === 0 ? (
                  <p className="text-center text-lightText text-lg">Aucune tâche disponible.</p>
                ) : (
                  allRawTaches.map(task => (
                    <div key={task.ID_Tache} className="bg-white rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                        <p className="font-bold text-text text-lg truncate">{task.Nom_Tache} <span className="text-sm text-lightText">({task.ID_Tache})</span></p>
                        <p className="text-sm text-lightText">Points: {task.Points} | Fréq: {task.Frequence} | Urg: {task.Urgence} | Cat: {task.Categorie}</p>
                        {task.Sous_Taches_IDs && <p className="text-xs text-lightText">Sous-tâches: {task.Sous_Taches_IDs}</p>}
                        {task.Parent_Task_ID && <p className="text-xs text-lightText">Parent: {task.Parent_Task_ID}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                        <button
                          onClick={() => { 
                            setEditingTask(task); 
                            setNewTaskData(task); 
                            setShowAdminTaskFormModal(true); 
                          }}
                          className={`${adminButtonClasses} !bg-accent hover:!bg-yellow-600`}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.ID_Tache)}
                          className={`${adminButtonClasses} !bg-error hover:!bg-red-700`}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  // Affichage du loader pendant le chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"> 
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast mb-4 sm:mb-6"></div> 
        <p className="text-xl sm:text-2xl font-semibold text-lightText">Chargement des données...</p> 
      </div>
    );
  }

  // Affichage de l'erreur si une erreur survient
  if (error) return <div className="text-center p-8 text-xl text-error">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-background font-sans p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="relative flex flex-col items-center justify-center py-6 sm:py-8 px-4 mb-8 sm:mb-10 text-center"> 
          <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-4 sm:mb-5 h-24 sm:h-32 md:h-40 w-auto drop-shadow-xl" /> 
          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-secondary drop-shadow-md">Clean App Challenge</h1> 
          <AdminLoginButton 
            isAdmin={isAdmin} 
            onLogin={handleAdminLogin} 
            onLogout={handleAdminLogout} 
            onOpenAdminPanel={() => setActiveMainView('adminPanel')} 
            buttonClass="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300" 
          />
        </header>

        <nav className="flex justify-center gap-2 sm:gap-6 mb-8 sm:mb-10 flex-wrap"> 
          <button
            className={`py-2.5 px-6 sm:py-3 sm:px-7 rounded-lg font-bold text-sm sm:text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${activeMainView === 'home' ? 'bg-primary text-white shadow-lg' : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
            onClick={() => setActiveMainView('home')}
          >
            Accueil
          </button>
          <button
            className={`py-2.5 px-6 sm:py-3 sm:px-7 rounded-lg font-bold text-sm sm:text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${activeMainView === 'completedTasks' ? 'bg-primary text-white shadow-lg' : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
            onClick={() => setActiveMainView('completedTasks')}
          >
            Tâches Terminées
          </button>
          <button
            className={`py-2.5 px-6 sm:py-3 sm:px-7 rounded-lg font-bold text-sm sm:text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${activeMainView === 'historicalPodiums' ? 'bg-primary text-white shadow-lg' : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
            onClick={() => setActiveMainView('historicalPodiums')}
          >
            Historique des Podiums
          </button>
        </nav>

        <main>
          {activeMainView === 'home' && (
            <>
              {renderPodiumSection()} 
              <hr className="my-8 sm:my-10 border-t-2 border-neutralBg" /> 
              {renderTaskCategories()}
            </>
          )}
          {activeMainView === 'fullRanking' && (
            <FullRankingTable 
              classement={classement} 
              onClose={() => setActiveMainView('home')} 
              onParticipantClick={handleParticipantClick} 
              realisations={realisations} 
              historicalPodiums={historicalPodiums} 
            />
          )}
          {activeMainView === 'historicalPodiums' && (
            <HistoricalPodiums historicalPodiums={historicalPodiums} onClose={() => setActiveMainView('home')} />
          )}
          {activeMainView === 'completedTasks' && (
            <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl">
              {renderCompletedTasks()}
            </div>
          )}
          {activeMainView === 'participantProfile' && ( 
            renderParticipantProfile()
          )}
          {activeMainView === 'adminPanel' && (
            renderAdminPanel()
          )}
        </main>
        {/* Modales et popups */}
        {renderTaskDialog()}
        {renderThankYouPopup()} 
        {renderSplitTaskDialog()} 
        {renderConfirmResetModal()} 
        {renderDeleteConfirmModal()} 
        {renderDeleteObjectiveConfirmModal()} 
        <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} /> 
      </div>
      {/* Conteneur pour les notifications toast */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
