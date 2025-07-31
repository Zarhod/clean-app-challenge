import React, { useState, useEffect, useRef } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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

  // Pour le recadrage d'image
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1, unit: '%', width: 90 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
    setShowAuthErrorModal(false);
    setAuthErrorMessage('');
    setImageSrc(null);
    setCrop({ aspect: 1, unit: '%', width: 90 });
    setCompletedCrop(null);
    setSelectedAvatar('👤'); // Réinitialiser l'avatar emoji
    setAvatarType('emoji'); // Par défaut à emoji
  }, [isLogin]);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop controlled
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
  }, []);

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = 'cropped.jpeg';
        resolve(blob);
      }, 'image/jpeg', 0.75);
    });
  }, [completedCrop]);

  const uploadPhoto = async (userId, croppedBlob) => {
    if (!croppedBlob) return null;
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_cropped.jpeg`);
    await uploadBytes(storageRef, croppedBlob);
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

      } else { // Inscription
        if (!displayName.trim()) {
          setError("Le nom d'affichage est requis.");
          setLoading(false);
          return;
        }
        if (avatarType === 'photo' && !imageSrc) {
          setError("Veuillez sélectionner une photo pour votre avatar.");
          setLoading(false);
          return;
        }
        if (avatarType === 'photo' && !completedCrop) {
          setError("Veuillez recadrer votre photo d'avatar.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let avatarToSave = selectedAvatar;
        let photoURLToSave = null;

        if (avatarType === 'photo' && imageSrc && completedCrop) {
          const croppedBlob = await getCroppedImg();
          if (croppedBlob) {
            photoURLToSave = await uploadPhoto(user.uid, croppedBlob);
            avatarToSave = null; // Si une photo est utilisée, l'avatar emoji est null
          } else {
            setError("Erreur lors du recadrage de l'image.");
            setLoading(false);
            return;
          }
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
                  onChange={onSelectFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
                  disabled={isDisabled}
                />
                {imageSrc && (
                  <div className="mt-4 w-full flex flex-col items-center">
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      circularCrop
                      className="max-w-full h-auto"
                    >
                      <img ref={imgRef} alt="Source" src={imageSrc} onLoad={onImageLoad} className="max-w-full h-auto" />
                    </ReactCrop>
                    <canvas
                      ref={previewCanvasRef}
                      style={{
                        display: 'none', // Cache le canvas de prévisualisation
                        width: completedCrop?.width,
                        height: completedCrop?.height,
                      }}
                    />
                    {completedCrop && (
                      <p className="text-sm text-gray-500 mt-2">Image prête à être recadrée.</p>
                    )}
                  </div>
                )}
                {!imageSrc && <p className="text-sm text-gray-500 mt-2">Aucune photo sélectionnée.</p>}
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
