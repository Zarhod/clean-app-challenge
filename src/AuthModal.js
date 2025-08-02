import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { supabase } from './supabase';

const AuthModal = ({ onClose }) => {
  const { setCurrentUser, setIsAdmin, loadingUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
        setIsAdmin(userData?.isAdmin || false); // ✅ important ici

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

        const { error: insertError } = await supabase
          .from('users')
          .insert([newUserData]);

        if (insertError) throw insertError;

        setCurrentUser({ uid: signUpData.user.id, ...newUserData });
        setIsAdmin(false); // ✅ par défaut
        toast.success(`Compte créé avec succès pour ${newUserData.displayName} !`);
        onClose();
      }

    } catch (err) {
      const msg = err?.message || '';
      const code = err?.status || err?.code || '';
      let errorMessage = "Une erreur est survenue lors de l'authentification.";

      if (process.env.NODE_ENV === 'development') {
        console.warn("Auth error:", err);
      }

      switch (true) {
        case msg.includes("Invalid login credentials"):
        case msg.includes("Invalid login"):
        case msg.includes("User not found"):
        case code === 'auth/wrong-password':
        case code === 'auth/user-not-found':
          errorMessage = "Ce compte n'existe pas ou le mot de passe est incorrect.";
          break;
        case msg.includes("User already registered"):
          errorMessage = "Cette adresse e-mail est déjà utilisée.";
          break;
        case msg.includes("Password should be at least"):
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case code === 'auth/network-request-failed':
          errorMessage = "Erreur réseau. Veuillez vérifier votre connexion.";
          break;
        default:
          errorMessage = msg || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-text text-left font-medium mb-1 text-sm">Nom d'affichage</label>
              <input
                type="text"
                id="displayName"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="Votre nom ou pseudo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
                disabled={isDisabled}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-text text-left font-medium mb-1 text-sm">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isDisabled}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-text text-left font-medium mb-1 text-sm">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isDisabled}
            />
          </div>
          {error && (
            <p className="text-error text-sm mt-2">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            disabled={isDisabled}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm"
            disabled={isDisabled}
          >
            {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                        transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
            disabled={isDisabled}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
