/* global __initial_auth_token */
// src/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const setupAuthAndUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Erreur de récupération de l\'utilisateur :', error.message);
          setLoadingUser(false);
          return;
        }

        if (!user) {
          const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (token) {
            const { error: signInError } = await supabase.auth.setSession({ access_token: token });
            if (signInError) {
              console.error("Erreur de connexion avec le token :", signInError.message);
              setLoadingUser(false);
              return;
            }
          } else {
            const { data: anonUser, error: anonError } = await supabase.auth.signInWithOAuth({ provider: 'anonymous' });
            if (anonError) {
              console.error("Erreur de connexion anonyme :", anonError.message);
              setLoadingUser(false);
              return;
            }
          }
        }

        const sessionUser = user || (await supabase.auth.getUser()).data.user;

        if (sessionUser) {
          const { data: userData, error: userFetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

          if (userFetchError && userFetchError.code !== 'PGRST116') {
            console.error("Erreur lors de la récupération de l'utilisateur :", userFetchError);
          }

          const defaultUserData = {
            id: sessionUser.id,
            email: sessionUser.email,
            displayName: sessionUser.user_metadata?.displayName || sessionUser.email?.split('@')[0],
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

          if (!userData) {
            const { error: insertError } = await supabase.from('users').insert(defaultUserData);
            if (insertError) {
              console.error("Erreur lors de l'insertion du nouvel utilisateur :", insertError.message);
              setLoadingUser(false);
              return;
            }
            setCurrentUser(defaultUserData);
          } else {
            setCurrentUser(userData);
          }

          setIsAdmin(userData?.isAdmin || false);
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }

        setLoadingUser(false);
      } catch (error) {
        console.error("Erreur de configuration de l'authentification Supabase :", error);
        setLoadingUser(false);
      }
    };

    setupAuthAndUser();
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loadingUser,
    setCurrentUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
