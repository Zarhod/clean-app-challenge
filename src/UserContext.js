// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Assurez-vous que ces imports sont corrects
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Log pour le débogage: UID de l'utilisateur connecté
        console.log("Utilisateur Firebase authentifié (UID):", user.uid);

        setCurrentUser(user);

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userIsAdmin = false;
        let userDisplayName = user.displayName;

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userIsAdmin = !!userData.isAdmin; // S'assurer que c'est un booléen
          
          // Utiliser le displayName de Firestore si Firebase Auth n'en a pas
          if (!userDisplayName && userData.displayName) {
            userDisplayName = userData.displayName;
            // Optionnel: Mettre à jour le profil Firebase Auth pour la cohérence
            // try {
            //   await user.updateProfile({ displayName: userData.displayName });
            // } catch (error) {
            //   console.error("Erreur lors de la mise à jour du displayName Firebase Auth:", error);
            // }
          }
        } else {
          // Créer le document utilisateur s'il n'existe pas
          // Utiliser l'email comme displayName par défaut si aucun n'est fourni par Firebase Auth
          userDisplayName = user.displayName || user.email;
          const initialUserData = {
            displayName: userDisplayName,
            email: user.email,
            isAdmin: false, // Par défaut, un nouvel utilisateur n'est pas admin
            dateJoined: new Date().toISOString(),
            weeklyPoints: 0,
            totalCumulativePoints: 0,
            previousWeeklyPoints: 0
          };
          await setDoc(userDocRef, initialUserData);
          console.log("Nouveau document utilisateur créé dans Firestore:", initialUserData);
        }
        
        // Mettre à jour l'objet currentUser avec le displayName consolidé
        setCurrentUser({ ...user, displayName: userDisplayName });
        setIsAdmin(userIsAdmin);

        // Logs pour le débogage: statut isAdmin et displayName final
        console.log("Statut isAdmin de l'utilisateur:", userIsAdmin);
        console.log("DisplayName de l'utilisateur:", userDisplayName);

      } else {
        console.log("Aucun utilisateur Firebase authentifié.");
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    });

    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
