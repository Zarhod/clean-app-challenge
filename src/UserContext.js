import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const setupAuthAndUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));

        let sessionResponse = await supabase.auth.getSession();
        let user = sessionResponse.data?.session?.user;
        if (!user || !user.id) {
          setLoadingUser(false);
          return;
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
          await supabase
            .from('users')
            .insert(defaultUserData, { returning: 'minimal' });
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
    <UserContext.Provider value={{ currentUser, isAdmin, loadingUser, setCurrentUser, setIsAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export default UserContext;