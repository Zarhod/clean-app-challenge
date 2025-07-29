/* global __initial_auth_token */ // Déclare __initial_auth_token comme globale pour ESLint

// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { auth, db } from './firebase'; 
import { toast } from 'react-toastify'; 

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); 

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeUserDoc = () => {}; 

    const setupAuthAndUserListener = async () => {
      try {
        // Tenter de se connecter avec le token personnalisé si disponible, sinon de manière anonyme
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
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
              setIsAdmin(userData.isAdmin === true); 
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
          unsubscribeUserDoc(); 
        }
      });
    };

    setupAuthAndUserListener();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []); 

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
