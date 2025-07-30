/* global __firebase_config, __initial_auth_token */
// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

// Initialise l'application Firebase une seule fois au niveau du module
let firebaseAppInstance = null;
let firestoreDbInstance = null;
let firebaseAuthInstance = null;

try {
  const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const firebaseConfig = JSON.parse(rawConfig);

  // Procède à l'initialisation uniquement si la configuration est valide
  // Le code s'attend à ce que __firebase_config soit fournie par l'environnement.
  if (!getApps().length) { // Vérifie si aucune application Firebase n'a été initialisée
    firebaseAppInstance = initializeApp(firebaseConfig);
  } else {
    firebaseAppInstance = getApp(); // Utilise l'application déjà initialisée
  }
  firestoreDbInstance = getFirestore(firebaseAppInstance);
  firebaseAuthInstance = getAuth(firebaseAppInstance);

} catch (error) {
  console.error("Erreur critique lors de l'initialisation de l'application Firebase :", error);
  // S'assure que les instances sont nulles si une erreur se produit pendant cette étape critique
  firebaseAppInstance = null;
  firestoreDbInstance = null;
  firebaseAuthInstance = null;
}

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Utilise directement les instances au niveau du module. Elles sont garanties d'être les mêmes
  // entre les rendus et ne causeront pas de problèmes de réinitialisation.
  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;

  useEffect(() => {
    // Si les instances Firebase ne sont pas disponibles (en raison d'une erreur de configuration), arrête le chargement et retourne
    if (!auth || !db) {
      console.error("Firebase instances are not available. Impossible de procéder à l'authentification.");
      setLoadingUser(false);
      return;
    }

    const setupAuthAndUser = async () => {
      try {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || user.displayName,
                isAdmin: userData.isAdmin || false,
                avatar: userData.avatar || '👤',
                weeklyPoints: userData.weeklyPoints || 0,
                totalCumulativePoints: userData.totalCumulativePoints || 0,
                previousWeeklyPoints: userData.previousWeeklyPoints || 0,
                xp: userData.xp || 0,
                level: userData.level || 1,
                dateJoined: userData.dateJoined || new Date().toISOString(),
                lastReadTimestamp: userData.lastReadTimestamp || null
              });
              setIsAdmin(userData.isAdmin || false);
            } else {
              const newUserData = {
                displayName: user.displayName || user.email.split('@')[0],
                email: user.email,
                isAdmin: false,
                avatar: '👤',
                weeklyPoints: 0,
                totalCumulativePoints: 0,
                previousWeeklyPoints: 0,
                xp: 0,
                level: 1,
                dateJoined: new Date().toISOString(),
                lastReadTimestamp: new Date().toISOString()
              };
              await setDoc(userDocRef, newUserData);
              setCurrentUser({ uid: user.uid, ...newUserData });
              setIsAdmin(false);
            }
          } else {
            setCurrentUser(null);
            setIsAdmin(false);
          }
          setLoadingUser(false);
        });

        return unsubscribeAuth;
      } catch (error) {
        console.error("Erreur de configuration de l'authentification Firebase :", error);
        setLoadingUser(false);
      }
    };

    const cleanup = setupAuthAndUser();
    return () => {
      if (typeof cleanup.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [auth, db]);

  useEffect(() => {
    if (db && currentUser?.uid) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const updatedUserData = docSnap.data();
          setCurrentUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
          }));
          setIsAdmin(updatedUserData.isAdmin || false);
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error("Erreur lors de l'écoute du document utilisateur :", error);
      });
      return () => unsubscribe();
    }
  }, [db, currentUser?.uid]);

  const value = {
    currentUser,
    isAdmin,
    loadingUser,
    db,
    auth,
    setCurrentUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
