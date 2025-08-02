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
        await new Promise(resolve => setTimeout(resolve, 300)); // 👈 Attente importante

        let sessionResponse = await supabase.auth.getSession();
        let user = sessionResponse.data?.session?.user;

        if (!user) {
          const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (token) {
            const { error: tokenError } = await supabase.auth.setSession({ access_token: token });
            if (tokenError) throw new Error("Token invalide");
            sessionResponse = await supabase.auth.getSession();
            user = sessionResponse.data?.session?.user;
          }
        }

        if (!user || !user.id) {
          throw new Error("Impossible d'insérer un utilisateur sans ID valide.");
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        const defaultUserData = {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.displayName || user.email?.split('@')[0],
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
          console.log("🧪 Inserting user:", defaultUserData);
          const { error: insertError } = await supabase.from('users').insert(defaultUserData);
          if (insertError) throw new Error("Erreur création profil utilisateur");
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
