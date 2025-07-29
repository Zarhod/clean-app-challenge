// src/Auth.js
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    let shouldHideLoading = true; // Drapeau pour contrôler l'état de chargement

    try {
      if (isLogin) {
        // Tentative de connexion
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Connexion réussie !');
      } else {
        // Inscription
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: displayName });

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          displayName: displayName,
          email: email,
          isAdmin: false,
          dateJoined: new Date().toISOString(),
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0
        });
        toast.success('Inscription réussie et profil créé !');
      }
      onClose(); // Fermer la modale après succès
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue lors de l'authentification.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible (6 caractères minimum).';
      } else if (error.code === 'auth/user-not-found') {
        // Si l'utilisateur n'est pas trouvé lors de la connexion, basculer vers l'inscription
        toast.info('Compte non trouvé. Veuillez vous inscrire.');
        setIsLogin(false); // Bascule vers le mode inscription
        shouldHideLoading = false; // Ne pas masquer le loader immédiatement
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect.';
      }
      if (shouldHideLoading) { // N'afficher l'erreur que si on ne bascule pas vers l'inscription
        toast.error(errorMessage);
      }
    } finally {
      if (shouldHideLoading) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto transform transition-all duration-300 ease-in-out scale-100 hover:scale-[1.01]">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 drop-shadow-sm">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-text text-left font-medium mb-2 text-sm">Nom d'utilisateur</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                required={!isLogin}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition duration-200 ease-in-out hover:border-primary/50"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-text text-left font-medium mb-2 text-sm">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition duration-200 ease-in-out hover:border-primary/50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-text text-left font-medium mb-2 text-sm">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition duration-200 ease-in-out hover:border-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-base tracking-wide"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>
        <div className="flex flex-col items-center mt-4 space-y-2"> {/* Utilisation de flex-col et space-y pour empiler */}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm font-medium"
            >
              {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            >
              Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
