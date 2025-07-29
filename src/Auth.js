// src/Auth.js
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Liste des avatars par défaut
const defaultAvatars = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
];

function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Connexion réussie !');
      } else {
        // Vérifier si le displayName est déjà pris
        const usersRef = doc(db, "users", displayName); // Utiliser displayName comme ID de document pour vérifier
        const userSnap = await getDoc(usersRef);
        if (userSnap.exists()) {
          toast.error('Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName });

        // Choisir un avatar aléatoire par défaut
        const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

        // Enregistrer les informations supplémentaires de l'utilisateur dans Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          dateJoined: new Date().toISOString(),
          isAdmin: false, // Par défaut, non admin
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          avatar: randomAvatar, // Enregistrer l'avatar
          level: 1, // Niveau initial
          xp: 0 // XP initial
        });
        toast.success('Compte créé et connecté !');
      }
      onClose();
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible (6 caractères minimum).';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email ou mot de passe incorrect.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        {!isLogin && (
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={loading}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          disabled={loading}
        />
        <button
          onClick={handleAuth}
          disabled={loading || !email || !password || (!isLogin && !displayName)}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm mb-4"
        >
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
        </button>
        <p className="text-sm text-text">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline ml-1 font-semibold"
            disabled={loading}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1.5 px-3 rounded-full shadow-md transition duration-300 text-xs"
          disabled={loading}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
