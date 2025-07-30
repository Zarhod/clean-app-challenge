// src/UserContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  const initializeFirebase = useCallback(async () => {
    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

      if (token) {
        await signInWithCustomToken(firebaseAuth, token);
      } else {
        await signInAnonymously(firebaseAuth);
      }

      onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          const userDocRef = doc(firestoreDb, 'users', user.uid);
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
              lastReadTimestamp: userData.lastReadTimestamp || null // Assurez-vous que ceci est inclus
            });
            setIsAdmin(userData.isAdmin || false);
          } else {
            // Créer un nouveau document utilisateur si non existant (pour les nouveaux utilisateurs ou migration)
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
              lastReadTimestamp: new Date().toISOString() // Initialise le timestamp de lecture
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
    } catch (error) {
      console.error("Firebase initialization or authentication error:", error);
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    initializeFirebase();
  }, [initializeFirebase]);

  // Écouteur en temps réel pour les changements sur le document utilisateur actuel
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
          // Si le document utilisateur n'existe plus (supprimé par ex)
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error("Error listening to user document:", error);
      });
      return () => unsubscribe();
    }
  }, [db, currentUser?.uid]); // Dépend de db et de l'UID de l'utilisateur

  const value = {
    currentUser,
    isAdmin,
    loadingUser,
    db,
    auth,
    setCurrentUser // Permet aux composants de mettre à jour currentUser dans le contexte
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
