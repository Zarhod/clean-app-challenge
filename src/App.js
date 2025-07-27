import React, { useState, useEffect, useCallback } from 'react';
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

// --- API CONFIGURATION ---
const API_URL = 'https://clean-app-challenge-api.jassairbus.workers.dev/'; 
const AUTH_TOKEN = '6f36b6b0-0ed4-4b2b-a45c-b70f8145c1f2';        

// Logo filename (make sure it's in the public/ folder)
const LOGO_FILENAME = 'logo.png'; 

// Admin password (IMPORTANT: Change for production!)
const ADMIN_PASSWORD = 'Bombardier111'; // Changed back to original

function App() {
  const [taches, setTaches] = useState([]); 
  const [allRawTaches, setAllRawTaches] = useState([]); 
  const [realisations, setRealisations] = useState([]); 
  const [classement, setClassement] = useState([]); 
  const [historicalPodiums, setHistoricalPodiums] = useState([]); 
  const [objectives, setObjectives] = useState([]); 
  const [congratulatoryMessages, setCongratulatoryMessages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); 
  const [participantName, setParticipantName] = useState(''); 
  const [showThankYouPopup, setShowThankYouPopup] = useState(null); 
  const [showConfetti, setShowConfetti] = useState(false); 
  
  const [activeMainView, setActiveMainView] = useState('home'); 
  const [activeTaskCategory, setActiveTaskCategory] = useState('tous'); 

  const [selectedParticipantProfile, setSelectedParticipantProfile] = useState(null); 
  const [participantWeeklyTasks, setParticipantWeeklyTasks] = useState([]); 
  const [totalGlobalCumulativePoints, setTotalGlobalCumulativePoints] = useState(0); 

  const [showSplitTaskDialog, setShowSplitTaskDialog] = useState(false); 
  const [subTasks, setSubTasks] = useState([]); 
  const [selectedSubTasks, setSelectedSubTasks] = useState([]); 
  
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false); 
  const [showAdminTaskFormModal, setShowAdminTaskFormModal] = useState(false); 
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); 
  const [taskToDelete, setTaskToDelete] = useState(null); 

  const [showAdminObjectiveFormModal, setShowAdminObjectiveFormModal] = useState(false); 
  const [newObjectiveData, setNewObjectiveData] = useState({ 
    ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
    Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false 
  });
  const [editingObjective, setEditingObjective] = useState(null); 
  const [showDeleteObjectiveConfirmModal, setShowDeleteObjectiveConfirmModal] = useState(false); 
  const [objectiveToDelete, setObjectiveToDelete] = useState(null); 

  const [isAdmin, setIsAdmin] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ 
    ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
    Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
  });
  const [editingTask, setEditingTask] = useState(null);

  const [showHighlightsSection, setShowHighlightsSection] = useState(false); 
  const [showObjectivesSection, setShowObjectivesSection] = useState(false); 
  const [showAdminObjectivesManagement, setShowAdminObjectivesManagement] = useState(false); 
  const [showAdminTasksManagement, setShowAdminTasksManagement] = useState(false); 


  const getHeaders = () => ({
    'Content-Type': 'application/json'
  });

  const fetchTaches = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getTaches&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
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
      setError(`Error fetching tasks: ${err.message}`);
      toast.error(`Error: ${err.message}`); 
    } finally {
      setLoading(false); 
    }
  }, [setAllRawTaches, setTaches, setError, setLoading]);

  const fetchClassement = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getClassement&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const rawData = await response.json(); 
      
      if (!Array.isArray(rawData)) {
        setError('Error: Ranking data is malformed (not an array).');
        toast.error('Error: Ranking data is malformed.');
        setClassement([]); 
        return;
      }

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
      setError(`Error fetching ranking: ${err.message}`);
      toast.error(`Error: ${err.message}`); 
    }
  }, [setClassement, setTotalGlobalCumulativePoints, setError]);

  const fetchRealisations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getRealisations&authToken=${AUTH_TOKEN}`, { 
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setRealisations(data);
    } catch (err) {
      setError(`Error fetching realizations: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    }
  }, [setRealisations, setError]);

  const fetchParticipantWeeklyTasks = useCallback(async (participantName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getParticipantWeeklyTasks&nomParticipant=${encodeURIComponent(participantName)}&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setParticipantWeeklyTasks(data);

    } catch (err) {
      setError(`Error fetching tasks for ${participantName}: ${err.message}`);
      toast.error(`Error loading profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [setParticipantWeeklyTasks, setLoading, setError]);

  const fetchSubTasks = useCallback(async (parentTaskId) => {
    setLoading(true); 
    try {
      const response = await fetch(`${API_URL}?action=getSousTaches&parentTaskId=${encodeURIComponent(parentTaskId)}&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setSubTasks(Array.isArray(data) ? data : []); 
    } catch (err) {
      setError(`Error fetching subtasks: ${err.message}`);
      toast.error(`Error: ${err.message}`);
      setSubTasks([]); 
    } finally {
      setLoading(false);
    }
  }, [setSubTasks, setLoading, setError]);

  const fetchObjectives = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getObjectives&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setObjectives(data);
    } catch (err) {
      setError(`Error fetching objectives: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    }
  }, [setObjectives, setError]);

  const fetchCongratulatoryMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getCongratulatoryMessages&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCongratulatoryMessages(data);
    } catch (err) {
      setError(`Error fetching congratulatory messages: ${err.message}`);
      setCongratulatoryMessages([{ Texte_Message: "Bravo for your excellent work!" }]); // Fallback
    }
  }, [setCongratulatoryMessages, setError]);

  const fetchHistoricalPodiums = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getHistoricalPodiums&authToken=${AUTH_TOKEN}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setHistoricalPodiums(data);
    } catch (err) {
      setError(`Error fetching historical podiums: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    }
  }, [setHistoricalPodiums, setError]);


  const recordTask = async (idTacheToRecord, isSubTask = false) => {
    if (!participantName.trim()) {
      toast.warn('Please enter your name.'); 
      return;
    }

    setLoading(true);
    try {
      const taskToRecord = allRawTaches.find(t => String(t.ID_Tache) === String(idTacheToRecord));
      if (!taskToRecord) {
        throw new Error(`Task with ID ${idTacheToRecord} not found in allRawTaches.`);
      }

      const pointsToSend = parseFloat(taskToRecord.Points) || 0;
      const categoryToSend = taskToRecord.Categorie || 'Uncategorized';

      const payload = {
        action: 'recordTask',
        idTache: idTacheToRecord,
        nomParticipant: participantName.trim(),
        pointsGagnes: pointsToSend,
        categorieTache: categoryToSend,
        authToken: AUTH_TOKEN 
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        const completedTask = taches.find(t => t.ID_Tache === idTacheToRecord);
        if (completedTask && String(completedTask.Frequence || '').toLowerCase() === 'ponctuel') {
            await handleDeleteTask(idTacheToRecord, true); 
            toast.success(`One-time task "${completedTask.Nom_Tache}" recorded and deleted.`);
        } else {
            toast.success(`Task "${completedTask ? completedTask.Nom_Tache : 'unknown'}" recorded successfully.`);
        }

        if (!isSubTask) { 
          const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo for your excellent work!";
          setShowThankYouPopup({ name: participantName.trim(), task: completedTask ? completedTask.Nom_Tache : 'Unknown Task', message: randomMessage }); 
          setShowConfetti(true); 
          setParticipantName('');
          setSelectedTask(null); 
        }
        fetchClassement(); 
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
      } else {
        toast.error(`Error: ${result.message}`); 
      }
    } catch (err) {
      setError(`Error recording task: ${err.message}`);
      toast.error(`An error occurred: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const recordMultipleTasks = async () => {
    const availableSelectedSubTasks = selectedSubTasks.filter(subTask => isSubTaskAvailable(subTask));

    if (!participantName.trim() || availableSelectedSubTasks.length === 0) {
      toast.warn('Please enter your name and select at least one available subtask.');
      return;
    }

    setLoading(true);
    try {
      const tasksToRecordPayload = availableSelectedSubTasks.map(subTask => {
        const points = parseFloat(subTask.Points) || 0;
        const category = subTask.Categorie || 'Uncategorized';
        return {
          idTache: subTask.ID_Tache,
          pointsGagnes: points,
          categorieTache: category
        };
      });

      const payload = {
        action: 'recordMultipleTasks',
        tasks: tasksToRecordPayload,
        nomParticipant: participantName.trim(),
        authToken: AUTH_TOKEN 
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        const completedTaskNames = availableSelectedSubTasks.map(st => st.Nom_Tache).join(', ');
        const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo for your excellent work!";
        setShowThankYouPopup({ name: participantName.trim(), task: completedTaskNames, message: randomMessage });
        setShowConfetti(true); 

        for (const subTask of availableSelectedSubTasks) {
            const fullSubTaskData = allRawTaches.find(t => String(t.ID_Tache) === String(subTask.ID_Tache));
            if (fullSubTaskData && String(fullSubTaskData.Frequence || '').toLowerCase() === 'ponctuel') {
                await handleDeleteTask(subTask.ID_Tache, true); 
            }
        }
        toast.success(`Tasks recorded successfully.`);

        setParticipantName('');
        setSelectedTask(null);
        setShowSplitTaskDialog(false); 
        setSelectedSubTasks([]);
        fetchClassement();
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      setError(`Error recording subtasks: ${err.message}`);
      toast.error(`An error occurred: ${err.message}`);
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
        body: JSON.stringify({ action: 'resetWeeklyPoints', authToken: AUTH_TOKEN }) 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchClassement(); 
        fetchRealisations(); 
        fetchTaches(); 
        fetchObjectives(); 
        fetchHistoricalPodiums(); 
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      setError(`Error resetting points: ${err.message}`);
      toast.error(`An error occurred while resetting: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmResetModal(false); 
    }
  };

  const handleAdminLogin = (passwordInput) => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setActiveMainView('adminPanel');
      toast.success('Logged in as administrator!');
    } else {
      toast.error('Incorrect password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveMainView('home');
    toast.info('Logged out of admin panel.');
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
      toast.error('Task ID is required.');
      return;
    }
    if (!newTaskData.Nom_Tache.trim()) {
      toast.error('Task name is required.');
      return;
    }
    if (newTaskData.Points !== '' && isNaN(newTaskData.Points)) {
      toast.error('Points must be a valid number.');
      return;
    }
    if (newTaskData.Parent_Task_ID.trim() !== '' && newTaskData.Sous_Taches_IDs.trim() !== '') {
        toast.error('A task cannot be both a subtask and a task group.');
        return;
    }
    if (newTaskData.Sous_Taches_IDs.trim() !== '' && newTaskData.Parent_Task_ID.trim() !== '') {
        toast.error('A task cannot be both a task group and a subtask.');
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
        },
        authToken: AUTH_TOKEN 
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchTaches(); 
        setShowAdminTaskFormModal(false); 
        setEditingTask(null);
        setNewTaskData({ 
          ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
          Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
        });
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      toast.error(`An error occurred: ${err.message}`);
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
        body: JSON.stringify({ action: 'deleteTask', idTache: taskId, authToken: AUTH_TOKEN })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchTaches(); 
        fetchRealisations(); 
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      toast.error(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false); 
      setTaskToDelete(null);
    }
  };

  const handleObjectiveFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewObjectiveData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitObjective = async () => {
    if (!newObjectiveData.ID_Objectif.trim()) {
      toast.error('Objective ID is required.');
      return;
    }
    if (!newObjectiveData.Nom_Objectif.trim()) {
      toast.error('Objective name is required.');
      return;
    }
    if (isNaN(parseFloat(newObjectiveData.Cible_Points))) {
      toast.error('Target points must be a valid number.');
      return;
    }
    if (newObjectiveData.Type_Cible === 'Par_Categorie' && !newObjectiveData.Categorie_Cible.trim()) {
      toast.error('Target category is required for "By Category" type.');
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
        },
        authToken: AUTH_TOKEN 
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchObjectives(); 
        setShowAdminObjectiveFormModal(false); 
        setEditingObjective(null);
        setNewObjectiveData({ 
          ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '', 
          Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
        });
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      toast.error(`An error occurred: ${err.message}`);
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
        body: JSON.stringify({ action: 'deleteObjectif', idObjectif: objectiveId, authToken: AUTH_TOKEN })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchObjectives(); 
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (err) {
      toast.error(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteObjectiveConfirmModal(false); 
      setObjectiveToDelete(null);
    }
  };


  useEffect(() => {
    fetchTaches();
    fetchClassement();
    fetchRealisations(); 
    fetchObjectives(); 
    fetchCongratulatoryMessages(); 
    fetchHistoricalPodiums(); 
  }, [fetchTaches, fetchClassement, fetchRealisations, fetchObjectives, fetchCongratulatoryMessages, fetchHistoricalPodiums]);

  const handleParticipantClick = async (participant) => {
    setSelectedParticipantProfile(participant);
    setActiveMainView('participantProfile');
    await fetchParticipantWeeklyTasks(participant.Nom_Participant);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    if (task.Sous_Taches_IDs && String(task.Sous_Taches_IDs).trim() !== '') {
      fetchSubTasks(task.ID_Tache); 
      setShowSplitTaskDialog(true); 
    } else {
      setShowSplitTaskDialog(false); 
    }
  };

  const isSubTaskAvailable = (subTask) => {
    const frequence = subTask.Frequence ? String(subTask.Frequence).toLowerCase() : 'hebdomadaire';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0); 

    const isCompleted = realisations.some(real => {
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
    return !isCompleted;
  };

  const getParticipantBadges = (participant) => {
    const badges = [];
    const participantRealisations = realisations.filter(r => String(r.Nom_Participant).trim() === String(participant.Nom_Participant).trim());
    
    const totalPoints = parseFloat(participant.Points_Total_Cumulatif) || 0;
    
    if (totalPoints >= 50) {
      badges.push({ name: 'Beginner Cleaner', icon: '✨', description: 'Reached 50 cumulative points.' });
    }
    if (totalPoints >= 200) {
      badges.push({ name: 'Pro Cleaner', icon: '🌟', description: 'Reached 200 cumulative points.' });
    }
    if (totalPoints >= 500) {
      badges.push({ name: 'Master of Cleanliness', icon: '👑', description: 'Reached 500 cumulative points.' });
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
        badges.push({ name: 'Active This Week', icon: '🔥', description: '3 or more tasks completed this week.' });
    }

    const kitchenTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'cuisine').length;
    if (kitchenTasks >= 5) {
      badges.push({ name: 'Kitchen Specialist', icon: '🍳', description: '5 kitchen tasks completed.' });
    }

    const roomTasks = participantRealisations.filter(r => String(r.Categorie_Tache || '').toLowerCase() === 'salle').length;
    if (roomTasks >= 5) {
      badges.push({ name: 'Room Specialist', icon: '🛋️', description: '5 room tasks completed.' });
    }

    const hasBeenFirst = historicalPodiums.some(podium => 
      podium.top3.length > 0 && String(podium.top3[0].name).trim() === String(participant.Nom_Participant).trim()
    );
    if (hasBeenFirst) {
      badges.push({ name: 'Former Champion', icon: '🥇', description: 'Has already been first on the podium.' });
    }

    return badges;
  };


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

  const renderPodiumSection = () => {
    if (!Array.isArray(classement) || classement.length === 0) return <p className="text-center text-lightText text-lg">No ranking available yet.</p>;

    const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze']; 
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl text-center"> 
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary mb-6 sm:mb-8 whitespace-nowrap overflow-hidden text-ellipsis">🏆 Weekly Podium 🏆</h2> 
        <div className="flex justify-center items-end mt-4 sm:mt-6 gap-2 sm:gap-4"> 
          {/* 2nd Place */}
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

          {/* 1st Place */}
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

          {/* 3rd Place */}
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
            View Full Ranking
          </button>
        )}
        {renderHighlights()} 
        {renderObjectivesSection()} 
      </div>
    );
  };

  const renderHighlights = () => {
    let mostImproved = null;
    let maxImprovement = -1;

    // NOTE: The 'Points_Total_Semaine_Precedente' column does not exist in your 'Feuille_Classement' sheet.
    // The "Most Improved" functionality will not work with your current structure.
    // It is here for compatibility with previous code.
    if (classement.length > 0) {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
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
          <span>✨ Current Trends ✨</span>
          <span>{showHighlightsSection ? '▲' : '▼'}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showHighlightsSection ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
            {mostImproved && maxImprovement > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50"> 
                <h3 className="text-base font-bold text-primary mb-1">Most Improved</h3>
                <p className="text-text text-sm font-semibold">{mostImproved.Nom_Participant}</p>
                <p className="text-lightText text-xs">+{maxImprovement} pts this week</p>
              </div>
            )}
            {mostActive && maxTasksCompleted > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50">
                <h3 className="text-base font-bold text-primary mb-1">Most Active</h3>
                <p className="text-text text-sm font-semibold">{mostActive.Nom_Participant}</p>
                <p className="text-lightText text-xs">{maxTasksCompleted} tasks completed this week</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderObjectivesSection = () => {
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 border-t border-neutralBg pt-4"> 
        <button
          onClick={() => setShowObjectivesSection(!showObjectivesSection)}
          className="w-full bg-neutralBg hover:bg-neutralBg/80 text-text font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base"
        >
          <span>🎯 Common Objectives 🎯</span>
          <span>{showObjectivesSection ? '▲' : '▼'}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showObjectivesSection ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-2"> 
            {objectives.map(obj => {
              const currentPoints = parseFloat(obj.Points_Actuels) || 0;
              const targetPoints = parseFloat(obj.Cible_Points) || 0;
              const progress = targetPoints > 0 ? (currentPoints / targetPoints) * 100 : 0;
              const isCompleted = obj.Est_Atteint === true || String(obj.Est_Atteint).toLowerCase() === 'true' || currentPoints >= targetPoints;

              return (
                <div key={obj.ID_Objectif} className={`bg-white rounded-lg p-3 shadow-sm border 
                  ${isCompleted ? 'border-success' : 'border-primary/10'}`}> 
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-bold text-primary truncate">{obj.Nom_Objectif}</h3> 
                    {isCompleted ? (
                      <span className="text-success font-bold text-sm">✅ Achieved!</span>
                    ) : (
                      <span className="text-text font-semibold text-sm">{currentPoints} / {targetPoints} pts</span>
                    )}
                  </div>
                  <p className="text-lightText text-xs mb-2 truncate">{obj.Description_Objectif}</p> 
                  <div className="w-full bg-gray-200 rounded-full h-2"> 
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


  const renderTaskCategories = () => {
    const categories = [
      { name: 'tous', label: 'Common Tasks' },
      { name: 'salle', label: 'Room Tasks' },
      { name: 'cuisine', label: 'Kitchen Tasks' }
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
        return <p className="text-center text-lightText text-md py-2">No tasks available in this section.</p>;
      }
      return (
        <div className="space-y-3">
          {tasks.map(tache => {
            const isCompletedForPeriod = !isSubTaskAvailable(tache); 

            if (isCompletedForPeriod) {
              return null; 
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
                            Task Group
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1 sm:gap-2 w-full sm:w-auto"> 
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getUrgencyClasses(tache.Urgence)}`}> 
                        {tache.Urgence || 'Normal'} 
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${getFrequencyClasses(tache.Frequence)}`}> 
                        {tache.Frequence || 'Weekly'}
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
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">One-time Tasks</h3> 
            {renderTasksList(ponctuelTasks)}
          </div>
        )}

        {quotidienTasks.filter(t => isSubTaskAvailable(t)).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Daily Tasks</h3> 
            {renderTasksList(quotidienTasks)}
          </div>
        )}

        {hebdomadaireTasks.filter(t => isSubTaskAvailable(t)).length > 0 && ( 
          <div className="mb-6"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Weekly Tasks</h3> 
            {renderTasksList(hebdomadaireTasks)}
          </div>
        )}

        {currentCategoryTasks.filter(t => isSubTaskAvailable(t)).length === 0 && (
          <p className="text-center text-lightText text-lg py-4">No tasks available in this category.</p>
        )}
      </div>
    );
  };

  const renderCompletedTasks = () => {
    if (!Array.isArray(realisations) || realisations.length === 0) {
      return (
        <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
          <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Completed Tasks</h2>
          <p className="text-center text-lightText text-lg">No tasks have been completed yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Completed Tasks</h2>
        <div className="space-y-3 text-left"> 
          {realisations.map((real, index) => (
            <div key={real.Timestamp + real.Nom_Participant + index} 
                 className="bg-card rounded-2xl p-3 sm:p-4 flex flex-col shadow-lg border border-blue-100"> 
              <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight mb-1">
                  {real.Nom_Tache_Effectuee}
              </h4>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-lightText">
                  <span>by <strong className="text-text">{real.Nom_Participant}</strong></span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(real.Categorie_Tache)}`}>
                      {real.Categorie_Tache || 'Uncategorized'}
                  </span>
                  <span>on {new Date(real.Timestamp).toLocaleDateString('en-US')} at {new Date(real.Timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg 
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base" 
          onClick={() => setActiveMainView('home')}
        >
          Back to Home
        </button>
      </div>
    );
  };

  const renderThankYouPopup = () => {
    if (!showThankYouPopup) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20"> 
          <h3 className="text-3xl sm:text-4xl font-bold text-success mb-6 sm:mb-8">🎉 Bravo! 🎉</h3> 
          <p className="text-lg sm:text-xl text-text mb-6 sm:mb-8">
            {showThankYouPopup.message}
            <br/>
            Task: "<strong className="text-primary">{showThankYouPopup.task}</strong>" completed by <strong className="text-secondary">{showThankYouPopup.name}</strong>.
          </p>
          <button 
            onClick={() => setShowThankYouPopup(null)} 
            className="bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base"
          >
            Great!
          </button>
        </div>
      </div>
    );
  };


  const renderTaskDialog = () => {
    if (!selectedTask || selectedTask.isGroupTask) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20"> 
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Confirm Task</h3> 
          <p className="text-base sm:text-lg mb-4">Task: <strong className="text-text">{selectedTask.Nom_Tache}</strong> (<span className="font-semibold text-primary">{selectedTask.Calculated_Points} points</span>)</p>
          <label htmlFor="participantName" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Your Name:</label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
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
              {loading ? 'Submitting...' : 'Validate Task'} 
            </button>
            <button 
              onClick={() => { setSelectedTask(null); setParticipantName(''); }} 
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              Cancel
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
        toast.info(`Task "${subTask.Nom_Tache}" has already been completed for its period.`);
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
            Complete: {selectedTask.Nom_Tache}
          </h3>
          <p className="text-base sm:text-lg mb-4 text-lightText">
            Select the parts you have completed:
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Loading subtasks...</p>
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
              <p className="text-center text-lightText text-md py-2">No subtasks available for this task, or loading error.</p>
            )
          )}

          <label htmlFor="participantNameSplit" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Your Name:</label>
          <input
            id="participantNameSplit"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
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
              {loading ? 'Submitting...' : 'Validate Selected Tasks'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderParticipantProfile = () => {
    if (!selectedParticipantProfile) return null;

    const participantCumulativePoints = selectedParticipantProfile.Points_Total_Cumulatif || 0;
    const engagementPercentage = totalGlobalCumulativePoints > 0 
      ? ((participantCumulativePoints / totalGlobalCumulativePoints) * 100).toFixed(2) 
      : 0;

    const participantBadges = getParticipantBadges(selectedParticipantProfile);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Profile of {selectedParticipantProfile.Nom_Participant}</h2>
        <div className="mb-6 p-4 bg-neutralBg rounded-xl shadow-inner"> 
          <p className="text-lg sm:text-xl font-semibold text-text">
            Overall Engagement Score: <span className="text-primary font-bold">{engagementPercentage}%</span>
          </p>
          <p className="text-base sm:text-lg text-lightText mt-2">
            Cumulative Points: <span className="font-bold">{participantCumulativePoints}</span>
          </p>
          {participantBadges.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-primary mb-2">Your Badges:</h4>
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

        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">Tasks completed this week:</h3>
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
                            {task.Categorie_Tache || 'Uncategorized'}
                        </span>
                        <span className="text-sm text-lightText">
                            {new Date(task.Timestamp).toLocaleDateString('en-US')} 
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
          <p className="text-lightText text-md sm:text-lg">No tasks completed this week.</p>
        )}

        <button 
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg 
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm sm:text-base" 
          onClick={() => setActiveMainView('home')}
        >
          Back to Home
        </button>
      </div>
    );
  };

  const renderConfirmResetModal = () => {
    if (!showConfirmResetModal) return null;

    return (
      <ConfirmActionModal
        title="Confirm Reset"
        message="Are you sure you want to reset weekly points and record the podium? This action is irreversible."
        confirmText="Yes, Reset"
        cancelText="No, Cancel"
        onConfirm={resetWeeklyPoints}
        onCancel={() => setShowConfirmResetModal(false)}
        loading={loading}
      />
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || !taskToDelete) return null;

    return (
      <ConfirmActionModal
        title="Confirm Deletion"
        message={`Are you sure you want to delete task with ID "${taskToDelete}"? This action is irreversible.`}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        onConfirm={() => handleDeleteTask(taskToDelete, true)} 
        onCancel={() => { setShowDeleteConfirmModal(false); setTaskToDelete(null); }}
        loading={loading}
      />
    );
  };

  const renderDeleteObjectiveConfirmModal = () => {
    if (!showDeleteObjectiveConfirmModal || !objectiveToDelete) return null;

    return (
      <ConfirmActionModal
        title="Confirm Objective Deletion"
        message={`Are you sure you want to delete objective with ID "${objectiveToDelete}"? This action is irreversible.`}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        onConfirm={() => handleDeleteObjective(objectiveToDelete, true)}
        onCancel={() => { setShowDeleteObjectiveConfirmModal(false); setObjectiveToDelete(null); }}
        loading={loading}
      />
    );
  };

  const exportToCsv = (filename, dataArray, headers) => {
    if (!dataArray || dataArray.length === 0) {
      toast.info(`No data to export for ${filename}.`);
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
      toast.success(`"${filename}" exported successfully!`);
    } else {
      toast.error("Your browser does not support direct CSV export.");
    }
  };

  const handleExportClassement = () => {
    // Column headers from your Feuille_Classement sheet
    const headers = ['Nom_Participant', 'Points_Total_Semaine_Courante', 'Points_Total_Cumulatif', 'Date_Mise_A_Jour'];
    const dataToExport = classement.map(p => ({
        Nom_Participant: p.Nom_Participant,
        Points_Total_Semaine_Courante: p.Points_Total_Semaine_Courante,
        Points_Total_Cumulatif: p.Points_Total_Cumulatif,
        Date_Mise_A_Jour: p.Date_Mise_A_Jour || '' 
    }));

    exportToCsv('classement_clean_app.csv', dataToExport, headers);
  };

  const handleExportRealisations = () => {
    // Column headers from your Feuille_Realisations sheet
    const headers = ['Timestamp', 'Nom_Participant', 'ID_Tache_Effectuee', 'Nom_Tache_Effectuee', 'Categorie_Tache', 'Points_Gagnes'];
    exportToCsv('realisations_clean_app.csv', realisations, headers);
  };


  const renderAdminPanel = () => {
    if (!isAdmin) {
      return null; 
    }

    const adminButtonClasses = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300";

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-6 text-center">Administration Panel</h2>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowConfirmResetModal(true)}
            className={adminButtonClasses}
          >
            Reset Weekly Points
          </button>
          <button
            onClick={handleExportClassement}
            className={adminButtonClasses}
          >
            Export Ranking CSV
          </button>
          <button
            onClick={handleExportRealisations}
            className={adminButtonClasses}
          >
            Export Realizations CSV
          </button>
        </div>

        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">Task Statistics</h3>
            <TaskStatisticsChart realisations={realisations} allRawTaches={allRawTaches} />
        </div>

        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowAdminObjectivesManagement(!showAdminObjectivesManagement)}
            className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base mb-4"
          >
            <span>🎯 Objective Management 🎯</span>
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
              Add New Objective
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

            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">All Objectives</h4>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                <p className="ml-3 text-lightText">Loading objectives...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {objectives.length === 0 ? (
                  <p className="text-center text-lightText text-lg">No objectives available.</p>
                ) : (
                  objectives.map(obj => (
                    <div key={obj.ID_Objectif} className="bg-white rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                        <p className="font-bold text-text text-lg truncate">{obj.Nom_Objectif} <span className="text-sm text-lightText">({obj.ID_Objectif})</span></p>
                        <p className="text-sm text-lightText">Target: {obj.Cible_Points} | Current: {obj.Points_Actuels} | Type: {obj.Type_Cible} {obj.Categorie_Cible && `(${obj.Categorie_Cible})`}</p>
                        <p className="text-sm text-lightText">Achieved: {obj.Est_Atteint ? 'Yes' : 'No'}</p>
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
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteObjective(obj.ID_Objectif)}
                          className={`${adminButtonClasses} !bg-error hover:!bg-red-700`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 p-4 bg-neutralBg rounded-xl shadow-inner">
          <button
            onClick={() => setShowAdminTasksManagement(!showAdminTasksManagement)}
            className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-md transition duration-300 flex items-center justify-between text-sm sm:text-base mb-4"
          >
            <span>📝 Task Management 📝</span>
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
              Add New Task
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

            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">All Tasks</h4>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                <p className="ml-3 text-lightText">Loading tasks...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRawTaches.length === 0 ? (
                  <p className="text-center text-lightText text-lg">No tasks available.</p>
                ) : (
                  allRawTaches.map(task => (
                    <div key={task.ID_Tache} className="bg-white rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                        <p className="font-bold text-text text-lg truncate">{task.Nom_Tache} <span className="text-sm text-lightText">({task.ID_Tache})</span></p>
                        <p className="text-sm text-lightText">Points: {task.Points} | Freq: {task.Frequence} | Urg: {task.Urgence} | Cat: {task.Categorie}</p>
                        {task.Sous_Taches_IDs && <p className="text-xs text-lightText">Subtasks: {task.Sous_Taches_IDs}</p>}
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
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.ID_Tache)}
                          className={`${adminButtonClasses} !bg-error hover:!bg-red-700`}
                        >
                          Delete
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"> 
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast mb-4 sm:mb-6"></div> 
        <p className="text-xl sm:text-2xl font-semibold text-lightText">Loading data...</p> 
      </div>
    );
  }

  if (error) return <div className="text-center p-8 text-xl text-error">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-background font-sans p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="relative flex flex-col items-center justify-center py-6 sm:py-8 px-4 mb-8 sm:mb-10 text-center"> 
          <img src={`/${LOGO_FILENAME}`} alt="Clean App Challenge Logo" className="mx-auto mb-4 sm:mb-5 h-24 sm:h-32 md:h-40 w-auto drop-shadow-xl" /> 
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
            Home
          </button>
          <button
            className={`py-2.5 px-6 sm:py-3 sm:px-7 rounded-lg font-bold text-sm sm:text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${activeMainView === 'completedTasks' ? 'bg-primary text-white shadow-lg' : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
            onClick={() => setActiveMainView('completedTasks')}
          >
            Completed Tasks
          </button>
          <button
            className={`py-2.5 px-6 sm:py-3 sm:px-7 rounded-lg font-bold text-sm sm:text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${activeMainView === 'historicalPodiums' ? 'bg-primary text-white shadow-lg' : 'bg-neutralBg text-text hover:bg-accent hover:text-secondary'}`}
            onClick={() => setActiveMainView('historicalPodiums')}
          >
            Podium History
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
        {/* Modals and popups */}
        {renderTaskDialog()}
        {renderThankYouPopup()} 
        {renderSplitTaskDialog()} 
        {renderConfirmResetModal()} 
        {renderDeleteConfirmModal()} 
        {renderDeleteObjectiveConfirmModal()} 
        <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} /> 
      </div>
      {/* Container for toast notifications */}
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
