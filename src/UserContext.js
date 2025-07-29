// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase'; // Assurez-vous que auth et db sont exportés de firebase.js

// Définition des variables globales pour Firebase (fournies par l'environnement Canvas)
// Assurez-vous qu'elles sont définies, sinon utilisez des valeurs par défaut pour le développement local
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // État de chargement initial de l'utilisateur

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeUserDoc = () => {}; // Fonction de désabonnement par défaut

    const setupAuthAndUserListener = async () => {
      try {
        // Tenter de se connecter avec le token personnalisé si disponible, sinon de manière anonyme
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
          console.log("Signed in with custom token.");
        } else {
          await signInAnonymously(auth);
          console.log("Signed in anonymously.");
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
        toast.error("Erreur d'authentification initiale.");
        setLoadingUser(false);
        return;
      }

      // Écouteur d'état d'authentification Firebase
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("Auth state changed: User is logged in.", user.uid);
          // Écouter les changements sur le document utilisateur dans Firestore
          const userDocRef = doc(db, "users", user.uid);
          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              console.log("User document data received:", userData);
              setCurrentUser({ uid: user.uid, ...userData });
              setIsAdmin(userData.isAdmin === true); // S'assurer que c'est un booléen
            } else {
              console.log("User document does not exist for UID:", user.uid);
              // Si le document n'existe pas, créer un profil de base
              setDoc(userDocRef, {
                email: user.email || 'anonymous',
                displayName: user.displayName || `Invité-${user.uid.substring(0, 6)}`,
                dateJoined: new Date().toISOString(),
                isAdmin: false,
                totalCumulativePoints: 0,
                weeklyPoints: 0,
                previousWeeklyPoints: 0,
                xp: 0,
                level: 1,
                avatar: '👤'
              }).then(() => {
                console.log("Basic user document created.");
                setCurrentUser({ uid: user.uid, email: user.email || 'anonymous', displayName: user.displayName || `Invité-${user.uid.substring(0, 6)}`, isAdmin: false, totalCumulativePoints: 0, weeklyPoints: 0, previousWeeklyPoints: 0, xp: 0, level: 1, avatar: '👤' });
                setIsAdmin(false);
              }).catch(e => {
                console.error("Error creating user document:", e);
                toast.error("Erreur lors de la création du profil utilisateur.");
              });
            }
            setLoadingUser(false);
          }, (error) => {
            console.error("Error listening to user document:", error);
            toast.error("Erreur lors de la récupération du profil utilisateur.");
            setLoadingUser(false);
          });
        } else {
          console.log("Auth state changed: No user is logged in.");
          setCurrentUser(null);
          setIsAdmin(false);
          setLoadingUser(false);
          unsubscribeUserDoc(); // Arrêter l'écoute du document utilisateur précédent
        }
      });
    };

    setupAuthAndUserListener();

    // Fonction de nettoyage
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []); // Dépendances vides pour n'exécuter qu'une seule fois au montage

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
