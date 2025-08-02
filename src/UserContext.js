/* global __initial_auth_token */
// src/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebase';

const UserContext = createContext();

let firebaseAppInstance = null;
let firestoreDbInstance = null;
let firebaseAuthInstance = null;
let firebaseInitializationError = null;

try {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    firebaseInitializationError = new Error(
      "CRITIQUE : La configuration Firebase est incomplète. " +
      "Veuillez vous assurer que les secrets Cloudflare Pages (REACT_APP_FIREBASE_...) sont correctement définis."
    );
    console.error(firebaseInitializationError.message);
  } else {
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    console.log("Firebase initialisé avec succès via UserContext.");
  }
} catch (error) {
  firebaseInitializationError = new Error(`Erreur critique lors de l'initialisation de Firebase : ${error.message}`);
  console.error(firebaseInitializationError.message, error);
  firebaseAppInstance = null;
  firestoreDbInstance = null;
  firebaseAuthInstance = null;
}

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;

  useEffect(() => {
    if (firebaseInitializationError || !auth || !db) {
      setLoadingUser(false);
      return;
    }

    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    const attemptTokenLogin = async () => {
      if (token) {
        try {
          await signInWithCustomToken(auth, token);
        } catch (err) {
          console.warn("Échec de connexion avec token custom :", err.message);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    });

    attemptTokenLogin();
    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    if (db && auth?.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const updatedUserData = docSnap.data();
          setCurrentUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
          }));
          setIsAdmin(updatedUserData.isAdmin || false);
        }
      }, (error) => {
        console.warn("Erreur lors de l'écoute du document utilisateur :", error.message);
      });
      return () => unsubscribe();
    }
  }, [db, auth?.currentUser]);

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
