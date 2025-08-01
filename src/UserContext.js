/* global __initial_auth_token */
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
        // 1. Vérifie si une session active existe
        let { data: { user }, error } = await supabase.auth.getUser();

        // 2. Sinon tente une session avec __initial_auth_token
        if (!user && typeof __initial_auth_token !== 'undefined') {
          const { error: tokenError } = await supabase.auth.setSession({ access_token: __initial_auth_token });
          if (tokenError) throw new Error("Échec de la connexion avec le token initial");

          const sessionRes = await supabase.auth.getUser();
          user = sessionRes.data?.user;
        }

        // 3. Si toujours rien → utilisateur non connecté
        if (!user) {
          setCurrentUser(null);
          setIsAdmin(false);
          setLoadingUser(false);
          return;
        }

        // 4. Récupère ou crée son profil dans la table `users`
        const { data: userData, error: userFetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        const defaultUserData = {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.displayName || user.email?.split('@')[0] || "Utilisateur",
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
          if (insertError) throw new Error("Erreur lors de la création du profil utilisateur");
          setCurrentUser(defaultUserData);
          setIsAdmin(false);
        } else {
          setCurrentUser(userData);
          setIsAdmin(userData?.isAdmin || false);
        }
      } catch (err) {
        console.error("Erreur de configuration utilisateur :", err.message || err);
        setCurrentUser(null);
        setIsAdmin(false);
      } finally {
        setLoadingUser(false);
      }
    };

    setupAuthAndUser();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};
