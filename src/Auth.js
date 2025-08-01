// src/Auth.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext';
import { supabase } from './supabase';

const avatars = ['😀', '😂', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '🐶', '🐱', '🐭', '🐹'];

const AuthModal = ({ onClose }) => {
  const { loadingUser, setCurrentUser } = useUser();
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
        toast.success(`Compte créé pour ${displayName} !`);
        onClose();
      }

    } catch (err) {
      console.error("Erreur d'auth:", err);
      let msg = err?.message || '';
      let errorMessage = "Une erreur est survenue.";

      switch (true) {
        case msg.includes("Invalid login credentials"):
          errorMessage = "Adresse e-mail ou mot de passe incorrect.";
          break;
        case msg.includes("User already registered"):
          errorMessage = "Cette adresse e-mail est déjà utilisée.";
          break;
        case msg.includes("Password should be at least"):
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case msg.includes("network"):
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
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
              required
              disabled={isDisabled}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
            required
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
            required
            disabled={isDisabled}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choisissez votre avatar</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50">
              {avatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center text-xl p-1.5 rounded-full cursor-pointer transition-all duration-200
                              ${selectedAvatar === avatar ? 'bg-primary text-white scale-110 shadow-lg' : 'hover:bg-gray-200'}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-xs mt-2">Avatar sélectionné : <span className="text-xl">{selectedAvatar}</span></p>
          </div>
        )}

        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
          disabled={isDisabled}
        >
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 w-full text-primary hover:text-secondary font-semibold text-sm transition duration-300"
        disabled={isDisabled}
      >
        {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
      </button>
    </ListAndInfoModal>
  );
};

export default AuthModal;
