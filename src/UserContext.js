/* global __initial_auth_token */
// Ce fichier est le SEUL responsable de l'initialisation de l'application Firebase
// et de la gestion de l'état d'authentification de l'utilisateur.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Importe la configuration Firebase depuis le fichier firebase.js
import { firebaseConfig } from './firebase';

const UserContext = createContext();

// Variables pour stocker les instances Firebase
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
    // Initialise Firebase une seule fois
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
  }
} catch (e) {
  firebaseInitializationError = e;
  console.error("Erreur lors de l'initialisation de Firebase :", e);
}

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // Indique si l'utilisateur est en cours de chargement

  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;

  // Initialisation de l'authentification et chargement des données utilisateur
  useEffect(() => {
    if (firebaseInitializationError) {
      setLoadingUser(false);
      console.error("L'application Firebase n'a pas pu être initialisée. Veuillez vérifier votre configuration.");
      return;
    }

    if (!auth || !db) {
      setLoadingUser(false);
      console.error("Firebase Auth ou Firestore ne sont pas disponibles.");
      return;
    }

    const setupAuthAndUser = async () => {
      try {
        // Tente de se connecter avec le jeton personnalisé fourni par l'environnement (Cloudflare Pages)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Connecté avec jeton personnalisé.");
          } catch (error) {
            console.warn("Échec de la connexion avec jeton personnalisé, tentative de connexion anonyme:", error);
            await signInAnonymously(auth);
          }
        } else {
          // Si pas de jeton, se connecter anonymement
          await signInAnonymously(auth);
          console.log("Connecté anonymement.");
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
              // Si l'utilisateur n'existe pas dans Firestore, le créer avec des valeurs par défaut
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

  // Écouteur en temps réel pour les mises à jour du document utilisateur
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
          // Si le document utilisateur n'existe plus (supprimé par ex.), déconnecter
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
