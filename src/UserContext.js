/* global __firebase_config, __initial_auth_token */
// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

// Initialise l'application Firebase une seule fois au niveau du module
let firebaseApp;
let firestoreDbInstance;
let firebaseAuthInstance;

try {
  let firebaseConfig;
  const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  
  try {
    firebaseConfig = JSON.parse(rawConfig);
    // Si la configuration parsée est vide ou manque des clés critiques, on force l'utilisation du fallback
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error("La configuration Firebase parsée est incomplète ou vide.");
    }
  } catch (parseError) {
    console.warn("Impossible de parser __firebase_config ou elle est incomplète. Utilisation de la configuration de secours codée en dur. Erreur:", parseError);
    // --- CONFIGURATION FIREBASE OBLIGATOIRE ---
    // VOUS DEVEZ REMPLACER CES VALEURS PAR LES INFORMATIONS RÉELLES DE VOTRE PROJET FIREBASE.
    // Vous trouverez ces informations dans la console Firebase > Paramètres du projet > Vos applications.
    firebaseConfig = {
      apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw",
      authDomain: "clean-app-challenge.firebaseapp.com",
      projectId: "clean-app-challenge",
      storageBucket: "clean-app-challenge.firebasestorage.app",
      messagingSenderId: "689290653968",
      appId: "1:689290653968:web:c55ebf0cc8efcef35b7595"
    };
    // --- FIN DE LA CONFIGURATION FIREBASE OBLIGATOIRE ---

    if (firebaseConfig.projectId === "VOTRE_FIREBASE_PROJECT_ID" || firebaseConfig.apiKey === "VOTRE_FIREBASE_API_KEY") {
      console.error(
        "ERREUR CRITIQUE : La configuration Firebase utilise toujours les placeholders. " +
        "Veuillez remplacer 'VOTRE_FIREBASE_PROJECT_ID', 'VOTRE_FIREBASE_API_KEY', etc., par les détails réels de votre projet Firebase. " +
        "L'application ne fonctionnera pas correctement sans cela."
      );
      // Empêche l'initialisation si les placeholders sont encore présents
      firebaseApp = null;
      firestoreDbInstance = null;
      firebaseAuthInstance = null;
      return; // Sort du bloc try
    }
  }

  // Procède à l'initialisation uniquement si la configuration est valide et ne contient pas de placeholders
  if (!getApps().length) { // Vérifie si aucune application Firebase n'a été initialisée
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp(); // Utilise l'application déjà initialisée
  }
  firestoreDbInstance = getFirestore(firebaseApp);
  firebaseAuthInstance = getAuth(firebaseApp);

} catch (error) {
  console.error("Erreur critique lors de l'initialisation de l'application Firebase :", error);
  // S'assure que les instances sont nulles si une erreur se produit pendant cette étape critique
  firebaseApp = null;
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
    // Si l'initialisation de Firebase a échoué au niveau du module, gère cela gracieusement
    if (!auth || !db) {
      console.error("Les instances Firebase ne sont pas disponibles. Impossible de procéder à l'authentification.");
      setLoadingUser(false); // Arrête le chargement, mais indique un état d'erreur
      return;
    }

    // Cet effet gère l'authentification initiale et configure l'écouteur d'état d'authentification.
    const setupAuthAndUser = async () => {
      try {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }

        // Configure l'écouteur onAuthStateChanged
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
              // Crée un nouveau document utilisateur s'il n'existe pas (par exemple, première connexion ou migration)
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
            // Aucun utilisateur n'est connecté
            setCurrentUser(null);
            setIsAdmin(false);
          }
          setLoadingUser(false); // L'état d'authentification a été déterminé
        });

        return unsubscribeAuth; // Retourne la fonction de désabonnement pour le nettoyage
      } catch (error) {
        console.error("Erreur de configuration de l'authentification Firebase :", error);
        setLoadingUser(false); // Arrête le chargement en cas d'erreur
      }
    };

    const cleanup = setupAuthAndUser(); // Appelle la fonction de configuration asynchrone
    return () => {
      // S'assure que la fonction de désabonnement est appelée lorsque le composant est démonté
      if (typeof cleanup.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [auth, db]); // Les dépendances sont les instances auth et db au niveau du module

  // Écouteur pour les mises à jour en temps réel du document utilisateur actuel
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
          // Si le document utilisateur n'existe plus (par exemple, supprimé par l'administrateur)
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error("Erreur lors de l'écoute du document utilisateur :", error);
      });
      return () => unsubscribe();
    }
  }, [db, currentUser?.uid]); // Dépend de db et currentUser.uid

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
