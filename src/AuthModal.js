// src/AuthModal.js
import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AvatarSelectionModal from './AvatarSelectionModal';

const AuthModal = ({ onClose }) => {
  const { auth, db, setCurrentUser, loadingUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('😀');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAvatar('😀');
    setError('');
    setLoading(false);
  }, [isLogin]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (loadingUser || !auth || !db) {
      setError("Le service d'authentification n'est pas encore prêt.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName || user.displayName,
            isAdmin: userData.isAdmin || false,
            avatar: userData.avatar || '👤',
            weeklyPoints: userData.weeklyPoints || 0,
            totalCumulativePoints: userData.totalCumulativePoints || 0,
            previousWeeklyPoints: userData.previousWeeklyPoints || 0,
            xp: userData.xp || 0,
            level: userData.level || 1,
            dateJoined: userData.dateJoined || new Date().toISOString(),
            lastReadTimestamp: userData.lastReadTimestamp || null
          });
          toast.success(`Bienvenue, ${userData.displayName || user.email} !`);
          onClose();
        } else {
          const defaultUserData = {
            displayName: user.displayName || email.split('@')[0],
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
          await setDoc(userDocRef, defaultUserData);
          setCurrentUser({ uid: user.uid, email: user.email, ...defaultUserData });
          toast.success(`Bienvenue, ${defaultUserData.displayName} !`);
          onClose();
        }

      } else {
        if (!displayName.trim()) {
          setError("Le nom d'affichage est requis.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: displayName.trim() });

        const userDocRef = doc(db, 'users', user.uid);
        const newUserData = {
          displayName: displayName.trim(),
          email: email.trim(),
          isAdmin: false,
          avatar: avatar || '👤',
          weeklyPoints: 0,
          totalCumulativePoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          dateJoined: new Date().toISOString(),
          lastReadTimestamp: new Date().toISOString()
        };
        await setDoc(userDocRef, newUserData);

        setCurrentUser({ uid: user.uid, ...newUserData });
        toast.success(`Compte créé avec succès pour ${displayName.trim()} !`);
        onClose();
      }

    } catch (err) {
      let errorMessage = "Une erreur est survenue.";
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresse e-mail invalide.'; break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé.'; break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Adresse e-mail ou mot de passe incorrect.'; break;
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse e-mail est déjà utilisée.'; break;
        case 'auth/weak-password':
          errorMessage = 'Mot de passe trop faible (6 caractères min).'; break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau.'; break;
        default:
          errorMessage = "Erreur inconnue.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser || !auth || !db;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label htmlFor="displayName" className="block text-left text-sm font-medium mb-1">Nom d'affichage</label>
                <input
                  type="text"
                  id="displayName"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Votre nom ou pseudo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isDisabled}
                />
              </div>

              <div className="text-5xl text-center mt-4">{avatar.startsWith('http') ? '🖼️' : avatar}</div>
              <div className="flex justify-center my-3">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out text-sm"
                  disabled={isDisabled}
                >
                  Choisir un avatar
                </button>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-left text-sm font-medium mb-1">Email</label>
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
            <label htmlFor="password" className="block text-left text-sm font-medium mb-1">Mot de passe</label>
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

          {error && <p className="text-error text-sm mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
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
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
            disabled={isDisabled}
          >
            Fermer
          </button>
        </div>
      </div>

      <AvatarSelectionModal
        isOpen={showAvatarModal}
        currentAvatar={avatar}
        onClose={() => setShowAvatarModal(false)}
        onAvatarSelected={(selected) => {
          setAvatar(selected);
          setShowAvatarModal(false);
        }}
      />
    </div>
  );
};

export default AuthModal;
