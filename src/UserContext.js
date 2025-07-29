/* global __initial_auth_token */
// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; // 'getDoc' supprimé car non utilisé directement

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Écouteur pour les changements d'état d'authentification Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si un utilisateur est connecté, on met à jour le currentUser
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);
        
        // Écouteur en temps réel pour le document utilisateur dans Firestore
        const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Fusionne les données Firebase Auth avec les données Firestore
            setCurrentUser({ ...user, ...userData });
            setIsAdmin(userData.isAdmin || false);
          } else {
            // Si le document utilisateur n'existe pas (nouvel utilisateur ou suppression manuelle),
            // on le crée avec des valeurs par défaut.
            setDoc(userDocRef, {
              displayName: user.displayName || user.email,
              email: user.email,
              isAdmin: false,
              dateJoined: new Date().toISOString(),
              weeklyPoints: 0,
              totalCumulativePoints: 0,
              previousWeeklyPoints: 0,
              xp: 0,
              level: 1,
              avatar: '👤'
            }, { merge: true }).then(() => {
              setCurrentUser({ 
                ...user, 
                displayName: user.displayName || user.email, 
                isAdmin: false, 
                dateJoined: new Date().toISOString(), 
                weeklyPoints: 0, 
                totalCumulativePoints: 0, 
                previousWeeklyPoints: 0, 
                xp: 0, 
                level: 1, 
                avatar: '👤' 
              });
              setIsAdmin(false);
            }).catch(e => console.error("Erreur lors de la création du document utilisateur:", e));
          }
        }, (error) => {
          console.error("Erreur lors de l'écoute du document utilisateur:", error);
        });
        return () => unsubscribeUserDoc(); // Nettoyage de l'écouteur du document utilisateur
      } else {
        // Si aucun utilisateur n'est connecté
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false); // L'état de chargement de l'utilisateur est terminé
    });

    // Logique d'authentification initiale (sans connexion anonyme)
    const signInInitialUser = async () => {
      try {
        // Vérifie si un token d'authentification initial est fourni par l'environnement Canvas
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        if (initialAuthToken) {
          // Tente de se connecter avec le token personnalisé
          await signInWithCustomToken(auth, initialAuthToken);
          console.log("Connecté avec le token personnalisé fourni par l'environnement.");
        } else {
          // Si aucun token initial n'est fourni, NE PAS se connecter anonymement.
          // L'utilisateur devra se connecter manuellement via la modale d'authentification.
          console.log("Aucun token d'authentification initial fourni. L'utilisateur devra se connecter manuellement.");
          setLoadingUser(false); // Assure que l'état de chargement est terminé
        }
      } catch (error) {
        // Si la connexion avec le token personnalisé échoue, cela signifie que l'utilisateur n'est pas connecté.
        // On ne fait rien d'autre ici pour ne pas forcer une connexion anonyme.
        console.error("Erreur lors de l'authentification initiale (token personnalisé):", error);
        setLoadingUser(false); // Assure que l'état de chargement est terminé même en cas d'erreur
      }
    };

    signInInitialUser(); // Appelle la fonction d'authentification initiale

    // Fonction de nettoyage pour l'écouteur d'authentification Firebase
    return () => unsubscribeAuth();
  }, []); // Le tableau de dépendances vide assure que cet effet ne s'exécute qu'une seule fois au montage

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};
