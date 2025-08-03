/* global __initial_auth_token */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from './firebase';

const UserContext = createContext();

let firebaseAppInstance = null;
let firestoreDbInstance = null;
let firebaseAuthInstance = null;
let firebaseStorageInstance = null;
let firebaseInitializationError = null;

try {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    firebaseInitializationError = new Error(
      "CRITIQUE : La configuration Firebase est incomplète. " +
      "Veuillez vous assurer que les secrets Cloudflare Pages (REACT_APP_FIREBASE_...) sont correctement définis."
    );
    console.error(firebaseInitializationError.message);
  } else {
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firebaseStorageInstance = getStorage(firebaseAppInstance);
  }
} catch (error) {
  firebaseInitializationError = new Error(`Erreur critique lors de l'initialisation de Firebase : ${error.message}`);
  console.error(firebaseInitializationError.message, error);
}

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;
  const storage = firebaseStorageInstance;

  const initializeStatsIfMissing = async (userRef, existingStats = {}) => {
    const defaultStats = {
      urgentTasksCompleted: 0,
      weeksParticipated: 0,
      maxXpInOneTask: 0,
    };
    const newStats = { ...defaultStats, ...existingStats };
    await updateDoc(userRef, { stats: newStats });
    return newStats;
  };

  const fetchAndSetUserData = useCallback(async (user) => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      let finalStats = userData.stats || {};
      const missingStatKeys = ['urgentTasksCompleted', 'weeksParticipated', 'maxXpInOneTask'].some(
        key => typeof finalStats[key] !== 'number'
      );

      if (missingStatKeys) {
        finalStats = await initializeStatsIfMissing(userDocRef, finalStats);
      }

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
        lastReadTimestamp: userData.lastReadTimestamp || null,
        badges: userData.badges || [],
        stats: finalStats,
      });

      setIsAdmin(userData.isAdmin || false);
    }
  }, [db]);

  const refreshUserData = async () => {
    if (auth?.currentUser) {
      await fetchAndSetUserData(auth.currentUser);
    }
  };

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
          console.warn("⚠️ Échec de connexion avec token custom :", err.message);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAndSetUserData(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    });

    attemptTokenLogin();
    return () => unsubscribe();
  }, [auth, db, fetchAndSetUserData]);

  useEffect(() => {
    if (db && auth?.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const stats = data.stats || {
            urgentTasksCompleted: 0,
            weeksParticipated: 0,
            maxXpInOneTask: 0,
          };

          setCurrentUser((prevUser) => ({
            ...prevUser,
            ...data,
            stats,
            badges: data.badges || [],
          }));

          setIsAdmin(data.isAdmin || false);
        }
      }, (error) => {
        console.warn("⚠️ Erreur lors de l'écoute du document utilisateur :", error.message);
      });
      return () => unsubscribe();
    }
  }, [db, auth?.currentUser]);

  const uploadAvatarImage = async (file) => {
    if (!auth?.currentUser || !storage) return null;
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const updateUserAvatar = async (newAvatar) => {
    if (!auth?.currentUser || !db) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userDocRef, { avatar: newAvatar });
  };

  const value = {
    currentUser,
    isAdmin,
    loadingUser,
    db,
    auth,
    storage,
    setCurrentUser,
    uploadAvatarImage,
    updateUserAvatar,
    refreshUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
