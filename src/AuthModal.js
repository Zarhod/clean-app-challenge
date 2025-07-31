// src/AuthModal.js
import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à auth et db

const AuthModal = ({ onClose }) => {
  const { auth, db } = useUser(); // Accède à auth et db depuis le contexte
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true); // État pour le message de bienvenue

  useEffect(() => {
    // Cache le message de bienvenue après 3 secondes
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResettingPassword) {
        await sendPasswordResetEmail(auth, email);
        toast.success("Un e-mail de réinitialisation de mot de passe a été envoyé !");
        setIsResettingPassword(false);
      } else if (isRegistering) {
        if (password !== confirmPassword) {
          toast.error("Les mots de passe ne correspondent pas.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Crée un document utilisateur dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: displayName || user.email.split('@')[0], // Utilise le nom d'affichage ou une partie de l'email
          isAdmin: false, // Par défaut, non-admin
          avatar: '👤', // Avatar par défaut
          photoURL: null, // Pas de photo par défaut
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          dateJoined: new Date().toISOString(),
          lastReadTimestamp: new Date().toISOString()
        });

        // Met à jour le profil utilisateur Firebase avec le nom d'affichage
        await updateProfile(user, { displayName: displayName || user.email.split('@')[0] });

        toast.success("Inscription réussie ! Bienvenue !");
        onClose(); // Ferme la modale après inscription
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Connexion réussie !");
        onClose(); // Ferme la modale après connexion
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "L'adresse e-mail est invalide.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Ce compte a été désactivé.";
          break;
        case 'auth/user-not-found':
          errorMessage = "Aucun utilisateur trouvé avec cette adresse e-mail.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Mot de passe incorrect.";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "Cette adresse e-mail est déjà utilisée.";
          break;
        case 'auth/weak-password':
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Problème de connexion réseau. Veuillez vérifier votre connexion.";
          break;
        default:
          errorMessage = `Erreur: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md animate-fade-in-scale border border-primary/20 mx-auto">
        {showWelcomeMessage && (
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">Bienvenue !</h2>
            <p className="text-lightText text-md">Connectez-vous ou inscrivez-vous pour commencer.</p>
          </div>
        )}

        <h3 className="text-2xl sm:text-3xl font-bold text-text mb-6 text-center">
          {isResettingPassword
            ? 'Réinitialiser le Mot de Passe'
            : isRegistering
            ? 'Créer un Compte'
            : 'Se Connecter'}
        </h3>

        <form onSubmit={handleAuthAction} className="space-y-4">
          {isRegistering && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text text-left mb-1">Nom d'affichage</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom ou pseudo"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required={isRegistering}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text text-left mb-1">Adresse E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@example.com"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          {!isResettingPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text text-left mb-1">Mot de Passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
          )}
          {isRegistering && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text text-left mb-1">Confirmer le Mot de Passe</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required={isRegistering}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin-fast mr-2"></div>
                Chargement...
              </div>
            ) : isResettingPassword ? (
              'Réinitialiser'
            ) : isRegistering ? (
              'S\'inscrire'
            ) : (
              'Se Connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center flex flex-col sm:flex-row justify-center items-center gap-3">
          {!isResettingPassword && (
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-primary hover:text-secondary font-medium text-sm transition duration-300 px-3 py-1.5 rounded-md"
              disabled={loading}
            >
              {isRegistering
                ? 'Déjà un compte ? Connectez-vous'
                : 'Pas encore de compte ? Inscrivez-vous'}
            </button>
          )}

          <button
            onClick={() => setIsResettingPassword(!isResettingPassword)}
            className="text-lightText hover:text-text font-medium text-sm transition duration-300 px-3 py-1.5 rounded-md"
            disabled={loading}
          >
            {isResettingPassword
              ? 'Retour à la connexion'
              : 'Mot de passe oublié ?'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-md"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
