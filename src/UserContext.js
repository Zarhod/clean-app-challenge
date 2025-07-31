// src/UserContext.js
// Ce fichier gère l'initialisation du client Supabase, l'authentification de l'utilisateur
// et la gestion de son état global (currentUser, isAdmin, loadingUser).
// Il assure qu'une seule instance de Supabase est créée et partagée.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

// Récupération des variables d'environnement Supabase.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erreur de configuration Supabase: REACT_APP_SUPABASE_URL ou REACT_APP_SUPABASE_ANON_KEY est manquant. Vérifiez votre fichier .env.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const unsubscribeRefs = useRef({});

  const updateUserDataInDb = useCallback(async (userId, dataToUpdate) => {
    try {
      const { error } = await supabase.from('users').update(dataToUpdate).eq('id', userId);
      if (error) {
        console.error("UserContext: Erreur lors de la mise à jour des données utilisateur dans public.users (updateUserDataInDb):", error.message);
      }
    } catch (error) {
      console.error("UserContext: Erreur inattendue lors de la mise à jour des données utilisateur (updateUserDataInDb):", error);
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    setLoadingUser(true);
    console.log("UserContext: Attempting signIn...");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("UserContext: signIn error:", error.message);
        throw error;
      }
      console.log("UserContext: signIn successful, user:", data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error("UserContext: Erreur de connexion (catch):", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoadingUser(false);
      console.log("UserContext: signIn process finished.");
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    setLoadingUser(true);
    console.log("UserContext: DÉBOGAGE: Début de la fonction signUp.");
    try {
      console.log("UserContext: DÉBOGAGE: Appel à supabase.auth.signUp...");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            avatar_url: '👤'
          }
        }
      });
      console.log("UserContext: DÉBOGAGE: Réponse de supabase.auth.signUp reçue. Erreur:", error, "Données:", data);

      if (error) {
        console.error("UserContext: Erreur lors de l'inscription dans auth.users:", error.message);
        throw error;
      }

      // Supabase 2.x ne crée pas automatiquement le user dans la table public.users
      // Nous devons le faire manuellement ici.
      if (data.user) {
        console.log("UserContext: DÉBOGAGE: Utilisateur créé dans auth.users. Tentative d'insertion dans public.users avec l'ID:", data.user.id);
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          avatar: '👤',
          points: 0,
          is_admin: false,
          last_login: new Date().toISOString()
        });
        console.log("UserContext: DÉBOGAGE: Réponse de l'insertion dans public.users reçue. Erreur:", insertError);

        if (insertError) {
          console.error("UserContext: Erreur lors de l'insertion du nouvel utilisateur dans public.users (signUp):", insertError.message);
          await supabase.auth.signOut();
          return { success: false, error: "Impossible de créer le profil utilisateur." };
        }
        console.log("UserContext: DÉBOGAGE: Utilisateur inséré dans public.users avec succès.");
      } else {
        console.warn("UserContext: DÉBOGAGE: Pas de données utilisateur après l'inscription. L'email de confirmation a-t-il été envoyé ?");
      }

      console.log("UserContext: DÉBOGAGE: Le processus d'inscription est terminé avec succès.");
      return { success: true, user: data.user };
    } catch (error) {
      console.error("UserContext: DÉBOGAGE: Erreur d'inscription (catch):", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoadingUser(false);
      console.log("UserContext: DÉBOGAGE: Fin de la fonction signUp.");
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoadingUser(true);
    console.log("UserContext: Attempting signOut...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("UserContext: signOut error:", error.message);
        throw error;
      }
      setCurrentUser(null);
      setIsAdmin(false);
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubscribeRefs.current = {};
      console.log("UserContext: signOut successful.");
    } catch (error) {
      console.error("UserContext: Erreur de déconnexion (catch):", error.message);
    } finally {
      setLoadingUser(false);
      console.log("UserContext: signOut process finished.");
    }
  }, []);

  useEffect(() => {
    console.log("UserContext: useEffect for onAuthStateChange triggered.");
    setLoadingUser(true);

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("UserContext: onAuthStateChange event:", event, "session:", session);

      if (session) {
        const user = session.user;
        console.log("UserContext: User session found, user ID:", user.id);

        console.log("UserContext: Attempting to fetch user data from public.users for user ID:", user.id);
        let userData = null;
        let userError = null;
        try {
          const result = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .limit(1);

          userData = result.data ? result.data[0] : null;
          userError = result.error;
          console.log("UserContext: Finished fetching user data from public.users. Result:", result);
        } catch (e) {
          console.error("UserContext: Exception during user data fetch from public.users:", e);
          userError = e;
        }

        // CORRECTION CLÉ: La condition vérifie si le profil n'existe pas,
        // même s'il n'y a pas d'erreur de requête.
        if (userError || !userData) {
          console.warn("UserContext: Authenticated user not found in public.users. Attempting to create profile.");
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.email.split('@')[0],
            avatar: user.user_metadata?.avatar_url || '👤',
            points: 0,
            is_admin: false,
            last_login: new Date().toISOString()
          });
          if (insertError) {
            console.error("UserContext: Erreur lors de la création du profil pour un nouvel utilisateur dans public.users:", insertError.message);
            await supabase.auth.signOut();
            setCurrentUser(null);
            setIsAdmin(false);
            toast.error("Erreur lors de la création du profil utilisateur.");
          } else {
            console.log("UserContext: Profile created in public.users. Re-fetching data to update state.");
            const { data: newUserData, error: newFetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .limit(1);

            if (newFetchError || !newUserData || newUserData.length === 0) {
              console.error("UserContext: Error re-fetching new user data after insert:", newFetchError ? newFetchError.message : "No data received.");
              setCurrentUser(null);
              setIsAdmin(false);
              toast.error("Erreur de connexion.");
            } else {
              console.log("UserContext: New user data re-fetched successfully after insert:", newUserData[0]);
              setCurrentUser({ ...user, ...newUserData[0] });
              setIsAdmin(newUserData[0].is_admin);
              toast.success(`Bonjour, ${newUserData[0].display_name} !`);
            }
          }
        } else if (userData) {
          console.log("UserContext: User data successfully loaded from public.users:", userData);
          setCurrentUser({ ...user, ...userData });
          setIsAdmin(userData.is_admin);
          updateUserDataInDb(user.id, { last_login: new Date().toISOString() });
          setLoadingUser(false);
          toast.success(`Bonjour, ${userData.display_name} !`);
        }
      } else {
        console.log("UserContext: No user session found. Setting currentUser to null and loadingUser to false.");
        setCurrentUser(null);
        setIsAdmin(false);
        setLoadingUser(false);
      }
    });

    return () => {
      console.log("UserContext: Cleaning up auth listener.");
      if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
      } else {
        console.warn("UserContext: authListener.data.subscription was not found during cleanup.");
      }
    };
  }, [updateUserDataInDb]);

  const contextValue = {
    currentUser,
    isAdmin,
    loadingUser,
    supabase,
    signIn,
    signUp,
    signOut,
    setCurrentUser,
    unsubscribeRefs
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
  }
  return context;
};
