// src/UserContext.js
// Ce fichier gère l'initialisation du client Supabase, l'authentification de l'utilisateur
// et la gestion de son état global (currentUser, isAdmin, loadingUser).
// Il assure qu'une seule instance de Supabase est créée et partagée.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement Supabase.
// Elles doivent être définies dans un fichier .env à la racine du projet,
// par exemple: REACT_APP_SUPABASE_URL=votre_url_supabase REACT_APP_SUPABASE_ANON_KEY=votre_cle_anon
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Vérification que les variables d'environnement sont bien chargées.
// Si elles manquent, une erreur est loggée pour faciliter le débogage.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erreur de configuration Supabase: REACT_APP_SUPABASE_URL ou REACT_APP_SUPABASE_ANON_KEY est manquant. Vérifiez votre fichier .env.");
  // En production, vous pourriez vouloir arrêter l'application ici ou afficher un message d'erreur.
}

// Initialisation du client Supabase.
// C'est ici que l'instance de Supabase est créée.
// Elle est exportée pour être utilisée directement si nécessaire, mais préférablement via le contexte.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Création du contexte React pour partager l'état de l'utilisateur et l'instance Supabase.
const UserContext = createContext();

// Fournisseur de contexte pour envelopper l'application et rendre l'état utilisateur disponible.
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Informations de l'utilisateur actuellement connecté
  const [isAdmin, setIsAdmin] = useState(false);       // Statut administrateur de l'utilisateur
  const [loadingUser, setLoadingUser] = useState(true); // Indique si l'état de l'utilisateur est en cours de chargement

  // Ref pour stocker les fonctions de désinscription des listeners Supabase.
  // Utile pour nettoyer les abonnements lors de la déconnexion ou du démontage du composant.
  const unsubscribeRefs = useRef({});

  // Fonction utilitaire pour mettre à jour les données de l'utilisateur dans la table 'public.users'.
  const updateUserDataInDb = useCallback(async (userId, dataToUpdate) => {
    try {
      // Met à jour la ligne de l'utilisateur correspondant à l'ID fourni.
      const { error } = await supabase.from('users').update(dataToUpdate).eq('id', userId);
      if (error) {
        console.error("Erreur lors de la mise à jour des données utilisateur dans public.users:", error.message);
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la mise à jour des données utilisateur:", error);
    }
  }, []);

  // Fonction pour la connexion d'un utilisateur existant.
  const signIn = useCallback(async (email, password) => {
    setLoadingUser(true); // Active l'état de chargement
    try {
      // Appel à l'API d'authentification Supabase pour se connecter avec email et mot de passe.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error; // Propage l'erreur pour la gestion dans le composant d'authentification
      }
      // Si la connexion réussit, le listener onAuthStateChange s'occupera de mettre à jour currentUser.
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Erreur de connexion:", error.message);
      return { success: false, error: error.message }; // Retourne l'erreur pour affichage
    } finally {
      setLoadingUser(false); // Désactive l'état de chargement
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    setLoadingUser(true); // Active l'état de chargement
    try {
      // Appel à l'API d'authentification Supabase pour l'inscription.
      // Le nom d'affichage et l'avatar par défaut sont stockés dans user_metadata.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName, // Stocke le nom d'affichage dans user_metadata
            avatar_url: '👤' // Avatar emoji par défaut
          }
        }
      });

      if (error) {
        throw error; // Propage l'erreur
      }

      // Si l'inscription dans auth.users est réussie, on crée une entrée correspondante
      // dans la table 'public.users' pour stocker les points, is_admin, etc.
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id, // L'ID de l'utilisateur Supabase Auth est utilisé comme clé primaire
          email: data.user.email,
          display_name: displayName,
          avatar: '👤', // Avatar par défaut
          points: 0,
          is_admin: false, // Par défaut, un nouvel utilisateur n'est pas admin
          last_login: new Date().toISOString() // Enregistre la date de la première connexion
        });
        if (insertError) {
          console.error("Erreur lors de l'insertion du nouvel utilisateur dans public.users:", insertError.message);
          // Gérer l'échec de l'insertion dans public.users (ex: déconnecter l'utilisateur ou le marquer comme non-initialisé)
          await supabase.auth.signOut(); // Déconnecte l'utilisateur si le profil ne peut pas être créé
          return { success: false, error: "Impossible de créer le profil utilisateur." };
        }
      }

      return { success: true, user: data.user }; // Retourne le succès
    } catch (error) {
      console.error("Erreur d'inscription:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoadingUser(false); // Désactive l'état de chargement
    }
  }, []);

  // Fonction pour la déconnexion de l'utilisateur.
  const signOut = useCallback(async () => {
    setLoadingUser(true); // Active l'état de chargement
    try {
      // Appel à l'API d'authentification Supabase pour se déconnecter.
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error; // Propage l'erreur
      }
      setCurrentUser(null); // Réinitialise l'utilisateur local
      setIsAdmin(false);    // Réinitialise le statut admin
      // Nettoie tous les listeners Supabase actifs pour éviter les fuites de mémoire.
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubscribeRefs.current = {}; // Réinitialise l'objet des refs
    } catch (error) {
      console.error("Erreur de déconnexion:", error.message);
    } finally {
      setLoadingUser(false); // Désactive l'état de chargement
    }
  }, []);

  // Effet pour écouter les changements d'état d'authentification de Supabase.
  // C'est le point central pour maintenir l'état 'currentUser' et 'isAdmin' à jour.
  useEffect(() => {
    console.log("UserContext: useEffect for onAuthStateChange triggered.");
    setLoadingUser(true); // Ensure loading state is true at the start of the effect

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("UserContext: onAuthStateChange event:", event, "session:", session);

      if (session) {
        const user = session.user;
        console.log("UserContext: User session found, user ID:", user.id);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 = "Row not found" (c'est normal pour un nouvel inscrit)
          console.error("UserContext: Error fetching user data from public.users:", userError.message);
          // If there's an unexpected error, log out the user to prevent stuck state
          setCurrentUser(null);
          setIsAdmin(false);
          setLoadingUser(false); // Set loading to false on error
        } else if (userData) {
          console.log("UserContext: User data found in public.users:", userData);
          setCurrentUser({ ...user, ...userData });
          setIsAdmin(userData.is_admin);
          updateUserDataInDb(user.id, { last_login: new Date().toISOString() });
          setLoadingUser(false); // User data loaded, set loading to false
        } else if (userError && userError.code === 'PGRST116') {
          console.warn("UserContext: Authenticated user not found in public.users. Attempting to create profile.");
          // This block handles cases where user is authenticated in auth.users but not in public.users
          // This should ideally be handled by signUp, but this is a fallback.
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata.display_name || user.email.split('@')[0],
            avatar: user.user_metadata.avatar_url || '👤',
            points: 0,
            is_admin: false,
            last_login: new Date().toISOString()
          });
          if (insertError) {
            console.error("UserContext: Error creating profile for new user in public.users:", insertError.message);
            await supabase.auth.signOut(); // Log out if profile creation fails
            setCurrentUser(null);
            setIsAdmin(false);
          } else {
            console.log("UserContext: Profile created in public.users. Re-fetching data.");
            const { data: newUserData, error: newFetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            if (newFetchError) {
              console.error("UserContext: Error re-fetching new user data:", newFetchError.message);
              setCurrentUser(null);
              setIsAdmin(false);
            } else {
              console.log("UserContext: New user data re-fetched successfully.");
              setCurrentUser({ ...user, ...newUserData });
              setIsAdmin(newUserData.is_admin);
            }
          }
          setLoadingUser(false); // New user profile handled, set loading to false
        }
      } else {
        console.log("UserContext: No user session found. Setting currentUser to null and loadingUser to false.");
        setCurrentUser(null);
        setIsAdmin(false);
        setLoadingUser(false); // No user, set loading to false
      }
    });

    return () => {
      console.log("UserContext: Cleaning up auth listener.");
      // Supabase onAuthStateChange retourne un objet avec 'data' et 'error'.
      // La fonction de désabonnement est dans 'data.subscription'.
      if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [updateUserDataInDb]); // Dépendances pour useCallback

  // Le contexte fourni à l'application.
  const contextValue = {
    currentUser,
    isAdmin,
    loadingUser,
    supabase, // L'instance de Supabase est partagée via le contexte
    signIn,
    signUp,
    signOut,
    setCurrentUser, // Permet aux composants enfants de mettre à jour l'état currentUser
    unsubscribeRefs // Permet aux composants enfants de stocker les fonctions de désabonnement des listeners
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personnalisé pour accéder facilement au contexte utilisateur.
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
  }
  return context;
};
