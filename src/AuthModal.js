import React, { useState, Fragment, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext';
import { Dialog, Transition } from '@headlessui/react';

const DEFAULT_AVATAR = '😀';

// Liste d'emojis unique et stylée (sans doublons)
const avatarOptions = Array.from(new Set([
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
  '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
  '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
  '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
  '😈', '👿', '👹', '🤡', '💩', '👻', '💀', '☠️', '👽',
  '👾', '🤖', '👀'
]));

const AuthModal = ({ onClose }) => {
  const { auth, db, loadingUser, setCurrentUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setInviteCode('');
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
      setError('Veuillez saisir une adresse e-mail valide.');
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
        // Connexion
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
            avatar: userData.avatar || DEFAULT_AVATAR,
          });
          toast.success(`Bienvenue, ${userData.displayName || user.email} !`);
          onClose();
        } else {
          setError("Votre profil utilisateur n'a pas été trouvé. Veuillez contacter l'administrateur.");
          setLoading(false);
        }
      } else {
        // Inscription
        if (!displayName.trim()) {
          setError("Le nom d'affichage est requis.");
          setLoading(false);
          return;
        }
        if (!inviteCode.trim()) {
          setError("Le code d'invitation est requis.");
          setLoading(false);
          return;
        }

        // Vérifier que le code d'invitation est valide et non utilisé
        const invitationsRef = collection(db, 'invitations');
        const invitationQuery = query(
          invitationsRef,
          where('code', '==', inviteCode.trim()),
          where('used', '==', false)
        );
        const querySnapshot = await getDocs(invitationQuery);
        if (querySnapshot.empty) {
          setError('Code d’invitation invalide ou déjà utilisé.');
          setLoading(false);
          return;
        }
        const invitationDoc = querySnapshot.docs[0];

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: displayName.trim() });

        const userDocRef = doc(db, 'users', user.uid);
        const newUserData = {
          displayName: displayName.trim(),
          email: email.trim(),
          avatar: selectedAvatar,
        };
        await setDoc(userDocRef, newUserData);

        // Marquer le code invitation comme utilisé
        await updateDoc(invitationDoc.ref, {
          used: true,
          usedBy: user.uid,
          usedAt: new Date().toISOString(),
        });

        setCurrentUser({ uid: user.uid, ...newUserData });
        toast.success(`Compte créé et connecté !`);
        onClose();
      }
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de l'authentification.";
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresse e-mail invalide.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
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
        default:
          errorMessage = "Une erreur inattendue est survenue. Veuillez réessayer.";
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || loadingUser || !auth || !db;

  return (
    <>
      <ListAndInfoModal
        title={isLogin ? 'Connexion' : 'Inscription'}
        onClose={onClose}
        sizeClass="max-w-sm sm:max-w-md"
      >
        <form onSubmit={handleAuth} className="space-y-3">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 p-2 text-base focus:border-primary focus:ring-primary focus:outline-none"
                  required
                  disabled={isDisabled}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Code d'invitation
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 p-2 text-base focus:border-primary focus:ring-primary focus:outline-none"
                  required
                  disabled={isDisabled}
                  placeholder="Entrez le code fourni par l'administrateur"
                  autoComplete="off"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 p-2 text-base focus:border-primary focus:ring-primary focus:outline-none"
              required
              disabled={isDisabled}
              autoComplete={isLogin ? "username" : "email"}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 p-2 text-base focus:border-primary focus:ring-primary focus:outline-none"
              required
              disabled={isDisabled}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Avatar
              </label>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-blue-300 bg-blue-50 p-2 text-base font-semibold text-primary hover:bg-blue-100 disabled:opacity-50 transition"
                onClick={() => setShowEmojiModal(true)}
                disabled={isDisabled}
              >
                <span className="text-2xl select-none">
                  {selectedAvatar || DEFAULT_AVATAR}
                </span>
                <span>{selectedAvatar ? 'Emoji sélectionné' : 'Sélectionner un emoji'}</span>
                <span className="ml-auto text-xs text-gray-400">Modifier</span>
              </button>
            </div>
          )}

          {error && (
            <p className="mt-2 text-center text-sm text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-white font-semibold shadow hover:bg-secondary transition disabled:opacity-50"
            disabled={isDisabled}
          >
            {loading ? (isLogin ? 'Connexion...' : "Inscription...") : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 w-full rounded-lg bg-gray-100 py-2 text-primary font-semibold shadow hover:bg-gray-200 transition disabled:opacity-50"
          disabled={isDisabled}
        >
          {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </ListAndInfoModal>

      {/* Modal emoji intégrée */}
      <Transition.Root show={showEmojiModal} as={Fragment}>
        <Dialog as="div" className="relative z-[1001]" onClose={() => setShowEmojiModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm p-6 max-h-[50vh] overflow-y-auto">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 text-center mb-4">
                    Choisir un avatar
                  </Dialog.Title>

                  <div className="grid grid-cols-6 gap-3">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          setShowEmojiModal(false);
                        }}
                        className={`text-4xl p-2 rounded-lg transition hover:bg-gray-200`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowEmojiModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-full shadow-md transition text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default AuthModal;
