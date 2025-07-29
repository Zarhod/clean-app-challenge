// src/App.js
// Version mise à jour pour utiliser Firebase Authentication et Firestore.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; 
import HistoricalPodiums from './HistoricalPodiums'; 
// AdminLoginButton sera remplacé par un bouton d'authentification générique
import AdminLoginButton from './AdminLoginButton'; // Gardé pour l'instant, sera adapté
import AdminTaskFormModal from './AdminTaskFormModal'; 
import ConfirmActionModal from './ConfirmActionModal'; 
import ConfettiOverlay from './ConfettiOverlay'; 
import TaskStatisticsChart from './TaskStatisticsChart'; 
import AdminObjectiveFormModal from './AdminObjectiveFormModal'; 
import ListAndInfoModal from './ListAndInfoModal'; 
import ExportSelectionModal from './ExportSelectionModal'; 
import RankingCard from './RankingCard'; 
import OverallRankingModal from './OverallRankingModal'; 
import ReportTaskModal from './ReportTaskModal'; 
import AuthModal from './Auth'; // Nouveau composant d'authentification
import confetti from 'canvas-confetti'; 

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Importations Firebase
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc } from 'firebase/firestore'; // <<< setDoc ajouté ici
import { signOut } from 'firebase/auth';

// Importation du contexte utilisateur
import { UserProvider, useUser } from './UserContext';

const LOGO_FILENAME = 'logo.png'; 

// REMOVED: ADMIN_PASSWORD is no longer needed with Firebase Auth roles

function AppContent() { // Renommé pour être enveloppé par UserProvider
  const { currentUser, isAdmin, loadingUser } = useUser(); // Utilisation du hook de contexte

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
  const [participantName, setParticipantName] = useState(''); // Le nom du participant sera le displayName de l'utilisateur connecté
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
  
  // Modales d'administration des tâches
  const [showAdminTaskFormModal, setShowAdminTaskFormModal] = useState(false); 
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); 
  const [taskToDelete, setTaskToDelete] = useState(null); 
  const [newTaskData, setNewTaskData] = useState({ 
    ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
    Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
  });
  const [editingTask, setEditingTask] = useState(null);

  // Modales d'administration des objectifs
  const [showAdminObjectiveFormModal, setShowAdminObjectiveFormModal] = useState(false); 
  const [newObjectiveData, setNewObjectiveData] = useState({ 
    ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
    Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false 
  });
  const [editingObjective, setEditingObjective] = useState(null); 
  const [showDeleteObjectiveConfirmModal, setShowDeleteObjectiveConfirmModal] = useState(false); 
  const [objectiveToDelete, setObjectiveToDelete] = useState(null); 

  // REMOVED: isAdmin state is now from UserContext

  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [showAdminObjectivesListModal, setShowAdminObjectivesListModal] = useState(false);
  const [showAdminTasksListModal, setShowAdminTasksListModal] = useState(false);
  const [showExportSelectionModal, setShowExportSelectionModal] = useState(false); 
  const [showOverallRankingModal, setShowOverallRankingModal] = useState(false); 

  // NOUVEAUX ÉTATS POUR LE SIGNALEMENT
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedTaskDetails, setReportedTaskDetails] = useState(null); // { id, name, participant }
  const [reports, setReports] = useState([]); // ÉTAT POUR LES SIGNALEMENTS

  // États Easter Egg
  const [logoClickCount, setLogoClickCount] = useState(0); 
  const [showChickEmoji, setShowChickEmoji] = useState(false);
  const logoClickTimerRef = useRef(null); 

  // État pour la modale d'authentification
  const [showAuthModal, setShowAuthModal] = useState(false);


  // REMOVED: getHeaders is no longer needed as Firebase SDK handles it

  const fetchTaches = useCallback(async () => {
    try {
      // Requête Firestore pour récupérer toutes les tâches
      const q = query(collection(db, "tasks"));
      const querySnapshot = await getDocs(q);
      
      const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (!Array.isArray(rawData)) { 
        throw new Error("Les données reçues ne sont pas un tableau.");
      }

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
      // Récupérer tous les utilisateurs
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Récupérer toutes les réalisations
      const realisationsQuery = query(collection(db, "realizations"));
      const realisationsSnapshot = await getDocs(realisationsQuery);
      const realisationsData = realisationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculer les points hebdomadaires et cumulatifs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay(); 
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
      const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);

      const participantScores = {};
      usersData.forEach(user => {
        participantScores[user.displayName] = {
          Nom_Participant: user.displayName,
          Points_Total_Semaine_Courante: parseFloat(user.weeklyPoints || 0), 
          Points_Total_Cumulatif: parseFloat(user.totalCumulativePoints || 0),
          Points_Total_Semaine_Precedente: parseFloat(user.previousWeeklyPoints || 0), // Assurez-vous d'avoir ce champ dans user doc
          Date_Mise_A_Jour: user.dateJoined || '' // Ou une date de dernière activité
        };
      });

      // Recalculer les points à partir des réalisations pour s'assurer de la fraîcheur
      // et gérer les cas où les points ne sont pas mis à jour immédiatement sur le profil
      const tempWeeklyPoints = {};
      const tempCumulativePoints = {};

      realisationsData.forEach(real => {
        const participant = real.nomParticipant;
        const points = parseFloat(real.pointsGagnes) || 0;
        const realDate = new Date(real.timestamp);
        realDate.setHours(0, 0, 0, 0);

        tempCumulativePoints[participant] = (tempCumulativePoints[participant] || 0) + points;
        if (realDate >= startOfCurrentWeek) {
          tempWeeklyPoints[participant] = (tempWeeklyPoints[participant] || 0) + points;
        }
      });

      // Fusionner les scores calculés avec les données utilisateur pour le classement
      usersData.forEach(user => {
        const displayName = user.displayName;
        if (!participantScores[displayName]) {
          participantScores[displayName] = {
            Nom_Participant: displayName,
            Points_Total_Semaine_Courante: 0,
            Points_Total_Cumulatif: 0,
            Points_Total_Semaine_Precedente: parseFloat(user.previousWeeklyPoints || 0),
            Date_Mise_A_Jour: user.dateJoined || ''
          };
        }
        participantScores[displayName].Points_Total_Semaine_Courante = tempWeeklyPoints[displayName] || 0;
        participantScores[displayName].Points_Total_Cumulatif = tempCumulativePoints[displayName] || 0;
      });
      
      const currentClassement = Object.values(participantScores)
        .sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
      
      setClassement(currentClassement);

      const globalCumulative = currentClassement.reduce((sum, p) => sum + (parseFloat(p.Points_Total_Cumulatif) || 0), 0); 
      setTotalGlobalCumulativePoints(globalCumulative);

    } catch (err) {
      setError(`Erreur lors de la récupération du classement: ${err.message}`);
      toast.error(`Erreur: ${err.message}`); 
    }
  }, [setClassement, setTotalGlobalCumulativePoints, setError]);

  const fetchRealisations = useCallback(async () => {
    try {
      const q = query(collection(db, "realizations"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealisations(data);
    }
    catch (err) {
      setError(`Erreur lors de la récupération des réalisations: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setRealisations, setError]);

  const fetchParticipantWeeklyTasks = useCallback(async (participantName) => {
    setLoading(true);
    try {
      const q = query(collection(db, "realizations"), where("nomParticipant", "==", participantName));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay(); 
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
      const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
      startOfCurrentWeek.setHours(0, 0, 0, 0);

      const weeklyTasks = data.filter(real => {
        const realDate = new Date(real.timestamp);
        realDate.setHours(0, 0, 0, 0);
        return realDate >= startOfCurrentWeek;
      });
      setParticipantWeeklyTasks(weeklyTasks);

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
      const parentTaskDoc = await getDoc(doc(db, "tasks", parentTaskId));
      if (!parentTaskDoc.exists()) {
        throw new Error("Tâche parente introuvable.");
      }
      const parentTaskData = parentTaskDoc.data();

      if (!parentTaskData.Sous_Taches_IDs || String(parentTaskData.Sous_Taches_IDs).trim() === '') {
        setSubTasks([]);
        return;
      }

      const subTaskIds = String(parentTaskData.Sous_Taches_IDs).split(',').map(id => id.trim());
      
      const subTasksPromises = subTaskIds.map(id => getDoc(doc(db, "tasks", id)));
      const subTaskDocs = await Promise.all(subTasksPromises);
      const sousTaches = subTaskDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      setSubTasks(sousTaches); 
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
      const q = query(collection(db, "objectives"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setObjectives(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des objectifs: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setObjectives, setError]);

  const fetchCongratulatoryMessages = useCallback(async () => {
    try {
      const q = query(collection(db, "congratulatory_messages"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCongratulatoryMessages(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des messages de félicitations: ${err.message}`);
      setCongratulatoryMessages([{ Texte_Message: "Bravo pour votre excellent travail !" }]); // Fallback
    }
  }, [setCongratulatoryMessages, setError]);

  const fetchHistoricalPodiums = useCallback(async () => {
    try {
      const q = query(collection(db, "historical_podiums"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalPodiums(data);
    } catch (err) {
      setError(`Erreur lors de la récupération de l'historique des podiums: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setHistoricalPodiums, setError]);

  // NOUVELLE FONCTION: Récupérer les signalements
  const fetchReports = useCallback(async () => {
    try {
      const q = query(collection(db, "reports"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    } catch (err) {
      setError(`Erreur lors de la récupération des signalements: ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    }
  }, [setReports, setError]);


  const recordTask = async (idTacheToRecord, isSubTask = false) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour valider une tâche.');
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const taskToRecord = allRawTaches.find(t => String(t.ID_Tache) === String(idTacheToRecord));
      if (!taskToRecord) {
        throw new Error(`Tâche avec l'ID ${idTacheToRecord} introuvable.`);
      }

      const pointsToSend = parseFloat(taskToRecord.Points) || 0;
      const categoryToSend = taskToRecord.Categorie || 'Non catégorisée';

      // Ajouter la réalisation à Firestore
      await addDoc(collection(db, "realizations"), {
        taskId: idTacheToRecord,
        userId: currentUser.uid,
        nomParticipant: currentUser.displayName || currentUser.email, // Utilise le displayName ou l'email
        nomTacheEffectuee: taskToRecord.Nom_Tache,
        categorieTache: categoryToSend,
        pointsGagnes: pointsToSend,
        timestamp: new Date().toISOString()
      });

      // Mettre à jour les points de l'utilisateur dans son document 'users'
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + pointsToSend;
        const newWeeklyPoints = (userData.weeklyPoints || 0) + pointsToSend;
        await updateDoc(userDocRef, {
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints
        });
      }

      const completedTask = taches.find(t => t.ID_Tache === idTacheToRecord);
      if (completedTask && String(completedTask.Frequence || '').toLowerCase() === 'ponctuel') {
          // Pour les tâches ponctuelles, on ne les supprime pas du tout car elles sont des définitions.
          // Leur disponibilité est gérée par isSubTaskAvailable.
          toast.success(`Tâche ponctuelle "${completedTask.Nom_Tache}" enregistrée.`);
      } else {
          toast.success(`Tâche "${completedTask ? completedTask.Nom_Tache : 'inconnue'}" enregistrée avec succès.`);
      }

      if (!isSubTask) { 
        const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
        setShowThankYouPopup({ name: currentUser.displayName || currentUser.email, task: completedTask ? completedTask.Nom_Tache : 'Tâche inconnue', message: randomMessage }); 
        setShowConfetti(true); 
        // setParticipantName(''); // Plus besoin de réinitialiser le nom ici
        setSelectedTask(null); 
      }
      fetchClassement(); 
      fetchRealisations(); 
      fetchTaches(); 
      fetchObjectives(); 
      fetchReports(); 
    } catch (err) {
      setError(`Erreur lors de l'enregistrement de la tâche: ${err.message}`);
      toast.error(`Une erreur est survenue: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const recordMultipleTasks = async () => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour valider des tâches.');
      setShowAuthModal(true);
      return;
    }

    const availableSelectedSubTasks = selectedSubTasks.filter(subTask => isSubTaskAvailable(subTask));

    if (availableSelectedSubTasks.length === 0) {
      toast.warn('Veuillez sélectionner au moins une sous-tâche disponible.');
      return;
    }

    setLoading(true);
    try {
      let totalPointsGained = 0;
      const tasksToRecordPayload = availableSelectedSubTasks.map(subTask => {
        const points = parseFloat(subTask.Points) || 0;
        const category = subTask.Categorie || 'Non catégorisée';
        totalPointsGained += points;
        return {
          taskId: subTask.ID_Tache,
          userId: currentUser.uid,
          nomParticipant: currentUser.displayName || currentUser.email,
          nomTacheEffectuee: subTask.Nom_Tache,
          categorieTache: category,
          pointsGagnes: points,
          timestamp: new Date().toISOString()
        };
      });

      // Enregistrer toutes les réalisations en une seule fois (ou en batch si beaucoup)
      const batchPromises = tasksToRecordPayload.map(taskData => addDoc(collection(db, "realizations"), taskData));
      await Promise.all(batchPromises);

      // Mettre à jour les points de l'utilisateur
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + totalPointsGained;
        const newWeeklyPoints = (userData.weeklyPoints || 0) + totalPointsGained;
        await updateDoc(userDocRef, {
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints
        });
      }

      const completedTaskNames = availableSelectedSubTasks.map(st => st.Nom_Tache).join(', ');
      const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
      setShowThankYouPopup({ name: currentUser.displayName || currentUser.email, task: completedTaskNames, message: randomMessage });
      setShowConfetti(true); 

      toast.success(`Tâches enregistrées avec succès.`);

      // setParticipantName(''); // Plus besoin de réinitialiser le nom ici
      setSelectedTask(null);
      setShowSplitTaskDialog(false); 
      setSelectedSubTasks([]);
      fetchClassement();
      fetchRealisations(); 
      fetchTaches(); 
      fetchObjectives(); 
      fetchReports(); 
    } catch (err) {
      setError(`Erreur lors de l'enregistrement des sous-tâches: ${err.message}`);
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetWeeklyPoints = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      // 1. Enregistrer le podium de la semaine avant de réinitialiser
      const sortedClassement = [...classement].sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
      const top3 = sortedClassement.slice(0, 3);
      const datePodium = new Date().toISOString().split('T')[0]; 

      await addDoc(collection(db, "historical_podiums"), {
        Date_Podium: datePodium,
        top3: top3.map(p => ({ name: p.Nom_Participant, points: p.Points_Total_Semaine_Courante }))
      });

      // 2. Réinitialiser les points hebdomadaires de tous les utilisateurs
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const batch = []; // Utilise un batch pour des écritures multiples

      usersSnapshot.docs.forEach(userDoc => {
        const userRef = doc(db, "users", userDoc.id);
        const userData = userDoc.data();
        batch.push(updateDoc(userRef, {
          weeklyPoints: 0,
          previousWeeklyPoints: userData.weeklyPoints || 0 // Sauvegarde les points de la semaine précédente
        }));
      });
      await Promise.all(batch); // Exécute toutes les mises à jour en parallèle

      toast.success('Points hebdomadaires réinitialisés et podium enregistré.');
      fetchClassement(); 
      fetchRealisations(); 
      fetchTaches(); 
      fetchObjectives(); 
      fetchHistoricalPodiums(); 
      fetchReports(); 
    } catch (err) {
      setError(`Erreur lors de la réinitialisation des points: ${err.message}`);
      toast.error(`Une erreur est survenue lors de la réinitialisation: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmResetModal(false); 
    }
  };

  // Logique de connexion/déconnexion admin simplifiée (maintenant via Firebase Auth)
  const handleAuthAction = async () => {
    if (currentUser) {
      // Si déjà connecté, c'est une déconnexion
      try {
        await signOut(auth);
        toast.info('Déconnecté.');
        setActiveMainView('home');
      } catch (error) {
        toast.error('Erreur lors de la déconnexion.');
        console.error("Erreur déconnexion:", error);
      }
    } else {
      // Sinon, ouvrir la modale d'authentification
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    // Le chargement initial des données dépend de l'état d'authentification
    // pour s'assurer que les règles de sécurité Firestore sont respectées.
    if (!loadingUser) { // S'assure que l'état de l'utilisateur a été déterminé
      // On peut toujours tenter de charger les données, les règles Firestore géreront les permissions
      fetchTaches();
      fetchClassement();
      fetchRealisations(); 
      fetchObjectives(); 
      fetchCongratulatoryMessages(); 
      fetchHistoricalPodiums(); 
      fetchReports(); 
      setLoading(false); // Fin du chargement initial
    }
  }, [currentUser, loadingUser, fetchTaches, fetchClassement, fetchRealisations, fetchObjectives, fetchCongratulatoryMessages, fetchHistoricalPodiums, fetchReports]);


  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData(prev => ({
      ...prev,
      [name]: name === 'Points' ? (value === '' ? '' : parseFloat(value) || '') : value 
    }));
  };

  const handleSubmitTask = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
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
      if (editingTask) {
        // Mise à jour d'une tâche existante
        await updateDoc(doc(db, "tasks", editingTask.id), {
          ...newTaskData,
          Points: newTaskData.Points === '' ? '' : parseFloat(newTaskData.Points) 
        });
        toast.success('Tâche mise à jour avec succès.');
      } else {
        // Ajout d'une nouvelle tâche
        await setDoc(doc(db, "tasks", newTaskData.ID_Tache), { // Utilise setDoc avec ID_Tache comme ID de document
          ...newTaskData,
          Points: newTaskData.Points === '' ? '' : parseFloat(newTaskData.Points) 
        });
        toast.success('Tâche ajoutée avec succès.');
      }
      
      fetchTaches(); 
      setShowAdminTaskFormModal(false); 
      setEditingTask(null);
      setNewTaskData({ 
        ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
        Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
      });
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, skipConfirmation = false) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (!skipConfirmation) {
      setTaskToDelete(taskId);
      setShowDeleteConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success('Tâche supprimée avec succès.');
      fetchTaches(); 
      fetchRealisations(); 
      fetchReports(); 
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
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
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
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
      if (editingObjective) {
        await updateDoc(doc(db, "objectives", editingObjective.id), {
          ...newObjectiveData,
          Cible_Points: parseFloat(newObjectiveData.Cible_Points),
          Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
          Est_Atteint: newObjectiveData.Est_Atteint
        });
        toast.success('Objectif mis à jour avec succès.');
      } else {
        await setDoc(doc(db, "objectives", newObjectiveData.ID_Objectif), { // Utilise setDoc avec ID_Objectif
          ...newObjectiveData,
          Cible_Points: parseFloat(newObjectiveData.Cible_Points),
          Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
          Est_Atteint: newObjectiveData.Est_Atteint
        });
        toast.success('Objectif ajouté avec succès.');
      }
      
      fetchObjectives(); 
      setShowAdminObjectiveFormModal(false); 
      setEditingObjective(null);
      setNewObjectiveData({ 
        ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '', 
        Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
      });
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObjective = async (objectiveId, skipConfirmation = false) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (!skipConfirmation) {
      setObjectiveToDelete(objectiveId);
      setShowDeleteObjectiveConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "objectives", objectiveId));
      toast.success('Objectif supprimé avec succès.');
      fetchObjectives(); 
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteObjectiveConfirmModal(false); 
      setObjectiveToDelete(null);
    }
  };

  // NOUVELLE FONCTION: Gérer le clic sur le bouton "Signaler"
  const handleReportClick = (taskRealisation) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour signaler une tâche.');
      setShowAuthModal(true);
      return;
    }
    setReportedTaskDetails({
      id: taskRealisation.taskId, // Utilise taskId de la réalisation
      name: taskRealisation.nomTacheEffectuee,
      participant: taskRealisation.nomParticipant,
      realizationId: taskRealisation.id, // L'ID du document de réalisation à supprimer
      reportedUserId: taskRealisation.userId // L'ID Firebase de l'utilisateur qui a fait la fausse tâche
    });
    setShowReportModal(true);
  };

  // NOUVELLE FONCTION: Soumettre le signalement
  const submitReport = async (reporterNameInput) => {
    if (!currentUser) {
      toast.warn('Vous devez être connecté pour signaler une tâche.');
      return;
    }
    if (!reportedTaskDetails) return;

    setLoading(true);
    try {
      // 1. Enregistrer le signalement
      await addDoc(collection(db, "reports"), {
        reportedTaskId: reportedTaskDetails.id,
        reportedUserId: reportedTaskDetails.reportedUserId,
        reportedParticipantName: reportedTaskDetails.participant,
        reporterUserId: currentUser.uid,
        reporterName: reporterNameInput.trim(),
        timestamp: new Date().toISOString(),
        status: 'pending' // Statut initial du rapport
      });

      // 2. Supprimer la réalisation frauduleuse
      await deleteDoc(doc(db, "realizations", reportedTaskDetails.realizationId));
      toast.success(`Tâche signalée et réalisation supprimée.`);

      // 3. Déduire les points du participant signalé
      const DEDUCTION_POINTS = 5;
      const reportedUserRef = doc(db, "users", reportedTaskDetails.reportedUserId);
      const reportedUserSnap = await getDoc(reportedUserRef);

      if (reportedUserSnap.exists()) {
        const reportedUserData = reportedUserSnap.data();
        const newTotalCumulativePoints = Math.max(0, (reportedUserData.totalCumulativePoints || 0) - DEDUCTION_POINTS);
        const newWeeklyPoints = Math.max(0, (reportedUserData.weeklyPoints || 0) - DEDUCTION_POINTS);
        
        await updateDoc(reportedUserRef, {
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints
        });
        toast.info(`${reportedTaskDetails.participant} a perdu ${DEDUCTION_POINTS} points.`);
      } else {
        console.warn(`Utilisateur signalé (${reportedTaskDetails.reportedUserId}) non trouvé dans la collection 'users'.`);
      }

      // Re-fetch ALL data to reflect changes (task reset, points deduction, reports status)
      fetchClassement();
      fetchRealisations();
      fetchTaches(); 
      fetchObjectives();
      fetchReports(); 
    } catch (err) {
      setError(`Erreur lors du signalement de la tâche: ${err.message}`);
      toast.error(`Une erreur est survenue lors du signalement: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReportModal(false);
      setReportedTaskDetails(null);
    }
  };


  const handleParticipantClick = async (participant) => {
    // Trouver l'UID de l'utilisateur à partir de son nom d'affichage
    const usersQuery = query(collection(db, "users"), where("displayName", "==", participant.Nom_Participant));
    const usersSnapshot = await getDocs(usersQuery);
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      setSelectedParticipantProfile({ id: userDoc.id, ...userDoc.data() });
      setActiveMainView('participantProfile');
      await fetchParticipantWeeklyTasks(participant.Nom_Participant);
    } else {
      toast.error("Profil utilisateur introuvable.");
    }
  };

  const isSubTaskAvailable = useCallback((subTask) => {
    const frequence = subTask.Frequence ? String(subTask.Frequence).toLowerCase() : 'hebdomadaire';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0); 

    // Vérifier si la tâche est déjà complétée (dans Realisations)
    const isCompletedInRealisations = realisations.some(real => {
      if (String(real.taskId || '') === String(subTask.ID_Tache)) { // Utilisez taskId pour Firestore
        const realDate = new Date(real.timestamp); // Utilisez timestamp pour Firestore
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

    // Une tâche est disponible si elle n'est PAS complétée dans Realisations.
    // Si elle a été signalée, sa réalisation est supprimée, elle redevient donc disponible.
    return !isCompletedInRealisations;
  }, [realisations]); 


  const handleTaskClick = (task) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour valider une tâche.');
      setShowAuthModal(true);
      return;
    }
    setSelectedTask(task);
    // Le nom du participant est maintenant le displayName de l'utilisateur connecté
    setParticipantName(currentUser.displayName || currentUser.email); 

    if (task.Sous_Taches_IDs && String(task.Sous_Taches_IDs).trim() !== '') {
      fetchSubTasks(task.ID_Tache); 
      setShowSplitTaskDialog(true); 
    } else {
      setShowSplitTaskDialog(false); 
    }
  };

  const areAllSubtasksCompleted = useCallback((groupTask) => {
    if (!groupTask.isGroupTask || !groupTask.Sous_Taches_IDs) {
        return false; 
    }
    const subTaskIds = String(groupTask.Sous_Taches_IDs).split(',').map(id => id.trim());
    
    const associatedSubtasks = allRawTaches.filter(t => subTaskIds.includes(String(t.ID_Tache)));

    if (associatedSubtasks.length === 0) {
        return true; 
    }

    return associatedSubtasks.every(subTask => !isSubTaskAvailable(subTask));
  }, [allRawTaches, isSubTaskAvailable]); 

  // Logique Easter Egg
  const handleLogoClick = () => {
    setLogoClickCount(prevCount => {
      const newCount = prevCount + 1;
      
      if (logoClickTimerRef.current) {
        clearTimeout(logoClickTimerRef.current);
      }
      logoClickTimerRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 500); 

      if (newCount >= 5) {
        setLogoClickCount(0); 
        clearTimeout(logoClickTimerRef.current); 

        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.2, x: 0.5 }, 
          colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#6a0dad', '#800080', '#ffc0cb', '#0000ff'] 
        });

        setShowChickEmoji(true); 
        setTimeout(() => {
          setShowChickEmoji(false); 
        }, 20000); 
      }
      return newCount;
    });
  };

  const getParticipantBadges = useCallback((participant) => {
    const badges = [];
    const participantRealisations = realisations.filter(r => String(r.nomParticipant).trim() === String(participant.Nom_Participant).trim());
    
    const totalPoints = parseFloat(participant.Points_Total_Cumulatif) || 0;

    if (participantRealisations.length > 0 && !badges.some(b => b.name === 'Premier Pas')) {
        badges.push({ name: 'Premier Pas', icon: '🐣', description: 'A complété sa première tâche.' });
    }
    
    const tasksThisWeek = participantRealisations.filter(real => {
        const realDate = new Date(real.timestamp);
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); 
        return realDate >= startOfWeek;
    }).length;
    if (tasksThisWeek >= 3 && !badges.some(b => b.name === 'Actif de la Semaine')) {
        badges.push({ name: 'Actif de la Semaine', icon: '⚡', description: '3 tâches ou plus complétées cette semaine.' });
    }

    const kitchenTasks = participantRealisations.filter(r => String(r.categorieTache || '').toLowerCase() === 'cuisine').length;
    if (kitchenTasks >= 5 && !badges.some(b => b.name === 'Chef Propre')) {
      badges.push({ name: 'Chef Propre', icon: '🍳', description: '5 tâches de cuisine complétées.' });
    }

    const roomTasks = participantRealisations.filter(r => String(r.categorieTache || '').toLowerCase() === 'salle').length;
    if (roomTasks >= 5 && !badges.some(b => b.name === 'Maître de Salon')) {
      badges.push({ name: 'Maître de Salon', icon: '🛋️', description: '5 tâches de salle complétées.' });
    }

    if (totalPoints >= 100 && !badges.some(b => b.name === 'Grand Nettoyeur')) {
      badges.push({ name: 'Grand Nettoyeur', icon: '✨', description: 'Atteint 100 points cumulés.' });
    }
    if (totalPoints >= 500 && !badges.some(b => b.name === 'Champion de la Propreté')) {
      badges.push({ name: 'Champion de la Propreté', icon: '🏆', description: 'Atteint 500 points cumulés.' });
    }
    if (totalPoints >= 1000 && !badges.some(b => b.name === 'Légende de la Propreté')) {
      badges.push({ name: 'Légende de la Propreté', icon: '🌟', description: 'Atteint 1000 points cumulés.' });
    }

    const hasBeenWeeklyWinner = historicalPodiums.some(podium => 
        podium.top3.length > 0 && String(podium.top3[0].name).trim() === String(participant.Nom_Participant).trim()
    );
    if (hasBeenWeeklyWinner && !badges.some(b => b.name === 'Vainqueur Hebdomadaire')) {
        badges.push({ name: 'Vainqueur Hebdomadaire', icon: '🥇', description: 'A été premier du podium hebdomadaire.' });
    }

    const weeklyWins = historicalPodiums.filter(podium => 
        podium.top3.length > 0 && String(podium.top3[0].name).trim() === String(participant.Nom_Participant).trim()
    ).length;
    if (weeklyWins >= 3 && !badges.some(b => b.name === 'Imbattable')) {
        badges.push({ name: 'Imbattable', icon: '👑', description: 'A été premier du podium hebdomadaire 3 fois ou plus.' });
    }

    const hasCompletedGroupTask = participantRealisations.some(r => {
        const taskDef = allRawTaches.find(t => String(t.ID_Tache) === String(r.taskId)); // Utilisez taskId
        return taskDef && (taskDef.Parent_Task_ID || (taskDef.Sous_Taches_IDs && taskDef.Sous_Taches_IDs.trim() !== ''));
    });
    if (hasCompletedGroupTask && !badges.some(b => b.name === 'Esprit d\'équipe')) {
        badges.push({ name: 'Esprit d\'équipe', icon: '🤝', description: 'A complété une tâche de groupe.' });
    }

    // NOUVEAUX BADGES: "Meilleure Balance" et "Bonnet d'Âne"
    const reporterCounts = {};
    const reportedCounts = {};

    reports.forEach(report => {
        const reporter = String(report.reporterName || '').trim();
        const reported = String(report.reportedParticipantName || '').trim();
        
        reporterCounts[reporter] = (reporterCounts[reporter] || 0) + 1;
        reportedCounts[reported] = (reportedCounts[reported] || 0) + 1;
    });

    // "Meilleure Balance"
    if (reporterCounts[String(participant.Nom_Participant).trim()] && reporterCounts[String(participant.Nom_Participant).trim()] > 0 && !badges.some(b => b.name === 'Meilleure Balance')) {
        badges.push({ name: 'Meilleure Balance', icon: '⚖️', description: 'A signalé au moins une tâche non conforme.' });
    }

    // "Bonnet d'Âne"
    if (reportedCounts[String(participant.Nom_Participant).trim()] && reportedCounts[String(participant.Nom_Participant).trim()] > 0 && !badges.some(b => b.name === 'Bonnet d\'Âne')) {
        badges.push({ name: 'Bonnet d\'Âne', icon: '🫏', description: 'A été signalé au moins une fois pour une tâche non conforme.' });
    }

    return badges;
  }, [realisations, historicalPodiums, allRawTaches, reports]); 


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
    const podiumColors = ['bg-podium-gold', 'bg-podium-silver', 'bg-podium-bronze']; 
    const medals = ['🥇', '🥈', '🥉'];

    const remainingTasksCount = taches.filter(tache => {
        if (tache.isGroupTask) {
            return !areAllSubtasksCompleted(tache);
        }
        return isSubTaskAvailable(tache);
    }).length;

    const sortedClassement = [...classement].sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
    const top3 = sortedClassement.slice(0, 3);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl text-center"> 
        <p className="text-lg sm:text-xl font-semibold text-text mb-4">
          Tâches restantes: <span className="text-primary font-bold">{remainingTasksCount}</span>
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary mb-6 sm:mb-8 whitespace-nowrap overflow-hidden text-ellipsis">🏆 Podium de la Semaine 🏆</h2> 
        
        {Array.isArray(classement) && classement.length > 0 ? (
          <>
            <div className="flex justify-center items-end mt-4 sm:mt-6 gap-2 sm:gap-4"> 
              {/* 2ème Place */}
              {top3.length > 1 && (
                <div 
                  key={top3[1].Nom_Participant || `anon-silver`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[1]} order-1 w-1/3 sm:w-auto min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3[1])} 
                >
                  <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[1]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3[1].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3[1].Points_Total_Semaine_Courante} pts</p> 
                </div>
              )}

              {/* 1ère Place */}
              {top3.length > 0 && (
                <div 
                  key={top3[0].Nom_Participant || `anon-gold`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[0]} order-2 w-1/3 sm:w-auto -translate-y-2 min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3[0])} 
                >
                  <span className={`text-5xl sm:text-6xl mb-0.5 sm:mb-1`}>{medals[0]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3[0].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3[0].Points_Total_Semaine_Courante} pts</p> 
                </div>
              )}

              {/* 3ème Place */}
              {top3.length > 2 && (
                <div 
                  key={top3[2].Nom_Participant || `anon-bronze`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[2]} order-3 w-1/3 sm:w-auto min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3[2])} 
                >
                  <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[2]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3[2].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3[2].Points_Total_Semaine_Courante} pts</p> 
                </div>
              )}
            </div>

            <button 
                className="mt-6 sm:mt-8 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md 
                           transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
                onClick={() => setActiveMainView('fullRanking')} 
              >
                Voir le Classement Complet
              </button>
          </>
        ) : (
          <p className="text-center text-lightText text-lg py-4">Soyez le premier à marquer des points cette semaine !</p>
        )}
        
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 border-t border-neutralBg pt-4">
            <button
                onClick={() => setShowHighlightsModal(true)}
                className="bg-neutralBg hover:bg-neutralBg/80 text-text font-semibold py-1.5 px-3 rounded-md transition duration-300 flex items-center justify-center text-xs sm:text-sm flex-1 min-w-[130px]" 
            >
                ✨ Tendances Actuelles ✨
            </button>
            <button
                onClick={() => setShowObjectivesModal(true)}
                className="bg-neutralBg hover:bg-neutralBg/80 text-text font-semibold py-1.5 px-3 rounded-md transition duration-300 flex items-center justify-center text-xs sm:text-sm flex-1 min-w-[130px]" 
            >
                🎯 Objectifs Communs 🎯
            </button>
        </div>
      </div>
    );
  };

  const renderHighlightsContent = () => {
    let mostImproved = null;
    let maxImprovement = -1;

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
        const realDate = new Date(real.timestamp); // Utilisez timestamp
        realDate.setHours(0, 0, 0, 0);
        if (realDate >= startOfCurrentWeek) {
            const name = String(real.nomParticipant).trim(); // Utilisez nomParticipant
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
        return <p className="text-center text-lightText text-md py-2">Aucune tendance disponible pour le moment.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
            {mostImproved && maxImprovement > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50"> 
                <h3 className="text-base font-bold text-primary mb-1">Le Plus Amélioré</h3>
                <p className="text-text text-sm font-semibold">{mostImproved.Nom_Participant}</p>
                <p className="text-lightText text-xs">+{maxImprovement} pts cette semaine</p>
              </div>
            )}
            {mostActive && maxTasksCompleted > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-blue-50">
                <h3 className="text-base font-bold text-primary mb-1">Le Plus Actif</h3>
                <p className="text-text text-sm font-semibold">{mostActive.Nom_Participant}</p>
                <p className="text-lightText text-xs">{maxTasksCompleted} tâches terminées cette semaine</p>
              </div>
            )}
        </div>
    );
  };

  const renderObjectivesContent = () => {
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return <p className="text-center text-lightText text-md py-2">Aucun objectif disponible pour le moment.</p>;
    }

    return (
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
                  <span className="text-success font-bold text-sm">✅ Atteint !</span>
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
    );
  };


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
            let shouldHideTask = false;
            if (tache.isGroupTask) {
                shouldHideTask = areAllSubtasksCompleted(tache);
            } else {
                shouldHideTask = !isSubTaskAvailable(tache); 
            }

            if (shouldHideTask) {
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
                        <span className="ml-0 sm:ml-2 px-1 py-0.5 text-[0.6rem] sm:text-xs font-semibold rounded-full bg-primary text-white shadow-sm whitespace-nowrap mt-1 sm:mt-0"> 
                            Groupe de Tâches
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
                    <div className="border border-gray-300 text-gray-700 font-bold text-xs sm:text-base px-1.5 py-0.5 rounded-md bg-gray-100"> 
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

        {ponctuelTasks.filter(tache => !(!tache.isGroupTask && !isSubTaskAvailable(tache)) && !(tache.isGroupTask && areAllSubtasksCompleted(tache))).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Ponctuelles</h3> 
            {renderTasksList(ponctuelTasks)}
          </div>
        )}

        {quotidienTasks.filter(tache => !(!tache.isGroupTask && !isSubTaskAvailable(tache)) && !(tache.isGroupTask && areAllSubtasksCompleted(tache))).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Quotidiennes</h3> 
            {renderTasksList(quotidienTasks)}
          </div>
        )}

        {hebdomadaireTasks.filter(tache => !(!tache.isGroupTask && !isSubTaskAvailable(tache)) && !(tache.isGroupTask && areAllSubtasksCompleted(tache))).length > 0 && ( 
          <div className="mb-6"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Hebdomadaires</h3> 
            {renderTasksList(hebdomadaireTasks)}
          </div>
        )}

        {currentCategoryTasks.filter(tache => !(!tache.isGroupTask && !isSubTaskAvailable(tache)) && !(tache.isGroupTask && areAllSubtasksCompleted(tache))).length === 0 && (
          <p className="text-center text-lightText text-lg py-4">Aucune tâche disponible dans cette catégorie.</p>
        )}
      </div>
    );
  };

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
            <div key={real.id || real.timestamp + real.nomParticipant + index} // Utilise real.id de Firestore
                 className="bg-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg border border-blue-100"> 
              <div className="flex-1 min-w-0 mb-2 sm:mb-0"> 
                  <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight mb-1">
                      {real.nomTacheEffectuee} {/* Utilise nomTacheEffectuee */}
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-lightText">
                      <span>par <strong className="text-text">{real.nomParticipant}</strong></span> {/* Utilise nomParticipant */}
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(real.categorieTache)}`}> {/* Utilise categorieTache */}
                          {real.categorieTache || 'Non catégorisé'}
                      </span>
                      <span>le {new Date(real.timestamp).toLocaleDateString('fr-FR')} à {new Date(real.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span> {/* Utilise timestamp */}
                  </div>
              </div>
              {currentUser && ( // Affiche le bouton "Signaler" uniquement si l'utilisateur est connecté
                <button
                  onClick={() => handleReportClick(real)}
                  className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs flex-shrink-0"
                >
                  Signaler
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg 
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
          onClick={() => setActiveMainView('home')}
        >
          Retour à l'Accueil
        </button>
      </div>
    );
  };

  const renderThankYouPopup = () => {
    if (!showThankYouPopup) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
          <h3 className="text-3xl sm:text-4xl font-bold text-success mb-6 sm:mb-8">🎉 Bravo ! 🎉</h3> 
          <p className="text-lg sm:text-xl text-text mb-6 sm:mb-8">
            {showThankYouPopup.message}
            <br/>
            Tâche: "<strong className="text-primary">{showThankYouPopup.task}</strong>" terminée par <strong className="text-secondary">{showThankYouPopup.name}</strong>.
          </p>
          <button 
            onClick={() => setShowThankYouPopup(null)} 
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
          >
            Super !
          </button>
        </div>
      </div>
    );
  };


  const renderTaskDialog = () => {
    if (!selectedTask || selectedTask.isGroupTask) return null; 
    // Le nom du participant est déjà défini par currentUser.displayName dans handleTaskClick
    // et mis à jour si l'utilisateur change de nom ou se connecte.
    // L'input est maintenant en lecture seule ou masqué si l'utilisateur est connecté.
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Confirmer la Tâche</h3> 
          <p className="text-base sm:text-lg mb-4">Tâche: <strong className="text-text">{selectedTask.Nom_Tache}</strong> (<span className="font-semibold text-primary">{selectedTask.Calculated_Points} points</span>)</p>
          {currentUser ? (
            <p className="block text-text text-left font-medium mb-2 text-sm sm:text-base">
              Validé par: <strong className="text-secondary">{currentUser.displayName || currentUser.email}</strong>
            </p>
          ) : (
            // Ce bloc ne devrait normalement pas s'afficher car handleTaskClick demande la connexion
            <label htmlFor="participantName" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Votre Nom:</label>
          )}
          <input
            id="participantName"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            readOnly={!!currentUser} // Lecture seule si connecté
            disabled={!!currentUser} // Désactivé si connecté
            autoFocus
          />
          <div className="flex flex-col gap-3 sm:gap-4 mt-4"> 
            <button 
              onClick={() => recordTask(selectedTask.ID_Tache)} 
              disabled={loading || !currentUser} // Désactivé si pas connecté
              className="bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
            >
              {loading ? 'Soumission...' : 'Valider la Tâche'} 
            </button>
            <button 
              onClick={() => { setSelectedTask(null); setParticipantName(''); }} 
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
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
    // Le nom du participant est déjà défini par currentUser.displayName dans handleTaskClick
    // et mis à jour si l'utilisateur change de nom ou se connecte.
    // L'input est maintenant en lecture seule ou masqué si l'utilisateur est connecté.
    const handleSubTaskChange = (subTask) => {
      if (isSubTaskAvailable(subTask)) {
        setSelectedSubTasks(prev => 
          prev.some(t => String(t.ID_Tache) === String(subTask.ID_Tache)) 
            ? prev.filter(t => String(t.ID_Tache) !== String(subTask.ID_Tache))
            : [...prev, subTask]
        );
      } else {
        toast.info(`La tâche "${subTask.Nom_Tache}" a déjà été terminée pour sa période.`);
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
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
            Terminer: {selectedTask.Nom_Tache}
          </h3>
          <p className="text-base sm:text-lg mb-4 text-lightText">
            Sélectionnez les parties que vous avez complétées:
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des sous-tâches...</p>
            </div>
          ) : (
            Array.isArray(subTasks) && subTasks.length > 0 ? (
              <div className="space-y-3 mb-6 text-left max-h-60 overflow-y-auto custom-scrollbar"> 
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

          {currentUser ? (
            <p className="block text-text text-left font-medium mb-2 text-sm sm:text-base">
              Validé par: <strong className="text-secondary">{currentUser.displayName || currentUser.email}</strong>
            </p>
          ) : (
            <label htmlFor="participantNameSplit" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Votre Nom:</label>
          )}
          <input
            id="participantNameSplit"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            readOnly={!!currentUser}
            disabled={!!currentUser}
            autoFocus
          />

          <div className="flex flex-col gap-3 sm:gap-4 mt-4">
            <button
              onClick={recordMultipleTasks}
              disabled={loading || selectedSubTasks.length === 0 || !currentUser}
              className="bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
            >
              {loading ? 'Soumission...' : 'Valider les Tâches Sélectionnées'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderParticipantProfile = () => {
    if (!selectedParticipantProfile) return null;

    const participantCumulativePoints = selectedParticipantProfile.totalCumulativePoints || 0; // Utilise totalCumulativePoints
    const engagementPercentage = totalGlobalCumulativePoints > 0 
      ? ((participantCumulativePoints / totalGlobalCumulativePoints) * 100).toFixed(2) 
      : 0;

    const participantBadges = getParticipantBadges(selectedParticipantProfile);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Profil de {selectedParticipantProfile.displayName || selectedParticipantProfile.email}</h2> {/* Utilise displayName */}
        <div className="mb-6 p-4 bg-neutralBg rounded-xl shadow-inner"> 
          <p className="text-lg sm:text-xl font-semibold text-text">
            Score d'Engagement Global: <span className="text-primary font-bold">{engagementPercentage}%</span>
          </p>
          <p className="text-base sm:text-lg text-lightText mt-2">
            Points Cumulatifs: <span className="font-bold">{participantCumulativePoints}</span>
          </p>
          {participantBadges.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-primary mb-2">Vos Badges:</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {participantBadges.map(badge => (
                  <span 
                    key={badge.name} 
                    title={badge.description} 
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm" 
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">Tâches terminées cette semaine:</h3>
        {participantWeeklyTasks.length > 0 ? (
          <div className="space-y-3 text-left"> 
            {participantWeeklyTasks.map((task, index) => (
              <div key={task.id || task.timestamp + task.userId + index} className="bg-card rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between 
                         shadow-lg border border-blue-100"> 
                <div className="flex-1 min-w-0"> 
                    <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight truncate"> 
                        {task.nomTacheEffectuee}
                    </h4> 
                    <div className="flex items-center space-x-2 mt-1"> 
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(task.categorieTache)}`}>
                            {task.categorieTache || 'Non catégorisé'}
                        </span>
                        <span className="text-sm text-lightText">
                            {new Date(task.timestamp).toLocaleDateString('fr-FR')} 
                        </span>
                    </div>
                </div>
                <p className="text-primary font-bold text-sm sm:text-base flex-shrink-0 ml-2"> 
                    {task.pointsGagnes} pts
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lightText text-md sm:text-lg">Aucune tâche terminée cette semaine.</p>
        )}

        <button 
          className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg 
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
          onClick={() => setActiveMainView('home')}
        >
          Retour à l'Accueil
        </button>
      </div>
    );
  };

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
    const headers = ['Nom_Participant', 'Points_Total_Semaine_Courante', 'Points_Total_Cumulatif', 'Points_Total_Semaine_Precedente', 'Date_Mise_A_Jour'];
    const dataToExport = classement.map(p => ({
        Nom_Participant: p.Nom_Participant,
        Points_Total_Semaine_Courante: p.Points_Total_Semaine_Courante,
        Points_Total_Cumulatif: p.Points_Total_Cumulatif,
        Points_Total_Semaine_Precedente: p.Points_Total_Semaine_Precedente || 0,
        Date_Mise_A_Jour: p.Date_Mise_A_Jour || '' 
    }));
    exportToCsv('classement_clean_app.csv', dataToExport, headers);
    setShowExportSelectionModal(false); 
  };

  const handleExportRealisations = () => {
    const headers = ['taskId', 'userId', 'nomParticipant', 'nomTacheEffectuee', 'categorieTache', 'pointsGagnes', 'timestamp'];
    exportToCsv('realisations_clean_app.csv', realisations, headers);
    setShowExportSelectionModal(false); 
  };

  const renderAdminObjectivesListModal = () => {
    if (!showAdminObjectivesListModal) return null;

    return (
      <ListAndInfoModal title="Gestion des Objectifs" onClose={() => setShowAdminObjectivesListModal(false)} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
        <button
          onClick={() => {
            setShowAdminObjectivesListModal(false); 
            setEditingObjective(null);
            setNewObjectiveData({ 
              ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
              Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
            });
            setShowAdminObjectiveFormModal(true); 
          }}
          className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 w-full mb-4 text-sm" 
        >
          Ajouter un Nouvel Objectif
        </button>

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
                        setShowAdminObjectivesListModal(false); 
                        setEditingObjective(obj);
                        setNewObjectiveData(obj);
                        setShowAdminObjectiveFormModal(true); 
                      }}
                      className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteObjective(obj.ID_Objectif)}
                      className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ListAndInfoModal>
    );
  };

  const renderAdminTasksListModal = () => {
    if (!showAdminTasksListModal) return null;

    return (
      <ListAndInfoModal title="Gestion des Tâches" onClose={() => setShowAdminTasksListModal(false)} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
        <button
          onClick={() => { 
            setShowAdminTasksListModal(false); 
            setEditingTask(null); 
            setNewTaskData({ 
              ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
              Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
            }); 
            setShowAdminTaskFormModal(true); 
          }}
          className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 w-full mb-4 text-sm" 
        >
          Ajouter une Nouvelle Tâche
        </button>

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
                        setShowAdminTasksListModal(false); 
                        setEditingTask(task); 
                        setNewTaskData(task); 
                        setShowAdminTaskFormModal(true); 
                      }}
                      className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.ID_Tache)}
                      className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ListAndInfoModal>
    );
  };


  const renderAdminPanel = () => {
    if (!isAdmin) {
      return null; 
    }

    const adminButtonClasses = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"; 

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-6 text-center">Panneau d'Administration</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3 bg-neutralBg rounded-xl shadow-inner"> 
          <button
              onClick={() => setShowAdminObjectivesListModal(true)}
              className={`${adminButtonClasses} col-span-1`}
          >
              Gérer les Objectifs
          </button>
          <button
              onClick={() => setShowAdminTasksListModal(true)}
              className={`${adminButtonClasses} col-span-1`}
          >
              Gérer les Tâches
          </button>
          <button
            onClick={() => setShowExportSelectionModal(true)}
            className={`${adminButtonClasses} col-span-1`}
          >
            Exporter les Données (CSV)
          </button>
          <button
            onClick={() => setShowConfirmResetModal(true)}
            className={`bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs sm:text-sm col-span-1`} 
          >
            Réinitialiser les Points Hebdomadaires
          </button>
        </div>

        <div className="mb-6 p-3 bg-neutralBg rounded-xl shadow-inner"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">Statistiques des Tâches</h3>
            <TaskStatisticsChart realisations={realisations} allRawTaches={allRawTaches} />
        </div>
      </div>
    );
  };

  const renderFullRankingCards = () => {
    if (!Array.isArray(classement) || classement.length === 0) {
      return (
        <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Classement Complet</h2>
          <p className="text-center text-lightText text-lg">Aucun classement disponible pour le moment.</p>
          <button
            className="mt-6 sm:mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
            onClick={() => setActiveMainView('home')}
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    const sortedClassement = [...classement].sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Classement Hebdomadaire Complet</h2>
        <div className="flex flex-col gap-3 mb-6 items-center"> 
          {sortedClassement.map((participant, index) => (
            <RankingCard
              key={participant.Nom_Participant}
              participant={participant}
              rank={index + 1}
              type="weekly" 
              onParticipantClick={handleParticipantClick}
              getParticipantBadges={getParticipantBadges}
            />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4"> 
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
            onClick={() => setActiveMainView('home')}
          >
            Retour à l'accueil
          </button>
          <button
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm" 
            onClick={() => setShowOverallRankingModal(true)}
          >
            Voir le Classement Général
          </button>
        </div>
      </div>
    );
  };


  if (loadingUser || loading) { // Attendre que l'utilisateur soit chargé
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"> 
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast mb-4 sm:mb-6"></div> 
        <p className="text-xl sm:text-2xl font-semibold text-lightText">Chargement des données...</p> 
      </div>
    );
  }

  if (error) return <div className="text-center p-8 text-xl text-error">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark font-sans p-4 sm:p-6"> 
      <div className="max-w-4xl mx-auto">
        <header className="relative flex flex-col items-center justify-center py-4 sm:py-6 px-4 mb-6 sm:mb-8 text-center"> 
          {showChickEmoji ? (
            <span className="text-7xl sm:text-8xl mb-3 sm:mb-4 cursor-pointer" onClick={handleLogoClick}>🐣</span>
          ) : (
            <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-3 sm:mb-4 h-20 sm:h-28 md:h-36 w-auto drop-shadow-xl cursor-pointer" onClick={handleLogoClick} /> 
          )}
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-secondary drop-shadow-md">Clean App Challenge</h1> 
          {/* Le bouton AdminLoginButton est maintenant un bouton d'authentification générique */}
          <AdminLoginButton 
            currentUser={currentUser} // Passe l'utilisateur actuel
            isAdmin={isAdmin} // Passe le statut admin
            onAuthAction={handleAuthAction} // Gère la connexion/déconnexion
            onOpenAdminPanel={() => setActiveMainView('adminPanel')} 
          />
        </header>

        <nav className="flex justify-center mb-6 sm:mb-8"> 
          <div className="bg-neutralBg rounded-full p-1.5 flex justify-center gap-4 sm:gap-6 shadow-lg border border-primary/20 flex-nowrap overflow-x-auto"> 
            <button
              className={`py-2 px-4 sm:px-6 rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex-shrink-0
                ${activeMainView === 'home' ? 'bg-primary text-white shadow-lg' : 'text-text hover:bg-accent hover:text-secondary'}`}
              onClick={() => setActiveMainView('home')}
            >
              Accueil
            </button>
            <button
              className={`py-2 px-4 sm:px-6 rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex-shrink-0
                ${activeMainView === 'completedTasks' ? 'bg-primary text-white shadow-lg' : 'text-text hover:bg-accent hover:text-secondary'}`}
              onClick={() => setActiveMainView('completedTasks')}
            >
              Tâches Terminées
            </button>
            <button
              className={`py-2 px-4 sm:px-6 rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex-shrink-0
                ${activeMainView === 'historicalPodiums' ? 'bg-primary text-white shadow-lg' : 'text-text hover:bg-accent hover:text-secondary'}`}
              onClick={() => setActiveMainView('historicalPodiums')}
            >
              Historique
            </button> 
          </div>
        </nav>

        <main>
          {activeMainView === 'home' && (
            <>
              {renderPodiumSection()} 
              <hr className="my-6 sm:my-8 border-t-2 border-neutralBg" /> 
              {renderTaskCategories()}
            </>
          )}
          {activeMainView === 'fullRanking' && (
            renderFullRankingCards()
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

        {showHighlightsModal && (
            <ListAndInfoModal title="Tendances Actuelles" onClose={() => setShowHighlightsModal(false)} sizeClass="max-w-xs sm:max-w-md"> 
                {renderHighlightsContent()}
            </ListAndInfoModal>
        )}
        {showObjectivesModal && (
            <ListAndInfoModal title="Objectifs Communs" onClose={() => setShowObjectivesModal(false)} sizeClass="max-w-xs sm:max-w-md"> 
                {renderObjectivesContent()}
            </ListAndInfoModal>
        )}
        {showAdminObjectivesListModal && isAdmin && renderAdminObjectivesListModal()} {/* Rendu conditionnel par isAdmin */}
        {showAdminTasksListModal && isAdmin && renderAdminTasksListModal()} {/* Rendu conditionnel par isAdmin */}
        {showExportSelectionModal && isAdmin && ( // Rendu conditionnel par isAdmin
            <ExportSelectionModal
                onClose={() => setShowExportSelectionModal(false)}
                onExportClassement={handleExportClassement}
                onExportRealisations={handleExportRealisations}
            />
        )}
        {showOverallRankingModal && (
          <OverallRankingModal
            classement={classement}
            onClose={() => setShowOverallRankingModal(false)}
            onParticipantClick={handleParticipantClick}
            getParticipantBadges={getParticipantBadges}
          />
        )}

        {showReportModal && currentUser && ( // Rendu conditionnel par currentUser
          <ReportTaskModal
            show={showReportModal}
            onClose={() => { setShowReportModal(false); setReportedTaskDetails(null); }}
            onSubmit={submitReport}
            reportedTaskDetails={reportedTaskDetails}
            loading={loading}
          />
        )}

        {showAdminObjectiveFormModal && isAdmin && ( // Rendu conditionnel par isAdmin
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
        {showAdminTaskFormModal && isAdmin && ( // Rendu conditionnel par isAdmin
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
        {showAuthModal && ( // Modale d'authentification
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}

      </div>
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

// Composant racine qui enveloppe AppContent avec UserProvider
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
