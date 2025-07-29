// src/Auth.js
// Composant pour la connexion et l'inscription des utilisateurs.

import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Importez vos instances Firebase
import { toast } from 'react-toastify';

const Auth = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true); // true pour connexion, false pour inscription
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Pour le nom d'affichage lors de l'inscription
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // Logique de connexion
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Connexion réussie !');
      } else {
        // Logique d'inscription
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Créer un document utilisateur dans Firestore avec un rôle par défaut 'user'
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: displayName, // Sauvegardez le nom d'affichage
          role: 'user', // Rôle par défaut
          totalCumulativePoints: 0,
          weeklyPoints: 0,
          dateJoined: new Date().toISOString()
        });
        toast.success('Compte créé avec succès !');
      }
      onClose(); // Fermer la modale après succès
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Cet e-mail est déjà utilisé.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Adresse e-mail invalide.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Mot de passe trop faible (minimum 6 caractères).";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Identifiants invalides.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h3>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-text text-left font-medium mb-1 text-sm">Nom d'affichage:</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom ou pseudo"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-text text-left font-medium mb-1 text-sm">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-text text-left font-medium mb-1 text-sm">Mot de passe:</label>
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
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm w-full"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-primary hover:underline text-sm"
        >
          {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
        </button>
        <button
          onClick={onClose}
          className="mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 text-sm w-full"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default Auth;
