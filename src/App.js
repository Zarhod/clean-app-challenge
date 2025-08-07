// src/App.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; 
import HistoricalPodiums from './HistoricalPodiums'; 
import AdminTaskFormModal from './AdminTaskFormModal'; 
import ConfettiOverlay from './ConfettiOverlay'; 
import TaskStatisticsChart from './TaskStatisticsChart'; 
import AdminObjectiveFormModal from './AdminObjectiveFormModal'; 
import ListAndInfoModal from './ListAndInfoModal'; 
import OverallRankingModal from './OverallRankingModal'; 
import ReportTaskModal from './ReportTaskModal'; 
import AuthModal from './AuthModal'; 
import AdminUserManagementModal from './AdminUserManagementModal'; 
import AdminCongratulatoryMessagesModal from './AdminCongratulatoryMessagesModal'; 
import WeeklyRecapModal from './WeeklyRecapModal'; 
import AvatarSelectionModal from './AvatarSelectionModal'; 
import PasswordChangeModal from './PasswordChangeModal'; 
import ProfileEditOptionsModal from './ProfileEditOptionsModal'; 
import confetti from 'canvas-confetti';
import { calculateLevelAndXP } from './utils/levelUtils';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Importations Firebase
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc, writeBatch, onSnapshot } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

// Importation du contexte utilisateur
import { UserProvider, useUser } from './UserContext';
// TaskConfirmModal gère maintenant les tâches simples et complexes
import TaskConfirmModal from './TaskConfirmModal'; 
import RankingCardModal from './RankingCard';
import Navbar from './components/Navbar';
import { LogOut } from 'lucide-react';
import checkAndAssignBadges from './utils/checkAndAssignBadges';
import BadgePopup from './components/BadgePopup';
import BadgeCarousel from "./components/BadgeCarousel";
import BADGES from './utils/badges';
import InvitationsAdminModal from './InvitationsAdminModal';
import WeeklyRecapImageModal from './WeeklyRecapImageModal';
import { generateRecapDataFromStats } from "./utils/recapUtils";



const LOGO_FILENAME = 'logo.png'; 


function AppContent() { 
  // eslint-disable-next-line no-unused-vars
  const [logoClickCount, setLogoClickCount] = useState(0); 
  const { currentUser, isAdmin, loadingUser, db, auth, setCurrentUser } = useUser(); 

  const [taches, setTaches] = useState([]); 
  const [allRawTaches, setAllRawTaches] = useState([]); 
  const [realisations, setRealisations] = useState([]); 
  const [usersData, setUsersData] = useState([]); // Nouveau: pour stocker les données brutes des utilisateurs
  const [classement, setClassement] = useState([]); 
  const [historicalPodiums, setHistoricalPodiums] = useState([]); 
  const [objectives, setObjectives] = useState([]); 
  const [congratulatoryMessages, setCongratulatoryMessages] = useState([]); 
  const [loading, setLoading] = useState(true); 

  const [selectedTask, setSelectedTask] = useState(null); 
  const [showThankYouPopup, setShowThankYouPopup] = useState(null); 
  const [showConfetti, setShowConfetti] = useState(false); 
  const [badgeQueue, setBadgeQueue] = useState([]); // tableau de badges à afficher (FIFO)
  const [showingBadge, setShowingBadge] = useState(null);

  const [activeMainView, setActiveMainView] = useState('home'); 
  const [activeTaskCategory, setActiveTaskCategory] = useState('tous'); 

  const [selectedParticipantProfile, setSelectedParticipantProfile] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  // alreadyDoneSubTasks n'est pas utilisé dans le code fourni, mais conservé.
  // eslint-disable-next-line no-unused-vars
  const [alreadyDoneSubTasks, setAlreadyDoneSubTasks] = useState([]);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  // Fonction pour vérifier si une sous-tâche est disponible (non encore complétée pour la période)
  const isSubTaskAvailable = useCallback((subTask) => {
    if (!currentUser) return false;

    const frequence = subTask.Frequence ? String(subTask.Frequence).toLowerCase() : 'hebdomadaire';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0); 

    const isCompletedInRealisations = realisations.some(real => {
      if (String(real.taskId || '') === String(subTask.ID_Tache) && String(real.userId) === String(currentUser.uid)) { 
        const realDate = new Date(real.timestamp); 
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

    return !isCompletedInRealisations;
  }, [realisations, currentUser]); 

  // Gère le clic sur une tâche pour ouvrir la modale de confirmation
  const handleTaskClick = async (task) => {
    if (!currentUser) {
      toast.warn("Veuillez vous connecter pour valider une tâche.");
      setShowAuthModal(true);
      return;
    }

    setLoading(true); // Active le chargement pendant la préparation de la tâche

    try {
      const taskToOpenModal = { ...task }; // Crée une copie pour éviter de modifier l'état directement

      // Si c'est une tâche de groupe (définie par Sous_Taches_IDs)
      if (task.Sous_Taches_IDs && typeof task.Sous_Taches_IDs === 'string' && task.Sous_Taches_IDs.trim() !== '') {
        const subTaskIds = task.Sous_Taches_IDs.split(',').map(id => id.trim()).filter(Boolean);
        const fetchedSubTasks = [];

        // Récupère les détails complets de chaque sous-tâche depuis allRawTaches
        for (const id of subTaskIds) {
          const subTaskDetail = allRawTaches.find(t => String(t.ID_Tache) === String(id));
          if (subTaskDetail) {
            fetchedSubTasks.push({
              ID_Tache: subTaskDetail.ID_Tache,
              Nom_Tache: subTaskDetail.Nom_Tache,
              Points: parseFloat(subTaskDetail.Points) || 0,
              Frequence: subTaskDetail.Frequence, // Important pour isSubTaskAvailable
              Urgence: subTaskDetail.Urgence,
              Categorie: subTaskDetail.Categorie,
              // Ajoutez d'autres champs si nécessaire pour l'affichage dans la modale
            });
          } else {
            console.warn(`Sous-tâche avec l'ID ${id} non trouvée dans allRawTaches.`);
          }
        }

        // Injecte le tableau des objets sous-tâches dans l'objet de la tâche principale
        taskToOpenModal.SousTaches = fetchedSubTasks;
        taskToOpenModal.isGroupTask = true; // Confirme que c'est une tâche de groupe
      } else {
        // C'est une tâche simple
        taskToOpenModal.isGroupTask = false;
        taskToOpenModal.SousTaches = []; // S'assurer que c'est vide pour une tâche simple
        // Les points sont déjà dans task.Calculated_Points pour les tâches simples
      }

      setSelectedTask(taskToOpenModal); // Définit la tâche préparée pour la modale
      setShowTaskModal(true); // Ouvre la TaskConfirmModal
    } catch (err) {
      toast.error(`Erreur lors du chargement de la tâche : ${err.message}`);
      console.error("Erreur dans handleTaskClick:", err);
    } finally {
      setLoading(false); // Désactive le chargement
    }
  };


  // Gère la confirmation d'une tâche (appelée par TaskConfirmModal)
  const handleTaskConfirmation = async ({ selectedSubs, points }) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour valider une tâche.');
      setShowAuthModal(true);
      return;
    }

    setLoadingConfirm(true);
    try {
      const now = new Date();
      const batch = writeBatch(db);

      let totalPointsGained = 0;
      const itemsToProcess = selectedSubs.length > 0 ? selectedSubs : [selectedTask];

      for (const item of itemsToProcess) {
        const taskId = item.ID_Tache;
        const taskName = item.Nom_Tache;
        const taskPoints = parseFloat(item.Points) || 0;
        const taskCategory = item.Categorie || 'Non catégorisée';
        const taskFrequence = item.Frequence;

        totalPointsGained += taskPoints;

        batch.set(doc(collection(db, 'realizations')), {
          taskId: taskId,
          userId: currentUser.uid,
          nomParticipant: currentUser.displayName || currentUser.email,
          nomTacheEffectuee: taskName,
          categorieTache: taskCategory,
          pointsGagnes: taskPoints,
          timestamp: now.toISOString(),
          parentTaskId: selectedSubs.length > 0 ? selectedTask.ID_Tache : null,
        });

        // Ponctuel = suppression après réalisation
        if (String(taskFrequence || '').toLowerCase() === 'ponctuel') {
          const taskDocToDelete = allRawTaches.find(t => String(t.ID_Tache) === String(taskId));
          if (taskDocToDelete) {
            batch.delete(doc(db, 'tasks', taskDocToDelete.id));
          }
        }
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedXP = (userData.xp || 0) + totalPointsGained;

        batch.update(userRef, {
          xp: updatedXP,
          weeklyPoints: (userData.weeklyPoints || 0) + totalPointsGained,
          totalCumulativePoints: (userData.totalCumulativePoints || 0) + totalPointsGained,
        });

        const { newLevel } = calculateLevelAndXP(updatedXP);
        if (newLevel > (userData.level || 1)) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6, x: 0.5 },
            colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#6a0dad', '#800080', '#ffc0cb', '#0000ff']
          });
          toast.success(`Félicitations ! Vous avez atteint le niveau ${newLevel} !`);
        }

        setCurrentUser(prevUser => ({
          ...prevUser,
          xp: updatedXP,
          weeklyPoints: (userData.weeklyPoints || 0) + totalPointsGained,
          totalCumulativePoints: (userData.totalCumulativePoints || 0) + totalPointsGained,
          level: newLevel
        }));
      }

      await batch.commit();

      // ============ BADGES AUTOMATIQUES =============
      const updatedUserSnap = await getDoc(userRef);
      const updatedUser = { id: userRef.id, ...updatedUserSnap.data() };

      // Toutes les réalisations du user
      const realizationsSnap = await getDocs(
        query(collection(db, 'realizations'), where('userId', '==', currentUser.uid))
      );
      const realisations = realizationsSnap.docs.map(doc => doc.data());

      // Toutes les tâches (pour les règles)
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      const tasks = tasksSnap.docs.map(doc => doc.data());

      // Attribue les badges et affiche le popup en temps réel
      await checkAndAssignBadges(
        updatedUser,
        realisations,
        tasks,
        db,
        (newBadge) => {
          // Ouvre la modale ou l'animation du badge obtenu
          showBadgePopup(newBadge); // (à remplacer par ton vrai composant/popup !)
        }
      );
      // ==============================================

      // Reste du feedback
      const completedTaskNames = itemsToProcess.map(t => t.Nom_Tache).join(', ');
      const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
      setShowThankYouPopup({ name: currentUser.displayName || currentUser.email, task: completedTaskNames, message: randomMessage });
      setShowConfetti(true);

      toast.success("Tâche(s) validée(s) !");
    } catch (error) {
      console.error("Erreur de validation :", error);
      toast.error("Erreur lors de la validation de la tâche.");
    } finally {
      setLoadingConfirm(false);
      setShowTaskModal(false);
      setSelectedTask(null);
    }
  };

  const [participantWeeklyTasks, setParticipantWeeklyTasks] = useState([]); 
  const [totalGlobalCumulativePoints, setTotalGlobalCumulativePoints] = useState(0); 
  
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false); 
  const [showConfirmResetRealisationsModal, setShowConfirmResetRealisationsModal] = useState(false);
  
  const [showAdminTaskFormModal, setShowAdminTaskFormModal] = useState(false); 
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); 
  const [taskToDelete, setTaskToDelete] = useState(null); 
  const [newTaskData, setNewTaskData] = useState({ 
    ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
    Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
  });
  const [editingTask, setEditingTask] = useState(null);

  const [showAdminObjectiveFormModal, setShowAdminObjectiveFormModal] = useState(false); 
  const [newObjectiveData, setNewObjectiveData] = useState({ 
    ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
    Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false 
  });
  const [editingObjective, setEditingObjective] = useState(null); 
  const [showDeleteObjectiveConfirmModal, setShowDeleteObjectiveConfirmModal] = useState(false); 
  const [objectiveToDelete, setObjectiveToDelete] = useState(null); 

  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [showAdminObjectivesListModal, setShowAdminObjectivesListModal] = useState(false);
  const [showAdminTasksListModal, setShowAdminTasksListModal] = useState(false);
  const [showExportSelectionModal, setShowExportSelectionModal] = useState(false); 
  const [showOverallRankingModal, setShowOverallRankingModal] = useState(false); 
  const [showAdminUserManagementModal, setShowAdminUserManagementModal] = useState(false); 
  const [showAdminCongratulatoryMessagesModal, setShowAdminCongratulatoryMessagesModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [reports, setReports] = useState([]);


  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedTaskDetails, setReportedTaskDetails] = useState(null); 

  const [showChickEmoji, setShowChickEmoji] = useState(false);
  const logoClickTimerRef = useRef(null); 

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileEditOptionsModal, setShowProfileEditOptionsModal] = useState(false); 

  const [showGlobalDataViewModal, setShowGlobalDataViewModal] = useState(false);
  const [selectedGlobalCollection, setSelectedGlobalCollection] = useState(null);
  const [globalCollectionDocs, setGlobalCollectionDocs] = useState([]);
  const [loadingGlobalCollectionDocs, setLoadingGlobalCollectionDocs] = useState(false);
  const [selectedDocumentDetails, setSelectedDocumentDetails] = useState(null);

  const [showWeeklyRecapModal, setShowWeeklyRecapModal] = useState(false);
  const [weeklyRecapData, setWeeklyRecapData] = useState(null);

  const [showFullRankingModal, setShowFullRankingModal] = useState(false);

  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false); 
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false); 
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showWeeklyRecapImage, setShowWeeklyRecapImage] = useState(false);


  // États pour la pagination des réalisations
  const [realizationsPerPage] = useState(10);
  const [currentRealizationsPage, setCurrentRealizationsPage] = useState(1);

  // Ref pour suivre l'état de chargement initial de chaque collection
  const initialLoadStatus = useRef({
    tasks: false,
    realizations: false,
    users: false, // Ajouté pour suivre le chargement des utilisateurs
    objectives: false,
    congratulatoryMessages: false,
    historicalPodiums: false,
    reports: false,
  });

  // Met à jour participantName si currentUser change (commenté car géré par TaskConfirmModal)
  useEffect(() => {
    if (currentUser) {
      // setParticipantName(currentUser.displayName || currentUser.email); 
    } else {
      // setParticipantName(''); 
    }
  }, [currentUser]);

  // Synchronise selectedParticipantProfile si c'est le profil de l'utilisateur actuel
  useEffect(() => {
    if (
      currentUser &&
      selectedParticipantProfile &&
      selectedParticipantProfile.id === currentUser.uid &&
      JSON.stringify(selectedParticipantProfile) !== JSON.stringify({ id: currentUser.uid, ...currentUser })
    ) {
      setSelectedParticipantProfile({ id: currentUser.uid, ...currentUser });
    }
  }, [currentUser, selectedParticipantProfile]);

  const showBadgePopup = (badge) => {
    setBadgeQueue(prevQueue => [...prevQueue, badge]);
  };

  const handleCloseBadge = () => setShowingBadge(null);

  // Fonction pour calculer le récapitulatif de la semaine précédente
  const calculateWeeklyRecap = useCallback((userId, displayName, allRealisations, allHistoricalPodiums) => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); 

    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - (currentDayOfWeek === 0 ? 7 : currentDayOfWeek) - 6); 
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6); 
    endOfLastWeek.setHours(23, 59, 59, 999);

    let pointsGained = 0;
    const tasksCompleted = [];
    let isWinner = false;

    const userRealisations = allRealisations.filter(real => String(real.userId) === String(userId));

    userRealisations.forEach(real => {
      const realDate = new Date(real.timestamp);
      if (realDate >= startOfLastWeek && realDate <= endOfLastWeek) {
        pointsGained += (parseFloat(real.pointsGagnes) || 0);
        tasksCompleted.push(real.nomTacheEffectuee);
      }
    });

    const lastWeekPodiums = (allHistoricalPodiums || []).filter(podium => {
      const podiumDate = new Date(podium.Date_Podium);
      return podiumDate >= startOfLastWeek && podiumDate <= endOfLastWeek;
    });

    if (lastWeekPodiums.length > 0) {
      const sortedPodiums = [...lastWeekPodiums].sort((a, b) => new Date(b.Date_Podium) - new Date(a.Date_Podium));
      const topEntry = sortedPodiums[0].top3[0]; 
      if (topEntry && String(topEntry.name).trim() === String(displayName).trim()) {
        isWinner = true;
      }
    }

    return {
      displayName: displayName,
      pointsGained: pointsGained,
      tasksCompleted: tasksCompleted,
      isWinner: isWinner,
      startDate: startOfLastWeek.toLocaleDateString('fr-FR'),
      endDate: endOfLastWeek.toLocaleDateString('fr-FR')
    };
  }, []); 

  useEffect(() => {
    if (
      usersData?.length > 0 &&
      realisations?.length > 0 &&
      allRawTaches?.length > 0
    ) {
      const recap = generateRecapDataFromStats(usersData, realisations, allRawTaches);
      setWeeklyRecapData(recap);
    }
  }, [usersData, realisations, allRawTaches]);

  // Fonctions de récupération de données utilisant onSnapshot (CHEMINS MIS À JOUR)
  const setupTasksListener = useCallback(() => {
    const tasksCollectionPath = 'tasks'; 

    const q = query(collection(db, tasksCollectionPath));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const cleanedRawData = rawData.filter(tache => {
        const isValid = tache && tache.ID_Tache;
        return isValid;
      });
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
        .filter(tache => tache !== null); 

      const finalFilteredTaches = processedAndFilteredTaches.filter(tache => {
        const isTopLevel = tache.Parent_Task_ID === null || tache.Parent_Task_ID === undefined || String(tache.Parent_Task_ID).trim() === '';
        return isTopLevel;
      });

      setTaches(finalFilteredTaches);
      initialLoadStatus.current.tasks = true;
    }, (error) => {
      if (auth.currentUser) { 
        toast.error(`Erreur lors de la récupération des tâches: ${error.message}`); 
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  const setupRealisationsListener = useCallback(() => {
    const q = query(collection(db, 'realizations')); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRealisations(data);
      initialLoadStatus.current.realizations = true;
    }, (error) => {
      if (auth.currentUser) { 
        toast.error(`Erreur lors de la récupération des réalisations: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  // Nouveau: Écouteur pour les données brutes des utilisateurs
  const setupUsersListener = useCallback(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersData(data); // Met à jour l'état usersData
      initialLoadStatus.current.users = true; // Marque les utilisateurs comme chargés
    }, (error) => {
      if (auth.currentUser) {
        toast.error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]);

  // Nouveau: useEffect pour calculer le classement une fois que les données utilisateurs et réalisations sont disponibles
  useEffect(() => {
    // Ne calcule le classement que si les données brutes des utilisateurs et les réalisations sont chargées
    if (usersData.length > 0 && realisations.length > 0) { 
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
          Points_Total_Semaine_Precedente: parseFloat(user.previousWeeklyPoints || 0), 
          Date_Mise_A_Jour: user.dateJoined || '',
          Avatar: user.avatar || '👤', 
          Level: user.level || 1, 
          XP: user.xp || 0 
        };
      });

      const tempWeeklyPoints = {};
      const tempCumulativePoints = {};

      realisations.forEach(real => {
        const participant = real.nomParticipant;
        const points = parseFloat(real.pointsGagnes) || 0;
        const realDate = new Date(real.timestamp);
        realDate.setHours(0, 0, 0, 0);

        if (realDate >= startOfCurrentWeek) {
          tempWeeklyPoints[participant] = (tempWeeklyPoints[participant] || 0) + points;
        }
        tempCumulativePoints[participant] = (tempCumulativePoints[participant] || 0) + points;
      });

      usersData.forEach(user => {
        const displayName = user.displayName;
        if (!participantScores[displayName]) {
          participantScores[displayName] = {
            Nom_Participant: displayName,
            Points_Total_Semaine_Courante: 0,
            Points_Total_Cumulatif: 0,
            Points_Total_Semaine_Precedente: parseFloat(user.previousWeeklyPoints || 0),
            Date_Mise_A_Jour: user.dateJoined || '',
            Avatar: user.avatar || '👤',
            Level: user.level || 1,
            XP: user.xp || 0
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
      // initialLoadStatus.current.classement = true; // Cette ligne est supprimée car le statut est géré par l'écouteur des utilisateurs
    }
  }, [usersData, realisations]); // Dépend de usersData et realisations


  const setupObjectivesListener = useCallback(() => {
    const q = query(collection(db, 'objectives')); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setObjectives(data);
      initialLoadStatus.current.objectives = true;
    }, (error) => {
      if (auth.currentUser) {
        toast.error(`Erreur lors de la récupération des objectifs: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  const setupCongratulatoryMessagesListener = useCallback(() => {
    const q = query(collection(db, 'congratulatory_messages')); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCongratulatoryMessages(data);
      initialLoadStatus.current.congratulatoryMessages = true;
    }, (error) => {
      if (auth.currentUser) {
        setCongratulatoryMessages([{ Texte_Message: "Bravo pour votre excellent travail !" }]); 
        toast.error(`Erreur lors de la récupération des messages de félicitation: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  const setupHistoricalPodiumsListener = useCallback(() => {
    const q = query(collection(db, 'historical_podiums')); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalPodiums(data);
      initialLoadStatus.current.historicalPodiums = true;
    }, (error) => {
      if (auth.currentUser) {
        toast.error(`Erreur lors de la récupération des podiums historiques: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  const setupReportsListener = useCallback(() => {
    const q = query(collection(db, 'reports')); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      initialLoadStatus.current.reports = true;
    }, (error) => {
      if (auth.currentUser) {
        toast.error(`Erreur lors de la récupération des rapports: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [db, auth]); 

  // Effet principal pour gérer les écouteurs en temps réel et l'état de chargement global
  useEffect(() => {
    const unsubscribes = [];
    const currentInitialLoadStatusRef = initialLoadStatus.current; 
    let timeoutId;

    const checkInitialLoad = () => {
      const allLoaded = Object.values(currentInitialLoadStatusRef).every(status => status);
      if (allLoaded) {
        setLoading(false); 
      } else {
        timeoutId = setTimeout(() => {
          setLoading(false); 
        }, 5000); 
      }
    };

    if (!loadingUser && currentUser) {
      if (db && auth) {
        unsubscribes.push(setupTasksListener());
        unsubscribes.push(setupRealisationsListener());
        unsubscribes.push(setupUsersListener()); // Appel du nouvel écouteur pour les utilisateurs
        unsubscribes.push(setupObjectivesListener());
        unsubscribes.push(setupCongratulatoryMessagesListener());
        unsubscribes.push(setupHistoricalPodiumsListener());
        unsubscribes.push(setupReportsListener());
      }

      setTimeout(checkInitialLoad, 500); 

    } else if (!loadingUser && !currentUser) {
      setTaches([]);
      setAllRawTaches([]);
      setRealisations([]);
      setUsersData([]); // Réinitialise les données utilisateurs brutes
      setClassement([]);
      setHistoricalPodiums([]);
      setObjectives([]);
      setCongratulatoryMessages([]);
      setReports([]);
      setWeeklyRecapData(null); 
      setLoading(false); 
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      Object.keys(currentInitialLoadStatusRef).forEach(key => currentInitialLoadStatusRef[key] = false);
    };
  }, [
    currentUser, loadingUser, db, auth, 
    setupTasksListener, setupRealisationsListener, setupUsersListener, // Dépendance mise à jour
    setupObjectivesListener, setupCongratulatoryMessagesListener, setupHistoricalPodiumsListener,
    setupReportsListener
  ]);

  useEffect(() => {
    const fetchClassement = async () => {
      if (!db || !auth?.currentUser) return;  // <--- AJOUT
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setClassement(data);
      } catch (error) {
        console.error("Erreur lors de la récupération du classement :", error);
      }
    };

    fetchClassement();
  }, [db, auth?.currentUser]); // <--- Ajoute auth?.currentUser dans les deps

  useEffect(() => {
    if (
      !showingBadge &&
      badgeQueue.length > 0 &&
      !showThankYouPopup // <--- remplace par ton vrai state
    ) {
      setShowingBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    }
  }, [badgeQueue, showingBadge, showThankYouPopup]);

  // Deuxième useEffect: Calcul et affichage du récapitulatif hebdomadaire
  useEffect(() => {
    const handleRecapLogic = async () => {
      if (currentUser && realisations.length > 0 && historicalPodiums.length > 0 && db) { 
        const today = new Date();
        const currentDayOfWeek = today.getDay(); 

        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));
        currentMonday.setHours(0, 0, 0, 0);

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const lastRecapDisplayed = userData.lastWeeklyRecapDisplayed ? new Date(userData.lastWeeklyRecapDisplayed) : null;

        if (currentDayOfWeek === 1 && (!lastRecapDisplayed || lastRecapDisplayed.toDateString() !== currentMonday.toDateString())) {
          const recap = calculateWeeklyRecap(currentUser.uid, currentUser.displayName || currentUser.email, realisations, historicalPodiums);
          setWeeklyRecapData(recap);
          setShowWeeklyRecapModal(true);
          await updateDoc(userDocRef, {
            lastWeeklyRecapDisplayed: currentMonday.toISOString()
          });
        } else if (lastRecapDisplayed && lastRecapDisplayed.toDateString() === currentMonday.toDateString()) {
            const recap = calculateWeeklyRecap(currentUser.uid, currentUser.displayName || currentUser.email, realisations, historicalPodiums);
            setWeeklyRecapData(recap);
        } else {
            setWeeklyRecapData(null); 
        }
      } else if (currentUser && (realisations.length === 0 || historicalPodiums.length === 0)) {
        setWeeklyRecapData(null);
      }
    };
    handleRecapLogic();
  }, [
    currentUser,
    realisations, 
    historicalPodiums, 
    calculateWeeklyRecap,
    db 
  ]);

  useEffect(() => {
    const shouldGenerate =
      currentUser?.isAdmin &&
      usersData?.length > 0 &&
      realisations?.length > 0 &&
      allRawTaches?.length > 0;

    if (shouldGenerate) {
      const data = generateRecapDataFromStats(usersData, realisations, allRawTaches);
      setWeeklyRecapData(data);
    }
  }, [currentUser, usersData, realisations, allRawTaches]);

  const fetchParticipantWeeklyTasks = useCallback(async (participantName) => {
    setLoading(true); 
    try {
      const q = query(collection(db, 'realizations'), where("nomParticipant", "==", participantName)); 
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
      toast.error(`Erreur lors du chargement du profil: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [setParticipantWeeklyTasks, setLoading, db]); 

  const fetchGlobalCollectionDocs = useCallback(async (collectionName) => {
    setLoadingGlobalCollectionDocs(true);
    try {
      const collectionPath = collectionName; 
      const q = query(collection(db, collectionPath));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalCollectionDocs(docs);
    } catch (err) {
      toast.error(`Erreur lors du chargement des documents de ${collectionName}: ${err.message}`);
      setGlobalCollectionDocs([]);
    } finally {
      setLoadingGlobalCollectionDocs(false);
    }
  }, [db]); 

  const resetWeeklyPoints = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      const sortedClassementForPodium = [...classement].sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
      const top3 = sortedClassementForPodium.filter(p => parseFloat(p.Points_Total_Semaine_Courante) > 0).slice(0, 3);
      const datePodium = new Date().toISOString().split('T')[0]; 

      if (top3.length > 0) {
        await addDoc(collection(db, 'historical_podiums'), { 
          Date_Podium: datePodium,
          top3: top3.map(p => ({ name: p.Nom_Participant, points: p.Points_Total_Semaine_Courante }))
        });
        toast.success('Points hebdomadaires réinitialisés et podium enregistré.');
      } else {
        toast.info('Aucun participant n\'a marqué de points cette semaine, le podium n\'a pas été enregistré.');
      }


      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const batch = writeBatch(db); 

      usersSnapshot.docs.forEach(userDoc => {
        const userRef = doc(db, "users", userDoc.id);
        const userData = userDoc.data();
        batch.update(userRef, {
          weeklyPoints: 0,
          previousWeeklyPoints: userData.weeklyPoints || 0 
        });
      });
      await batch.commit(); 

    } catch (err) {
      toast.error(`Une erreur est survenue lors de la réinitialisation des points hebdomadaires: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmResetModal(false); 
    }
  };

  const resetRealisations = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      const realisationsQuery = query(collection(db, 'realizations')); 
      const realisationsSnapshot = await getDocs(realisationsQuery);
      const batchDeleteRealisations = writeBatch(db);

      realisationsSnapshot.docs.forEach(realDoc => {
        batchDeleteRealisations.delete(doc(db, 'realizations', realDoc.id)); 
      });
      await batchDeleteRealisations.commit();

      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const batchResetUsers = writeBatch(db);

      usersSnapshot.docs.forEach(userDoc => {
        const userRef = doc(db, "users", userDoc.id);
        batchResetUsers.update(userRef, {
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0, 
          xp: 0, 
          level: 1 
        });
      });
      await batchResetUsers.commit();

      toast.success('Toutes les réalisations et les points des utilisateurs ont été réinitialisés.');
    } catch (err) {
      toast.error(`Une erreur est survenue lors de la réinitialisation des réalisations: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmResetRealisationsModal(false);
    }
  };

  const handleAuthAction = async () => {
    if (currentUser) {
      try {
        await signOut(auth);
        toast.info('Déconnecté.');
        setActiveMainView('home');
      } catch (error) {
        toast.error('Erreur lors de la déconnexion.');
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData(prev => ({
      ...prev,
      [name]: name === 'Points' ? (value === '' ? '' : parseFloat(value) || '') : value 
    }));
  };

  // Fonction pour préparer les données de la tâche pour l'édition dans AdminTaskFormModal
  const prepareTaskForEdit = useCallback(async (taskToEdit) => {
    setLoading(true);
    try {
      let taskDataForModal = { ...taskToEdit };

      // Si c'est une tâche complexe, charger les détails de ses sous-tâches
      if (taskToEdit.Sous_Taches_IDs && typeof taskToEdit.Sous_Taches_IDs === 'string' && taskToEdit.Sous_Taches_IDs.trim() !== '') {
        const subTaskIds = taskToEdit.Sous_Taches_IDs.split(',').map(id => id.trim()).filter(Boolean);
        const fetchedSubTasks = [];

        for (const id of subTaskIds) {
          // Chercher dans allRawTaches d'abord, sinon faire un getDoc si nécessaire
          const subTaskDetail = allRawTaches.find(t => String(t.ID_Tache) === String(id));
          if (subTaskDetail) {
            fetchedSubTasks.push({
              nom: subTaskDetail.Nom_Tache, // Le champ 'nom' est attendu par AdminTaskFormModal
              points: parseFloat(subTaskDetail.Points) || 0,
              ID_Tache: subTaskDetail.ID_Tache,
            });
          } else {
            console.warn(`Sous-tâche avec l'ID ${id} non trouvée dans allRawTaches. Tentative de récupération directe.`);
            const subDoc = await getDoc(doc(db, 'tasks', id));
            if (subDoc.exists()) {
              const subData = subDoc.data();
              fetchedSubTasks.push({
                nom: subData.Nom_Tache,
                points: parseFloat(subData.Points) || 0,
                ID_Tache: subData.ID_Tache,
              });
            } else {
              console.error(`Sous-tâche avec l'ID ${id} introuvable.`);
            }
          }
        }
        taskDataForModal.SousTaches = fetchedSubTasks; // Passe les objets sous-tâches
      } else {
        taskDataForModal.SousTaches = []; // S'assurer que c'est vide pour une tâche simple
      }

      setEditingTask(taskToEdit); // Définit la tâche en cours d'édition
      setNewTaskData(taskDataForModal); // Prépare les données pour le formulaire
      setShowAdminTaskFormModal(true); // Ouvre la modale
    } catch (error) {
      toast.error(`Erreur lors de la préparation de la tâche pour l'édition : ${error.message}`);
      console.error("Erreur prepareTaskForEdit:", error);
    } finally {
      setLoading(false);
    }
  }, [allRawTaches, db]); // allRawTaches et db sont des dépendances importantes


  const handleSubmitTask = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    // Validations des champs
    if (!newTaskData.ID_Tache.trim()) {
      toast.error('L\'ID de la tâche est requis.');
      return;
    }
    if (!newTaskData.Nom_Tache.trim()) {
      toast.error('Le nom de la tâche est requis.');
      return;
    }
    // Vérifie les points seulement si ce n'est pas une tâche complexe (les points sont calculés pour les complexes)
    if (!newTaskData.Sous_Taches_IDs && (newTaskData.Points === '' || isNaN(parseFloat(newTaskData.Points)))) {
      toast.error('Les points doivent être un nombre valide pour une tâche classique.');
      return;
    }
    // Logique pour éviter qu'une tâche soit à la fois sous-tâche et groupe de tâches
    if (newTaskData.Parent_Task_ID.trim() !== '' && newTaskData.Sous_Taches_IDs.trim() !== '') {
        toast.error('Une tâche ne peut pas être à la fois une sous-tâche et un groupe de tâches.');
        return;
    }

    setLoading(true);
    try {
      // Les points pour les tâches complexes sont déjà calculés et mis à jour via onFormChange dans AdminTaskFormModal
      const pointsToSave = parseFloat(newTaskData.Points) || 0; 

      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), { 
          ...newTaskData,
          Points: pointsToSave 
        });
        toast.success('Tâche mise à jour avec succès.');
      } else {
        await setDoc(doc(db, 'tasks', newTaskData.ID_Tache), { 
          ...newTaskData,
          Points: pointsToSave 
        });
        toast.success('Tâche ajoutée avec succès.');
      }
      
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

  const handleDeleteTask = useCallback(async (taskId, skipConfirmation = false) => {
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
      await deleteDoc(doc(db, 'tasks', taskId)); 
      toast.success('Tâche supprimée avec succès.');
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false); 
      setTaskToDelete(null);
    }
  }, [isAdmin, db]);

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
        await updateDoc(doc(db, 'objectives', editingObjective.id), { 
          ...newObjectiveData,
          Cible_Points: parseFloat(newObjectiveData.Cible_Points),
          Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
          Est_Atteint: newObjectiveData.Est_Atteint
        });
        toast.success('Objectif mis à jour avec succès.');
      } else {
        await setDoc(doc(db, 'objectives', newObjectiveData.ID_Objectif), { 
          ...newObjectiveData,
          Cible_Points: parseFloat(newObjectiveData.Cible_Points),
          Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
          Est_Atteint: newObjectiveData.Est_Atteint
        });
        toast.success('Objectif ajouté avec succès.');
      }
      
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

  const handleDeleteObjective = useCallback(async (objectiveId, skipConfirmation = false) => {
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
      await deleteDoc(doc(db, 'objectives', objectiveId)); 
      toast.success('Objectif supprimé avec succès.');
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteObjectiveConfirmModal(false); 
      setObjectiveToDelete(null);
    }
  }, [isAdmin, db]);

  const handleReportClick = (taskRealisation) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour signaler une tâche.');
      setShowAuthModal(true);
      return;
    }
    setReportedTaskDetails({
      id: taskRealisation.taskId, 
      name: taskRealisation.nomTacheEffectuee,
      participant: taskRealisation.nomParticipant,
      realizationId: taskRealisation.id, 
      reportedUserId: taskRealisation.userId 
    });
    setShowReportModal(true);
  };

  const submitReport = async () => { 
    if (!currentUser) {
      toast.warn('Vous devez être connecté pour signaler une tâche.');
      return;
    }
    if (!reportedTaskDetails) return;

    setLoading(true);
    try {
      const existingReportsQuery = query(
        collection(db, 'reports'),
        where('realizationId', '==', reportedTaskDetails.realizationId)
      );
      const existingReportsSnap = await getDocs(existingReportsQuery);

      if (!existingReportsSnap.empty) {
        toast.info("Cette tâche a déjà été signalée.");
        setShowReportModal(false);
        setReportedTaskDetails(null);
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'reports'), { 
        reportedTaskId: reportedTaskDetails.id,
        reportedUserId: reportedTaskDetails.reportedUserId,
        reportedParticipantName: reportedTaskDetails.participant,
        reporterUserId: currentUser.uid,
        reporterName: currentUser.displayName || currentUser.email, 
        realizationId: reportedTaskDetails.realizationId, 
        timestamp: new Date().toISOString(),
        status: 'pending' 
      });

      // Supprimer la réalisation
      await deleteDoc(doc(db, 'realizations', reportedTaskDetails.realizationId)); 

      // 1️⃣ Remettre la tâche disponible (adapte les champs si besoin)
      const reportedTaskRef = doc(db, 'tasks', reportedTaskDetails.id);
      await updateDoc(reportedTaskRef, {
        responsable: null,         // ou "" selon ton modèle
        status: "disponible"       // adapte au nom réel du champ
        // ... autres champs éventuels
      });

      toast.success(`Tâche signalée, réalisation supprimée et tâche remise disponible.`);

      const DEDUCTION_POINTS = 5;
      const reportedUserRef = doc(db, "users", reportedTaskDetails.reportedUserId);
      const reportedUserSnap = await getDoc(reportedUserRef);

      if (reportedUserSnap.exists()) {
        const reportedUserData = reportedUserSnap.data();
        const newTotalCumulativePoints = Math.max(0, (reportedUserData.totalCumulativePoints || 0) - DEDUCTION_POINTS);
        const newWeeklyPoints = Math.max(0, (reportedUserData.weeklyPoints || 0) - DEDUCTION_POINTS);
        const newXP = Math.max(0, (reportedUserData.xp || 0) - DEDUCTION_POINTS);
        const { level: newLevel } = calculateLevelAndXP(newXP);

        await updateDoc(reportedUserRef, {
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints,
          xp: newXP,
          level: newLevel
        });

        if (currentUser.uid === reportedTaskDetails.reportedUserId) {
          setCurrentUser(prevUser => ({
            ...prevUser,
            totalCumulativePoints: newTotalCumulativePoints,
            weeklyPoints: newWeeklyPoints,
            xp: newXP,
            level: newLevel
          }));
        }

        toast.info(`${reportedTaskDetails.participant} a perdu ${DEDUCTION_POINTS} points.`);
      } else {
        console.warn(`Utilisateur signalé (${reportedTaskDetails.reportedUserId}) non trouvé dans la collection 'users'.`);
      }
    } catch (err) {
      toast.error(`Une erreur est survenue lors du signalement: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReportModal(false);
      setReportedTaskDetails(null);
    }
  };



  const handleParticipantClick = useCallback(async (participant) => {
    setShowFullRankingModal(false); // 👈 ferme la modale immédiatement

    if (
      currentUser &&
      String(participant.Nom_Participant || '').trim() ===
        String(currentUser.displayName || currentUser.email).trim()
    ) {
      setSelectedParticipantProfile({ ...currentUser, id: currentUser.uid });
      setActiveMainView('participantProfile');
      await fetchParticipantWeeklyTasks(currentUser.displayName || currentUser.email);
      return;
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('displayName', '==', participant.Nom_Participant)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      setSelectedParticipantProfile({ id: userDoc.id, ...userDoc.data() });
      setActiveMainView('participantProfile');
      await fetchParticipantWeeklyTasks(participant.Nom_Participant);
    } else {
      toast.error('Profil utilisateur introuvable.');
    }
  }, [fetchParticipantWeeklyTasks, db, currentUser]);


  const areAllSubtasksCompleted = useCallback((groupTask) => {
    if (!groupTask.isGroupTask || !groupTask.Sous_Taches_IDs) {
        return false; 
    }
    const subTaskIds = String(groupTask.Sous_Taches_IDs).split(',').map(id => id.trim());
    
    const existingSubtasks = allRawTaches.filter(t => subTaskIds.includes(String(t.ID_Tache)));

    if (existingSubtasks.length === 0) {
        return true; 
    }

    return existingSubtasks.every(subTask => !isSubTaskAvailable(subTask));
  }, [allRawTaches, isSubTaskAvailable]); 

  const isTaskHidden = useCallback((tache) => {
    const freq = (tache.Frequence || 'hebdomadaire').toLowerCase();

    // Trouve la dernière réalisation pour cette tâche
    const lastRealisation = realisations
      .filter(r => String(r.taskId) === String(tache.ID_Tache))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!lastRealisation) {
      // Jamais réalisée => on affiche
      return false;
    }

    const lastDate = new Date(lastRealisation.timestamp);
    const now = new Date();


    if (freq === 'quotidien') {
      // Cache si réalisée aujourd'hui
      const sameDay =
        lastDate.getDate() === now.getDate() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getFullYear() === now.getFullYear();
      if (sameDay) return true;
      return false; // réapparaît le lendemain
    }

    if (freq === 'hebdomadaire') {
      // Cache si réalisée cette semaine, réapparaît lundi prochain
      // Semaine commence lundi 00:00
      const lastMonday = new Date(now);
      const day = lastMonday.getDay();
      const diff = (day === 0 ? -6 : 1 - day); // si dimanche (0), lundi = -6 jours, sinon lundi = 1 - jour
      lastMonday.setDate(lastMonday.getDate() + diff);
      lastMonday.setHours(0,0,0,0);

      if (lastDate >= lastMonday) {
        // réalisée cette semaine => cachée
        return true;
      }
      return false; // réapparaît la semaine suivante
    }

    // Pour les tâches ponctuelles ou autres fréquences :
    // On garde ta logique existante
    const isSingleTaskCompleted = !tache.isGroupTask && !isSubTaskAvailable(tache);
    const isGroupTaskFullyCompleted = tache.isGroupTask && areAllSubtasksCompleted(tache);

    return isSingleTaskCompleted || isGroupTaskFullyCompleted;

  }, [realisations, isSubTaskAvailable, areAllSubtasksCompleted]);


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
    // Nombre de tâches restantes
    const remainingTasksCount = taches.filter(tache => {
      if (tache.isGroupTask) return !areAllSubtasksCompleted(tache);
      return isSubTaskAvailable(tache);
    }).length;

    // Trie classement par points hebdo décroissants, en convertissant en nombre
    const sortedClassement = [...classement].sort(
      (a, b) =>
        Number(b.Points_Total_Semaine_Courante || 0) - Number(a.Points_Total_Semaine_Courante || 0)
    );

    // On prend les top 3 avec plus de 0 points
    const top3WithPoints = sortedClassement
      .filter(p => Number(p.Points_Total_Semaine_Courante || 0) > 0)
      .slice(0, 3);

    // Récupération url avatar
    const getAvatarUrl = p =>
      typeof p.Avatar === 'string' && p.Avatar.startsWith('http')
        ? p.Avatar
        : null;

    const bgClasses = [
      'bg-gradient-to-tr from-yellow-300 to-yellow-500',
      'bg-gradient-to-tr from-gray-200 to-gray-400',
      'bg-gradient-to-tr from-orange-200 to-orange-400'
    ];
    const medals = ['🥇', '🥈', '🥉'];

    // Ordre: [2e, 1er, 3e] pour effet podium
    const podiumIndices = [1, 0, 2];
    const podiumStyles = [
      // 2ème à gauche (plus petit)
      { container: "flex flex-col items-center justify-end", avatar: "w-14 h-14 sm:w-20 sm:h-20", offset: "mb-2 sm:mb-4", medal: "text-2xl sm:text-3xl" },
      // 1er au centre (grand)
      { container: "flex flex-col items-center justify-end", avatar: "w-20 h-20 sm:w-28 sm:h-28", offset: "", medal: "text-3xl sm:text-4xl" },
      // 3ème à droite (plus petit)
      { container: "flex flex-col items-center justify-end", avatar: "w-14 h-14 sm:w-20 sm:h-20", offset: "mb-2 sm:mb-4", medal: "text-2xl sm:text-3xl" },
    ];

    return (
      <div className="bg-card rounded-3xl p-5 mb-4 shadow-lg text-center space-y-4">
        {/* Compteur de tâches restantes */}
        <div className="inline-block px-4 py-1 bg-primary/10 text-primary font-semibold rounded-full">
          Tâches restantes: <span className="font-bold">{remainingTasksCount}</span>
        </div>

        {/* Titre */}
        <h2 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 animate-pulse">
          Podium de la Semaine
        </h2>

        {/* Si pas de points, afficher message sinon podium */}
        {top3WithPoints.length === 0 ? (
          <p className="text-lg font-semibold text-lightText mt-8">Pas de classement pour le moment</p>
        ) : (
          <div className="flex justify-center items-end gap-3 sm:gap-8 mt-8">
            {podiumIndices.map((idx, col) => {
              const p = top3WithPoints[idx];
              if (!p) return <div key={col} className="flex-1" />; // pour garder l'espacement s'il manque un top
              const style = podiumStyles[col];
              const avatar = getAvatarUrl(p);
              return (
                <div
                  key={p.id || p.Nom_Participant}
                  className={`${style.container} ${style.offset} cursor-pointer`}
                  onClick={() => handleParticipantClick(p)}
                  style={{ minWidth: "90px" }}
                >
                  <div className={`relative ${style.avatar}`}>
                    {/* Cercle avatar */}
                    <div className={`${style.avatar} rounded-full overflow-hidden shadow-md ${bgClasses[idx]} flex items-center justify-center`}>
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={p.Nom_Participant}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-3xl sm:text-5xl select-none">
                          {p.Avatar || '👤'}
                        </span>
                      )}
                    </div>
                    {/* Médaille */}
                    <span
                      className={`absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 ${style.medal}`}
                      style={{ pointerEvents: 'none' }}
                    >
                      {medals[idx]}
                    </span>
                  </div>
                  {/* Nom */}
                  <p className="mt-1 text-sm sm:text-base font-semibold text-text truncate w-24 text-center">
                    {p.Nom_Participant}
                  </p>
                  {/* Points */}
                  <p className="text-xs text-lightText">{Number(p.Points_Total_Semaine_Courante || 0)} pts</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Espace */}
        <div className="mt-6"></div>

        {/* Bouton classement complet - affiché uniquement s'il y a un podium */}
        {top3WithPoints.length > 0 && (
          <>
            <button
              className="bg-primary hover:bg-secondary text-white font-semibold text-xs py-1.5 px-4 rounded-full shadow transition-transform hover:scale-105"
              onClick={() => setShowFullRankingModal(true)}
            >
              Voir le classement complet
            </button>
            <div className="border-t border-neutralBg my-4"></div>
          </>
        )}

        {/* Boutons Tendances et Objectifs */}
        <div className="flex justify-center gap-6">
          <button
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm py-2 px-4 rounded-full shadow-sm transition"
            onClick={() => setShowHighlightsModal(true)}
          >
            <span className="text-base">✨</span>
            <span>Tendances</span>
          </button>
          <button
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm py-2 px-4 rounded-full shadow-sm transition"
            onClick={() => setShowObjectivesModal(true)}
          >
            <span className="text-base">🎯</span>
            <span>Objectifs</span>
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
          const realDate = new Date(real.timestamp); 
          realDate.setHours(0, 0, 0, 0);
          if (realDate >= startOfCurrentWeek) {
              const name = String(real.nomParticipant).trim(); 
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

  const renderObjectivesContent = (objectives, realisations, tasks) => {
    // Si pas d'objectifs
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return (
        <p className="text-center text-lightText text-md py-2">
          Aucun objectif disponible pour le moment.
        </p>
      );
    }

    // Calcule les points actuels selon type objectif
    function getPointsForObjective(obj) {
      if (!obj || !Array.isArray(realisations) || !Array.isArray(tasks)) return 0;

      const targetCategory = obj.Categorie_Cible || "";
      const targetType = obj.Type_Cible || "Cumulatif";

      if (targetType === "Hebdomadaire") {
        // Lundi semaine courante à 00:00:00
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return realisations.reduce((sum, real) => {
          const realDate = new Date(real.date);
          if (realDate < startOfWeek) return sum;

          const task = tasks.find(t => t.ID_Tache === real.taskId);
          if (!task) return sum;
          if (targetCategory && targetCategory.length > 0 && task.Categorie !== targetCategory) return sum;

          return sum + (parseFloat(task.Calculated_Points) || 0);
        }, 0);
      }

      if (targetType === "Par_Categorie") {
        if (!targetCategory || targetCategory.length === 0) return 0;

        return realisations.reduce((sum, real) => {
          const task = tasks.find(t => t.ID_Tache === real.taskId);
          if (task && task.Categorie === targetCategory) {
            return sum + (parseFloat(task.Calculated_Points) || 0);
          }
          return sum;
        }, 0);
      }

      // Cumulatif ou autre type par défaut
      return realisations.reduce((sum, real) => {
        const task = tasks.find(t => t.ID_Tache === real.taskId);
        return sum + (task ? (parseFloat(task.Calculated_Points) || 0) : 0);
      }, 0);
    }

    return (
      <div className="space-y-2">
        {objectives.map(obj => {
          const currentPoints = getPointsForObjective(obj);
          const targetPoints = parseFloat(obj.Cible_Points) || 0;
          const progress = targetPoints > 0 ? (currentPoints / targetPoints) * 100 : 0;
          const isCompleted =
            obj.Est_Atteint === true ||
            String(obj.Est_Atteint).toLowerCase() === 'true' ||
            currentPoints >= targetPoints;

          return (
            <div
              key={obj.ID_Objectif}
              className={`bg-white rounded-lg p-3 shadow-sm border ${
                isCompleted ? 'border-success' : 'border-primary/10'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-base font-bold text-primary truncate">{obj.Nom_Objectif}</h3>
                {isCompleted ? (
                  <span className="text-success font-bold text-sm">✅ Atteint !</span>
                ) : (
                  <span className="text-text font-semibold text-sm">
                    {currentPoints.toFixed(1)} / {targetPoints} pts
                  </span>
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
      { name: 'tous', label: 'Communs' },
      { name: 'salle', label: 'Salle' },
      { name: 'cuisine', label: 'Cuisine' }
    ];

    const currentCategoryTasks = taches.filter(tache => {
      if (activeTaskCategory === 'tous') {
        return tache.Categorie?.toLowerCase() === 'tous';
      }
      return tache.Categorie?.toLowerCase() === activeTaskCategory;
    });

    const sections = [
      { key: 'ponctuel', label: 'Ponctuelles' },
      { key: 'quotidien', label: 'Quotidiennes' },
      { key: 'hebdomadaire', label: 'Hebdomadaires' }
    ];

    const filterByFreq = (freq) =>
      currentCategoryTasks.filter(
        t => (t.Frequence || 'hebdomadaire').toLowerCase() === freq
      );

    const renderTasksList = (tasks) => {
      const visible = tasks.filter(t => !isTaskHidden(t) && !t.Parent_Task_ID);
      if (!visible.length) {
        return (
          <p className="text-center text-lightText text-base py-2">
            Aucune tâche disponible.
          </p>
        );
      }
      return (
        <div className="space-y-4">
          {visible.map(t => (
            <div
              key={t.ID_Tache}
              onClick={() => handleTaskClick(t)}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-card rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 border border-transparent hover:border-primary max-w-full cursor-pointer"
            >
              <div className="flex-1 min-w-0 max-w-full">
                <h4 className="text-lg font-bold break-words bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  {t.Nom_Tache}
                </h4>
                {t.isGroupTask && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    Groupe
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-3 sm:mt-0 shrink-0">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getUrgencyClasses(t.Urgence)}`}>
                  {t.Urgence || 'Normal'}
                </span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getFrequencyClasses(t.Frequence)}`}>
                  {t.Frequence || 'Hebdo'}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-secondary/10 text-secondary">
                  {t.Calculated_Points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="bg-card rounded-3xl p-6 shadow-lg space-y-6">
        {/* Category Buttons with responsive alignment */}
        <div
          className="flex justify-center space-x-2 sm:space-x-3 overflow-x-auto py-2 px-4"
          style={{ WebkitOverflowScrolling: 'touch' }} // scroll fluide sur iOS
        >
          {categories.map(cat => {
            const isActive = activeTaskCategory === cat.name;
            const activeBg = cat.name === 'tous'
              ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
              : cat.name === 'salle'
              ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            const inactiveBg = cat.name === 'tous'
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : cat.name === 'salle'
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100';
            return (
              <button
                key={cat.name}
                onClick={() => setActiveTaskCategory(cat.name)}
                className={`
                  px-4 py-2
                  sm:px-5 sm:py-2.5
                  rounded-full
                  font-semibold
                  transition-all duration-200 shadow-md
                  whitespace-nowrap
                  ${isActive ? activeBg : inactiveBg}
                `}
                style={{
                  minWidth: 'clamp(60px, 20vw, 100px)', // largeur min responsive
                  maxWidth: '160px',
                  fontSize: 'clamp(0.75rem, 1.5vw, 1rem)', // taille texte responsive
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Task Sections */}
        {sections.map(sec => {
          const list = filterByFreq(sec.key);
          if (!list.some(t => !isTaskHidden(t))) return null;
          return (
            <section key={sec.key} className="space-y-4">
              <h3 className="text-xl font-bold text-primary border-l-4 border-primary pl-3">
                Tâches {sec.label}
              </h3>
              {renderTasksList(list)}
            </section>
          );
        })}

        {/* Empty State */}
        {!currentCategoryTasks.some(t => !isTaskHidden(t)) && (
          <p className="text-center text-lightText text-base py-4">
            Aucune tâche disponible dans cette catégorie.
          </p>
        )}
      </div>
    );
  };
    
  const renderCompletedTasks = () => {
    if (!Array.isArray(realisations) || realisations.length === 0) {
      return (
        <div className="bg-card rounded-3xl p-6 shadow-lg text-center space-y-4 mb-6">
          {/* Titre dynamique */}
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
            Tâches Terminées
          </h2>
          <p className="text-lightText text-base">
            Aucune tâche n'a été terminée pour le moment.
          </p>
        </div>
      );
    }

    const startIdx = (currentRealizationsPage - 1) * realizationsPerPage;
    const currentRealizations = realisations.slice(
      startIdx,
      startIdx + realizationsPerPage
    );
    const totalPages = Math.ceil(realisations.length / realizationsPerPage);
    const paginate = (num) => setCurrentRealizationsPage(num);

    return (
      <div className="bg-card rounded-3xl p-6 shadow-lg text-center space-y-6 mb-6">
        {/* Titre dynamique */}
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
          Tâches Terminées
        </h2>

        <div className="space-y-4 text-left">
          {currentRealizations.map((real, idx) => (
            <div
              key={real.id || real.timestamp + real.nomParticipant + idx}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-card rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 border border-transparent hover:border-primary"
            >
              <div className="flex-1 mb-2 sm:mb-0">
                <h4 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  {real.nomTacheEffectuee}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-sm text-lightText mt-1">
                  <span>
                    par <strong className="text-text">{real.nomParticipant}</strong>
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryClasses(real.categorieTache)}`}>
                    {real.categorieTache || 'Non catégorisé'}
                  </span>
                  <span>
                    {new Date(real.timestamp).toLocaleDateString('fr-FR')} –{' '}
                    {new Date(real.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportClick(real);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full shadow-sm text-xs transition"
                >
                  Signaler
                </button>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => paginate(currentRealizationsPage - 1)}
              disabled={currentRealizationsPage === 1}
              className="bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full shadow-md text-sm transition disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-text text-sm font-semibold">
              {currentRealizationsPage} / {totalPages}
            </span>
            <button
              onClick={() => paginate(currentRealizationsPage + 1)}
              disabled={currentRealizationsPage === totalPages}
              className="bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full shadow-md text-sm transition disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveMainView('home')}
          className="mt-4 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full shadow-sm font-medium transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  };


  const renderThankYouPopup = () => {
    if (!showThankYouPopup) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000] p-4">
        <div className="bg-gradient-to-tr from-purple-400 via-pink-400 to-yellow-400 rounded-3xl w-full max-w-xs sm:max-w-md p-6 shadow-lg animate-popin relative text-center overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 opacity-20 blur-3xl pointer-events-none rounded-3xl"></div>

          <h3 className="relative text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-4 select-none">
            🎉 Bravo ! 🎉
          </h3>

          <p className="relative text-lg sm:text-xl text-white mb-4 font-semibold drop-shadow-sm max-w-xs mx-auto">
            {showThankYouPopup.message}
          </p>

          <p className="relative text-yellow-300 font-bold drop-shadow-sm mb-6 max-w-xs mx-auto">
            Tâche: "<span className="text-white">{showThankYouPopup.task}</span>"<br />
            terminée par <span className="text-pink-300">{showThankYouPopup.name}</span>.
          </p>

          <button
            onClick={() => setShowThankYouPopup(null)}
            className="relative bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white font-semibold py-2 px-5 rounded-full shadow-md transition duration-300 ease-in-out hover:brightness-110 hover:scale-105 tracking-wide select-none"
          >
            Super !
          </button>
        </div>
      </div>
    );
  };

  const renderParticipantProfile = () => {
    if (!selectedParticipantProfile) return null;

    const isCurrentUser = currentUser && selectedParticipantProfile.id === currentUser.uid;
    const profileData = isCurrentUser ? currentUser : selectedParticipantProfile;
    const totalPoints = profileData.totalCumulativePoints || 0;
    const engagementPercentage = totalGlobalCumulativePoints
      ? ((totalPoints / totalGlobalCumulativePoints) * 100).toFixed(1)
      : 0;

    const level = profileData.level || 1;
    const { xpNeededForNextLevel } = calculateLevelAndXP(profileData.xp || 0);
    const xpProgress = xpNeededForNextLevel
      ? Math.min(((profileData.xp || 0) / xpNeededForNextLevel) * 100, 100)
      : 0;

    const userBadgesObj = profileData.badges || {};
    const unlockedBadges = BADGES
      .map(badge => {
        const badgeState = userBadgesObj[badge.id];
        if (badgeState && badgeState.unlocked) {
          return {
            ...badge,
            unlockedAt: badgeState.unlockedAt,
            isUnlocked: true,
            ownersCount: badge.ownersCount
          };
        }
        return null;
      })
      .filter(Boolean);

    const isPhoto = profileData.avatar && profileData.avatar.startsWith('http');

    return (
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mb-8 text-center max-w-3xl mx-auto">
        {/* Avatar + Level */}
        <div className="relative inline-block mb-3">
          <div className={
            `w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg mx-auto flex items-center justify-center
            ${!isPhoto ? 'bg-gradient-to-br from-blue-200 via-fuchsia-100 to-pink-200' : 'bg-white'}`
          }>
            {profileData.avatar ? (
              isPhoto ? (
                <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span
                  aria-label="Avatar Emoji"
                  role="img"
                  className="select-none w-full h-full flex items-center justify-center text-[2.7rem] sm:text-[3.4rem]"
                  style={{ lineHeight: "1" }}
                >
                  {profileData.avatar}
                </span>
              )
            ) : (
              <span className="text-gray-400 text-4xl">?</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md transform translate-x-2 translate-y-2">
            <span className="text-sm font-bold">Niv. {level}</span>
          </div>
        </div>

        {/* Name */}
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-secondary">
          {profileData.displayName || profileData.email}
        </h2>

        {/* Actions */}
        {isCurrentUser && (
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setShowProfileEditOptionsModal(true)}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105 max-w-[120px] flex-shrink whitespace-nowrap text-sm overflow-hidden text-ellipsis"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={() => weeklyRecapData && setShowWeeklyRecapModal(true)}
              disabled={!weeklyRecapData}
              className={`px-4 py-2 rounded-full shadow-lg transition max-w-[120px] flex-shrink whitespace-nowrap text-sm overflow-hidden text-ellipsis ${
                weeklyRecapData
                  ? 'bg-secondary hover:bg-secondary/90 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              🗓 Récap Hebdo
            </button>
          </div>
        )}

        {/* XP Bar */}
        <div className="mt-6 w-full max-w-lg mx-auto">
          <label className="block text-xs text-lightText mb-1 font-medium">
            Barre d'expérience
          </label>
          <div className="relative h-7 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400"
              style={{ width: `${xpProgress}%`, transition: 'width 1s ease-out' }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary">
              {profileData.xp || 0} XP / {xpNeededForNextLevel}
            </span>
          </div>
          <div className="text-xs text-lightText mt-1">
            Gagnez des XP pour monter de niveau !
          </div>
        </div>

        {/* Engagement Score */}
        <div className="mt-6">
          <p className="text-text">Score d'Engagement Global</p>
          <p className="text-2xl font-bold text-primary">{engagementPercentage}%</p>
        </div>

        {/* Cumulative Points Pill */}
        <div className="mt-4 w-full max-w-xs sm:max-w-sm mx-auto bg-primary/10 px-6 py-2 rounded-full shadow-sm text-center">
          <span className="text-sm text-text font-medium">Points Cumulatifs : </span>
          <span className="text-sm font-bold text-primary ml-1">{totalPoints}</span>
        </div>

        {/* Badges */}
        <div className="w-full flex justify-center my-10">
          <div
            className="
              badge-widget-glassy
              w-full
              max-w-2xl
              px-1
              mx-auto
              transition-all
              duration-200
              shadow-2xl
              rounded-[2.5rem]
            "
          >
            <BadgeCarousel badges={unlockedBadges} />
          </div>
        </div>

        {/* Weekly Tasks */}
        <div className="mt-8 space-y-4 text-left">
          <h3 className="text-xl font-bold text-secondary">Tâches terminées cette semaine</h3>
          {participantWeeklyTasks.length > 0 ? (
            participantWeeklyTasks.map((task, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-4 flex justify-between items-center shadow-md"
              >
                <div>
                  <h4 className="font-semibold text-text truncate">{task.nomTacheEffectuee}</h4>
                  <p className="text-xs text-lightText">
                    {new Date(task.timestamp).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="text-primary font-bold">+{task.pointsGagnes} pts</span>
              </div>
            ))
          ) : (
            <p className="text-center text-lightText">Aucune tâche terminée cette semaine.</p>
          )}
        </div>

        <button
          className="mt-8 w-full bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105"
          onClick={() => setActiveMainView('home')}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  };



  const renderConfirmResetModal = () => {
    if (!showConfirmResetModal) return null;

    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">
          {/* Header */}
          <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-yellow-100">
            <h3 className="text-center text-xl font-extrabold text-yellow-700">
              Confirmer la Réinitialisation
            </h3>
          </div>

          {/* Message */}
          <div className="px-6 py-5 text-sm text-gray-700 text-center">
            Êtes-vous sûr de vouloir réinitialiser les points hebdomadaires et enregistrer le podium ?
            <br />
            <span className="text-xs text-gray-500">Cette action est irréversible.</span>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t bg-white">
            <button
              onClick={() => setShowConfirmResetModal(false)}
              className="flex-1 py-2 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition shadow-sm"
            >
              Non, Annuler
            </button>
            <button
              onClick={resetWeeklyPoints}
              disabled={loading}
              className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition shadow-md"
            >
              {loading ? 'Réinitialisation...' : 'Oui, Réinitialiser'}
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderConfirmResetRealisationsModal = () => {
    if (!showConfirmResetRealisationsModal) return null;

    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">
          {/* Header */}
          <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
            <h3 className="text-center text-xl font-extrabold text-red-700">
              Confirmer la Réinitialisation
            </h3>
          </div>

          {/* Message */}
          <div className="px-6 py-5 text-sm sm:text-base text-gray-700 text-center space-y-2">
            <p>
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-red-600">toutes les réalisations</span> ?
            </p>
            <p className="text-sm sm:text-base text-gray-500">
              Cela réinitialisera les <span className="font-semibold">points de tous les utilisateurs à zéro</span> et effacera
              définitivement l’historique des tâches terminées.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t bg-white">
            <button
              onClick={() => setShowConfirmResetRealisationsModal(false)}
              className="flex-1 py-2 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition shadow-sm"
            >
              Annuler
            </button>
            <button
              onClick={resetRealisations}
              disabled={loading}
              className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-md"
            >
              {loading ? 'Réinitialisation...' : 'Oui, Réinitialiser'}
            </button>
          </div>
        </div>
      </div>
    );
  };



  const renderDeleteConfirmModal = () => {
  if (!showDeleteConfirmModal || taskToDelete === null) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
          <h3 className="text-center text-xl font-extrabold text-red-700">
            Confirmer la Suppression
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-5 text-sm text-gray-700 text-center">
          Êtes-vous sûr de vouloir supprimer la tâche avec l'ID <span className="font-mono text-red-600">{taskToDelete}</span> ?
          <br />
          <span className="text-xs text-gray-500">Cette action est irréversible.</span>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-white">
          <button
            onClick={() => {
              setShowDeleteConfirmModal(false);
              setTaskToDelete(null);
            }}
            className="flex-1 py-2 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition shadow-sm"
          >
            Non, Annuler
          </button>
          <button
            onClick={() => handleDeleteTask(taskToDelete, true)}
            disabled={loading}
            className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-md"
          >
            {loading ? 'Suppression...' : 'Oui, Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};


  const renderDeleteObjectiveConfirmModal = () => {
    if (!showDeleteObjectiveConfirmModal || objectiveToDelete === null) return null;

    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div className="bg-white pointer-events-auto w-full max-w-sm sm:max-w-md rounded-3xl border border-gray-200 shadow-[0_15px_35px_rgba(0,0,0,0.2)] animate-fade-in-scale overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
            <h3 className="text-center text-xl font-extrabold text-red-700">⚠️ Suppression de l’Objectif</h3>
          </div>

          {/* Message */}
          <div className="px-6 py-5 text-center text-sm text-gray-700">
            Êtes-vous sûr de vouloir supprimer l’objectif avec l’ID <br />
            <span className="font-semibold text-red-600">"{objectiveToDelete}"</span> ?<br />
            <span className="text-xs text-gray-500 mt-2 block">Cette action est irréversible.</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row px-6 py-4 gap-2 border-t bg-white">
            <button
              onClick={() => {
                setShowDeleteObjectiveConfirmModal(false);
                setObjectiveToDelete(null);
              }}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-full text-sm font-semibold shadow-inner transition"
            >
              Non, Annuler
            </button>
            <button
              onClick={() => handleDeleteObjective(objectiveToDelete, true)}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full text-sm font-semibold shadow-md transition"
            >
              {loading ? 'Suppression...' : 'Oui, Supprimer'}
            </button>
          </div>
        </div>
      </div>
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

  const handleExportClassement = useCallback(() => {
    const headers = ['Nom_Participant', 'Points_Total_Semaine_Courante', 'Points_Total_Cumulatif', 'Points_Total_Semaine_Precedente', 'Date_Mise_A_Jour', 'Avatar', 'Level', 'XP'];
    const dataToExport = classement.map(p => ({
        Nom_Participant: p.Nom_Participant,
        Points_Total_Semaine_Courante: p.Points_Total_Semaine_Courante,
        Points_Total_Cumulatif: p.Points_Total_Cumulatif,
        Points_Total_Semaine_Precedente: p.Points_Total_Semaine_Precedente || 0,
        Avatar: p.Avatar || '👤', 
        Level: p.Level || 1, 
        XP: p.XP || 0,
        Date_Mise_A_Jour: p.Date_Mise_A_Jour ? new Date(p.Date_Mise_A_Jour).toLocaleDateString('fr-FR') : '' 
    }));
    exportToCsv('classement_clean_app.csv', dataToExport, headers);
    setShowExportSelectionModal(false); 
  }, [classement]); 

  const handleExportRealisations = useCallback(() => {
    const headers = ['taskId', 'userId', 'nomParticipant', 'nomTacheEffectuee', 'categorieTache', 'pointsGagnes', 'timestamp'];
    const dataToExport = realisations.map(r => ({
        taskId: r.taskId,
        userId: r.userId,
        nomParticipant: r.nomParticipant,
        nomTacheEffectuee: r.nomTacheEffectuee,
        categorieTache: r.categorieTache,
        pointsGagnes: r.pointsGagnes,
        timestamp: r.timestamp ? new Date(r.timestamp).toLocaleString('fr-FR') : '' 
    }));
    exportToCsv('realisations_clean_app.csv', dataToExport, headers);
    setShowExportSelectionModal(false); 
  }, [realisations]); 

  const renderAdminObjectivesListModal = useCallback(() => {
    if (!showAdminObjectivesListModal) return null;

    return (
      <div className={`z-10 fixed inset-0 px-2 sm:px-4 flex items-center justify-center ${showAdminObjectiveFormModal ? 'backdrop-blur-sm backdrop-saturate-150' : ''}`}>
        <ListAndInfoModal
          title="Gestion des Objectifs"
          onClose={() => setShowAdminObjectivesListModal(false)}
          sizeClass="w-full max-w-[95vw] sm:max-w-md md:max-w-xl lg:max-w-2xl h-[90vh] overflow-y-auto rounded-2xl p-6 animate-fade-in"
        >
          <button
            onClick={() => {
              setEditingObjective(null);
              setNewObjectiveData({
                ID_Objectif: '',
                Nom_Objectif: '',
                Description_Objectif: '',
                Cible_Points: '',
                Type_Cible: 'Cumulatif',
                Categorie_Cible: '',
                Points_Actuels: 0,
                Est_Atteint: false
              });
              setShowAdminObjectiveFormModal(true);
            }}
            className="w-full mb-4 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white py-2 px-4 rounded-2xl shadow-lg transition-all duration-300"
          >
            ➕ Ajouter un Nouvel Objectif
          </button>

          <h4 className="text-base sm:text-lg font-bold text-teal-500 mb-4 text-center">
            Tous les Objectifs
          </h4>

          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText text-sm sm:text-base">Chargement des objectifs...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {objectives.length === 0 ? (
                <p className="text-center text-lightText text-sm sm:text-base">Aucun objectif disponible.</p>
              ) : (
                objectives.map(obj => (
                  <div
                    key={obj.ID_Objectif}
                    className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-200 transition-transform duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                      <p className="font-bold text-text text-base sm:text-lg truncate">
                        {obj.Nom_Objectif}
                        <span className="text-sm text-lightText ml-1">({obj.ID_Objectif})</span>
                      </p>
                      <p className="text-sm text-lightText">
                        🎯 Cible : {obj.Cible_Points} | 📈 Actuel : {obj.Points_Actuels} | 🧭 Type : {obj.Type_Cible}
                        {obj.Categorie_Cible && ` (${obj.Categorie_Cible})`}
                      </p>
                      <p className="text-sm text-lightText">
                        🏁 Atteint : <span className={obj.Est_Atteint ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                          {obj.Est_Atteint ? 'Oui' : 'Non'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                      <button
                        onClick={() => {
                          setEditingObjective(obj);
                          setNewObjectiveData(obj);
                          setShowAdminObjectiveFormModal(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1.5 px-4 rounded-full shadow-md transition-all duration-300 text-xs"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteObjective(obj.ID_Objectif)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-4 rounded-full shadow-md transition-all duration-300 text-xs"
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
      </div>
    );
  }, [
    loading,
    objectives,
    handleDeleteObjective,
    setShowAdminObjectivesListModal,
    setNewObjectiveData,
    setEditingObjective,
    setShowAdminObjectiveFormModal,
    showAdminObjectivesListModal,
    showAdminObjectiveFormModal
  ]);

  const renderAdminTasksListModal = useCallback(() => {
    if (!showAdminTasksListModal) return null;

    return (
      <ListAndInfoModal
        title="Gestion des Tâches"
        onClose={() => setShowAdminTasksListModal(false)}
        sizeClass="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-[90vh] overflow-y-auto rounded-2xl p-6 animate-fade-in"
      >
        <button
          onClick={() => {
            setEditingTask(null);
            setNewTaskData({
              ID_Tache: '',
              Nom_Tache: '',
              Description: '',
              Points: '',
              Frequence: 'Hebdomadaire',
              Urgence: 'Faible',
              Categorie: 'Tous',
              Sous_Taches_IDs: '',
              Parent_Task_ID: '',
            });
            setShowAdminTaskFormModal(true);
          }}
          className="w-full mb-4 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white py-2 px-4 rounded-2xl shadow-lg transition-all duration-300"
        >
          Ajouter une Nouvelle Tâche
        </button>

        <h4 className="text-base sm:text-lg font-bold text-teal-500 mb-4 text-center">
          Toutes les Tâches
        </h4>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-fast"></div>
            <p className="ml-3 text-lightText text-sm sm:text-base">Chargement des tâches...</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1">
            {allRawTaches.length === 0 ? (
              <p className="text-center text-lightText text-sm sm:text-base">Aucune tâche disponible.</p>
            ) : (
              allRawTaches
                .filter(task => !task.Parent_Task_ID)
                .map(task => (
                  <div
                    key={task.ID_Tache}
                    className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-200 transition-transform duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-text text-base sm:text-lg truncate">
                          {task.Nom_Tache}
                        </p>
                        {task.Sous_Taches_IDs && (
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Tâche complexe
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-lightText">
                        ID: <span className="font-mono">{task.ID_Tache}</span> | Points: {task.Points} | Fréq: {task.Frequence} | Urg: {task.Urgence} | Cat: {task.Categorie}
                      </p>
                      {task.Sous_Taches_IDs && (
                        <p className="text-xs text-purple-700 mt-1">
                          {task.Sous_Taches_IDs.split(',').length} sous-tâche{task.Sous_Taches_IDs.split(',').length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                      <button
                        onClick={() => {
                          prepareTaskForEdit(task);
                          setShowAdminTaskFormModal(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1.5 px-4 rounded-full shadow-md transition-all duration-300 text-xs"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setTaskToDelete(task.ID_Tache);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-4 rounded-full shadow-md transition-all duration-300 text-xs"
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
  }, [loading, allRawTaches, setShowAdminTasksListModal, setNewTaskData, setEditingTask, setShowAdminTaskFormModal, showAdminTasksListModal, prepareTaskForEdit]);


 const renderGlobalDataViewModal = useCallback(() => {
    if (!showGlobalDataViewModal) return null;

    const collectionsList = [
      { name: 'users', label: '👥 Utilisateurs' },
      { name: 'tasks', label: '📝 Tâches' },
      { name: 'realizations', label: '✅ Réalisations' },
      { name: 'objectives', label: '🎯 Objectifs' },
      { name: 'historical_podiums', label: '🏆 Podiums Historiques' },
      { name: 'congratulatory_messages', label: '🎉 Messages de Félicitations' },
      { name: 'reports', label: '📊 Rapports' },
    ];

    return (
      <>
        <ListAndInfoModal
          title="📁 Vision Globale de la Base de Données"
          onClose={() => {
            setShowGlobalDataViewModal(false);
            setSelectedGlobalCollection(null);
            setGlobalCollectionDocs([]);
            setSelectedDocumentDetails(null);
          }}
          sizeClass="w-full max-w-4xl h-[90vh] overflow-y-auto rounded-2xl animate-fade-in"
        >
          {!selectedGlobalCollection ? (
            <div className="space-y-6">
              <h4 className="text-center text-lg sm:text-xl font-bold text-primary">Choisissez une collection</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {collectionsList.map(col => (
                  <button
                    key={col.name}
                    onClick={() => {
                      setSelectedGlobalCollection(col.name);
                      fetchGlobalCollectionDocs(col.name);
                    }}
                    className="h-20 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-sm sm:text-base rounded-2xl shadow transition-all duration-300 flex items-center justify-center text-center px-2"
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative flex justify-between items-center mb-2">
                <h4 className="text-lg sm:text-xl font-bold text-secondary text-center w-full">
                  📚 Documents : <span className="lowercase font-mono">{selectedGlobalCollection}</span>
                </h4>
                <button
                  onClick={() => {
                    setSelectedGlobalCollection(null);
                    setGlobalCollectionDocs([]);
                    setSelectedDocumentDetails(null);
                  }}
                  className="absolute left-0 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1 px-3 rounded-full text-xs"
                >
                  ← Retour
                </button>
              </div>

              {loadingGlobalCollectionDocs ? (
                <div className="flex justify-center items-center py-6">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-fast"></div>
                  <p className="ml-3 text-lightText">Chargement des documents...</p>
                </div>
              ) : globalCollectionDocs.length > 0 ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {globalCollectionDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm border border-gray-200 hover:shadow-md transition"
                    >
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm text-text truncate mb-1">🆔 {doc.id}</p>
                        <p className="text-xs text-lightText truncate">
                          {JSON.stringify(doc).substring(0, 120)}...
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedDocumentDetails(doc)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-xl shadow-sm text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Voir plus
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-lightText text-sm mt-6">Aucun document dans cette collection.</p>
              )}
            </div>
          )}
        </ListAndInfoModal>

        {selectedDocumentDetails && (
          <div className="fixed inset-0 z-[1200] bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-6 animate-fade-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-bold text-center text-primary mb-4">
                Détails du Document : <span className="text-sm break-all">{selectedDocumentDetails.id}</span>
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs whitespace-pre-wrap break-words max-h-[70vh] overflow-y-auto custom-scrollbar">
                {JSON.stringify(selectedDocumentDetails, null, 2)}
              </pre>
              <button
                onClick={() => setSelectedDocumentDetails(null)}
                className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-300 w-full text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </>
    );
  }, [
    showGlobalDataViewModal,
    selectedGlobalCollection,
    globalCollectionDocs,
    loadingGlobalCollectionDocs,
    fetchGlobalCollectionDocs,
    selectedDocumentDetails
  ]);

  const renderAdminPanel = () => {
    if (!isAdmin) return null;

    const btnBase =
      "px-4 py-2 text-sm font-medium rounded-full transition duration-200 shadow-sm text-center";
    const purpleBtn = `${btnBase} bg-purple-100 text-purple-700 hover:bg-purple-200`;
    const blueBtn = `${btnBase} bg-blue-100 text-blue-700 hover:bg-blue-200`;
    const redBtn = `${btnBase} bg-red-100 text-red-700 hover:bg-red-200`;
    const grayBtn = `${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200`;

    return (
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-secondary mb-8">
          Panneau d'Administration
        </h2>

        <div className="space-y-8">
          {/* Section 1 - Gestions principales */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
            <button onClick={() => setShowAdminObjectivesListModal(true)} className={purpleBtn}>
              🎯 Objectifs
            </button>
            <button onClick={() => setShowAdminTasksListModal(true)} className={purpleBtn}>
              ✅ Tâches
            </button>
            <button onClick={() => setShowAdminUserManagementModal(true)} className={blueBtn}>
              👥 Utilisateurs
            </button>
            <button onClick={() => setShowAdminCongratulatoryMessagesModal(true)} className={blueBtn}>
              🎉 Félicitations
            </button>
            <button onClick={() => setShowInvitationModal(true)} className={blueBtn}>
              ✉️ Invitations
            </button>
            <button onClick={() => setShowConfirmResetModal(true)} className={redBtn}>
              🔄 Reset Points Hebdo
            </button>
            <button onClick={() => setShowConfirmResetRealisationsModal(true)} className={redBtn}>
              ❌ Reset Réalisations
            </button>
          </div>

          {/* Section 2 - Outils spécifiques */}
          <div className="bg-neutralBg/40 border border-gray-200 rounded-xl p-4 shadow-inner max-w-xl mx-auto">
            <h3 className="text-center text-base font-semibold text-primary mb-4">
              Outils spécifiques
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center sm:gap-4">
              <button onClick={() => setShowGlobalDataViewModal(true)} className={grayBtn}>
                🧠 BDD Globale
              </button>
              <button onClick={() => setShowExportSelectionModal(true)} className={grayBtn}>
                📤 Export CSV
              </button>
              <button onClick={() => setShowWeeklyRecapImage(true)} className={grayBtn}>
                🖼️ Image Récap Semaine
              </button>
            </div>
          </div>

          {/* Section 3 - Statistiques */}
          <TaskStatisticsChart realisations={realisations} allRawTaches={allRawTaches} />

          {/* Section 4 - Image récap de la semaine */}
          {showWeeklyRecapImage && (
            <WeeklyRecapImageModal
              isOpen={true}
              onClose={() => setShowWeeklyRecapImage(false)}
              recapData={weeklyRecapData}
            />
          )}
        </div>
      </div>
    );
  };


  const renderExportSelectionModal = useCallback(() => {
    if (!showExportSelectionModal) return null;
    return (
      <ListAndInfoModal
        title="Exporter les Données"
        onClose={() => setShowExportSelectionModal(false)}
        sizeClass="max-w-xs sm:max-w-sm"
      >
        <div className="flex flex-col space-y-4 items-center"> 
          <button
            onClick={handleExportClassement}
            className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
          >
            Exporter le Classement (CSV)
          </button>
          <button
            onClick={handleExportRealisations}
            className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
          >
            Exporter les Réalisations (CSV)
          </button>
        </div>
      </ListAndInfoModal>
    );
  }, [showExportSelectionModal, handleExportClassement, handleExportRealisations]);


  // --- Rendu conditionnel de l'application ---

  // Rendu de l'écran de bienvenue si l'utilisateur n'est pas connecté
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark font-sans p-4 sm:p-6">
        <header className="relative flex flex-col items-center justify-center py-4 sm:py-6 px-4 mb-6 sm:mb-8 text-center">
          <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-3 sm:mb-4 h-16 sm:h-24 w-auto drop-shadow-xl cursor-pointer transform hover:scale-105 transition"/>
          {/* Dynamic Title with subtle animation */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight animate-pulse">
            Clean App Challenge
          </h1>
        </header>
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center border border-primary/20 mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Bienvenue !</h2>
          <p className="text-lg text-text mb-6">
            Veuillez vous connecter ou créer un compte pour accéder à toutes les fonctionnalités de l'application.
          </p>
          <button
            onClick={() => setShowAuthModal(true)} 
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
          >
            Se connecter / S'inscrire
          </button>
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
        {showAuthModal && ( 
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  // Rendu de l'application principale si l'utilisateur est connecté et les données chargées
  if (loading) { 
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"> 
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast mb-4 sm:mb-6"></div> 
        <p className="text-xl sm:text-2xl font-semibold text-lightText">Chargement des données...</p> 
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark font-sans p-4 sm:p-6"> 
      <div className="max-w-4xl mx-auto">
        <header className="relative flex flex-col items-center justify-center py-4 sm:py-6 px-4 mb-6 sm:mb-8 text-center space-y-3">
          {/* Logo / Emoji */}
          {showChickEmoji ? (
            <span
              className="text-7xl sm:text-7xl cursor-pointer transform hover:scale-110 transition"
              onClick={handleLogoClick}
            >
              🐣
            </span>
          ) : (
            <img
              src={`/${LOGO_FILENAME}`}
              alt="Logo Clean App Challenge"
              className="mx-auto mb-3 sm:mb-4 h-20 sm:h-24 w-auto drop-shadow-xl cursor-pointer transform hover:scale-105 transition"
              onClick={handleLogoClick}
            />
          )}

          {/* Dynamic Title with subtle animation */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight animate-pulse">
            Clean App Challenge
          </h1>

          {/* Greeting */}
          <p className="text-2xl sm:text-3xl text-lightText font-semibold mb-6">
            Bonjour, {currentUser?.displayName || currentUser?.email || 'Utilisateur'} 👋
          </p>

          {/* Logout button */}
          {currentUser && (
            <div className="absolute top-4 right-4">
              <button
                onClick={handleAuthAction}
                className="bg-transparent hover:bg-primary/10 text-primary p-2 rounded-full transition-transform hover:scale-110"
                aria-label="Déconnexion"
              >
                <LogOut size={20} className="text-primary opacity-70 hover:opacity-100 transition" />
              </button>
            </div>
          )}
        </header>


        <Navbar
          activeMainView={activeMainView}
          setActiveMainView={setActiveMainView}
          currentUser={currentUser}
          handleParticipantClick={handleParticipantClick}
          isAdmin={isAdmin}
        />

        <main>
          {activeMainView === 'home' && (
            <>
              {renderPodiumSection()} 
              <hr className="my-6 sm:my-8 border-t-2 border-neutralBg" /> 
              {renderTaskCategories()}
            </>
          )}
          {activeMainView === 'historicalPodiums' && (
            <HistoricalPodiums historicalPodiums={historicalPodiums} onClose={() => setActiveMainView('home')}>
              {weeklyRecapData && ( 
                <div className="bg-neutralBg rounded-xl p-4 shadow-inner mb-6">
                  <h3 className="text-xl font-bold text-primary mb-3 text-center">Votre Récapitulatif de la Semaine Précédente</h3>
                  <p className="text-md text-text mb-2">
                    Points gagnés : <strong className="text-success">{weeklyRecapData.pointsGained}</strong>
                  </p>
                  <p className="text-md text-text mb-2">
                    Tâches complétées : <strong className="text-secondary">{weeklyRecapData.tasksCompleted.length}</strong>
                  </p>
                  {weeklyRecapData.tasksCompleted.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-lightText mt-1">
                      {weeklyRecapData.tasksCompleted.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  )}
                  {weeklyRecapData.isWinner && (
                    <p className="text-lg font-bold text-yellow-500 mt-3 text-center">
                      Vous étiez le vainqueur de la semaine ! 🏆
                    </p>
                  )}
                  <p className="text-xs text-lightText italic mt-3 text-center">
                    Ce récapitulatif est mis à jour chaque lundi.
                  </p>
                </div>
              )}
            </HistoricalPodiums>
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
          {activeMainView === 'objectives' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Objectifs</h2>
              {renderObjectivesContent(objectives, realisations, taches)}
            </div>
          )}

        </main>
        {/* Modales et popups */}
        {renderThankYouPopup()} 
        {renderConfirmResetModal()} 
        {renderConfirmResetRealisationsModal()} 
        {renderDeleteConfirmModal()} 
        {renderDeleteObjectiveConfirmModal()} 
        <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} /> 

        {showHighlightsModal && (
            <ListAndInfoModal title="Tendances Actuelles" onClose={() => setShowHighlightsModal(false)} sizeClass="max-w-xs sm:max-w-md"> 
                {renderHighlightsContent()}
            </ListAndInfoModal>
        )}
        
        {showObjectivesModal && (
          <ListAndInfoModal
            title="Objectifs Communs"
            onClose={() => setShowObjectivesModal(false)}
            sizeClass="max-w-xs sm:max-w-md"
          >
            {renderObjectivesContent(objectives, realisations, taches)}
          </ListAndInfoModal>
        )}
        {showInvitationModal && (
          <InvitationsAdminModal
            open={showInvitationModal} // ou isOpen={showInvitationModal} si ta modale attend isOpen !
            onClose={() => setShowInvitationModal(false)}
            // Passe d’autres props si besoin (db, toast, etc)
          />
        )}

        {showAdminObjectivesListModal && isAdmin && renderAdminObjectivesListModal()} 
        {showAdminTasksListModal && isAdmin && renderAdminTasksListModal()} 
        {showExportSelectionModal && isAdmin && renderExportSelectionModal()} 
        {showOverallRankingModal && (
          <OverallRankingModal
            classement={classement}
            onClose={() => setShowOverallRankingModal(false)}
            onParticipantClick={handleParticipantClick}
          />
        )}


        {showReportModal && currentUser && ( 
          <ReportTaskModal
            show={showReportModal}
            onClose={() => { setShowReportModal(false); setReportedTaskDetails(null); }}
            onSubmit={submitReport} 
            reportedTaskDetails={reportedTaskDetails}
            loading={loading}
          />
        )}

        {showAdminObjectiveFormModal && isAdmin && ( 
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
        {showAdminTaskFormModal && isAdmin && ( 
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
        {showAuthModal && ( 
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}

        {showAdminUserManagementModal && isAdmin && (
          <AdminUserManagementModal
            onClose={() => setShowAdminUserManagementModal(false)}
            realisations={realisations} 
          />
        )}


        {showAdminCongratulatoryMessagesModal && isAdmin && (
          <AdminCongratulatoryMessagesModal
            onClose={() => setShowAdminCongratulatoryMessagesModal(false)}
          />
        )}

        {showGlobalDataViewModal && isAdmin && renderGlobalDataViewModal()}

        {showWeeklyRecapModal && weeklyRecapData && (
          <WeeklyRecapModal
            recapData={weeklyRecapData}
            onClose={() => setShowWeeklyRecapModal(false)}
          />
        )}


        {showProfileEditOptionsModal && currentUser && ( 
          <ProfileEditOptionsModal
            onClose={() => setShowProfileEditOptionsModal(false)}
            onOpenAvatar={() => { setShowAvatarSelectionModal(true); setShowProfileEditOptionsModal(false); }}
            onOpenPassword={() => { setShowPasswordChangeModal(true); setShowProfileEditOptionsModal(false); }}
          />
        )}

        {showAvatarSelectionModal && currentUser && (
          <AvatarSelectionModal
            currentAvatar={currentUser.avatar || '👤'}
            onClose={() => setShowAvatarSelectionModal(false)}
            onSave={async (newAvatar) => {
              try {
                await updateDoc(doc(db, "users", currentUser.uid), { avatar: newAvatar });
                setCurrentUser(prevUser => ({ ...prevUser, avatar: newAvatar }));
                toast.success("Avatar mis à jour !");
              } catch (error) {
                toast.error("Erreur lors de la mise à jour de l'avatar.");
                console.error("Error updating avatar:", error);
              } finally {
                setShowAvatarSelectionModal(false);
              }
            }}
          />
        )}


        {showPasswordChangeModal && currentUser && (
          <PasswordChangeModal
            onClose={() => setShowPasswordChangeModal(false)}
            currentUser={currentUser}
          />
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

      <BadgePopup badge={showingBadge} onClose={handleCloseBadge} />

      {/* TaskConfirmModal gère maintenant les tâches simples et les tâches de groupe */}
      
      <RankingCardModal
        show={showFullRankingModal}
        onClose={() => setShowFullRankingModal(false)}
        title="Classement Hebdomadaire Complet"
        participants={classement}
        type="weekly"
        onParticipantClick={handleParticipantClick}
      />
    {showTaskModal && selectedTask && (
        <TaskConfirmModal
          task={selectedTask} // selectedTask contient maintenant SousTaches si c'est un groupe
          onClose={() => setShowTaskModal(false)}
          onConfirm={handleTaskConfirmation}
          loading={loadingConfirm}
          currentUser={currentUser}
          isSubTaskAvailable={isSubTaskAvailable} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
