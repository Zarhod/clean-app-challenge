// src/App.js
// Version mise à jour pour utiliser Firebase Authentication et Firestore.

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
import AdminLoginButton from './AdminLoginButton'; 
import ChatFloatingButton from './ChatFloatingButton'; 
import ChatModal from './ChatModal'; 
import AvatarSelectionModal from './AvatarSelectionModal'; 
import PasswordChangeModal from './PasswordChangeModal'; 
import ExportSelectionModal from './ExportSelectionModal'; 

import confetti from 'canvas-confetti'; 

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Importations Firebase
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc, onSnapshot, runTransaction, orderBy, limit } from 'firebase/firestore'; 
import { signOut as firebaseSignOut } from 'firebase/auth'; 
import { useUser, UserProvider } from './UserContext'; 

// Nom du fichier logo - assurez-vous que 'logo.png' est dans le dossier 'public' de votre projet
const LOGO_FILENAME = 'logo.png'; 

// Composant principal de l'application (contenu)
function AppContent() {
  const { currentUser, isAdmin, isAuthReady, signOut, unreadMessagesCount, markMessagesAsRead } = useUser();

  const [taches, setTaches] = useState([]);
  const [objectifs, setobjectifs] = useState([]);
  const [realisations, setRealisations] = useState([]);
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReportTaskModal, setShowReportTaskModal] = useState(false);
  const [selectedTaskToReport, setSelectedTaskToReport] = useState(null);
  const [showOverallRankingModal, setShowOverallRankingModal] = useState(false);
  const [showHistoricalPodiumsModal, setShowHistoricalPodiumsModal] = useState(false);
  const [historicalPodiums, setHistoricalPodiums] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showProfileEditOptionsModal, setShowProfileEditOptionsModal] = useState(false);
  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showAdminUserManagementModal, setShowAdminUserManagementModal] = useState(false);
  const [showAdminCongratulatoryMessagesModal, setShowAdminCongratulatoryMessagesModal] = useState(false);
  const [showAdminTaskFormModal, setShowAdminTaskFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAdminObjectiveFormModal, setShowAdminObjectiveFormModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [showGlobalDataViewModal, setShowGlobalDataViewModal] = useState(false);
  const [selectedDocumentDetails, setSelectedDocumentDetails] = useState(null);
  const [weeklyRecapData, setWeeklyRecapData] = useState(null);
  const [showWeeklyRecapModal, setShowWeeklyRecapModal] = useState(false);
  const [congratulatoryMessages, setCongratulatoryMessages] = useState([]);
  const [showCongratulatoryMessage, setShowCongratulatoryMessage] = useState(false);
  const [currentCongratulatoryMessage, setCurrentCongratulatoryMessage] = useState('');
  const [showExportModal, setShowExportModal] = useState(false); // Ajout de l'état pour la modale d'exportation

  // États pour l'Easter Egg (clics sur le logo)
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimerRef = useRef(null);
  const [showChickEmoji, setShowChickEmoji] = useState(false);

  // Récupération des données initiales et écoute des changements
  useEffect(() => {
    if (!db || !isAuthReady) return;

    const unsubscribeTaches = onSnapshot(collection(db, 'taches'), (snapshot) => {
      const fetchedTaches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTaches(fetchedTaches);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast.error("Erreur lors du chargement des tâches.");
    });

    const unsubscribeObjectifs = onSnapshot(collection(db, 'objectifs'), (snapshot) => {
      const fetchedObjectifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setobjectifs(fetchedObjectifs);
    }, (error) => {
      console.error("Error fetching objectives:", error);
      toast.error("Erreur lors du chargement des objectifs.");
    });

    const unsubscribeRealisations = onSnapshot(collection(db, 'realisations'), (snapshot) => {
      const fetchedRealisations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealisations(fetchedRealisations);
    }, (error) => {
      console.error("Error fetching realisations:", error);
      toast.error("Erreur lors du chargement des réalisations.");
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs.");
      setLoading(false);
    });

    const unsubscribePodiums = onSnapshot(collection(db, 'historical_podiums'), (snapshot) => {
      const fetchedPodiums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalPodiums(fetchedPodiums);
    }, (error) => {
      console.error("Error fetching historical podiums:", error);
    });

    const unsubscribeCongratulatoryMessages = onSnapshot(collection(db, 'congratulatory_messages'), (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => doc.data().Texte_Message);
      setCongratulatoryMessages(fetchedMessages);
    }, (error) => {
      console.error("Error fetching congratulatory messages:", error);
    });

    return () => {
      unsubscribeTaches();
      unsubscribeObjectifs();
      unsubscribeRealisations();
      unsubscribeUsers();
      unsubscribePodiums();
      unsubscribeCongratulatoryMessages();
    };
  }, [db, isAuthReady]);

  // Fonction pour afficher un message de félicitation aléatoire
  const triggerCongratulatoryMessage = useCallback(() => {
    if (congratulatoryMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * congratulatoryMessages.length);
      setCurrentCongratulatoryMessage(congratulatoryMessages[randomIndex]);
      setShowCongratulatoryMessage(true);
      setTimeout(() => setShowCongratulatoryMessage(false), 5000); // Message disparaît après 5 secondes
    }
  }, [congratulatoryMessages]);

  // Vérification hebdomadaire et réinitialisation des points
  useEffect(() => {
    if (!db || !isAuthReady || !currentUser || !isAdmin) return; // Seul l'admin gère la réinitialisation

    const checkAndResetWeeklyPoints = async () => {
      const lastResetDocRef = doc(db, 'admin', 'lastWeeklyReset');
      const lastResetSnap = await getDoc(lastResetDocRef);
      const lastResetDate = lastResetSnap.exists() ? new Date(lastResetSnap.data().timestamp) : null;

      const today = new Date();
      // Calculer le début de la semaine actuelle (lundi)
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Lundi
      currentWeekStart.setHours(0, 0, 0, 0);

      if (!lastResetDate || lastResetDate < currentWeekStart) {
        // La dernière réinitialisation est antérieure à cette semaine, ou n'existe pas
        // Il est temps de réinitialiser et d'enregistrer le podium
        console.log("Il est temps de réinitialiser les points hebdomadaires et d'enregistrer le podium.");

        try {
          // 1. Enregistrer le podium de la semaine passée
          const previousWeekEnd = new Date(currentWeekStart);
          previousWeekEnd.setDate(currentWeekStart.getDate() - 1); // Dimanche de la semaine passée
          previousWeekEnd.setHours(23, 59, 59, 999);

          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersWithWeeklyPoints = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            displayName: doc.data().displayName,
            weeklyPoints: doc.data().weeklyPoints || 0,
            avatar: doc.data().avatar || '👤',
            photoURL: doc.data().photoURL || null
          }));

          const sortedUsers = usersWithWeeklyPoints.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
          const top3 = sortedUsers.slice(0, 3).map(user => ({
            displayName: user.displayName,
            points: user.weeklyPoints,
            avatar: user.avatar,
            photoURL: user.photoURL
          }));

          if (top3.length > 0) {
            await addDoc(collection(db, 'historical_podiums'), {
              date: previousWeekEnd.toISOString(),
              winners: top3,
              fullRanking: sortedUsers.map(u => ({ displayName: u.displayName, points: u.weeklyPoints })) // Optionnel: enregistrer le classement complet
            });
            toast.info("Podium hebdomadaire enregistré !");
          }

          // 2. Réinitialiser les points hebdomadaires de tous les utilisateurs
          const batch = db.batch();
          usersSnapshot.docs.forEach(userDoc => {
            const userRef = doc(db, 'users', userDoc.id);
            batch.update(userRef, {
              previousWeeklyPoints: userDoc.data().weeklyPoints || 0, // Sauvegarde les points de la semaine passée
              weeklyPoints: 0
            });
          });
          await batch.commit();

          // 3. Mettre à jour le timestamp de la dernière réinitialisation
          await setDoc(lastResetDocRef, { timestamp: today.toISOString() });
          toast.success("Points hebdomadaires réinitialisés et podium mis à jour !");

          // Afficher le récapitulatif de la semaine passée pour l'utilisateur actuel
          const currentUserWeeklyPoints = usersWithWeeklyPoints.find(u => u.uid === currentUser.uid)?.weeklyPoints || 0;
          const userRankInPreviousWeek = sortedUsers.findIndex(u => u.uid === currentUser.uid) + 1;

          setWeeklyRecapData({
            date: previousWeekEnd.toISOString(),
            topUsers: top3,
            userRank: userRankInPreviousWeek > 0 ? userRankInPreviousWeek : 'N/A',
            userPoints: currentUserWeeklyPoints
          });
          setShowWeeklyRecapModal(true); // Afficher la modale de récapitulatif
        } catch (error) {
          console.error("Erreur lors de la réinitialisation hebdomadaire:", error);
          toast.error("Erreur lors de la réinitialisation hebdomadaire des points.");
        }
      }
    };

    checkAndResetWeeklyPoints();
  }, [db, isAuthReady, currentUser, isAdmin, congratulatoryMessages]); 

  // Fonction pour marquer une tâche comme réalisée
  const handleMarkTaskAsCompleted = useCallback(async (taskId, taskPoints) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast.info("Veuillez vous connecter pour réaliser une tâche.");
      return;
    }
    if (!db) {
      toast.error("Base de données non disponible.");
      return;
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw "Document utilisateur non trouvé!";
        }

        const userData = userDoc.data();
        const newWeeklyPoints = (userData.weeklyPoints || 0) + taskPoints;
        const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + taskPoints;
        const newXp = (userData.xp || 0) + taskPoints;
        let newLevel = userData.level || 1;

        // Logique de leveling (exemple simple : 100 points = 1 niveau)
        while (newXp >= newLevel * 100) { // Chaque niveau nécessite 100 * niveau points
          newLevel++;
          toast.success(`Félicitations, vous avez atteint le niveau ${newLevel - 1} !`);
          triggerCongratulatoryMessage();
        }

        transaction.update(userRef, {
          weeklyPoints: newWeeklyPoints,
          totalCumulativePoints: newTotalCumulativePoints,
          xp: newXp,
          level: newLevel
        });

        // Ajouter une réalisation
        await addDoc(collection(db, 'realisations'), {
          userId: currentUser.uid,
          displayName: currentUser.displayName,
          taskId: taskId,
          taskName: taches.find(t => t.id === taskId)?.Nom_Tache || 'Tâche inconnue',
          pointsGagnes: taskPoints,
          timestamp: new Date().toISOString(),
          statut: 'validée', // ou 'en attente' si validation admin nécessaire
        });
      });

      toast.success("Tâche marquée comme réalisée ! Points ajoutés !");
      setShowConfetti(true); // Déclenche les confettis
    } catch (error) {
      console.error("Erreur lors de la réalisation de la tâche:", error);
      toast.error("Erreur lors de la réalisation de la tâche.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, db, taches, triggerCongratulatoryMessage]);

  // Fonction pour marquer un objectif comme atteint
  const handleMarkObjectiveAsCompleted = useCallback(async (objectiveId, objectivePoints) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast.info("Veuillez vous connecter pour marquer un objectif comme atteint.");
      return;
    }
    if (!db) {
      toast.error("Base de données non disponible.");
      return;
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw "Document utilisateur non trouvé!";
        }

        const userData = userDoc.data();
        const newWeeklyPoints = (userData.weeklyPoints || 0) + objectivePoints;
        const newTotalCumulativePoints = (userData.totalCumulativePoints || 0) + objectivePoints;
        const newXp = (userData.xp || 0) + objectivePoints;
        let newLevel = userData.level || 1;

        while (newXp >= newLevel * 100) {
          newLevel++;
          toast.success(`Félicitations, vous avez atteint le niveau ${newLevel - 1} !`);
          triggerCongratulatoryMessage();
        }

        transaction.update(userRef, {
          weeklyPoints: newWeeklyPoints,
          totalCumulativePoints: newTotalCumulativePoints,
          xp: newXp,
          level: newLevel
        });

        // Marquer l'objectif comme atteint pour l'utilisateur
        const userObjectiveRef = doc(db, 'users', currentUser.uid, 'objectives_completed', objectiveId);
        transaction.set(userObjectiveRef, {
          objectiveId: objectiveId,
          objectiveName: objectifs.find(obj => obj.id === objectiveId)?.Nom_Objectif || 'Objectif inconnu',
          pointsGagnes: objectivePoints,
          timestamp: new Date().toISOString(),
          Est_Atteint: true,
        });
      });

      toast.success("Objectif marqué comme atteint ! Points ajoutés !");
      setShowConfetti(true);
    } catch (error) {
      console.error("Erreur lors de la réalisation de l'objectif:", error);
      toast.error("Erreur lors de la réalisation de l'objectif.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, db, objectifs, triggerCongratulatoryMessage]);

  // Fonction pour ouvrir la modale de signalement
  const handleReportTask = useCallback((taskId, taskName, realisationId = null) => {
    if (!currentUser) {
      setShowAuthModal(true);
      toast.info("Veuillez vous connecter pour signaler une tâche.");
      return;
    }
    setSelectedTaskToReport({ taskId, taskName, realisationId });
    setShowReportTaskModal(true);
  }, [currentUser]);

  // Fonction de connexion admin
  const handleAdminLogin = async (password) => {
    // Ceci est une implémentation simplifiée.
    // En production, un système de gestion d'utilisateurs Firebase avec rôles serait préférable.
    if (password === "admin123") { // Mot de passe admin codé en dur pour l'exemple
      // En production, vous feriez une connexion Firebase ici et vérifieriez le rôle
      toast.success("Connecté en tant qu'administrateur !");
      // Mettre à jour le rôle admin de l'utilisateur actuel dans Firestore
      if (currentUser) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), { isAdmin: true });
        } catch (error) {
          console.error("Erreur lors de la mise à jour du rôle admin:", error);
          toast.error("Erreur lors de l'attribution du rôle admin.");
        }
      }
    } else {
      toast.error("Mot de passe administrateur incorrect.");
    }
  };

  // Fonction de déconnexion admin (qui est la même que la déconnexion utilisateur)
  const handleAdminLogout = async () => {
    await signOut(); // Utilise la fonction signOut du UserContext
  };

  // Fonction pour ouvrir le panneau admin
  const handleOpenAdminPanel = () => {
    setShowAdminPanel(true);
  };

  // Fonction pour ouvrir la modale de gestion des utilisateurs
  const handleOpenAdminUserManagement = () => {
    setShowAdminUserManagementModal(true);
  };

  // Fonction pour ouvrir la modale de gestion des messages de félicitation
  const handleOpenAdminCongratulatoryMessages = () => {
    setShowAdminCongratulatoryMessagesModal(true);
  };

  // Fonctions de gestion des tâches (pour AdminPanel)
  const handleAddTask = () => {
    setEditingTask(null);
    setShowAdminTaskFormModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowAdminTaskFormModal(true);
  };

  const handleDeleteTask = useCallback(async (taskId) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setShowConfirmActionModal(true);
    setActionToConfirm(() => async () => {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'taches', taskId));
        toast.success("Tâche supprimée avec succès !");
      } catch (error) {
        toast.error("Erreur lors de la suppression de la tâche.");
        console.error("Error deleting task:", error);
      } finally {
        setLoading(false);
        setShowConfirmActionModal(false);
        setActionToConfirm(null);
      }
    });
  }, [db, isAdmin]);

  const handleSaveTask = async (taskData) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'taches', editingTask.id), taskData);
        toast.success("Tâche mise à jour avec succès !");
      } else {
        await addDoc(collection(db, 'taches'), taskData);
        toast.success("Tâche ajoutée avec succès !");
      }
      setShowAdminTaskFormModal(false);
      setEditingTask(null);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de la tâche.");
      console.error("Error saving task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de gestion des objectifs (pour AdminPanel)
  const handleAddObjective = () => {
    setEditingObjective(null);
    setShowAdminObjectiveFormModal(true);
  };

  const handleEditObjective = (objective) => {
    setEditingObjective(objective);
    setShowAdminObjectiveFormModal(true);
  };

  const handleDeleteObjective = useCallback(async (objectiveId) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setShowConfirmActionModal(true);
    setActionToConfirm(() => async () => {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'objectifs', objectiveId));
        toast.success("Objectif supprimé avec succès !");
      } catch (error) {
        toast.error("Erreur lors de la suppression de l'objectif.");
        console.error("Error deleting objective:", error);
      } finally {
        setLoading(false);
        setShowConfirmActionModal(false);
        setActionToConfirm(null);
      }
    });
  }, [db, isAdmin]);

  const handleSaveObjective = async (objectiveData) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      if (editingObjective) {
        await updateDoc(doc(db, 'objectifs', editingObjective.id), objectiveData);
        toast.success("Objectif mis à jour avec succès !");
      } else {
        await addDoc(collection(db, 'objectifs'), objectiveData);
        toast.success("Objectif ajouté avec succès !");
      }
      setShowAdminObjectiveFormModal(false);
      setEditingObjective(null);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de l'objectif.");
      console.error("Error saving objective:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher les détails d'un document (utilisée par GlobalDataView)
  const handleViewDocumentDetails = useCallback((document) => {
    setSelectedDocumentDetails(document);
  }, []);

  const handleCloseDocumentDetails = useCallback(() => {
    setSelectedDocumentDetails(null);
  }, []);

  // Fonction pour rendre la modale de vue globale des données
  const renderGlobalDataViewModal = () => {
    const allData = [
      ...taches.map(d => ({ ...d, type: 'Tâche', collection: 'taches' })),
      ...objectifs.map(d => ({ ...d, type: 'Objectif', collection: 'objectifs' })),
      ...realisations.map(d => ({ ...d, type: 'Réalisation', collection: 'realisations' })),
      ...users.map(d => ({ ...d, type: 'Utilisateur', collection: 'users' })),
      ...historicalPodiums.map(d => ({ ...d, type: 'Podium Historique', collection: 'historical_podiums' }))
    ].sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
      return dateB - dateA; // Trie par timestamp décroissant
    });

    return (
      <ListAndInfoModal title="Vue Globale des Données" onClose={() => setShowGlobalDataViewModal(false)} sizeClass="max-w-4xl">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar p-2">
          {allData.length === 0 ? (
            <p className="text-center text-lightText text-md">Aucune donnée disponible.</p>
          ) : (
            allData.map((item, index) => (
              <div key={item.id || index} className="bg-neutralBg rounded-lg p-3 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text text-sm">{item.type}: {item.Nom_Tache || item.Nom_Objectif || item.displayName || item.id}</p>
                  <p className="text-lightText text-xs">ID: {item.ID_Tache || item.ID_Objectif || item.id}</p>
                  {item.timestamp && (
                    <p className="text-lightText text-xs">Date: {new Date(item.timestamp.toDate ? item.timestamp.toDate() : item.timestamp).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <button
                  onClick={() => handleViewDocumentDetails(item)}
                  className="bg-secondary hover:bg-teal-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs"
                >
                  Détails
                </button>
              </div>
            ))
          )}
        </div>
      </ListAndInfoModal>
    );
  };

  // Fonction pour rendre la modale des détails d'un document
  const renderDocumentDetailsModal = () => {
    if (!selectedDocumentDetails) return null;

    return (
      <ListAndInfoModal title="Détails du Document" onClose={handleCloseDocumentDetails} sizeClass="max-w-md">
        <div className="space-y-2 text-text text-sm">
          {Object.entries(selectedDocumentDetails).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start border-b border-gray-100 py-1">
              <span className="font-medium">{key}:</span>
              <span className="text-right ml-2 break-words">
                {typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </ListAndInfoModal>
    );
  };

  // Préparation des données pour TaskStatisticsChart
  const taskChartData = taches.map(task => {
    const completedCount = realisations.filter(r => r.taskId === task.id && r.statut === 'validée').length;
    return {
      name: task.Nom_Tache,
      'Points Gagnés': task.Points_Gagnes,
      'Tâches Réalisées': completedCount,
    };
  });

  // Préparation des données pour OverallRankingModal
  const rankingData = users
    .map(user => ({
      uid: user.id,
      Nom_Participant: user.displayName,
      Total_Points: user.totalCumulativePoints,
      Avatar: user.photoURL || user.avatar,
    }))
    .sort((a, b) => b.Total_Points - a.Total_Points);

  const handleDeleteUser = useCallback(async (userUid) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (userUid === currentUser.uid) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    setShowConfirmActionModal(true);
    setActionToConfirm(() => async () => {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'users', userUid));
        // Optionnel: Supprimer les réalisations associées à cet utilisateur
        const userRealisationsQuery = query(collection(db, 'realisations'), where('userId', '==', userUid));
        const userRealisationsSnapshot = await getDocs(userRealisationsQuery);
        const deletePromises = userRealisationsSnapshot.docs.map(d => deleteDoc(doc(db, 'realisations', d.id)));
        await Promise.all(deletePromises);
        toast.success(`Utilisateur supprimé avec succès !`);
      } catch (error) {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
        console.error("Error deleting user:", error);
      } finally {
        setLoading(false);
        setShowConfirmActionModal(false);
        setActionToConfirm(null);
      }
    });
  }, [db, isAdmin, currentUser]);

  // Fonction de gestion des clics sur le logo pour l'Easter Egg
  const handleLogoClick = () => {
    setLogoClickCount(prevCount => {
      const newCount = prevCount + 1;
      
      if (logoClickTimerRef.current) {
        clearTimeout(logoClickTimerRef.current);
      }
      logoClickTimerRef.current = setTimeout(() => {
        setLogoClickCount(0); // Réinitialise le compteur si pas de clic rapide
      }, 500); // 500ms pour les clics rapides

      if (newCount >= 5) { // Si 5 clics ou plus
        setLogoClickCount(0); // Réinitialise le compteur
        clearTimeout(logoClickTimerRef.current); // Arrête le timer

        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.2, x: 0.5 }, 
          colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#6a0dad', '#800080', '#ffc0cb', '#0000ff'] 
        });

        setShowChickEmoji(true); // Affiche l'emoji poussin
        setTimeout(() => {
          setShowChickEmoji(false); // Cache l'emoji après 20 secondes
        }, 20000); 
      }
      return newCount;
    });
  };


  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light to-background-dark text-white">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-white border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="mt-4 text-lg">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark text-text relative pb-16">
      <AdminLoginButton
        isAdmin={isAdmin}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
      />

      {/* Header */}
      <header className="py-6 px-4 sm:px-6 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-lg text-white text-center rounded-b-3xl relative">
        {showChickEmoji ? (
            <span className="text-7xl sm:text-8xl mb-3 sm:mb-4 cursor-pointer" onClick={handleLogoClick}>🐣</span>
          ) : (
            <img src={`/${LOGO_FILENAME}`} alt="Logo Clean App Challenge" className="mx-auto mb-3 sm:mb-4 h-20 sm:h-28 md:h-36 w-auto drop-shadow-xl cursor-pointer" onClick={handleLogoClick} /> 
          )}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">CleanApp Challenge</h1>
        <p className="text-lg sm:text-xl font-medium opacity-90">Rendez le monde plus propre, gagnez des points !</p>
        {currentUser && (
          <div className="mt-4 flex items-center justify-center space-x-3 bg-white bg-opacity-30 rounded-full py-2 px-4 mx-auto w-fit shadow-inner cursor-pointer"
               onClick={() => setShowProfileEditOptionsModal(true)}>
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <span className="text-3xl leading-none">{currentUser.avatar || '👤'}</span>
            )}
            <span className="font-semibold text-lg">{currentUser.displayName || 'Invité'}</span>
            <span className="text-sm opacity-80">({currentUser.totalCumulativePoints || 0} points)</span>
          </div>
        )}
        {!currentUser && (
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-4 bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Se Connecter / S'inscrire
          </button>
        )}
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {/* Section Tâches */}
        <section className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">Tâches à Réaliser</h2>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-white border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-4 text-white text-lg">Chargement des tâches...</p>
            </div>
          ) : taches.length === 0 ? (
            <p className="text-center text-white text-lg bg-white bg-opacity-20 p-4 rounded-xl shadow-md">Aucune tâche disponible pour le moment. Revenez plus tard !</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taches.filter(t => t.Est_Active).map((tache) => (
                <div key={tache.id} className="bg-card rounded-xl shadow-lg p-5 border border-primary/10 flex flex-col justify-between transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div>
                    <h3 className="text-xl font-bold text-text mb-2">{tache.Nom_Tache}</h3>
                    <p className="text-lightText text-sm mb-3">{tache.Description}</p>
                    <div className="flex items-center text-primary font-semibold text-md mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l2.293 2.293a1 1 0 001.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      {tache.Points_Gagnes} Points
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={() => handleMarkTaskAsCompleted(tache.id, tache.Points_Gagnes)}
                      disabled={loading || !currentUser}
                      className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading && !currentUser ? 'Connexion requise' : 'Réalisé !'}
                    </button>
                    <button
                      onClick={() => handleReportTask(tache.id, tache.Nom_Tache)}
                      disabled={loading || !currentUser}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Signaler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Objectifs */}
        <section className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">Objectifs à Atteindre</h2>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-white border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-4 text-white text-lg">Chargement des objectifs...</p>
            </div>
          ) : objectifs.length === 0 ? (
            <p className="text-center text-white text-lg bg-white bg-opacity-20 p-4 rounded-xl shadow-md">Aucun objectif disponible pour le moment. Revenez plus tard !</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {objectifs.map((objectif) => {
                const progress = (objectif.Progress_Current / objectif.Progress_Target) * 100;
                const isCompleted = objectif.Est_Atteint || progress >= 100;
                const isPastEndDate = new Date() > new Date(objectif.Date_Fin);

                return (
                  <div key={objectif.id} className={`bg-card rounded-xl shadow-lg p-5 border ${isCompleted ? 'border-success/50' : 'border-accent/50'} flex flex-col justify-between transform transition duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                    <div>
                      <h3 className="text-xl font-bold text-text mb-2">{objectif.Nom_Objectif}</h3>
                      <p className="text-lightText text-sm mb-3">{objectif.Description}</p>
                      <div className="flex items-center text-primary font-semibold text-md mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l2.293 2.293a1 1 0 001.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        {objectif.Points_Objectif} Points
                      </div>
                      <p className="text-lightText text-xs mb-3">
                        Du {new Date(objectif.Date_Debut).toLocaleDateString('fr-FR')} au {new Date(objectif.Date_Fin).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                        <div
                          className={`h-2.5 rounded-full ${isCompleted ? 'bg-success' : 'bg-accent'}`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-lightText">{Math.round(progress)}% Atteint</p>
                    </div>
                    <div className="mt-4">
                      {!isCompleted && !isPastEndDate && (
                        <button
                          onClick={() => handleMarkObjectiveAsCompleted(objectif.id, objectif.Points_Objectif)}
                          disabled={loading || !currentUser}
                          className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {loading && !currentUser ? 'Connexion requise' : 'Marquer comme Atteint'}
                        </button>
                      )}
                      {isCompleted && (
                        <p className="text-center text-success font-semibold text-md mt-2">Objectif Atteint !</p>
                      )}
                      {isPastEndDate && !isCompleted && (
                        <p className="text-center text-error font-semibold text-md mt-2">Date limite dépassée.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section Statistiques et Classement */}
        <section className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">Statistiques & Classement</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des statistiques de tâches */}
            <TaskStatisticsChart data={taskChartData} />

            {/* Classement des utilisateurs */}
            <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-primary/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-primary">Top Utilisateurs</h3>
                <button
                  onClick={() => setShowOverallRankingModal(true)}
                  className="bg-primary hover:bg-secondary text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-sm"
                >
                  Voir Tout
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
                  <p className="ml-3 text-lightText">Chargement du classement...</p>
                </div>
              ) : rankingData.length === 0 ? (
                <p className="text-center text-lightText text-md py-4">Aucun utilisateur classé pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {rankingData.slice(0, 5).map((user, index) => (
                    <RankingCard
                      key={user.uid}
                      user={user}
                      rank={index + 1}
                      isCurrentUser={currentUser && user.uid === currentUser.uid}
                      onClick={() => { /* Optionnel: ouvrir un profil utilisateur */ }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bouton pour voir les podiums historiques */}
        <section className="text-center mt-8">
          <button
            onClick={() => setShowHistoricalPodiumsModal(true)}
            className="bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-lg"
          >
            Voir les Podiums Historiques
          </button>
        </section>
      </main>

      {/* Bouton flottant pour le chat */}
      {currentUser && (
        <ChatFloatingButton
          onClick={() => setShowChatModal(true)}
          unreadMessagesCount={unreadMessagesCount}
        />
      )}

      {/* Modales */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showChatModal && <ChatModal onClose={() => setShowChatModal(false)} onMarkMessagesAsRead={markMessagesAsRead} />}
      {showProfileEditOptionsModal && (
        <ProfileEditOptionsModal
          onClose={() => setShowProfileEditOptionsModal(false)}
          onOpenAvatarSelection={() => setShowAvatarSelectionModal(true)}
          onOpenPasswordChange={() => setShowPasswordChangeModal(true)}
        />
      )}
      {showAvatarSelectionModal && <AvatarSelectionModal onClose={() => setShowAvatarSelectionModal(false)} />}
      {showPasswordChangeModal && <PasswordChangeModal onClose={() => setShowPasswordChangeModal(false)} />}

      {showConfirmActionModal && actionToConfirm && (
        <ConfirmActionModal
          title="Confirmer l'action"
          message="Êtes-vous sûr de vouloir effectuer cette action ? Elle est irréversible."
          confirmText="Confirmer"
          cancelText="Annuler"
          onConfirm={actionToConfirm}
          onCancel={() => { setShowConfirmActionModal(false); setActionToConfirm(null); }}
          loading={loading}
        />
      )}

      {showConfetti && <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />}

      {showReportTaskModal && (
        <ReportTaskModal
          onClose={() => setShowReportTaskModal(false)}
          taskDetails={selectedTaskToReport}
        />
      )}

      {showOverallRankingModal && (
        <OverallRankingModal
          onClose={() => setShowOverallRankingModal(false)}
          rankingData={rankingData}
        />
      )}

      {showHistoricalPodiumsModal && (
        <HistoricalPodiums
          onClose={() => setShowHistoricalPodiumsModal(false)}
          historicalPodiums={historicalPodiums}
        />
      )}

      {/* Modales d'administration */}
      {showAdminPanel && isAdmin && (
        <ListAndInfoModal title="Panneau Administrateur" onClose={() => setShowAdminPanel(false)} sizeClass="max-w-xl sm:max-w-2xl md:max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
            <button
              onClick={() => handleAddTask()}
              className="flex-1 bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
            >
              Ajouter Tâche
            </button>
            <button
              onClick={() => handleAddObjective()}
              className="flex-1 bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
            >
              Ajouter Objectif
            </button>
            <button
              onClick={() => setShowAdminUserManagementModal(true)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Gestion Utilisateurs
            </button>
            <button
              onClick={() => setShowAdminCongratulatoryMessagesModal(true)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Messages Félicitation
            </button>
            <button
              onClick={() => setShowGlobalDataViewModal(true)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Voir Toutes les Données
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Exporter Données
            </button>
          </div>

          {/* Affichage des listes de tâches et objectifs pour l'édition/suppression */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-secondary mb-4 text-center">Gérer les Tâches</h4>
              {taches.length === 0 ? (
                <p className="text-center text-lightText text-md">Aucune tâche à gérer.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {taches.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm border border-neutralBg/50">
                      <p className="font-semibold text-text text-sm flex-1 mr-2">{task.Nom_Tache}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="bg-accent hover:bg-orange-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-error hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-secondary mb-4 text-center">Gérer les Objectifs</h4>
              {objectifs.length === 0 ? (
                <p className="text-center text-lightText text-md">Aucun objectif à gérer.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {objectifs.map((objective) => (
                    <div key={objective.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm border border-neutralBg/50">
                      <p className="font-semibold text-text text-sm flex-1 mr-2">{objective.Nom_Objectif}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditObjective(objective)}
                          className="bg-accent hover:bg-orange-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteObjective(objective.id)}
                          className="bg-error hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition duration-300 text-xs"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ListAndInfoModal>
      )}

      {showAdminTaskFormModal && isAdmin && (
        <AdminTaskFormModal
          taskData={editingTask || { ID_Tache: '', Nom_Tache: '', Description: '', Points_Gagnes: 0, Frequence: '', Est_Active: true }}
          onFormChange={(e) => setEditingTask({ ...editingTask, [e.target.name]: e.target.value })}
          onSubmit={handleSaveTask}
          onClose={() => setShowAdminTaskFormModal(false)}
          loading={loading}
          editingTask={editingTask}
        />
      )}

      {showAdminObjectiveFormModal && isAdmin && (
        <AdminObjectiveFormModal
          objectiveData={editingObjective || { ID_Objectif: '', Nom_Objectif: '', Description: '', Points_Objectif: 0, Date_Debut: '', Date_Fin: '', Progress_Current: 0, Progress_Target: 0, Est_Atteint: false }}
          onFormChange={(e) => setEditingObjective({ ...editingObjective, [e.target.name]: e.target.value })}
          onSubmit={handleSaveObjective}
          onClose={() => setShowAdminObjectiveFormModal(false)}
          loading={loading}
          editingObjective={editingObjective}
        />
      )}

      {showAdminUserManagementModal && isAdmin && (
        <AdminUserManagementModal
          onClose={() => setShowAdminUserManagementModal(false)}
          realisations={realisations}
          onUpdateUser={async (uid, data) => {
            try {
              await updateDoc(doc(db, 'users', uid), data);
              toast.success("Utilisateur mis à jour avec succès !");
            } catch (error) {
              console.error("Erreur mise à jour utilisateur:", error);
              toast.error("Erreur lors de la mise à jour de l'utilisateur.");
            }
          }}
          onDeleteUser={handleDeleteUser}
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

      {showExportModal && isAdmin && (
        <ExportSelectionModal
          onClose={() => setShowExportModal(false)}
          allRawTaches={taches}
          allObjectives={objectifs}
          realisations={realisations}
        />
      )}

      {showCongratulatoryMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1001] p-4 animate-fade-in-scale">
          <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
            <h3 className="text-4xl font-extrabold mb-4">Félicitations !</h3>
            <p className="text-xl mb-6">{currentCongratulatoryMessage}</p>
            <button
              onClick={() => setShowCongratulatoryMessage(false)}
              className="bg-white text-primary font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300 hover:scale-105"
            >
              Super !
            </button>
          </div>
        </div>
      )}

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
