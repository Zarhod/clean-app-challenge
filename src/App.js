// src/App.js
// Version mise à jour pour utiliser Firebase Authentication et Firestore avec des écouteurs en temps réel.
// Tous les chemins Firestore sont maintenant à la racine de la base de données.
// Les boutons des modales sont centrés sur mobile.
// Gestion améliorée des erreurs de permission pour éviter les toasts sur la page de connexion.
// Correction de l'erreur "TypeError: null is not iterable" dans calculateWeeklyRecap.
// Améliorations de l'affichage du profil utilisateur, des modales et suppression des logs.
// Intégration d'une fonctionnalité de chat simple avec bouton flottant.
// Correction des problèmes de z-index et d'affichage des modales.
// Correction des dépendances manquantes dans useCallback pour résoudre les erreurs de compilation CI.
// Amélioration du graphique de statistiques des tâches.
// Correction des problèmes de boutons de profil et d'affichage d'avatar.
// Correction des erreurs no-undef dans UserContext.js.
// Correction des avertissements ESLint 'exhaustive-deps' et 'no-unused-vars'.
// Correction de la duplication de l'écran de bienvenue lors de l'ouverture de la modale de connexion.
// Correction du podium affichant des utilisateurs à 0 point.
// Amélioration majeure de l'interface utilisateur du chat.
// Correction de l'affichage du bouton de modification de profil.
// Correction du chevauchement des boutons dans AuthModal.
// Ajout de l'indicateur de messages non lus sur le bouton de chat.
// Amélioration des messages d'erreur de connexion.
// Correction de l'erreur de compilation 'no-undef' pour __firebase_config et __initial_auth_token.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; 
import HistoricalPodiums from './HistoricalPodiums'; 
import AdminTaskFormModal from './AdminTaskFormModal'; 
import ConfirmActionModal from './ConfirmActionModal'; 
import ConfettiOverlay from './ConfettiOverlay'; 
import TaskStatisticsChart from './TaskStatisticsChart'; 
import AdminObjectiveFormModal from './AdminObjectiveFormModal'; 
import ListAndInfoModal from './ListAndInfoModal'; 
import RankingCard from './RankingCard'; 
import OverallRankingModal from './OverallRankingModal'; 
import ReportTaskModal from './ReportTaskModal'; 
import AuthModal from './AuthModal'; 
import AdminUserManagementModal from './AdminUserManagementModal'; 
import AdminCongratulatoryMessagesModal from './AdminCongratulatoryMessagesModal'; 
import WeeklyRecapModal from './WeeklyRecapModal'; 
import TaskHistoryModal from './TaskHistoryModal'; 
import AvatarSelectionModal from './AvatarSelectionModal'; 
import PasswordChangeModal from './PasswordChangeModal'; 
import ProfileEditOptionsModal from './ProfileEditOptionsModal'; 
import confetti from 'canvas-confetti'; 

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Importations Supabase
import { supabase } from "./supabase";

// Importation du contexte utilisateur
import { UserProvider, useUser } from './UserContext';

const LOGO_FILENAME = 'logo.png'; 

// Fonctions utilitaires pour la gamification (déplacées en dehors du du composant pour éviter les re-déclarations)
const calculateLevelAndXP = (currentXP) => {
  let level = 1;
  let xpNeededForNextLevel = 100; 
  
  if (currentXP >= 100) {
    level = 2;
    xpNeededForNextLevel = 150; 
  }
  if (currentXP >= 250) {
    level = 3;
    xpNeededForNextLevel = 250; 
  }
  if (currentXP >= 500) {
    level = 4;
    xpNeededForNextLevel = 500; 
  }
  if (currentXP >= 1000) {
    level = 5;
    xpNeededForNextLevel = 1000; 
  }
  if (currentXP >= 2000) { 
    level = Math.floor(currentXP / 100) + 1; 
    xpNeededForNextLevel = 100; 
  }

  return { level, xpNeededForNextLevel };
};


function AppContent() { 
  // eslint-disable-next-line no-unused-vars
  const [logoClickCount, setLogoClickCount] = useState(0); 
  const { currentUser, isAdmin, loadingUser, db, auth, setCurrentUser } = useUser(); // Récupère db et auth du contexte

  const [taches, setTaches] = useState([]); 
  const [allRawTaches, setAllRawTaches] = useState([]); 
  const [realisations, setRealisations] = useState([]); 
  const [classement, setClassement] = useState([]); 
  const [historicalPodiums, setHistoricalPodiums] = useState([]); 
  const [objectives, setObjectives] = useState([]); 
  const [congratulatoryMessages, setCongratulatoryMessages] = useState([]); 
  const [loading, setLoading] = useState(true); 

  const [selectedTask, setSelectedTask] = useState(null); 
  const [participantName, setParticipantName] = useState(currentUser?.displayName || currentUser?.email || ''); 
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

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedTaskDetails, setReportedTaskDetails] = useState(null); 
  const [reports, setReports] = useState([]); 

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

  const [showTaskHistoryModal, setShowTaskHistoryModal] = useState(false); 
  const [taskHistoryTaskId, setTaskHistoryTaskId] = useState(null); 

  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false); 
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false); 

  // États pour la pagination des réalisations
  const [realizationsPerPage] = useState(10);
  const [currentRealizationsPage, setCurrentRealizationsPage] = useState(1);

  // Ref pour suivre l'état de chargement initial de chaque collection
  const initialLoadStatus = useRef({
    tasks: false,
    realizations: false,
    classement: false,
    objectives: false,
    congratulatoryMessages: false,
    historicalPodiums: false,
    reports: false,
  });

  // Met à jour participantName si currentUser change
  useEffect(() => {
    if (currentUser) {
      setParticipantName(currentUser.displayName || currentUser.email);
    } else {
      setParticipantName('');
    }
  }, [currentUser]);

  // Synchronise selectedParticipantProfile si c'est le profil de l'utilisateur actuel
  useEffect(() => {
    if (currentUser && selectedParticipantProfile && selectedParticipantProfile.id === currentUser.uid) {
      // Met à jour selectedParticipantProfile avec les dernières données de currentUser
      setSelectedParticipantProfile({ ...currentUser });
    }
  }, [currentUser, selectedParticipantProfile]);


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


  // Fonctions de récupération de données utilisant onSnapshot (CHEMINS MIS À JOUR)
  const setupTasksListener = useCallback(() => {
    const fetchAndProcessTasks = async () => {
      const { data: rawData, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) {
        if (supabase.auth.getUser()) {
          toast.error(`Erreur lors de la récupération des tâches : ${error.message}`);
        }
        return;
      }

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
    };

    fetchAndProcessTasks();

    const channel = supabase
      .channel('tasks-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchAndProcessTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
 

  const setupRealisationsListener = useCallback(() => {
    const fetchRealisations = async () => {
      const { data, error } = await supabase
        .from('realisations')
        .select('*');

      if (error) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData) {
          toast.error(`Erreur lors de la récupération des réalisations : ${error.message}`);
        }
        return;
      }

      setRealisations(data);
      initialLoadStatus.current.realisations = true;
    };

    fetchRealisations();

    const channel = supabase
      .channel('realisations-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'realisations' },
        fetchRealisations
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const setupClassementListener = useCallback(() => {
    const fetchClassement = async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          toast.error(`Erreur lors de la récupération des utilisateurs pour le classement: ${usersError.message}`);
        }
        return;
      }

      const { data: realisationsData, error: realisationsError } = await supabase
        .from('realizations')
        .select('*');

      if (realisationsError) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          toast.error(`Erreur lors de la récupération des réalisations pour le classement: ${realisationsError.message}`);
        }
        return;
      }

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

      realisationsData.forEach(real => {
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
      initialLoadStatus.current.classement = true;
    };

    fetchClassement();

    const channel = supabase
      .channel('classement-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        fetchClassement
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'realizations' },
        fetchClassement
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
 

  const setupObjectivesListener = useCallback(() => {
    const fetchObjectives = async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*');

      if (error) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          toast.error(`Erreur lors de la récupération des objectifs: ${error.message}`);
        }
        return;
      }

      setObjectives(data);
      initialLoadStatus.current.objectives = true;
    };

    fetchObjectives();

    const channel = supabase
      .channel('objectives-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objectives' },
        fetchObjectives
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
 

  const setupCongratulatoryMessagesListener = useCallback(() => {
    const channel = supabase
      .channel('congratulatory_messages_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'congratulatory_messages' },
        async () => {
          const { data, error } = await supabase
            .from('congratulatory_messages')
            .select('*');

          if (error) {
            toast.error(`Erreur lors de la récupération des messages : ${error.message}`);
            return;
          }

          setCongratulatoryMessages(data);
          initialLoadStatus.current.congratulatoryMessages = true;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 

  const setupHistoricalPodiumsListener = useCallback(() => {
    const fetchHistoricalPodiums = async () => {
      try {
        const { data, error } = await supabase
          .from('historical_podiums')
          .select('*');

        if (error) throw error;

        setHistoricalPodiums(data || []);
        initialLoadStatus.current.historicalPodiums = true;
      } catch (error) {
        // Vérification simplifiée (ne déclenche pas d'effet secondaire inutile)
        toast.error(`Erreur lors de la récupération des podiums historiques : ${error.message}`);
      }
    };

    fetchHistoricalPodiums();

    return () => {}; // Supabase ne fournit pas de méthode unsubscribe pour une requête simple
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

 

  const setupReportsListener = useCallback(() => {
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        async () => {
          const { data, error } = await supabase
            .from('reports')
            .select('*');

          if (error) {
            toast.error(`Erreur lors de la récupération des signalements : ${error.message}`);
          } else {
            setReports(data);
            initialLoadStatus.current.reports = true;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


 

  // Effet principal pour gérer les écouteurs en temps réel et l'état de chargement global
  useEffect(() => {
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
      const unsubTasks = setupTasksListener();
      const unsubRealisations = setupRealisationsListener();
      const unsubClassement = setupClassementListener();
      const unsubObjectives = setupObjectivesListener();
      const unsubMessages = setupCongratulatoryMessagesListener();
      const unsubPodiums = setupHistoricalPodiumsListener();
      const unsubReports = setupReportsListener();

      setTimeout(checkInitialLoad, 500);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        unsubTasks?.();
        unsubRealisations?.();
        unsubClassement?.();
        unsubObjectives?.();
        unsubMessages?.();
        unsubPodiums?.();
        unsubReports?.();

        Object.keys(currentInitialLoadStatusRef).forEach(
          key => currentInitialLoadStatusRef[key] = false
        );
      };
    } else if (!loadingUser && !currentUser) {
      setTaches([]);
      setAllRawTaches([]);
      setRealisations([]);
      setClassement([]);
      setHistoricalPodiums([]);
      setObjectives([]);
      setCongratulatoryMessages([]);
      setReports([]);
      setWeeklyRecapData(null);
      setLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      Object.keys(currentInitialLoadStatusRef).forEach(
        key => currentInitialLoadStatusRef[key] = false
      );
    };
  }, [
    currentUser, loadingUser,
    setupTasksListener, setupRealisationsListener, setupClassementListener,
    setupObjectivesListener, setupCongratulatoryMessagesListener, setupHistoricalPodiumsListener,
    setupReportsListener
  ]);




  // Deuxième useEffect: Calcul et affichage du récapitulatif hebdomadaire
  useEffect(() => {
    const handleRecapLogic = async () => {
      if (currentUser && realisations.length > 0 && historicalPodiums.length > 0) {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));
        currentMonday.setHours(0, 0, 0, 0);

        const { data: userData, error } = await supabase
          .from("users")
          .select("lastWeeklyRecapDisplayed")
          .eq("id", currentUser.uid)
          .single();

        if (error) {
          console.error("Erreur lors de la récupération des infos utilisateur :", error.message);
          return;
        }

        const lastRecapDisplayed = userData?.lastWeeklyRecapDisplayed
          ? new Date(userData.lastWeeklyRecapDisplayed)
          : null;

        if (
          currentDayOfWeek === 1 &&
          (!lastRecapDisplayed || lastRecapDisplayed.toDateString() !== currentMonday.toDateString())
        ) {
          const recap = calculateWeeklyRecap(
            currentUser.uid,
            currentUser.displayName || currentUser.email,
            realisations,
            historicalPodiums
          );
          setWeeklyRecapData(recap);
          setShowWeeklyRecapModal(true);

          const { error: updateError } = await supabase
            .from("users")
            .update({ lastWeeklyRecapDisplayed: currentMonday.toISOString() })
            .eq("id", currentUser.uid);

          if (updateError) {
            console.error("Erreur lors de la mise à jour :", updateError.message);
          }
        } else if (
          lastRecapDisplayed &&
          lastRecapDisplayed.toDateString() === currentMonday.toDateString()
        ) {
          const recap = calculateWeeklyRecap(
            currentUser.uid,
            currentUser.displayName || currentUser.email,
            realisations,
            historicalPodiums
          );
          setWeeklyRecapData(recap);
        } else {
          setWeeklyRecapData(null);
        }
      } else if (currentUser && (realisations.length === 0 || historicalPodiums.length === 0)) {
        setWeeklyRecapData(null);
      }
    };
    handleRecapLogic();
  }, [currentUser, realisations, historicalPodiums, calculateWeeklyRecap]);



  const fetchParticipantWeeklyTasks = useCallback(async (participantName) => {
    setLoading(true); 
    try {
      const { data, error } = await supabase
        .from('realizations')
        .select('*')
        .eq('nomParticipant', participantName);

      if (error) throw error;

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
  }, [setParticipantWeeklyTasks, setLoading]);


  const fetchSubTasks = useCallback(async (parentTaskId) => {
    setLoading(true); 
    try {
      const { data: parentTaskData, error: parentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentTaskId)
        .single();

      if (parentError || !parentTaskData) {
        throw new Error("Tâche parente introuvable.");
      }

      if (!parentTaskData.Sous_Taches_IDs || String(parentTaskData.Sous_Taches_IDs).trim() === '') {
        setSubTasks([]);
        return;
      }

      const subTaskIds = String(parentTaskData.Sous_Taches_IDs).split(',').map(id => id.trim());

      const { data: sousTaches, error: subError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', subTaskIds);

      if (subError) throw subError;

      setSubTasks(sousTaches || []); 
    } catch (err) {
      toast.error(`Erreur: ${err.message}`);
      setSubTasks([]); 
    } finally {
      setLoading(false);
    }
  }, [setSubTasks, setLoading]);
 

  const fetchGlobalCollectionDocs = useCallback(async (collectionName) => {
    setLoadingGlobalCollectionDocs(true);
    try {
      const { data, error } = await supabase
        .from(collectionName)
        .select('*');

      if (error) throw error;

      const docs = data.map(row => ({ id: row.id, ...row }));
      setGlobalCollectionDocs(docs);
    } catch (err) {
      toast.error(`Erreur lors du chargement des documents de ${collectionName}: ${err.message}`);
      setGlobalCollectionDocs([]);
    } finally {
      setLoadingGlobalCollectionDocs(false);
    }
  }, []);


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

      // Enregistrer la réalisation
      const { error: addError } = await supabase.from('realizations').insert([{
        taskId: idTacheToRecord,
        userId: currentUser.uid,
        nomParticipant: currentUser.displayName || currentUser.email,
        nomTacheEffectuee: taskToRecord.Nom_Tache,
        categorieTache: categoryToSend,
        pointsGagnes: pointsToSend,
        timestamp: new Date().toISOString()
      }]);
      if (addError) throw addError;

      // Récupérer les infos de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.uid)
        .single();
      if (userError) throw userError;

      const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + pointsToSend;
      const newWeeklyPoints = (userData.weeklyPoints || 0) + pointsToSend;
      const newXP = (userData.xp || 0) + pointsToSend;
      const { level: newLevel } = calculateLevelAndXP(newXP);

      // Mettre à jour les points de l'utilisateur
      const { error: updateError } = await supabase
        .from('users')
        .update({
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints,
          xp: newXP,
          level: newLevel
        })
        .eq('id', currentUser.uid);
      if (updateError) throw updateError;

      // Mettre à jour le contexte utilisateur
      setCurrentUser(prevUser => ({
        ...prevUser,
        totalCumulativePoints: newTotalCumulativePoints,
        weeklyPoints: newWeeklyPoints,
        xp: newXP,
        level: newLevel
      }));

      // Supprimer si tâche ponctuelle
      if (String(taskToRecord.Frequence || '').toLowerCase() === 'ponctuel') {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskToRecord.id);
        if (deleteError) throw deleteError;

        toast.success(`Tâche ponctuelle "${taskToRecord.Nom_Tache}" enregistrée et supprimée.`);
      } else {
        toast.success(`Tâche "${taskToRecord.Nom_Tache}" enregistrée avec succès.`);
      }

      // Afficher le message de félicitation
      if (!isSubTask) {
        const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";
        setShowThankYouPopup({
          name: currentUser.displayName || currentUser.email,
          task: taskToRecord.Nom_Tache,
          message: randomMessage
        });
        setShowConfetti(true);
        setSelectedTask(null);
      }

    } catch (err) {
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
      const tasksToDelete = [];
      const realizationsToInsert = [];

      availableSelectedSubTasks.forEach(subTask => {
        const points = parseFloat(subTask.Points) || 0;
        const category = subTask.Categorie || 'Non catégorisée';
        totalPointsGained += points;

        if (String(subTask.Frequence || '').toLowerCase() === 'ponctuel') {
          tasksToDelete.push(subTask.id);
        }

        realizationsToInsert.push({
          taskId: subTask.ID_Tache,
          userId: currentUser.uid,
          nomParticipant: currentUser.displayName || currentUser.email,
          nomTacheEffectuee: subTask.Nom_Tache,
          categorieTache: category,
          pointsGagnes: points,
          timestamp: new Date().toISOString()
        });
      });

      // Insertion multiple
      const { error: insertError } = await supabase.from('realizations').insert(realizationsToInsert);
      if (insertError) throw insertError;

      // Suppression des tâches ponctuelles
      if (tasksToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .in('id', tasksToDelete);
        if (deleteError) throw deleteError;
      }

      // Mise à jour des points utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.uid)
        .single();
      if (userError) throw userError;

      const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + totalPointsGained;
      const newWeeklyPoints = (userData.weeklyPoints || 0) + totalPointsGained;
      const newXP = (userData.xp || 0) + totalPointsGained;
      const { level: newLevel } = calculateLevelAndXP(newXP);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints,
          xp: newXP,
          level: newLevel
        })
        .eq('id', currentUser.uid);
      if (updateError) throw updateError;

      setCurrentUser(prevUser => ({
        ...prevUser,
        totalCumulativePoints: newTotalCumulativePoints,
        weeklyPoints: newWeeklyPoints,
        xp: newXP,
        level: newLevel
      }));

      const completedTaskNames = availableSelectedSubTasks.map(st => st.Nom_Tache).join(', ');
      const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)]?.Texte_Message || "Bravo pour votre excellent travail !";

      setShowThankYouPopup({
        name: currentUser.displayName || currentUser.email,
        task: completedTaskNames,
        message: randomMessage
      });
      setShowConfetti(true);
      toast.success(`Tâches enregistrées avec succès.`);

      setSelectedTask(null);
      setShowSplitTaskDialog(false);
      setSelectedSubTasks([]);
    } catch (err) {
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
      const sortedClassementForPodium = [...classement].sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);
      const top3 = sortedClassementForPodium
        .filter(p => parseFloat(p.Points_Total_Semaine_Courante) > 0)
        .slice(0, 3);
      const datePodium = new Date().toISOString().split('T')[0];

      // Enregistrement du podium
      if (top3.length > 0) {
        const { error: insertError } = await supabase.from('historical_podiums').insert({
          Date_Podium: datePodium,
          top3: top3.map(p => ({ name: p.Nom_Participant, points: p.Points_Total_Semaine_Courante }))
        });
        if (insertError) throw insertError;

        toast.success('Points hebdomadaires réinitialisés et podium enregistré.');
      } else {
        toast.info('Aucun participant n\'a marqué de points cette semaine, le podium n\'a pas été enregistré.');
      }

      // Mise à jour des utilisateurs
      const { data: users, error: usersError } = await supabase.from('users').select('id, weeklyPoints');
      if (usersError) throw usersError;

      const updates = users.map(user => ({
        id: user.id,
        weeklyPoints: 0,
        previousWeeklyPoints: user.weeklyPoints || 0
      }));

      for (const user of updates) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            weeklyPoints: user.weeklyPoints,
            previousWeeklyPoints: user.previousWeeklyPoints
          })
          .eq('id', user.id);
        if (updateError) throw updateError;
      }

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
      // Supprimer toutes les réalisations
      const { data: realisations, error: realisationsError } = await supabase
        .from('realizations')
        .select('id');

      if (realisationsError) throw realisationsError;

      for (const real of realisations) {
        const { error: deleteError } = await supabase
          .from('realizations')
          .delete()
          .eq('id', real.id);
        if (deleteError) throw deleteError;
      }

      // Réinitialiser les données des utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) throw usersError;

      for (const user of users) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            weeklyPoints: 0,
            totalCumulativePoints: 0,
            previousWeeklyPoints: 0,
            xp: 0,
            level: 1
          })
          .eq('id', user.id);
        if (updateError) throw updateError;
      }

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
        await supabase.auth.signOut();
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
    if (newTaskData.Points === '' || isNaN(parseFloat(newTaskData.Points))) {
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
      const pointsToSave = parseFloat(newTaskData.Points);

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({ ...newTaskData, Points: pointsToSave })
          .eq('id', editingTask.id);

        if (error) throw error;

        toast.success('Tâche mise à jour avec succès.');
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{ id: newTaskData.ID_Tache, ...newTaskData, Points: pointsToSave }]);

        if (error) throw error;

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
      // Ne ferme pas la modale de liste ici, elle reste ouverte en arrière-plan
      setShowDeleteConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Tâche supprimée avec succès.');
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false);
      setTaskToDelete(null);
    }
  }, [isAdmin, setLoading, setShowDeleteConfirmModal, setTaskToDelete]);


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
      toast.error("L'ID de l'objectif est requis.");
      return;
    }

    if (!newObjectiveData.Nom_Objectif.trim()) {
      toast.error("Le nom de l'objectif est requis.");
      return;
    }

    if (isNaN(parseFloat(newObjectiveData.Cible_Points))) {
      toast.error("Les points cible doivent être un nombre valide.");
      return;
    }

    if (
      newObjectiveData.Type_Cible === "Par_Categorie" &&
      !newObjectiveData.Categorie_Cible.trim()
    ) {
      toast.error(
        'La catégorie cible est requise pour le type "Par Catégorie".'
      );
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...newObjectiveData,
        Cible_Points: parseFloat(newObjectiveData.Cible_Points),
        Points_Actuels: parseFloat(newObjectiveData.Points_Actuels),
        Est_Atteint: newObjectiveData.Est_Atteint,
      };

      if (editingObjective) {
        const { error } = await supabase
          .from("objectives")
          .update(dataToSave)
          .eq("id", editingObjective.id);
        if (error) throw error;
        toast.success("Objectif mis à jour avec succès.");
      } else {
        const { error } = await supabase
          .from("objectives")
          .insert([{ id: newObjectiveData.ID_Objectif, ...dataToSave }]);
        if (error) throw error;
        toast.success("Objectif ajouté avec succès.");
      }

      setShowAdminObjectiveFormModal(false);
      setEditingObjective(null);
      setNewObjectiveData({
        ID_Objectif: "",
        Nom_Objectif: "",
        Description_Objectif: "",
        Cible_Points: "",
        Type_Cible: "Cumulatif",
        Categorie_Cible: "",
        Points_Actuels: 0,
        Est_Atteint: false,
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
      const { error } = await supabase
        .from("objectives")
        .delete()
        .eq("id", objectiveId);

      if (error) throw error;

      toast.success("Objectif supprimé avec succès.");
    } catch (err) {
      toast.error(`Une erreur est survenue: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteObjectiveConfirmModal(false);
      setObjectiveToDelete(null);
    }
  }, [isAdmin, setLoading, setShowDeleteObjectiveConfirmModal, setObjectiveToDelete]);


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
    // Ne ferme pas la modale parente ici
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
      // 1. Vérifier s'il y a déjà un rapport pour cette réalisation
      const { data: existingReports, error: reportError } = await supabase
        .from('reports')
        .select('id')
        .eq('realizationId', reportedTaskDetails.realizationId);

      if (reportError) throw reportError;

      if (existingReports.length > 0) {
        toast.info("Cette tâche a déjà été signalée.");
        setShowReportModal(false);
        setReportedTaskDetails(null);
        return;
      }

      // 2. Ajouter un nouveau rapport
      const { error: insertError } = await supabase.from('reports').insert({
        reportedTaskId: reportedTaskDetails.id,
        reportedUserId: reportedTaskDetails.reportedUserId,
        reportedParticipantName: reportedTaskDetails.participant,
        reporterUserId: currentUser.uid,
        reporterName: currentUser.displayName || currentUser.email,
        realizationId: reportedTaskDetails.realizationId,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      if (insertError) throw insertError;

      // 3. Supprimer la réalisation signalée
      const { error: deleteError } = await supabase
        .from('realizations')
        .delete()
        .eq('id', reportedTaskDetails.realizationId);
      if (deleteError) throw deleteError;

      toast.success(`Tâche signalée et réalisation supprimée.`);

      // 4. Réduction des points de l'utilisateur signalé
      const DEDUCTION_POINTS = 5;
      const { data: reportedUserData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', reportedTaskDetails.reportedUserId)
        .single();
      if (userError) throw userError;

      const newTotalCumulativePoints = Math.max(0, (reportedUserData.totalCumulativePoints || 0) - DEDUCTION_POINTS);
      const newWeeklyPoints = Math.max(0, (reportedUserData.weeklyPoints || 0) - DEDUCTION_POINTS);
      const newXP = Math.max(0, (reportedUserData.xp || 0) - DEDUCTION_POINTS);
      const { level: newLevel } = calculateLevelAndXP(newXP);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          totalCumulativePoints: newTotalCumulativePoints,
          weeklyPoints: newWeeklyPoints,
          xp: newXP,
          level: newLevel
        })
        .eq('id', reportedTaskDetails.reportedUserId);
      if (updateError) throw updateError;

      // 5. Mise à jour éventuelle du currentUser si concerné
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

    } catch (err) {
      toast.error(`Une erreur est survenue lors du signalement: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReportModal(false);
      setReportedTaskDetails(null);
    }
  };



  const handleParticipantClick = useCallback(async (participant) => {
    if (currentUser && String(participant.Nom_Participant || '').trim() === String(currentUser.displayName || currentUser.email).trim()) {
      setSelectedParticipantProfile({ ...currentUser });
      setActiveMainView('participantProfile');
      await fetchParticipantWeeklyTasks(currentUser.displayName || currentUser.email);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('displayName', participant.Nom_Participant)
        .limit(1)
        .single();

      if (error || !data) {
        toast.error("Profil utilisateur introuvable.");
        return;
      }

      setSelectedParticipantProfile(data);
      setActiveMainView('participantProfile');
      await fetchParticipantWeeklyTasks(participant.Nom_Participant);
    } catch (err) {
      toast.error("Erreur lors de la récupération du profil utilisateur.");
      console.error(err);
    }
  }, [fetchParticipantWeeklyTasks, currentUser]);


  const isSubTaskAvailable = useCallback((subTask) => {
    const frequence = subTask.Frequence ? String(subTask.Frequence).toLowerCase() : 'hebdomadaire';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayOfWeek = today.getDay(); 
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0); 

    const isCompletedInRealisations = realisations.some(real => {
      if (String(real.taskId || '') === String(subTask.ID_Tache)) { 
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
  }, [realisations]); 


  const handleTaskClick = (task) => {
    if (!currentUser) {
      toast.warn('Veuillez vous connecter pour valider une tâche.');
      setShowAuthModal(true);
      return;
    }
    setSelectedTask(task);
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
    
    const existingSubtasks = allRawTaches.filter(t => subTaskIds.includes(String(t.ID_Tache)));

    if (existingSubtasks.length === 0) {
        return true; 
    }

    return existingSubtasks.every(subTask => !isSubTaskAvailable(subTask));
  }, [allRawTaches, isSubTaskAvailable]); 

  const isTaskHidden = useCallback((tache) => {
    const isSingleTaskCompleted = !tache.isGroupTask && !isSubTaskAvailable(tache);
    const isGroupTaskFullyCompleted = tache.isGroupTask && areAllSubtasksCompleted(tache);
    return isSingleTaskCompleted || isGroupTaskFullyCompleted;
  }, [isSubTaskAvailable, areAllSubtasksCompleted]);

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
    if (weeklyWins >= 3 && !badges.some(b => b.name === 'Triple Couronne')) {
        badges.push({ name: 'Triple Couronne', icon: '👑', description: 'A été premier 3 fois ou plus.' });
    }

    const firstObjectiveCompleted = objectives.some(obj => 
      obj.Est_Atteint && 
      (String(obj.Type_Cible || '').toLowerCase() === 'cumulatif' && parseFloat(participant.Points_Total_Cumulatif) >= parseFloat(obj.Cible_Points || 0))
    );
    if (firstObjectiveCompleted && !badges.some(b => b.name === 'Conquérant d\'Objectifs')) {
      badges.push({ name: 'Conquérant d\'Objectifs', icon: '🎯', description: 'A complété son premier objectif.' });
    }

    const allObjectivesCompleted = objectives.every(obj => {
      const isCumulatifObjectiveMet = 
        String(obj.Type_Cible || '').toLowerCase() === 'cumulatif' && 
        parseFloat(participant.Points_Total_Cumulatif) >= parseFloat(obj.Cible_Points || 0);
      
      const isCategorieObjectiveMet = 
        String(obj.Type_Cible || '').toLowerCase() === 'par_categorie' && 
        participantRealisations.filter(r => String(r.categorieTache || '').toLowerCase() === String(obj.Categorie_Cible || '').toLowerCase()).length > 0 && 
        participantRealisations.filter(r => String(r.categorieTache || '').toLowerCase() === String(obj.Categorie_Cible || '').toLowerCase()).reduce((sum, r) => sum + (parseFloat(r.pointsGagnes) || 0), 0) >= parseFloat(obj.Cible_Points || 0);
      
      return obj.Est_Atteint && (isCumulatifObjectiveMet || isCategorieObjectiveMet);
    });

    if (allObjectivesCompleted && objectives.length > 0 && !badges.some(b => b.name === 'Maître des Objectifs')) {
      badges.push({ name: 'Maître des Objectifs', icon: '🏆', description: 'A complété tous les objectifs.' });
    }

    const hasReportedTask = reports.some(r => String(r.reporterUserId || '') === String(currentUser?.uid || ''));
    if (hasReportedTask && !badges.some(b => b.name === 'Vigie de la Propreté')) {
        badges.push({ name: 'Vigie de la Propreté', icon: '👁️', description: 'A signalé une tâche problématique.' });
    }

    return badges;
  }, [realisations, historicalPodiums, objectives, reports, currentUser]);


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
    const top3WithPoints = sortedClassement.filter(p => parseFloat(p.Points_Total_Semaine_Courante) > 0).slice(0, 3);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl text-center"> 
        <p className="text-lg sm:text-xl font-semibold text-text mb-4">
          Tâches restantes: <span className="text-primary font-bold">{remainingTasksCount}</span>
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary mb-6 sm:mb-8 whitespace-nowrap overflow-hidden text-ellipsis">🏆 Podium de la Semaine 🏆</h2> 
        
        {Array.isArray(classement) && top3WithPoints.length > 0 ? ( 
          <>
            <div className="flex justify-center items-end mt-4 sm:mt-6 gap-2 sm:gap-4"> 
              {/* 2ème Place */}
              {top3WithPoints.length > 1 && (
                <div 
                  key={top3WithPoints[1].Nom_Participant || `anon-silver`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[1]} order-1 w-1/3 sm:w-auto min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3WithPoints[1])} 
                >
                  <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[1]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3WithPoints[1].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3WithPoints[1].Points_Total_Semaine_Courante} pts</p> 
                </div>
              )}

              {/* 1ère Place */}
              {top3WithPoints.length > 0 && (
                <div 
                  key={top3WithPoints[0].Nom_Participant || `anon-gold`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[0]} order-2 w-1/3 sm:w-auto -translate-y-2 min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3WithPoints[0])} 
                >
                  <span className={`text-5xl sm:text-6xl mb-0.5 sm:mb-1`}>{medals[0]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3WithPoints[0].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3WithPoints[0].Points_Total_Semaine_Courante} pts</p> 
                </div>
              )}

              {/* 3ème Place */}
              {top3WithPoints.length > 2 && (
                <div 
                  key={top3WithPoints[2].Nom_Participant || `anon-bronze`} 
                  className={`flex flex-col items-center p-2 sm:p-4 rounded-3xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                    ${podiumColors[2]} order-3 w-1/3 sm:w-auto min-w-[80px]`} 
                  onClick={() => handleParticipantClick(top3WithPoints[2])} 
                >
                  <span className={`text-3xl sm:text-5xl mb-0.5 sm:mb-1`}>{medals[2]}</span> 
                  <p className="font-bold text-sm sm:text-xl mb-0.5 text-text truncate w-full px-1 text-center">{top3WithPoints[2].Nom_Participant}</p> 
                  <p className="text-xs sm:text-base text-lightText">{top3WithPoints[2].Points_Total_Semaine_Courante} pts</p> 
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
      const visibleTasks = tasks.filter(tache => !isTaskHidden(tache));

      if (visibleTasks.length === 0) {
        return <p className="text-center text-lightText text-md py-2">Aucune tâche disponible dans cette section.</p>;
      }
      return (
        <div className="space-y-3">
          {visibleTasks.map(tache => { 
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

        {ponctuelTasks.filter(tache => !isTaskHidden(tache)).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Ponctuelles</h3> 
            {renderTasksList(ponctuelTasks)}
          </div>
        )}

        {quotidienTasks.filter(tache => !isTaskHidden(tache)).length > 0 && ( 
          <div className="mb-6 border-b border-neutralBg pb-4"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Quotidiennes</h3> 
            {renderTasksList(quotidienTasks)}
          </div>
        )}

        {hebdomadaireTasks.filter(tache => !isTaskHidden(tache)).length > 0 && ( 
          <div className="mb-6"> 
            <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-left">Tâches Hebdomadaires</h3> 
            {renderTasksList(hebdomadaireTasks)}
          </div>
        )}

        {currentCategoryTasks.filter(tache => !isTaskHidden(tache)).length === 0 && (
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

    const indexOfLastRealization = currentRealizationsPage * realizationsPerPage;
    const indexOfFirstRealization = indexOfLastRealization - realizationsPerPage;
    const currentRealizations = realisations.slice(indexOfFirstRealization, indexOfLastRealization);

    const totalPages = Math.ceil(realisations.length / realizationsPerPage);

    const paginate = (pageNumber) => setCurrentRealizationsPage(pageNumber);

    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Tâches Terminées</h2>
        <div className="space-y-3 text-left"> 
          {currentRealizations.map((real, index) => ( 
            <div key={real.id || real.timestamp + real.nomParticipant + index} 
                 className="bg-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg border border-blue-100"> 
              <div className="flex-1 min-w-0 mb-2 sm:mb-0"> 
                  <h4 className="text-secondary text-base sm:text-xl font-extrabold leading-tight mb-1">
                      {real.nomTacheEffectuee} 
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-lightText">
                      <span>par <strong className="text-text">{real.nomParticipant}</strong></span> 
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryClasses(real.categorieTache)}`}> 
                          {real.categorieTache || 'Non catégorisé'}
                      </span>
                      <span>le {new Date(real.timestamp).toLocaleDateString('fr-FR')} à {new Date(real.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span> 
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0"> 
                {currentUser && ( 
                  <button
                    onClick={() => handleReportClick(real)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs flex-shrink-0"
                  >
                    Signaler
                  </button>
                )}
                <button
                  onClick={() => {
                    setTaskHistoryTaskId(real.taskId);
                    setShowTaskHistoryModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs flex-shrink-0"
                >
                  Historique
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => paginate(currentRealizationsPage - 1)}
              disabled={currentRealizationsPage === 1}
              className="bg-primary hover:bg-secondary text-white font-semibold py-1.5 px-3 rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Précédent
            </button>
            <span className="text-text text-sm font-semibold">
              Page {currentRealizationsPage} sur {totalPages}
            </span>
            <button
              onClick={() => paginate(currentRealizationsPage + 1)}
              disabled={currentRealizationsPage === totalPages}
              className="bg-primary hover:bg-secondary text-white font-semibold py-1.5 px-3 rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Suivant
            </button>
          </div>
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

  const renderThankYouPopup = () => {
    if (!showThankYouPopup) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4"> 
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
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4"> 
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Confirmer la Tâche</h3> 
          <p className="text-base sm:text-lg mb-4">Tâche: <strong className="text-text">{selectedTask.Nom_Tache}</strong> (<span className="font-semibold text-primary">{selectedTask.Calculated_Points} points</span>)</p>
          
          <label htmlFor="participantName" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Validé par:</label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            readOnly={true} 
            disabled={true} 
            autoFocus
          />
          <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end"> 
            <button 
              onClick={() => recordTask(selectedTask.ID_Tache)} 
              disabled={loading || !currentUser} 
              className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
            >
              {loading ? 'Soumission...' : 'Valider la Tâche'} 
            </button>
            <button 
              onClick={() => { setSelectedTask(null); setParticipantName(currentUser?.displayName || currentUser?.email || ''); }} 
              disabled={loading}
              className="w-full sm:w-auto bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg 
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
      setParticipantName(currentUser?.displayName || currentUser?.email || ''); 
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4"> 
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
              <div className="space-y-3 mb-6 text-left max-h-60 overflow-y-auto p-2 border rounded-md bg-gray-50 custom-scrollbar"> 
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

          <label htmlFor="participantNameSplit" className="block text-text text-left font-medium mb-2 text-sm sm:text-base">Validé par:</label>
          <input
            id="participantNameSplit"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full p-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            readOnly={true} 
            disabled={true} 
            autoFocus
          />

          <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end"> 
            <button
              onClick={recordMultipleTasks}
              disabled={loading || selectedSubTasks.length === 0 || !currentUser}
              className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm"
            >
              {loading ? 'Soumission...' : 'Valider les Tâches Sélectionnées'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
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

    const participantCumulativePoints = selectedParticipantProfile.totalCumulativePoints || 0; 
    const engagementPercentage = totalGlobalCumulativePoints > 0 
      ? ((participantCumulativePoints / totalGlobalCumulativePoints) * 100).toFixed(2) 
      : 0;

    const participantBadges = getParticipantBadges(selectedParticipantProfile);
    const { level, xpNeededForNextLevel } = calculateLevelAndXP(selectedParticipantProfile.xp || 0); // Utilise selectedParticipantProfile.xp
    const xpProgress = xpNeededForNextLevel > 0 ? ((selectedParticipantProfile.xp || 0) / xpNeededForNextLevel) * 100 : 0;


    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl text-center mb-6 sm:mb-8"> 
        <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-6">Profil de {selectedParticipantProfile.displayName || selectedParticipantProfile.email}</h2> 
        <div className="mb-6 p-4 bg-neutralBg rounded-xl shadow-inner"> 
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">{selectedParticipantProfile.avatar || '👤'}</span> {/* Utilise selectedParticipantProfile.avatar */}
            <div className="text-left">
              <p className="text-lg sm:text-xl font-semibold text-text">
                Niveau: <span className="text-primary font-bold">{level}</span>
              </p>
              <p className="text-base sm:text-lg text-lightText">
                XP: <span className="font-bold">{selectedParticipantProfile.xp || 0}</span> / {xpNeededForNextLevel}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="h-2 rounded-full bg-primary" 
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-text">
            Score d'Engagement Global: <span className="text-primary font-bold">{engagementPercentage}%</span>
          </p>
          <p className="text-base sm:text-lg text-lightText mt-2">
            Points Cumulatifs: <span className="font-bold">{participantCumulativePoints}</span>
          </p>
          {currentUser && selectedParticipantProfile.id === currentUser.uid && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowProfileEditOptionsModal(true)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded-md transition duration-300 text-sm flex items-center gap-1"
              >
                ✏️ Modifier le Profil
              </button>
            </div>
          )}
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
        confirmButtonClass="bg-error hover:bg-red-700" 
        cancelText="Non, Annuler"
        onConfirm={resetWeeklyPoints}
        onCancel={() => setShowConfirmResetModal(false)}
        loading={loading}
      />
    );
  };

  const renderConfirmResetRealisationsModal = () => {
    if (!showConfirmResetRealisationsModal) return null;

    return (
      <ConfirmActionModal
        title="Confirmer la Réinitialisation des Réalisations"
        message="Êtes-vous sûr de vouloir supprimer TOUTES les réalisations et réinitialiser TOUS les points des utilisateurs à zéro ? Cette action est irréversible et supprime l'historique des tâches terminées."
        confirmText="Oui, Réinitialiser Tout"
        confirmButtonClass="bg-red-600 hover:bg-red-700" 
        cancelText="Non, Annuler"
        onConfirm={resetRealisations}
        onCancel={() => setShowConfirmResetRealisationsModal(false)}
        loading={loading}
      />
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || taskToDelete === null) return null; // Vérifie explicitement null

    return (
      <ConfirmActionModal
        title="Confirmer la Suppression"
        message={`Êtes-vous sûr de vouloir supprimer la tâche avec l'ID "${taskToDelete}" ? Cette action est irréversible.`}
        confirmText="Oui, Supprimer"
        confirmButtonClass="bg-error hover:bg-red-700" 
        cancelText="Non, Annuler"
        onConfirm={() => handleDeleteTask(taskToDelete, true)} 
        onCancel={() => { setShowDeleteConfirmModal(false); setTaskToDelete(null); }}
        loading={loading}
      />
    );
  };

  const renderDeleteObjectiveConfirmModal = () => {
    if (!showDeleteObjectiveConfirmModal || objectiveToDelete === null) return null; // Vérifie explicitement null

    return (
      <ConfirmActionModal
        title="Confirmer la Suppression de l'Objectif"
        message={`Êtes-vous sûr de vouloir supprimer l'objectif avec l'ID "${objectiveToDelete}" ? Cette action est irréversible.`}
        confirmText="Oui, Supprimer"
        confirmButtonClass="bg-error hover:bg-red-700" 
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
        // Convertir Date_Mise_A_Jour en format lisible si nécessaire, ou laisser tel quel
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
        // Convertir timestamp en format lisible si nécessaire
        timestamp: r.timestamp ? new Date(r.timestamp).toLocaleString('fr-FR') : '' 
    }));
    exportToCsv('realisations_clean_app.csv', dataToExport, headers);
    setShowExportSelectionModal(false); 
  }, [realisations]); 

  const renderAdminObjectivesListModal = useCallback(() => {
    if (!showAdminObjectivesListModal) return null;

    return (
      <ListAndInfoModal title="Gestion des Objectifs" onClose={() => setShowAdminObjectivesListModal(false)} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
        <button
          onClick={() => {
            setShowAdminObjectivesListModal(false); // Ferme la liste avant d'ouvrir le formulaire
            setEditingObjective(null);
            setNewObjectiveData({ 
              ID_Objectif: '', Nom_Objectif: '', Description_Objectif: '', Cible_Points: '',
              Type_Cible: 'Cumulatif', Categorie_Cible: '', Points_Actuels: 0, Est_Atteint: false
            });
            setShowAdminObjectiveFormModal(true); 
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 w-full mb-4 text-sm" 
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
                        setShowAdminObjectivesListModal(false); // Ferme la liste avant d'ouvrir le formulaire
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
  }, [loading, objectives, handleDeleteObjective, setShowAdminObjectivesListModal, setNewObjectiveData, setEditingObjective, setShowAdminObjectiveFormModal, showAdminObjectivesListModal]); 

  const renderAdminTasksListModal = useCallback(() => {
    if (!showAdminTasksListModal) return null;

    return (
      <ListAndInfoModal title="Gestion des Tâches" onClose={() => setShowAdminTasksListModal(false)} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
        <button
          onClick={() => { 
            setShowAdminTasksListModal(false); // Ferme la liste avant d'ouvrir le formulaire
            setEditingTask(null); 
            setNewTaskData({ 
              ID_Tache: '', Nom_Tache: '', Description: '', Points: '', Frequence: 'Hebdomadaire', 
              Urgence: 'Faible', Categorie: 'Tous', Sous_Taches_IDs: '', Parent_Task_ID: ''
            }); 
            setShowAdminTaskFormModal(true); 
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 w-full mb-4 text-sm" 
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
                        setShowAdminTasksListModal(false); // Ferme la liste avant d'ouvrir le formulaire
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
  }, [loading, allRawTaches, handleDeleteTask, setShowAdminTasksListModal, setNewTaskData, setEditingTask, setShowAdminTaskFormModal, showAdminTasksListModal]); 

  const renderGlobalDataViewModal = useCallback(() => {
    if (!showGlobalDataViewModal) return null;

    const collectionsList = [
      { name: 'users', label: 'Utilisateurs' },
      { name: 'tasks', label: 'Tâches' },
      { name: 'realizations', label: 'Réalisations' },
      { name: 'objectives', label: 'Objectifs' },
      { name: 'historical_podiums', label: 'Podiums Historiques' },
      { name: 'congratulatory_messages', label: 'Messages de Félicitations' },
      { name: 'reports', label: 'Rapports' },
      { name: 'chat_messages', label: 'Messages de Chat' }, 
    ];

    return (
      <ListAndInfoModal
        title="Vision Globale de la Base de Données"
        onClose={() => {
          setShowGlobalDataViewModal(false);
          setSelectedGlobalCollection(null);
          setGlobalCollectionDocs([]);
          setSelectedDocumentDetails(null);
        }}
        sizeClass="max-w-full sm:max-w-xl md:max-w-2xl"
      >
        {!selectedGlobalCollection ? (
          <div className="space-y-3">
            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">Sélectionnez une Collection</h4>
            <div className="grid grid-cols-2 gap-3">
              {collectionsList.map(col => (
                <button
                  key={col.name}
                  onClick={() => {
                    setSelectedGlobalCollection(col.name);
                    fetchGlobalCollectionDocs(col.name);
                  }}
                  className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">Documents de la Collection "{selectedGlobalCollection}"</h4>
            <button
              onClick={() => {
                setSelectedGlobalCollection(null);
                setGlobalCollectionDocs([]);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs mb-4"
            >
              ← Retour aux Collections
            </button>
            {loadingGlobalCollectionDocs ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                <p className="ml-3 text-lightText">Chargement des documents...</p>
              </div>
            ) : (
              globalCollectionDocs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {globalCollectionDocs.map(doc => (
                    <div key={doc.id} className="bg-white rounded-lg p-3 shadow-sm border border-neutralBg/50 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text text-sm truncate">ID: {doc.id}</p>
                        <p className="text-xs text-lightText truncate">{JSON.stringify(doc).substring(0, 100)}...</p>
                      </div>
                      <button
                        onClick={() => setSelectedDocumentDetails(doc)}
                        className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs ml-2 flex-shrink-0"
                      >
                        Voir Détails
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-lightText text-lg">Aucun document dans cette collection.</p>
              )
            )}
          </div>
        )}
      </ListAndInfoModal>
    );
  }, [showGlobalDataViewModal, selectedGlobalCollection, globalCollectionDocs, loadingGlobalCollectionDocs, fetchGlobalCollectionDocs]);

  const renderDocumentDetailsModal = useCallback(() => {
    if (!selectedDocumentDetails) return null;
    return (
      <ListAndInfoModal
        title={`Détails du Document: ${selectedDocumentDetails.id}`}
        onClose={() => setSelectedDocumentDetails(null)}
        sizeClass="max-w-full sm:max-w-md md:max-w-lg"
      >
        <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words w-full max-h-[70vh] overflow-y-auto custom-scrollbar">
          {JSON.stringify(selectedDocumentDetails, null, 2)}
        </pre>
      </ListAndInfoModal>
    );
  }, [selectedDocumentDetails]);


  const renderAdminPanel = () => {
    if (!isAdmin) {
      return null; 
    }

    const adminPurpleButtonClasses = "bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm";
    const adminBlueButtonClasses = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"; 
    const subtleAdminButtonClasses = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs";


    return (
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-6 text-center">Panneau d'Administration</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-neutralBg rounded-xl p-4 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                  onClick={() => setShowAdminObjectivesListModal(true)}
                  className={`${adminPurpleButtonClasses} col-span-1`} 
              >
                  Gérer les Objectifs
              </button>
              <button
                  onClick={() => setShowAdminTasksListModal(true)}
                  className={`${adminPurpleButtonClasses} col-span-1`} 
              >
                  Gérer les Tâches
              </button>
            </div>
          </div>

          <div className="bg-neutralBg rounded-xl p-4 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowAdminUserManagementModal(true)} 
                className={`${adminBlueButtonClasses} col-span-1`} 
              >
                Gérer les Utilisateurs
              </button>
              <button
                onClick={() => setShowAdminCongratulatoryMessagesModal(true)} 
                className={`${adminBlueButtonClasses} col-span-1`} 
              >
                Gérer les Messages de Félicitation
              </button>
            </div>
          </div>

          <div className="bg-neutralBg/50 rounded-xl p-3 shadow-inner border border-gray-200"> 
            <h3 className="text-base font-bold text-primary mb-3 text-center">Outils Avancés</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"> 
              <button
                onClick={() => setShowGlobalDataViewModal(true)} 
                className={`${subtleAdminButtonClasses} col-span-1`}
              >
                Vision Globale de la BDD
              </button>
              <button
                onClick={() => setShowExportSelectionModal(true)}
                className={`${subtleAdminButtonClasses} col-span-1`}
              >
                Exporter les Données (CSV)
              </button>
              <button
                onClick={() => setShowConfirmResetModal(true)}
                className={`bg-error/80 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs sm:text-sm col-span-1`} 
              >
                Réinitialiser les Points Hebdomadaires
              </button>
              <button
                onClick={() => setShowConfirmResetRealisationsModal(true)} 
                className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs sm:text-sm col-span-1`} 
              >
                Réinitialiser les Réalisations
              </button>
            </div>
          </div>
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

  if (loadingUser) { 
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"> 
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast mb-4 sm:mb-6"></div> 
        <p className="text-xl sm:text-2xl font-semibold text-lightText">Chargement de l'utilisateur...</p> 
      </div>
    );
  }

  // Rendu de l'écran de bienvenue si l'utilisateur n'est pas connecté
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark font-sans p-4 sm:p-6">
        <header className="relative flex flex-col items-center justify-center py-4 sm:py-6 px-4 mb-6 sm:mb-8 text-center">
          <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-3 sm:mb-4 h-20 sm:h-28 md:h-36 w-auto drop-shadow-xl" />
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-secondary drop-shadow-md">Clean App Challenge</h1>
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
        {/* La modale d'authentification est rendue ici, en dehors du bloc conditionnel de l'écran de bienvenue */}
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
        <header className="relative flex flex-col items-center justify-center py-4 sm:py-6 px-4 mb-6 sm:mb-8 text-center"> 
          {showChickEmoji ? (
            <span className="text-7xl sm:text-8xl mb-3 sm:mb-4 cursor-pointer" onClick={handleLogoClick}>🐣</span>
          ) : (
            <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-3 sm:mb-4 h-20 sm:h-28 md:h-36 w-auto drop-shadow-xl cursor-pointer" onClick={handleLogoClick} /> 
          )}
          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-secondary drop-shadow-md">Clean App Challenge</h1> 
          
          {currentUser && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleAuthAction}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1.5 px-3 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-xs whitespace-nowrap"
              >
                Déconnexion
              </button>
            </div>
          )}
        </header>

        <nav className="flex flex-col items-center mb-6 sm:mb-8 px-4"> 
          <div className="bg-neutralBg rounded-full p-1.5 flex flex-row justify-start sm:justify-center gap-4 sm:gap-6 shadow-lg border border-primary/20 flex-nowrap overflow-x-auto w-full max-w-full"> 
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
            {currentUser && (
              <button
                onClick={() => handleParticipantClick({ Nom_Participant: currentUser.displayName || currentUser.email })}
                className={`py-2 px-4 sm:px-6 rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex-shrink-0
                  ${activeMainView === 'participantProfile' ? 'bg-primary text-white shadow-lg' : 'text-text hover:bg-accent hover:text-secondary'}`}
              >
                Mon Profil
              </button>
            )}
            {/* Le bouton de chat est maintenant dans ChatFloatingButton */}
            {isAdmin && (
              <button
                onClick={() => setActiveMainView('adminPanel')}
                className={`py-2 px-4 sm:px-6 rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex-shrink-0
                  ${activeMainView === 'adminPanel' ? 'bg-primary text-white shadow-lg' : 'text-text hover:bg-accent hover:text-secondary'}`}
              >
                Console Admin
              </button>
            )}
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
        </main>
        {/* Modales et popups */}
        {renderTaskDialog()}
        {renderThankYouPopup()} 
        {renderSplitTaskDialog()} 
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
            <ListAndInfoModal title="Objectifs Communs" onClose={() => setShowObjectivesModal(false)} sizeClass="max-w-xs sm:max-w-md"> 
                {renderObjectivesContent()}
            </ListAndInfoModal>
        )}
        {showAdminObjectivesListModal && isAdmin && renderAdminObjectivesListModal()} 
        {showAdminTasksListModal && isAdmin && renderAdminTasksListModal()} 
        {showExportSelectionModal && isAdmin && renderExportSelectionModal()} 
        {showOverallRankingModal && (
          <OverallRankingModal
            classement={classement}
            onClose={() => setShowOverallRankingModal(false)}
            onParticipantClick={handleParticipantClick}
            getParticipantBadges={getParticipantBadges}
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
        {/* La modale d'authentification est rendue ici, en dehors du bloc conditionnel de l'écran de bienvenue */}
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
        {selectedDocumentDetails && isAdmin && renderDocumentDetailsModal()}

        {showWeeklyRecapModal && weeklyRecapData && (
          <WeeklyRecapModal
            recapData={weeklyRecapData}
            onClose={() => setShowWeeklyRecapModal(false)}
          />
        )}

        {showTaskHistoryModal && (
          <TaskHistoryModal
            taskId={taskHistoryTaskId}
            allRealisations={realisations}
            allTasks={allRawTaches}
            onClose={() => {
              setShowTaskHistoryModal(false);
              setTaskHistoryTaskId(null);
            }}
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
                const { error } = await supabase
                  .from('users')
                  .update({ avatar: newAvatar })
                  .eq('id', currentUser.uid); // ou 'user_id' selon ta table

                if (error) throw error;

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
            supabase={supabase} // on transmet supabase pour changer le mot de passe
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
