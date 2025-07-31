// src/AuthModal.js
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // <-- AJOUT DE GETDOC ICI
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext'; 
import ConfirmActionModal from './ConfirmActionModal';

const avatars = ['😀', '😂', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🦋', '🐢', '🐍', '🐉', '🐳', '🐬', '🐠', '🐙', '🦀', '🦞', '🦐', '🦑', '🐡', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🦅', '🦆', '🦢', '🦩', '🦜', '🐦', '🐧', '🦉', '🦚', '🦃', '🐓', '🐔', '🐣', '🐤', '🐥', '👶', '👦', '👧', '🧑', '👨', '👩', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧟', '🧞', '👨‍🦯', '👩‍🦯', '👨‍🦼', '👩‍🦼', '👨‍🦽', '👩‍🦽', '🗣️', '👤', '👥', '🫂'];

const AuthModal = ({ onClose }) => {
  const { auth, db, setCurrentUser, loadingUser } = useUser(); 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤'); 
  const [error, setError] = useState('');
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [avatarType, setAvatarType] = useState('emoji'); // 'emoji' ou 'photo'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
    setShowAuthErrorModal(false);
    setAuthErrorMessage('');
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setSelectedAvatar('👤'); // Réinitialiser l'avatar emoji
    setAvatarType('emoji'); // Par défaut à emoji
  }, [isLogin]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  };

  const uploadPhoto = async (userId, file) => {
    if (!file) return null;
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowAuthErrorModal(false);
    setAuthErrorMessage('');

    if (loadingUser || !auth || !db) {
      setAuthErrorMessage("Le service d'authentification n'est pas encore prêt. Veuillez patienter et réessayer.");
      setShowAuthErrorModal(true);
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
            photoURL: userData.photoURL || null,
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
            photoURL: null,
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
        if (avatarType === 'photo' && !selectedPhoto) {
          setError("Veuillez sélectionner une photo pour votre avatar.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let avatarToSave = selectedAvatar;
        let photoURLToSave = null;

        if (avatarType === 'photo' && selectedPhoto) {
          photoURLToSave = await uploadPhoto(user.uid, selectedPhoto);
          avatarToSave = null; // Si une photo est utilisée, l'avatar emoji est null
        }

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
          avatar: avatarToSave,
          photoURL: photoURLToSave
        };
        await setDoc(userDocRef, newUserData);

        setCurrentUser({ uid: user.uid, ...newUserData });
        toast.success(`Compte créé et connecté !`);
        onClose();
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let errorMessage = "Une erreur est survenue lors de l'authentification.";
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresse e-mail invalide.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Adresse e-mail ou mot de passe incorrect.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Adresse e-mail ou mot de passe incorrect.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Adresse e-mail ou mot de passe incorrect.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse e-mail est déjà utilisée.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion.';
          break;
        case 'auth/admin-restricted-operation':
          errorMessage = "Opération restreinte par l'administrateur Firebase. Veuillez contacter le support.";
          break;
        default:
          errorMessage = "Une erreur inattendue est survenue. Veuillez réessayer.";
          break;
      }
      setAuthErrorMessage(errorMessage);
      setShowAuthErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser || !auth || !db;

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
            <div className="flex justify-center items-center mb-4 space-x-4">
              <span className="text-gray-700 font-medium">Emoji</span>
              <label htmlFor="avatarTypeToggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="avatarTypeToggle"
                  className="sr-only peer"
                  checked={avatarType === 'photo'}
                  onChange={() => setAvatarType(prev => prev === 'emoji' ? 'photo' : 'emoji')}
                  disabled={isDisabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-gray-700 font-medium">Photo</span>
            </div>

            {avatarType === 'emoji' ? (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 custom-scrollbar">
                  {avatars.map((avatar, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-center text-2xl sm:text-3xl p-1.5 rounded-full cursor-pointer transition-all duration-200
                                  ${selectedAvatar === avatar ? 'bg-primary text-white scale-110 shadow-lg' : 'hover:bg-gray-200'}`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      {avatar}
                    </div>
                  ))}
                </div>
                <p className="text-center text-gray-500 text-xs mt-2">Votre avatar actuel: <span className="text-xl align-middle">{selectedAvatar}</span></p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
                  disabled={isDisabled}
                />
                {photoPreview && (
                  <img src={photoPreview} alt="Aperçu de l'avatar" className="mt-4 w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md" />
                )}
                {!photoPreview && <p className="text-sm text-gray-500 mt-2">Aucune photo sélectionnée.</p>}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
          disabled={isDisabled}
        >
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 w-full text-primary hover:text-secondary font-semibold text-sm transition duration-300"
        disabled={isDisabled}
      >
        {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
      </button>

      {showAuthErrorModal && (
        <ConfirmActionModal
          title="Erreur d'Authentification"
          message={authErrorMessage}
          confirmText="Compris"
          onConfirm={() => setShowAuthErrorModal(false)}
          onCancel={() => setShowAuthErrorModal(false)}
          confirmButtonClass="bg-error hover:bg-red-700"
        />
      )}
    </ListAndInfoModal>
  );
};

export default AuthModal;
