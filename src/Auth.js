import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext';
import { supabase } from './supabase';

const avatars = ['😀', '😂', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '🐶', '🐱', '🐭', '🐹'];

const AuthModal = ({ onClose }) => {
  const { loadingUser, setCurrentUser, setIsAdmin } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
  }, [isLogin]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError || !user) throw signInError;

        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const finalUser = {
          uid: user.id,
          email: user.email,
          displayName: userData?.displayName || email.split('@')[0],
          isAdmin: userData?.isAdmin || false,
          avatar: userData?.avatar || '👤',
          weeklyPoints: userData?.weeklyPoints || 0,
          totalCumulativePoints: userData?.totalCumulativePoints || 0,
          previousWeeklyPoints: userData?.previousWeeklyPoints || 0,
          xp: userData?.xp || 0,
          level: userData?.level || 1,
          dateJoined: userData?.dateJoined || new Date().toISOString(),
          lastReadTimestamp: userData?.lastReadTimestamp || null
        };

        setCurrentUser(finalUser);
        setIsAdmin(userData?.isAdmin || false); // ✅ essentiel

        toast.success(`Bienvenue, ${finalUser.displayName} !`);
        onClose();
      } else {
        if (!displayName.trim()) {
          setError("Le nom d'affichage est requis.");
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError || !signUpData.user) throw signUpError;

        const newUserData = {
          id: signUpData.user.id,
          displayName: displayName.trim(),
          email: email.trim(),
          avatar: selectedAvatar,
          isAdmin: false,
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          dateJoined: new Date().toISOString(),
          lastReadTimestamp: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([newUserData]);

        if (insertError) throw insertError;

        setCurrentUser({ uid: signUpData.user.id, ...newUserData });
        setIsAdmin(false); // ✅ par défaut
        toast.success(`Compte créé pour ${displayName} !`);
        onClose();
      }

    } catch (err) {
      const msg = err?.message || '';
      const code = err?.code || err?.status || '';
      let errorMessage = "Une erreur est survenue.";

      if (process.env.NODE_ENV === 'development') {
        console.warn("Erreur d'auth:", err);
      }

      switch (true) {
        case msg.includes("Invalid login credentials"):
        case msg.includes("Invalid login"):
        case msg.includes("User not found"):
        case code === 'auth/user-not-found':
        case code === 'auth/wrong-password':
          errorMessage = "Ce compte n'existe pas ou le mot de passe est incorrect.";
          break;
        case msg.includes("User already registered"):
          errorMessage = "Cette adresse e-mail est déjà utilisée.";
          break;
        case msg.includes("Password should be at least"):
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case code === 'auth/network-request-failed':
          errorMessage = "Erreur réseau. Vérifiez votre connexion.";
          break;
        default:
          errorMessage = msg;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser;

  return (
    <ListAndInfoModal title={isLogin ? "Connexion" : "Inscription"} onClose={onClose} sizeClass="max-w-xs sm:max-w-md">
      {/* contenu du formulaire identique */}
    </ListAndInfoModal>
  );
};

export default AuthModal;
