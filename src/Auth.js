// src/Auth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal'; 

const avatars = ['😀', '😂', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🦋', '🐢', '🐍', '🐉', '🐳', '🐬', '🐠', '🐙', '🦀', '🦞', '🦐', '🦑', '🐡', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🦅', '🦆', '🦢', '🦩', '🦜', '🐦', '🐧', '🦉', '🦚', '🦃', '🐓', '🐔', '🐣', '🐤', '🐥', '👶', '👦', '👧', '🧑', '👨', '👩', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧟', '🧞', '👨‍🦯', '👩‍🦯', '👨‍🦼', '👩‍🦼', '👨‍🦽', '👩‍🦽', '🗣️', '👤', '👥', '🫂'];

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤'); 

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Connexion réussie !');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: displayName });

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: displayName,
          dateJoined: new Date().toISOString(),
          isAdmin: false, 
          totalCumulativePoints: 0,
          weeklyPoints: 0,
          previousWeeklyPoints: 0,
          xp: 0,
          level: 1,
          avatar: selectedAvatar 
        });
        toast.success('Compte créé et connecté !');
      }
      onClose();
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choisissez votre avatar</label>
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
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 w-full text-primary hover:text-secondary font-semibold text-sm transition duration-300"
        disabled={loading}
      >
        {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
      </button>
    </ListAndInfoModal>
  );
};

export default AuthModal;
