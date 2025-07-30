/* global __firebase_config, __initial_auth_token */
// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react'; // Removed useCallback as it's not needed for module-level init
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

// Initialize Firebase app once at the module level
let firebaseApp;
let firestoreDbInstance;
let firebaseAuthInstance;

try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  if (!getApps().length) { // Check if no Firebase app has been initialized yet
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp(); // Use the already initialized app
  }
  firestoreDbInstance = getFirestore(firebaseApp);
  firebaseAuthInstance = getAuth(firebaseApp);
} catch (error) {
  console.error("Critical Firebase initialization error:", error);
  // In a real application, you might want to display a user-friendly error here
  // or log to a monitoring service. For now, we just log to console.
}

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Directly use the module-level instances. These are guaranteed to be the same
  // across renders and won't cause re-initialization issues.
  const db = firestoreDbInstance;
  const auth = firebaseAuthInstance;

  useEffect(() => {
    // If Firebase initialization failed at module level, handle it gracefully
    if (!auth || !db) {
      console.error("Firebase instances are not available. Cannot proceed with authentication.");
      setLoadingUser(false); // Stop loading, but indicate an error state
      return;
    }

    // This effect handles initial authentication and sets up the auth state listener.
    const setupAuthAndUser = async () => {
      try {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }

        // Set up the onAuthStateChanged listener
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
              // Create a new user document if it doesn't exist (e.g., first login, or migration)
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
            // No user is signed in
            setCurrentUser(null);
            setIsAdmin(false);
          }
          setLoadingUser(false); // Authentication state has been determined
        });

        return unsubscribeAuth; // Return the unsubscribe function for cleanup
      } catch (error) {
        console.error("Firebase authentication setup error:", error);
        setLoadingUser(false); // Stop loading on error
      }
    };

    const cleanup = setupAuthAndUser(); // Call the async setup function
    return () => {
      // Ensure the unsubscribe function is called when the component unmounts
      if (typeof cleanup.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [auth, db]); // Dependencies are the module-level auth and db instances

  // Listener for real-time updates to the current user's document
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
          // If the user document no longer exists (e.g., deleted by admin)
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }, (error) => {
        console.error("Error listening to user document:", error);
      });
      return () => unsubscribe();
    }
  }, [db, currentUser?.uid]); // Depends on db and currentUser.uid

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
