/* global __initial_auth_token */
// src/UserContext.js
// Ce fichier est le SEUL responsable de l'initialisation de l'application Firebase
// et de la gestion de l'état d'authentification de l'utilisateur.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'; // signInAnonymously a été retiré
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
      "pour construire la variable globale '__firebase_config' ou que les placeholders dans firebase.js sont remplis."
    );
    console.error(firebaseInitializationError.message);
  } else {
    // Procède à l'initialisation UNIQUEMENT si la configuration est valide
    if (!getApps().length) { // Vérifie si aucune application Firebase n'a été initialisée
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp(); // Utilise l'application déjà initialisée
    }
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    console.log("Firebase initialisé avec succès via UserContext.");
  }

} catch (error) {
  firebaseInitializationError = new Error(`Erreur critique lors de l'initialisation de l'application Firebase : ${error.message}`);
  console.error(firebaseInitializationError.message, error);
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
    // Si Firebase n'a pas pu être initialisé au niveau du module, gère cela ici
    if (firebaseInitializationError) {
      console.error("Impossible de procéder à l'authentification :", firebaseInitializationError.message);
      setLoadingUser(false);
      return;
    }

    // Si les instances Firebase ne sont pas disponibles (en raison d'une erreur de configuration), arrête le chargement et retourne
    if (!auth || !db) {
      console.error("Firebase instances sont nulles. Impossible de procéder à l'authentification.");
      setLoadingUser(false);
      return;
    }

    // Modification ici : Supprime la logique de signInWithCustomToken et signInAnonymously
    // L'application attendra une connexion explicite (email/mot de passe)
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // L'utilisateur est connecté (email/mdp, etc.)
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
          // Cas où l'utilisateur est authentifié via Auth, mais pas encore dans Firestore
          // Cela peut arriver si un compte est créé directement via la console Firebase ou si la création Firestore échoue.
          // Nous initialisons ici les données Firestore pour cet utilisateur.
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
        // L'utilisateur n'est PAS connecté.
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    }, (error) => {
      console.error("Erreur lors de l'écoute de l'état d'authentification Firebase :", error);
      setLoadingUser(false);
    });

    return () => unsubscribeAuth(); // Nettoyer l'écouteur
  }, [auth, db]); // Dépendances pour re-exécuter l'effet si auth ou db changent

  useEffect(() => {
    // Cet useEffect écoute les changements sur le document utilisateur Firestore
    // C'est ici que l'erreur "Missing or insufficient permissions" apparaît souvent
    // si les règles Firestore ne permettent pas la lecture du document 'users/{userId}'
    // pour l'utilisateur actuellement connecté.
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
          // Si le document utilisateur n'existe plus (ex: supprimé manuellement), déconnecter l'utilisateur
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error("Erreur lors de l'écoute du document utilisateur :", error);
        // Ne pas définir loadingUser à false ici car cela pourrait masquer d'autres problèmes
        // et l'état de chargement est déjà géré par l'onAuthStateChanged initial.
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
