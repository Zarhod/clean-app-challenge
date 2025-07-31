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
// Ajout de la gestion du thème clair/sombre.
// Ajout de la possibilité d'importer une photo en guise d'avatar.
// Ajout de l'option pour ne pas fermer la modale d'ajout de tâche.

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, UserProvider } from './UserContext'; // <-- AJOUT DE USERPROVIDER ICI
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Composants
import AuthModal from './AuthModal';
import AdminLoginButton from './AdminLoginButton';
import AdminTaskFormModal from './AdminTaskFormModal';
import AdminObjectiveFormModal from './AdminObjectiveFormModal';
import AdminUserManagementModal from './AdminUserManagementModal';
import AdminCongratulatoryMessagesModal from './AdminCongratulatoryMessagesModal';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import WeeklyRecapModal from './WeeklyRecapModal';
import HistoricalPodiums from './HistoricalPodiums';
import OverallRankingModal from './OverallRankingModal';
import RankingCard from './RankingCard';
import TaskHistoryModal from './TaskHistoryModal';
import ReportTaskModal from './ReportTaskModal';
import ConfettiOverlay from './ConfettiOverlay';
import ProfileEditOptionsModal from './ProfileEditOptionsModal';
import AvatarSelectionModal from './AvatarSelectionModal';
import PasswordChangeModal from './PasswordChangeModal';
import ChatFloatingButton from './ChatFloatingButton';
import TaskStatisticsChart from './TaskStatisticsChart';
import ExportSelectionModal from './ExportSelectionModal'; // <-- AJOUT DE CET IMPORT

// Fonction utilitaire pour le téléchargement CSV
const exportToCsv = (filename, rows) => {
  if (!rows || rows.length === 0) {
    toast.warn("Aucune donnée à exporter.");
    return;
  }

  const csvContent = "data:text/csv;charset=utf-8,"
    + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Exportation de ${filename} réussie !`);
};

function AppContent() {
  const { currentUser, isAdmin, loadingUser, db, auth, setCurrentUser } = useUser();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddObjectiveModal, setShowAddObjectiveModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showCongratulatoryMessagesModal, setShowCongratulatoryMessagesModal] = useState(false);
  const [showConfirmDeleteTaskModal, setShowConfirmDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null); // Utilisé aussi pour l'édition
  const [showConfirmDeleteObjectiveModal, setShowConfirmDeleteObjectiveModal] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState(null); // Utilisé aussi pour l'édition
  const [showConfirmDeleteRealisationModal, setShowConfirmDeleteRealisationModal] = useState(false);
  const [realisationToDelete, setRealisationToDelete] = useState(null);
  const [showConfirmResetWeeklyPointsModal, setShowConfirmResetWeeklyPointsModal] = useState(false);
  const [showConfirmResetAllPointsModal, setShowConfirmResetAllPointsModal] = useState(false);
  const [showWeeklyRecapModal, setShowWeeklyRecapModal] = useState(false);
  const [weeklyRecapData, setWeeklyRecapData] = useState(null);
  const [showHistoricalPodiumsModal, setShowHistoricalPodiumsModal] = useState(false);
  const [historicalPodiums, setHistoricalPodiums] = useState([]);
  const [showOverallRankingModal, setShowOverallRankingModal] = useState(false);
  const [showExportSelectionModal, setShowExportSelectionModal] = useState(false);
  const [showTaskHistoryModal, setShowTaskHistoryModal] = useState(false);
  const [selectedTaskIdForHistory, setSelectedTaskIdForHistory] = useState(null);
  const [showReportTaskModal, setShowReportTaskModal] = useState(false);
  const [reportedTaskDetails, setReportedTaskDetails] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showProfileEditOptionsModal, setShowProfileEditOptionsModal] = useState(false);
  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // États pour les données Firestore
  const [tasks, setTasks] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [realisations, setRealisations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // État pour le thème (clair par défaut)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Effet pour appliquer la classe de thème au body et sauvegarder dans localStorage
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Listeners Firestore
  useEffect(() => {
    if (!db) return;

    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingData(false);
    }, (error) => {
      console.error("Erreur lors du chargement des tâches:", error);
      // toast.error("Erreur de chargement des tâches."); // Désactivé pour éviter les toasts sur la page de connexion
      setLoadingData(false);
    });

    const unsubscribeObjectives = onSnapshot(collection(db, 'objectives'), (snapshot) => {
      setObjectives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Erreur lors du chargement des objectifs:", error);
      // toast.error("Erreur de chargement des objectifs.");
    });

    const unsubscribeRealisations = onSnapshot(collection(db, 'realizations'), (snapshot) => {
      setRealisations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Erreur lors du chargement des réalisations:", error);
      // toast.error("Erreur de chargement des réalisations.");
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      // toast.error("Erreur de chargement des utilisateurs.");
    });

    const unsubscribePodiums = onSnapshot(collection(db, 'historical_podiums'), (snapshot) => {
      setHistoricalPodiums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Erreur lors du chargement des podiums historiques:", error);
      // toast.error("Erreur de chargement des podiums historiques.");
    });


    return () => {
      unsubscribeTasks();
      unsubscribeObjectives();
      unsubscribeRealisations();
      unsubscribeUsers();
      unsubscribePodiums();
    };
  }, [db]); // Dépendance à db pour s'assurer qu'il est initialisé

  // Calcul des points hebdomadaires et cumulatifs
  const calculateLeaderboard = useCallback(() => {
    const leaderboard = users.map(user => {
      const userRealisations = realisations.filter(real => real.userId === user.uid);

      const weeklyPoints = userRealisations
        .filter(real => {
          const realDate = new Date(real.timestamp);
          const today = new Date();
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Dimanche
          return realDate >= startOfWeek;
        })
        .reduce((sum, real) => sum + (parseFloat(real.pointsGagnes) || 0), 0);

      const totalCumulativePoints = userRealisations.reduce((sum, real) => sum + (parseFloat(real.pointsGagnes) || 0), 0);

      const xp = userRealisations.reduce((sum, real) => sum + (parseFloat(real.pointsGagnes) || 0), 0); // XP = points gagnés
      const level = Math.floor(xp / 100) + 1; // 100 XP par niveau

      return {
        Nom_Participant: user.displayName,
        Avatar: user.avatar,
        PhotoURL: user.photoURL, // Ajout de PhotoURL
        ID_Utilisateur: user.uid,
        Points_Total_Semaine_Courante: weeklyPoints,
        Points_Total_Cumulatif: totalCumulativePoints,
        XP: xp,
        Level: level,
        isAdmin: user.isAdmin,
        lastReadTimestamp: user.lastReadTimestamp,
        dateJoined: user.dateJoined
      };
    }).sort((a, b) => b.Points_Total_Semaine_Courante - a.Points_Total_Semaine_Courante);

    return leaderboard;
  }, [users, realisations]);

  const leaderboard = calculateLeaderboard();

  // Fonction pour calculer le récapitulatif hebdomadaire
  const calculateWeeklyRecap = useCallback(() => {
    if (!currentUser || !realisations || realisations.length === 0) {
      return null;
    }

    const today = new Date();
    const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

    // Calculate the start and end of the *previous* week
    const prevWeekEndDate = new Date(today);
    prevWeekEndDate.setDate(today.getDate() - currentDay - 1); // Go to last Saturday
    prevWeekEndDate.setHours(23, 59, 59, 999);

    const prevWeekStartDate = new Date(prevWeekEndDate);
    prevWeekStartDate.setDate(prevWeekEndDate.getDate() - 6); // Go back 6 days to Sunday
    prevWeekStartDate.setHours(0, 0, 0, 0);

    const userRealisationsPrevWeek = realisations.filter(real => {
      const realDate = new Date(real.timestamp);
      return real.userId === currentUser.uid && realDate >= prevWeekStartDate && realDate <= prevWeekEndDate;
    });

    const pointsGained = userRealisationsPrevWeek.reduce((sum, real) => sum + (parseFloat(real.pointsGagnes) || 0), 0);
    const tasksCompleted = userRealisationsPrevWeek.map(real => {
      const task = tasks.find(t => String(t.ID_Tache) === String(real.taskId));
      return task ? task.Nom_Tache : 'Tâche inconnue';
    });

    // Determine if the user was the winner of the previous week
    // This requires calculating the leaderboard for the previous week's data
    const previousWeekLeaderboard = users.map(user => {
      const userRealisationsPrevWeekForLeaderboard = realisations.filter(real => {
        const realDate = new Date(real.timestamp);
        return real.userId === user.uid && realDate >= prevWeekStartDate && realDate <= prevWeekEndDate;
      });
      const points = userRealisationsPrevWeekForLeaderboard.reduce((sum, real) => sum + (parseFloat(real.pointsGagnes) || 0), 0);
      return { userId: user.uid, points: points };
    }).sort((a, b) => b.points - a.points);

    const isWinner = previousWeekLeaderboard.length > 0 && previousWeekLeaderboard[0].userId === currentUser.uid && previousWeekLeaderboard[0].points > 0;

    return {
      displayName: currentUser.displayName || currentUser.email,
      startDate: prevWeekStartDate.toLocaleDateString('fr-FR'),
      endDate: prevWeekEndDate.toLocaleDateString('fr-FR'),
      pointsGained,
      tasksCompleted,
      isWinner
    };
  }, [currentUser, realisations, users, tasks]); // Ajout de 'tasks' aux dépendances

  // Fonction pour vérifier et afficher le récapitulatif hebdomadaire au chargement
  useEffect(() => {
    if (!currentUser || !db) return;

    const checkAndShowRecap = async () => {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      const today = new Date();
      const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

      // Define Sunday as the day to show the recap (e.g., end of week)
      const recapDisplayDay = 0; // Sunday

      if (currentDay === recapDisplayDay) {
        // Calculate the start and end of the *previous* week
        const prevWeekEndDate = new Date(today);
        prevWeekEndDate.setDate(today.getDate() - 1); // Go to last Saturday
        prevWeekEndDate.setHours(23, 59, 59, 999);

        const prevWeekStartDate = new Date(prevWeekEndDate);
        prevWeekStartDate.setDate(prevWeekEndDate.getDate() - 6); // Go back 6 days to Sunday
        prevWeekStartDate.setHours(0, 0, 0, 0);

        const lastRecapShownDate = userData?.lastRecapShownDate ? new Date(userData.lastRecapShownDate) : null;

        // Check if recap for the previous week has NOT been shown yet
        // Compare by date string to avoid timezone issues for "same day" check
        if (!lastRecapShownDate || lastRecapShownDate.toLocaleDateString('fr-FR') !== prevWeekEndDate.toLocaleDateString('fr-FR')) {
          const recap = calculateWeeklyRecap();
          if (recap && recap.pointsGained > 0) { // Show recap only if points were gained
            setWeeklyRecapData(recap);
            setShowWeeklyRecapModal(true);
            // Update lastRecapShownDate in Firestore
            await updateDoc(userDocRef, {
              lastRecapShownDate: prevWeekEndDate.toISOString()
            });
            // Also update the local currentUser context
            setCurrentUser(prevUser => ({ ...prevUser, lastRecapShownDate: prevWeekEndDate.toISOString() }));

            // Save podium if user was winner
            if (recap.isWinner) {
              const currentPodium = leaderboard
                .filter(p => p.Points_Total_Semaine_Courante > 0)
                .slice(0, 3) // Top 3
                .map(p => ({
                  name: p.Nom_Participant,
                  points: p.Points_Total_Semaine_Courante
                }));

              if (currentPodium.length > 0) {
                await addDoc(collection(db, 'historical_podiums'), {
                  Date_Podium: prevWeekEndDate.toISOString(),
                  top3: currentPodium
                });
                toast.success("Podium hebdomadaire enregistré !");
              }
            }
          }
        }
      }
    };

    // Only run this check if user data is loaded and not loading
    if (currentUser && !loadingUser && db) {
      checkAndShowRecap();
    }
  }, [currentUser, loadingUser, db, calculateWeeklyRecap, leaderboard, setCurrentUser]);


  // Fonctions de gestion des tâches
  const handleAddTask = async (newTaskData) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      await addDoc(collection(db, 'tasks'), newTaskData);
      toast.success('Tâche ajoutée avec succès !');
      return true; // Indique le succès
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la tâche.');
      console.error('Error adding task:', error);
      return false; // Indique l'échec
    }
  };

  const handleUpdateTask = async (taskId, updatedTaskData) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updatedTaskData);
      toast.success('Tâche mise à jour avec succès !');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la tâche.');
      console.error('Error updating task:', error);
      return false;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      toast.success('Tâche supprimée avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la tâche.');
      console.error('Error deleting task:', error);
    } finally {
      setShowConfirmDeleteTaskModal(false);
      setTaskToDelete(null);
    }
  };

  // Fonctions de gestion des objectifs
  const handleAddObjective = async (newObjectiveData) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      await addDoc(collection(db, 'objectives'), newObjectiveData);
      toast.success('Objectif ajouté avec succès !');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'objectif.');
      console.error('Error adding objective:', error);
    }
  };

  const handleUpdateObjective = async (objectiveId, updatedObjectiveData) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const objectiveRef = doc(db, 'objectives', objectiveId);
      await updateDoc(objectiveRef, updatedObjectiveData);
      toast.success('Objectif mis à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'objectif.');
      console.error('Error updating objective:', error);
    }
  };

  const handleDeleteObjective = async (objectiveId) => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const objectiveRef = doc(db, 'objectives', objectiveId);
      await deleteDoc(objectiveRef);
      toast.success('Objectif supprimé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'objectif.');
      console.error('Error deleting objective:', error);
    } finally {
      setShowConfirmDeleteObjectiveModal(false);
      setObjectiveToDelete(null);
    }
  };

  // Fonction pour marquer une tâche comme réalisée
  const handleTaskRealized = async (task) => {
    if (!currentUser || !db) {
      toast.error("Vous devez être connecté pour réaliser une tâche.");
      return;
    }

    try {
      const realizationData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        taskId: task.id,
        nomTache: task.Nom_Tache,
        pointsGagnes: task.Points,
        categorieTache: task.Categorie,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'realizations'), realizationData);

      // Mettre à jour les points de l'utilisateur
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const newWeeklyPoints = (userData.weeklyPoints || 0) + (parseFloat(task.Points) || 0);
      const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + (parseFloat(task.Points) || 0);
      const newXP = (userData.xp || 0) + (parseFloat(task.Points) || 0);
      const newLevel = Math.floor(newXP / 100) + 1; // 100 XP par niveau

      await updateDoc(userRef, {
        weeklyPoints: newWeeklyPoints,
        totalCumulativePoints: newTotalCumulativePoints,
        xp: newXP,
        level: newLevel,
      });

      toast.success(`Tâche "${task.Nom_Tache}" réalisée ! +${task.Points} points.`);
      setShowConfetti(true); // Déclenche les confettis
    } catch (error) {
      toast.error('Erreur lors de la réalisation de la tâche.');
      console.error('Error realizing task:', error);
    }
  };

  // Fonction pour signaler une réalisation (admin seulement)
  const handleReportRealization = async (realisation) => { // <-- CORRECTION DU NOM DE LA VARIABLE ICI
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setReportedTaskDetails({
      id: realisation.id,
      name: realisation.nomTache,
      participant: realisation.userName, // <-- CORRECTION ICI
      userId: realisation.userId, // <-- CORRECTION ICI
      points: parseFloat(realisation.pointsGagnes) || 0
    });
    setShowReportTaskModal(true);
  };

  const confirmReportRealization = async () => {
    if (!reportedTaskDetails || !db) {
      toast.error("Détails du signalement manquants.");
      return;
    }

    try {
      // 1. Supprimer la réalisation
      const realRef = doc(db, 'realizations', reportedTaskDetails.id);
      await deleteDoc(realRef);

      // 2. Déduire les points de l'utilisateur
      const userRef = doc(db, 'users', reportedTaskDetails.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const newWeeklyPoints = Math.max(0, (userData.weeklyPoints || 0) - reportedTaskDetails.points);
      const newTotalCumulativePoints = Math.max(0, (userData.totalCumulativePoints || 0) - reportedTaskDetails.points);
      const newXP = Math.max(0, (userData.xp || 0) - reportedTaskDetails.points);
      const newLevel = Math.floor(newXP / 100) + 1;

      await updateDoc(userRef, {
        weeklyPoints: newWeeklyPoints,
        totalCumulativePoints: newTotalCumulativePoints,
        xp: newXP,
        level: newLevel,
      });

      // 3. Ajouter un rapport (optionnel, pour traçabilité)
      await addDoc(collection(db, 'reports'), {
        type: 'realization_reported',
        realizationId: reportedTaskDetails.id,
        reportedBy: currentUser.uid,
        reportedUserName: currentUser.displayName || currentUser.email,
        reportedUserId: reportedTaskDetails.userId,
        reportedUserNameAffected: reportedTaskDetails.participant,
        taskName: reportedTaskDetails.name,
        pointsDeducted: reportedTaskDetails.points,
        timestamp: new Date().toISOString()
      });

      toast.success(`Tâche "${reportedTaskDetails.name}" signalée et points déduits !`);
    } catch (error) {
      toast.error("Erreur lors du signalement de la tâche.");
      console.error("Error reporting realization:", error);
    } finally {
      setShowReportTaskModal(false);
      setReportedTaskDetails(null);
    }
  };

  // Fonctions de gestion de l'admin
  const handleAdminLogin = async (password) => {
    try {
      // Ceci est un exemple TRÈS SIMPLIFIÉ et NON SÉCURISÉ pour un mot de passe admin fixe en frontend.
      // EN PRODUCTION, le mot de passe admin DOIT être vérifié sur un serveur backend sécurisé.
      if (password === "admin123") { // Remplacez par un vrai mécanisme d'authentification admin
        // Simule la connexion admin en mettant à jour le rôle de l'utilisateur actuel
        if (currentUser && db) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { isAdmin: true });
          toast.success("Connecté en tant qu'administrateur !");
        } else {
          toast.error("Veuillez vous connecter normalement d'abord.");
        }
      } else {
        toast.error("Mot de passe admin incorrect.");
      }
    } catch (error) {
      toast.error("Erreur de connexion admin.");
      console.error("Admin login error:", error);
    }
  };

  const handleAdminLogout = async () => {
    try {
      if (currentUser && db) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { isAdmin: false });
        toast.info("Déconnecté du mode administrateur.");
      }
    } catch (error) {
      toast.error("Erreur lors de la déconnexion admin.");
      console.error("Admin logout error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        toast.info("Vous avez été déconnecté.");
        setCurrentUser(null); // S'assurer que le currentUser est null après déconnexion
      }
    } catch (error) {
      toast.error("Erreur lors de la déconnexion.");
      console.error("Logout error:", error);
    }
  };

  const handleResetWeeklyPoints = async () => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const batch = db.batch();
      users.forEach(user => {
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
          previousWeeklyPoints: user.weeklyPoints || 0, // Sauvegarde les points de la semaine passée
          weeklyPoints: 0
        });
      });
      await batch.commit();
      toast.success('Points hebdomadaires réinitialisés pour tous les utilisateurs !');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation des points hebdomadaires.');
      console.error('Error resetting weekly points:', error);
    } finally {
      setShowConfirmResetWeeklyPointsModal(false);
    }
  };

  const handleResetAllPoints = async () => {
    try {
      if (!db) { toast.error("Service de base de données non disponible."); return; }
      const batch = db.batch();
      users.forEach(user => {
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1
        });
      });
      await batch.commit();
      toast.success('Tous les points et XP ont été réinitialisés pour tous les utilisateurs !');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation de tous les points.');
      console.error('Error resetting all points:', error);
    } finally {
      setShowConfirmResetAllPointsModal(false);
    }
  };

  // Fonctions d'export CSV
  const handleExportClassement = () => {
    const classementData = leaderboard.map(p => [
      p.Nom_Participant,
      p.Points_Total_Semaine_Courante,
      p.Points_Total_Cumulatif,
      p.XP,
      p.Level,
      p.isAdmin ? 'Admin' : 'Utilisateur',
      p.dateJoined ? new Date(p.dateJoined).toLocaleDateString('fr-FR') : 'N/A'
    ]);
    const headers = ["Nom Participant", "Points Semaine Courante", "Points Cumulatifs", "XP", "Niveau", "Statut", "Date Inscription"];
    exportToCsv("classement_general.csv", [headers, ...classementData]);
    setShowExportSelectionModal(false);
  };

  const handleExportRealisations = () => {
    const realisationsData = realisations.map(r => [
      r.nomTache,
      r.pointsGagnes,
      r.categorieTache,
      r.userName,
      r.timestamp ? new Date(r.timestamp).toLocaleString('fr-FR') : 'N/A'
    ]);
    const headers = ["Nom Tache", "Points Gagnés", "Catégorie", "Utilisateur", "Date Realisation"];
    exportToCsv("realisations_historique.csv", [headers, ...realisationsData]);
    setShowExportSelectionModal(false);
  };

  // Fonction pour obtenir les badges d'un participant
  const getParticipantBadges = useCallback((participant) => {
    const badges = [];
    if (participant.isAdmin) {
      badges.push({ name: "Admin", icon: "👑", description: "Administrateur de l'application" });
    }
    if (participant.XP >= 500) { // Exemple de badge pour 500 XP
      badges.push({ name: "Expert", icon: "🌟", description: "A atteint 500 XP" });
    }
    if (participant.Level >= 5) { // Exemple de badge pour Niveau 5
      badges.push({ name: "Maître", icon: "🧙‍♂️", description: "A atteint le niveau 5" });
    }
    // Ajoutez d'autres logiques de badges ici
    return badges;
  }, []);

  // Affichage conditionnel
  if (loadingUser || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light to-background-dark text-text transition-colors duration-500">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="mt-4 text-lg font-semibold text-primary">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  // Filtrer les tâches actives (non terminées si applicable, ou toutes si pas de statut)
  const activeTasks = tasks.filter(task => !task.Est_Terminee);
  const activeObjectives = objectives.filter(obj => !obj.Est_Atteint);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background-light to-background-dark text-text transition-colors duration-500 ${theme}`}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative">
        {/* Bouton de connexion/déconnexion et Admin */}
        {!currentUser ? (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
            >
              Connexion / Inscription
            </button>
          </div>
        ) : (
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            {/* Bouton de profil (icône crayon) */}
            <button
              onClick={() => setShowProfileEditOptionsModal(true)}
              className="bg-accent hover:bg-yellow-600 text-white p-2 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-110 text-xl"
              aria-label="Modifier le profil"
            >
              ✏️
            </button>

            {/* Thème sombre/clair slider */}
            <div className="flex items-center space-x-2 bg-neutralBg p-2 rounded-full shadow-inner border border-primary/10">
              <span className="text-xl">☀️</span>
              <label htmlFor="themeToggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="themeToggle"
                  className="sr-only peer"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-xl">🌙</span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
            >
              Déconnexion
            </button>
          </div>
        )}

        {/* Bouton Admin */}
        {currentUser && (
          <AdminLoginButton
            isAdmin={isAdmin}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
          />
        )}

        <header className="text-center py-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary drop-shadow-lg mb-2">
            Clean App Challenge
          </h1>
          <p className="text-lg sm:text-xl text-secondary font-medium">
            Rendez le monde plus propre, une tâche à la fois !
          </p>
        </header>

        {currentUser && (
          <section className="mb-8 bg-card rounded-3xl p-6 shadow-2xl border border-primary/20 animate-fade-in-scale">
            <h2 className="text-3xl font-bold text-primary mb-4 text-center">
              Bienvenue, {currentUser.displayName || currentUser.email} !
            </h2>
            <div className="flex items-center justify-center mb-4">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar de l'utilisateur" className="w-24 h-24 rounded-full object-cover mr-4 border-2 border-primary shadow-md" />
              ) : (
                <span className="text-6xl mr-4">{currentUser.avatar || '👤'}</span>
              )}
              <div>
                <p className="text-xl font-semibold text-text">Niveau: {currentUser.level || 1}</p>
                <p className="text-lg text-lightText">XP: {currentUser.xp || 0}</p>
                <p className="text-lg text-lightText">Points cette semaine: <span className="font-bold text-success">{currentUser.weeklyPoints || 0}</span></p>
                <p className="text-lg text-lightText">Points cumulatifs: <span className="font-bold text-secondary">{currentUser.totalCumulativePoints || 0}</span></p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {getParticipantBadges(currentUser).map(badge => (
                <span key={badge.name} title={badge.description} className="text-2xl cursor-help">
                  {badge.icon}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Section Tâches Actives */}
        <section className="mb-8 bg-card rounded-3xl p-6 shadow-2xl border border-primary/20 animate-fade-in-scale">
          <h2 className="text-3xl font-bold text-primary mb-4 text-center">Tâches Actives</h2>
          {activeTasks.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucune tâche active pour le moment. Revenez plus tard !</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map(task => (
                <div key={task.id} className="bg-neutralBg rounded-xl p-4 shadow-md border border-primary/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-secondary mb-2">{task.Nom_Tache}</h3>
                    <p className="text-lightText text-sm mb-1">Catégorie: {task.Categorie}</p>
                    <p className="text-lightText text-sm mb-1">Points: <span className="font-bold text-success">{task.Points}</span></p>
                    <p className="text-lightText text-sm mb-3">Fréquence: {task.Frequence}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    {currentUser && (
                      <button
                        onClick={() => handleTaskRealized(task)}
                        className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Réaliser
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setShowAddTaskModal(true); setTaskToDelete(task); }} // Réutilise le state taskToDelete pour l'édition
                        className="flex-1 bg-warning hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Modifier
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setTaskToDelete(task.id); setShowConfirmDeleteTaskModal(true); }}
                        className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                    {currentUser && ( // Bouton Historique pour tous les utilisateurs connectés
                      <button
                        onClick={() => { setSelectedTaskIdForHistory(task.id); setShowTaskHistoryModal(true); }}
                        className="flex-1 bg-info hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Historique
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Objectifs Actifs */}
        <section className="mb-8 bg-card rounded-3xl p-6 shadow-2xl border border-primary/20 animate-fade-in-scale">
          <h2 className="text-3xl font-bold text-primary mb-4 text-center">Objectifs Actifs</h2>
          {activeObjectives.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucun objectif actif pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeObjectives.map(objective => (
                <div key={objective.id} className="bg-neutralBg rounded-xl p-4 shadow-md border border-primary/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-secondary mb-2">{objective.Nom_Objectif}</h3>
                    <p className="text-lightText text-sm mb-1">Description: {objective.Description}</p>
                    <p className="text-lightText text-sm mb-1">Date Limite: {objective.Date_Limite ? new Date(objective.Date_Limite).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                      <button
                        onClick={() => { setShowAddObjectiveModal(true); setObjectiveToDelete(objective); }} // Réutilise le state objectiveToDelete pour l'édition
                        className="flex-1 bg-warning hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => { setObjectiveToDelete(objective.id); setShowConfirmDeleteObjectiveModal(true); }}
                        className="flex-1 bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Classement Hebdomadaire */}
        <section className="mb-8 bg-card rounded-3xl p-6 shadow-2xl border border-primary/20 animate-fade-in-scale">
          <h2 className="text-3xl font-bold text-primary mb-4 text-center">Classement Hebdomadaire</h2>
          {leaderboard.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucun classement hebdomadaire disponible pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-3 items-center">
              {leaderboard
                .filter(p => p.Points_Total_Semaine_Courante > 0) // N'affiche que ceux avec des points > 0
                .slice(0, 3) // Affiche uniquement le top 3
                .map((participant, index) => (
                  <RankingCard
                    key={participant.ID_Utilisateur}
                    participant={participant}
                    rank={index + 1}
                    type="weekly"
                    onParticipantClick={() => { /* Pas d'action pour le clic sur le podium */ }}
                    getParticipantBadges={getParticipantBadges}
                  />
                ))}
              {leaderboard.filter(p => p.Points_Total_Semaine_Courante > 0).length > 3 && (
                <button
                  onClick={() => setShowOverallRankingModal(true)}
                  className="mt-4 bg-info hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                >
                  Voir le classement général
                </button>
              )}
            </div>
          )}
        </section>

        {/* Graphique des statistiques des tâches */}
        {currentUser && realisations.length > 0 && tasks.length > 0 && (
          <section className="mb-8 bg-card rounded-3xl p-6 shadow-2xl border border-primary/20 animate-fade-in-scale">
            <TaskStatisticsChart realisations={realisations} allRawTaches={tasks} />
          </section>
        )}


        {/* Modales */}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

        {showAdminPanel && isAdmin && (
          <ListAndInfoModal title="Panneau Administrateur" onClose={() => setShowAdminPanel(false)} sizeClass="max-w-xl">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Ajouter une Tâche
              </button>
              <button
                onClick={() => setShowAddObjectiveModal(true)}
                className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Ajouter un Objectif
              </button>
              <button
                onClick={() => setShowUserManagementModal(true)}
                className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Gérer les Utilisateurs
              </button>
              <button
                onClick={() => setShowCongratulatoryMessagesModal(true)}
                className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Gérer les Messages de Félicitations
              </button>
              <button
                onClick={() => setShowExportSelectionModal(true)}
                className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Exporter les Données CSV
              </button>
              <button
                onClick={() => setShowConfirmResetWeeklyPointsModal(true)}
                className="bg-warning hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Réinitialiser Points Hebdomadaires
              </button>
              <button
                onClick={() => setShowConfirmResetAllPointsModal(true)}
                className="bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Réinitialiser TOUS les Points
              </button>
              <button
                onClick={() => setShowHistoricalPodiumsModal(true)}
                className="bg-info hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Voir Historique des Podiums
              </button>
              {/* Bouton pour signaler une réalisation */}
              <button
                onClick={() => setShowReportTaskModal(true)} // Cette modale est déclenchée par le bouton de signalement sur la tâche
                className="bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
              >
                Signaler une Réalisation (Admin)
              </button>
            </div>
          </ListAndInfoModal>
        )}

        {showAddTaskModal && isAdmin && (
          <AdminTaskFormModal
            taskData={taskToDelete || { Nom_Tache: '', Description: '', Points: 0, Frequence: 'Quotidien', Categorie: '', Parent_Task_ID: '' }}
            onFormChange={(e) => setTaskToDelete(prev => ({ ...prev, [e.target.name]: e.target.value }))}
            onSubmit={async (keepOpen) => {
              const success = taskToDelete && taskToDelete.id
                ? await handleUpdateTask(taskToDelete.id, taskToDelete)
                : await handleAddTask(taskToDelete);
              
              if (success && !keepOpen) {
                setShowAddTaskModal(false);
                setTaskToDelete(null);
              } else if (success && keepOpen) {
                setTaskToDelete({ Nom_Tache: '', Description: '', Points: 0, Frequence: 'Quotidien', Categorie: '', Parent_Task_ID: '' });
              }
            }}
            onClose={() => { setShowAddTaskModal(false); setTaskToDelete(null); }}
            editingTask={taskToDelete && taskToDelete.id}
          />
        )}

        {showAddObjectiveModal && isAdmin && (
          <AdminObjectiveFormModal
            objectiveData={objectiveToDelete || { Nom_Objectif: '', Description: '', Date_Limite: '', Est_Atteint: false }}
            onFormChange={(e) => setObjectiveToDelete(prev => ({ ...prev, [e.target.name]: e.target.value }))}
            onSubmit={async () => {
              if (objectiveToDelete && objectiveToDelete.id) {
                await handleUpdateObjective(objectiveToDelete.id, objectiveToDelete);
              } else {
                await handleAddObjective(objectiveToDelete);
              }
              setShowAddObjectiveModal(false);
              setObjectiveToDelete(null);
            }}
            onClose={() => { setShowAddObjectiveModal(false); setObjectiveToDelete(null); }}
            editingObjective={objectiveToDelete && objectiveToDelete.id}
          />
        )}

        {showUserManagementModal && isAdmin && (
          <AdminUserManagementModal onClose={() => setShowUserManagementModal(false)} realisations={realisations} />
        )}

        {showCongratulatoryMessagesModal && isAdmin && (
          <AdminCongratulatoryMessagesModal onClose={() => setShowCongratulatoryMessagesModal(false)} />
        )}

        {showConfirmDeleteTaskModal && (
          <ConfirmActionModal
            title="Confirmer la Suppression"
            message="Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible."
            confirmText="Oui, Supprimer"
            confirmButtonClass="bg-error hover:bg-red-700"
            cancelText="Non, Annuler"
            onConfirm={() => handleDeleteTask(taskToDelete)}
            onCancel={() => { setShowConfirmDeleteTaskModal(false); setTaskToDelete(null); }}
          />
        )}

        {showConfirmDeleteObjectiveModal && (
          <ConfirmActionModal
            title="Confirmer la Suppression"
            message="Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action est irréversible."
            confirmText="Oui, Supprimer"
            confirmButtonClass="bg-error hover:bg-red-700"
            cancelText="Non, Annuler"
            onConfirm={() => handleDeleteObjective(objectiveToDelete)}
            onCancel={() => { setShowConfirmDeleteObjectiveModal(false); setObjectiveToDelete(null); }}
          />
        )}

        {showConfirmDeleteRealisationModal && (
          <ConfirmActionModal
            title="Confirmer la Suppression"
            message="Êtes-vous sûr de vouloir supprimer cette réalisation ? Cette action est irréversible et retirera les points."
            confirmText="Oui, Supprimer"
            confirmButtonClass="bg-error hover:bg-red-700"
            cancelText="Non, Annuler"
            onConfirm={() => { /* Logique de suppression de réalisation */ }}
            onCancel={() => { setShowConfirmDeleteRealisationModal(false); setRealisationToDelete(null); }}
          />
        )}

        {showConfirmResetWeeklyPointsModal && (
          <ConfirmActionModal
            title="Réinitialiser Points Hebdomadaires"
            message="Êtes-vous sûr de vouloir réinitialiser les points hebdomadaires de TOUS les utilisateurs ? Les points de la semaine passée seront sauvegardés."
            confirmText="Oui, Réinitialiser"
            confirmButtonClass="bg-warning hover:bg-yellow-600"
            cancelText="Non, Annuler"
            onConfirm={handleResetWeeklyPoints}
            onCancel={() => setShowConfirmResetWeeklyPointsModal(false)}
          />
        )}

        {showConfirmResetAllPointsModal && (
          <ConfirmActionModal
            title="Réinitialiser TOUS les Points"
            message="Êtes-vous sûr de vouloir réinitialiser TOUS les points (hebdomadaires et cumulatifs) et l'XP de TOUS les utilisateurs ? Cette action est irréversible."
            confirmText="Oui, Réinitialiser Tout"
            confirmButtonClass="bg-error hover:bg-red-700"
            cancelText="Non, Annuler"
            onConfirm={handleResetAllPoints}
            onCancel={() => setShowConfirmResetAllPointsModal(false)}
          />
        )}

        {showWeeklyRecapModal && weeklyRecapData && (
          <WeeklyRecapModal
            recapData={weeklyRecapData}
            onClose={() => setShowWeeklyRecapModal(false)}
          />
        )}

        {showHistoricalPodiumsModal && (
          <HistoricalPodiums
            historicalPodiums={historicalPodiums}
            onClose={() => setShowHistoricalPodiumsModal(false)}
          >
            {/* Vous pouvez passer le récapitulatif hebdomadaire ici si vous voulez l'afficher au-dessus */}
          </HistoricalPodiums>
        )}

        {showOverallRankingModal && (
          <OverallRankingModal
            classement={leaderboard}
            onClose={() => setShowOverallRankingModal(false)}
            onParticipantClick={() => { /* Gérer le clic sur un participant si nécessaire */ }}
            getParticipantBadges={getParticipantBadges}
          />
        )}

        {showExportSelectionModal && (
          <ExportSelectionModal
            onClose={() => setShowExportSelectionModal(false)}
            onExportClassement={handleExportClassement}
            onExportRealisations={handleExportRealisations}
          />
        )}

        {showTaskHistoryModal && selectedTaskIdForHistory && (
          <TaskHistoryModal
            taskId={selectedTaskIdForHistory}
            allRealisations={realisations}
            allTasks={tasks}
            onClose={() => setShowTaskHistoryModal(false)}
          />
        )}

        {showReportTaskModal && reportedTaskDetails && (
          <ReportTaskModal
            show={showReportTaskModal}
            onClose={() => setShowReportTaskModal(false)}
            onSubmit={confirmReportRealization}
            reportedTaskDetails={reportedTaskDetails}
          />
        )}

        {showConfetti && (
          <ConfettiOverlay
            show={showConfetti}
            onComplete={() => setShowConfetti(false)}
          />
        )}

        {showProfileEditOptionsModal && currentUser && (
          <ProfileEditOptionsModal
            onClose={() => setShowProfileEditOptionsModal(false)}
            onOpenAvatar={() => { setShowProfileEditOptionsModal(false); setShowAvatarSelectionModal(true); }}
            onOpenPassword={() => { setShowProfileEditOptionsModal(false); setShowPasswordChangeModal(true); }}
          />
        )}

        {showAvatarSelectionModal && currentUser && (
          <AvatarSelectionModal
            currentAvatar={currentUser.avatar || '👤'}
            currentPhotoURL={currentUser.photoURL || null}
            onClose={() => setShowAvatarSelectionModal(false)}
            onSave={async ({ newAvatar, newPhotoURL }) => {
              try {
                const updateData = {};
                if (newAvatar !== undefined) updateData.avatar = newAvatar;
                if (newPhotoURL !== undefined) updateData.photoURL = newPhotoURL;

                await updateDoc(doc(db, "users", currentUser.uid), updateData);
                setCurrentUser(prevUser => ({ ...prevUser, ...updateData }));
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
        
        {/* Le bouton flottant du chat est rendu ici */}
        <ChatFloatingButton currentUser={currentUser} db={db} />

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
    <UserProvider> {/* <-- USERPROVIDER EST BIEN ICI */}
      <AppContent />
    </UserProvider>
  );
}

export default App;
