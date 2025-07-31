// src/AuthModal.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à Supabase
import ImageCropperModal, { readFile, getCroppedImg } from './ImageCropperModal'; // Importe le nouveau composant de recadrage

// Liste d'emojis pour la sélection d'avatar
const emojis = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😎', '🤩', '🥳',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐒', '🐔',
  '🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥭', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣',
  '🚀', '🛸', '🛰️', '🚁', '🚂', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚌', '🚍', '🚎', '🚐', '🚑',
  '🏠', '🏢', '🏫', '🏪', '🏭', '🏯', '🏰', '🗽', '🗼', '⛩️', '🗾', '🗻', '🌋', '🏞️', '🛣️', '🛤️',
];

const AuthModal = ({ onClose }) => {
  const { signIn, signUp, loadingUser, supabase } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [loading, setLoading] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCropUrl, setImageToCropUrl] = useState(null);

  useEffect(() => {
    if (loadingUser) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [loadingUser]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const fileDataUrl = await readFile(file);
        setImageToCropUrl(fileDataUrl);
        setShowImageCropper(true);
      } catch (error) {
        toast.error("Erreur lors de la lecture du fichier image.");
        console.error("Error reading file:", error);
      }
    }
  };

  const handleCancelCrop = () => {
    setShowImageCropper(false);
    setImageToCropUrl(null);
    setSelectedAvatar('👤'); // Réinitialiser l'avatar si l'utilisateur annule le recadrage
  };

  const handleCropComplete = useCallback(async (croppedImageFile) => {
    setLoading(true);
    try {
      if (!croppedImageFile) {
        throw new Error("Aucune image recadrée n'a été retournée.");
      }
      
      const userId = supabase.auth.currentUser?.id;
      if (!userId) {
        // Cette erreur est improbable si nous sommes dans le flow d'inscription, mais c'est une bonne pratique de la gérer.
        throw new Error("ID d'utilisateur non disponible pour le téléchargement d'image.");
      }

      // Supabase Storage path: `avatars/user_id.png`
      const filePath = `avatars/${userId}.png`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }
      
      const publicUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;

      setSelectedAvatar(publicUrl);
      toast.success("Image d'avatar recadrée et prête à être utilisée !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement de l'avatar.");
      console.error("Error uploading avatar:", error);
      setSelectedAvatar('👤');
    } finally {
      setShowImageCropper(false);
      setImageToCropUrl(null);
      setLoading(false);
    }
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { success, error } = await signIn(email, password);
      if (!success) {
        toast.error(`Erreur de connexion: ${error}`);
      } else {
        // Le toast de succès est géré dans UserContext.js
        onClose(); 
      }
    } else {
      if (!displayName || !email || !password) {
        toast.error("Veuillez remplir tous les champs.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères.");
        setLoading(false);
        return;
      }

      // La fonction signUp de UserContext gère à la fois l'auth et l'insertion dans public.users
      const { success, error } = await signUp(email, password, displayName);
      if (!success) {
        toast.error(`Erreur d'inscription: ${error}`);
      } else {
        // Le toast de succès est géré dans UserContext.js
        onClose(); 
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full transform transition-all duration-300 ease-in-out scale-95 md:scale-100 opacity-0 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">{isLogin ? 'Se connecter' : 'S\'inscrire'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Nom d'affichage</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-base"
                placeholder="Votre nom"
                disabled={loading}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-base"
              placeholder="votre.email@example.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de Passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-base"
              placeholder="Minimum 6 caractères"
              disabled={loading}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
              <div className="flex items-center space-x-4">
                {/* Section Emojis */}
                <div className="flex-1 overflow-x-auto whitespace-nowrap p-2 bg-gray-100 rounded-xl flex items-center space-x-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {emojis.map(emoji => (
                    <span
                      key={emoji}
                      onClick={() => {
                        setSelectedAvatar(emoji);
                        const fileInput = document.getElementById('avatar-upload');
                        if (fileInput) fileInput.value = ''; // Réinitialiser l'input fichier
                      }}
                      className={`text-2xl cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 
                                  ${selectedAvatar === emoji ? 'ring-2 ring-primary bg-gray-200' : ''}`}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>

                {/* Séparateur */}
                <div className="h-10 w-px bg-gray-300"></div>

                {/* Section Upload */}
                <div className="flex-shrink-0">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-4l-4 4m0 0l4 4m0-4h4m-4-4v8m-4-4h4" />
                      </svg>
                    </span>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center items-center">
                <span className="text-5xl border-4 border-dashed border-gray-300 rounded-full w-24 h-24 flex items-center justify-center">
                  {selectedAvatar.includes('http') ? (
                    <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedAvatar
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full bg-transparent hover:bg-gray-100 text-gray-600 font-semibold py-2 px-4 rounded-full 
                     transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Annuler
        </button>
      </div>

      {showImageCropper && imageToCropUrl && (
        <ImageCropperModal
          imageSrc={imageToCropUrl}
          onClose={handleCancelCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default AuthModal;
