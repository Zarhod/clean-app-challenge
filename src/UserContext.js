// src/UserContext.js
// Ce contexte gère l'état d'authentification de l'utilisateur et son rôle.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Importez vos instances Firebase

// Créez le contexte
const UserContext = createContext();

// Hook personnalisé pour utiliser le contexte utilisateur
export const useUser = () => useContext(UserContext);

// Fournisseur de contexte utilisateur
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // État de chargement initial de l'utilisateur

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Utilisateur connecté
        setCurrentUser(user);
        // Récupérer le rôle de l'utilisateur depuis Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAdmin(userData.role === 'admin');
          } else {
            // Si le document utilisateur n'existe pas encore (nouvel utilisateur),
            // définissez-le avec un rôle par défaut 'user'.
            // Cela sera géré lors de l'inscription/première connexion.
            setIsAdmin(false); // Par défaut, non admin
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle de l'utilisateur:", error);
          setIsAdmin(false); // En cas d'erreur, assurez-vous qu'il n'est pas admin
        }
      } else {
        // Utilisateur déconnecté
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false); // L'état de l'utilisateur a été chargé
    });

    // Nettoyage de l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, []);

  // Fournir les valeurs du contexte aux composants enfants
  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};
