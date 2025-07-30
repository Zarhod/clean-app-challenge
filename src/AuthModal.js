// src/AuthModal.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useUser } from './UserContext'; // Importe useUser pour accéder à auth et db

const AuthModal = ({ onClose }) => {
  const { auth, db, setCurrentUser } = useUser(); // Récupère auth, db et setCurrentUser du contexte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        // Inscription
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Mettre à jour le profil de l'utilisateur avec le nom d'affichage
        await updateProfile(user, { displayName: displayName || email });

        // Créer un document utilisateur dans Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          displayName: displayName || email,
          email: email,
          avatar: '👤', // Avatar par défaut
          isAdmin: false, // Par défaut, non administrateur
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          dateJoined: new Date().toISOString(),
        });

        // Mettre à jour le currentUser dans le contexte après l'inscription
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: displayName || email,
          avatar: '👤',
          isAdmin: false,
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          dateJoined: new Date().toISOString(),
        });

        toast.success(`Bienvenue, ${displayName || email} !`);
      } else {
        // Connexion
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Le onAuthStateChanged dans UserContext gérera la récupération du document utilisateur
        // et la mise à jour de setCurrentUser.
        toast.success(`Connecté en tant que ${user.displayName || user.email} !`);
      }
      onClose(); // Ferme la modale après une authentification réussie
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue lors de l'authentification.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "Cette adresse e-mail est déjà utilisée.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Adresse e-mail invalide.";
            break;
          case 'auth/operation-not-allowed':
            errorMessage = "L'authentification par e-mail/mot de passe n'est pas activée. Veuillez contacter l'administrateur.";
            break;
          case 'auth/weak-password':
            errorMessage = "Le mot de passe est trop faible (6 caractères minimum).";
            break;
          case 'auth/user-disabled':
            errorMessage = "Ce compte a été désactivé.";
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = "Identifiants incorrects.";
            break;
          default:
            errorMessage = `Erreur Firebase: ${error.message}`;
            break;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isRegister ? 'Inscription' : 'Connexion'}
        </h2>
        <form onSubmit={handleAuthAction} className="space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="displayName" className="sr-only">Nom d'affichage</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nom d'affichage (optionnel)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-base"
          >
            {loading ? 'Chargement...' : (isRegister ? 'S\'inscrire' : 'Se connecter')}
          </button>
        </form>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 text-primary hover:underline text-sm font-medium"
          disabled={loading}
        >
          {isRegister ? 'Vous avez déjà un compte ? Connectez-vous.' : 'Pas de compte ? Inscrivez-vous.'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
