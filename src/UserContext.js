// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app'; // Importez getApps et getApp

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    let firebaseApp;
    // Vérifier si une application Firebase par défaut existe déjà
    if (!getApps().length) {
      // Si aucune application n'existe, l'initialiser
      const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {};
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      // Si une application existe déjà, la récupérer
      firebaseApp = getApp();
    }

    const firestoreDb = getFirestore(firebaseApp);
    const firebaseAuth = getAuth(firebaseApp);

    setDb(firestoreDb);
    setAuth(firebaseAuth);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(firestoreDb, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData = {};
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
          } else {
            // Si le document utilisateur n'existe pas, le créer
            await setDoc(userDocRef, {
              displayName: user.displayName || user.email,
              email: user.email,
              avatar: '👤', // Avatar par défaut
              isAdmin: false,
              weeklyPoints: 0,
              totalCumulativePoints: 0,
              previousWeeklyPoints: 0,
              xp: 0,
              level: 1,
              dateJoined: new Date().toISOString(),
            });
            userData = (await getDoc(userDocRef)).data(); // Relire les données après création
          }
          
          // Mettre à jour currentUser avec toutes les données du profil
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName || user.email, // Utiliser userData.displayName si disponible
            avatar: userData.avatar || '👤',
            isAdmin: userData.isAdmin || false,
            weeklyPoints: userData.weeklyPoints || 0,
            totalCumulativePoints: userData.totalCumulativePoints || 0,
            previousWeeklyPoints: userData.previousWeeklyPoints || 0,
            xp: userData.xp || 0,
            level: userData.level || 1,
            dateJoined: userData.dateJoined || new Date().toISOString(),
            // Ajoutez d'autres champs si nécessaire
          });
          setIsAdmin(userData.isAdmin || false);
        } catch (error) {
          console.error("Erreur lors de la récupération/création du document utilisateur:", error);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    });

    // Tentative de connexion avec le token personnalisé si disponible
    const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

    const signInWithToken = async () => {
      if (initialAuthToken && firebaseAuth) {
        try {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } catch (error) {
          console.error("Erreur de connexion avec le token personnalisé:", error);
          // Fallback vers l'authentification anonyme si le token échoue
          try {
            await signInAnonymously(firebaseAuth);
          } catch (anonError) {
            console.error("Erreur de connexion anonyme:", anonError);
          }
        }
      } else if (firebaseAuth && !firebaseAuth.currentUser) {
        // Si aucun token n'est disponible et pas déjà connecté, se connecter anonymement
        try {
          await signInAnonymously(firebaseAuth);
        } catch (anonError) {
          console.error("Erreur de connexion anonyme:", anonError);
        }
      }
    };

    signInWithToken();

    return () => unsubscribe(); // Nettoyage de l'écouteur d'authentification
  }, []); // Dépendances vides pour n'exécuter qu'une fois à l'initialisation

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser, db, auth, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
