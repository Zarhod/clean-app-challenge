import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext';
import AvatarSelectionModal from './AvatarSelectionModal';

const DEFAULT_AVATAR = '😀';

const AuthModal = ({ onClose }) => {
  const { auth, db, loadingUser, setCurrentUser } = useUser(); 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
    setSelectedAvatar(DEFAULT_AVATAR);
  }, [isLogin]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (loadingUser || !auth || !db) {
      setError("Le service d'authentification n'est pas encore prêt. Veuillez patienter et réessayer.");
      setLoading(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Adresse e-mail invalide.');
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
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
            avatar: userData.avatar || DEFAULT_AVATAR,
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
            avatar: DEFAULT_AVATAR,
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
          toast.success(`Bienvenue, ${defaultUserData.displayName} ! Votre compte a été initialisé.`);
          onClose();
        }

      } else {
        if (!displayName.trim()) {
          setError("Le nom d'affichage est requis.");
          setLoading(false);
          return;
        }
        if (!selectedAvatar) {
          setError("Veuillez sélectionner un avatar.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: displayName.trim() });

        const userDocRef = doc(db, "users", user.uid);
        const newUserData = {
          displayName: displayName.trim(),
          email: email.trim(),
          dateJoined: new Date().toISOString(),
          isAdmin: false, 
          totalCumulativePoints: 0,
          weeklyPoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          avatar: selectedAvatar
        };

        try {
          await setDoc(userDocRef, newUserData);
          // console.log("Profil créé dans Firestore", newUserData);
        } catch (firestoreError) {
          // console.error("Erreur création profil Firestore:", firestoreError);
          setError("Impossible de créer le profil utilisateur. Veuillez réessayer plus tard.");
          setLoading(false);
          return;
        }

        setCurrentUser({ uid: user.uid, ...newUserData });
        toast.success(`Compte créé et connecté !`);
        onClose();
      }
    } catch (err) {
      // console.error("Erreur d'authentification:", err.code, err.message);
      let errorMessage = "Une erreur est survenue lors de l'authentification.";
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresse e-mail invalide.'; break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé.'; break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Adresse e-mail ou mot de passe incorrect.'; break;
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse e-mail est déjà utilisée.'; break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.'; break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion.'; break;
        default:
          errorMessage = "Une erreur inattendue est survenue. Veuillez réessayer.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser || !auth || !db;

  return (
    <>
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
          {/* Sélection d'avatar */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow transition-all w-full"
                onClick={() => setShowAvatarModal(true)}
                disabled={isDisabled}
              >
                <span className="text-2xl">
                  {selectedAvatar?.startsWith('http') ? (
                    <img src={selectedAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover inline-block" />
                  ) : (
                    selectedAvatar || DEFAULT_AVATAR
                  )}
                </span>
                <span className="text-base text-primary font-semibold">
                  {selectedAvatar?.startsWith('http') ? "Photo sélectionnée" : "Emoji sélectionné"}
                </span>
                <span className="ml-auto text-xs text-gray-400">Modifier</span>
              </button>
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

      {/* Modale Avatar réutilisée */}
      {!isLogin && showAvatarModal && (
        <AvatarSelectionModal
          isOpen={showAvatarModal}
          currentAvatar={selectedAvatar}
          onClose={() => setShowAvatarModal(false)}
          onAvatarSelected={(avatar) => {
            setSelectedAvatar(avatar);
            setShowAvatarModal(false);
          }}
        />
      )}
    </>
  );
};

export default AuthModal;
