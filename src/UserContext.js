/* global __initial_auth_token */
// src/UserContext.js
// Ce fichier est le SEUL responsable de l'initialisation de l'application Firebase
// et de la gestion de l'état d'authentification de l'utilisateur.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Importe la configuration Firebase depuis le fichier firebase.js
// Ce fichier (./firebase) ne fait que fournir l'objet de configuration.
import { firebaseConfig } from './firebase';

const UserContext = createContext();

// Variables pour stocker les instances Firebase
// Elles seront initialisées une seule fois au niveau du module.
let firebaseAppInstance = null;
let firestoreDbInstance = null;
let firebaseAuthInstance = null;
let firebaseInitializationError = null; // Variable pour stocker l'erreur d'initialisation

try {
  // Vérifie si la configuration Firebase est valide avant d'initialiser
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    firebaseInitializationError = new Error(
      "CRITIQUE : La configuration Firebase est incomplète. " +
      "Veuillez vous assurer que les secrets Cloudflare Pages (REACT_APP_FIREBASE_...) sont correctement définis " +
      "pour construire la variable globale __firebase_config, ou que firebase.js contient des valeurs par défaut valides."
    );
    console.error(firebaseInitializationError.message);
  } else {
    // Initialise Firebase App une seule fois
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    // Initialise Firestore et Auth une seule fois
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
  }
} catch (e) {
  firebaseInitializationError = e;
  console.error("Erreur lors de l'initialisation de Firebase :", e);
}

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // Indique si l'utilisateur est en cours de chargement/initialisation

  // Expose les instances Firebase via le contexte
  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;

  useEffect(() => {
    if (firebaseInitializationError) {
      console.error("Firebase n'a pas pu être initialisé. L'application ne fonctionnera pas correctement.", firebaseInitializationError);
      setLoadingUser(false);
      return;
    }

    if (!auth || !db) {
      console.warn("Firebase Auth ou Firestore ne sont pas encore disponibles.");
      setLoadingUser(true); // Garder loadingUser à true tant que les instances ne sont pas prêtes
      return;
    }

    const setupAuthAndUser = async () => {
      try {
        // Tente de se connecter avec le token personnalisé si disponible
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Connecté avec le token personnalisé.");
          } catch (tokenError) {
            console.warn("Échec de la connexion avec le token personnalisé, tentative de connexion anonyme:", tokenError);
            await signInAnonymously(auth);
            console.log("Connecté anonymement.");
          }
        } else {
          // Si pas de token, se connecter anonymement
          await signInAnonymously(auth);
          console.log("Connecté anonymement.");
        }

        // Écoute les changements d'état d'authentification
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
              const userData = docSnap.data();
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || user.displayName,
                isAdmin: userData.isAdmin || false,
                avatar: userData.avatar || '👤',
                photoURL: userData.photoURL || null,
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
              // Si l'utilisateur est authentifié mais n'a pas de document Firestore, le créer
              const defaultUserData = {
                displayName: user.displayName || user.email.split('@')[0],
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
              setCurrentUser({ uid: user.uid, email: user.email, ...defaultUserData });
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
}
