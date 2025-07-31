// src/UserContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db, auth } from './firebase'; // Importe les instances db et auth initialisées

// Crée le contexte utilisateur
const UserContext = createContext();

// Hook personnalisé pour utiliser le contexte utilisateur
export const useUser = () => useContext(UserContext);

// Fournisseur de contexte utilisateur
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false); // Indique si l'état d'authentification a été vérifié
  const [lastReadChatTimestamp, setLastReadChatTimestamp] = useState(null); // Timestamp de la dernière lecture du chat
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Nombre de messages non lus

  // Écoute les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Utilisateur connecté
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ uid: user.uid, ...userData, displayName: user.displayName || userData.displayName || user.email });
          setIsAdmin(userData.isAdmin || false); // S'assurer qu'isAdmin est un booléen
          setLastReadChatTimestamp(userData.lastReadTimestamp ? new Date(userData.lastReadTimestamp) : null);
        } else {
          // Si l'utilisateur est authentifié mais n'a pas de document Firestore (ex: nouvelle connexion anonyme ou bug)
          // Créer un document utilisateur par défaut
          const defaultUserData = {
            email: user.email || null,
            displayName: user.displayName || user.email?.split('@')[0] || `Utilisateur_${user.uid.substring(0, 6)}`,
            isAdmin: false,
            avatar: '👤',
            photoURL: null,
            weeklyPoints: 0,
            totalCumulativePoints: 0,
            previousWeeklyPoints: 0,
            xp: 0,
            level: 1,
            dateJoined: new Date().toISOString(),
            lastReadTimestamp: new Date().toISOString()
          };
          await setDoc(userDocRef, defaultUserData);
          setCurrentUser({ uid: user.uid, ...defaultUserData });
          setIsAdmin(false);
          setLastReadChatTimestamp(new Date());
          toast.info("Votre profil a été créé.");
        }
      } else {
        // Utilisateur déconnecté
        setCurrentUser(null);
        setIsAdmin(false);
        setLastReadChatTimestamp(null);
      }
      setIsAuthReady(true); // L'état d'authentification initial a été vérifié
    });

    return () => unsubscribeAuth(); // Nettoyage de l'écouteur
  }, []); // Dépendances vides pour n'exécuter qu'une fois au montage

  // Écoute les messages non lus du chat
  useEffect(() => {
    if (!db || !currentUser || !isAuthReady) {
      setUnreadMessagesCount(0);
      return;
    }

    const q = query(
      collection(db, 'chat_messages'),
      where('timestamp', '>', lastReadChatTimestamp || new Date(0)) // Messages après la dernière lecture ou depuis le début des temps
    );

    const unsubscribeChat = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        const message = doc.data();
        // Compte les messages qui ne sont pas de l'utilisateur actuel
        // et qui sont réellement "nouveaux" (timestamp > lastReadChatTimestamp)
        if (message.userId !== currentUser.uid && message.timestamp &&
            (message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp)) > (lastReadChatTimestamp || new Date(0))) {
          count++;
        }
      });
      setUnreadMessagesCount(count);
    }, (error) => {
      console.error("Error fetching unread chat messages:", error);
    });

    return () => unsubscribeChat();
  }, [db, currentUser, isAuthReady, lastReadChatTimestamp]);

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = useCallback(async () => {
    if (currentUser && db) {
      const now = new Date();
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          lastReadTimestamp: now.toISOString()
        });
        setLastReadChatTimestamp(now);
        setUnreadMessagesCount(0); // Réinitialise le compteur après lecture
      } catch (error) {
        console.error("Erreur lors de la mise à jour du timestamp de lecture:", error);
        toast.error("Erreur lors de la mise à jour de l'état de lecture du chat.");
      }
    }
  }, [currentUser, db]);

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // L'onAuthStateChanged gérera la mise à jour de currentUser à null
      toast.info("Vous avez été déconnecté.");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion.");
    }
  };

  // Valeurs fournies par le contexte
  const contextValue = {
    currentUser,
    setCurrentUser, // Permet de mettre à jour l'utilisateur depuis d'autres composants
    isAdmin,
    isAuthReady,
    db, // Fournit l'instance Firestore
    auth, // Fournit l'instance Auth
    signOut,
    unreadMessagesCount,
    markMessagesAsRead
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
