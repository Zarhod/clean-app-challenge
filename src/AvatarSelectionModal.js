// src/AvatarSelectionModal.js
// Ce composant permet à l'utilisateur de choisir un avatar emoji ou de télécharger une image.
// Il gère l'upload d'images vers Supabase Storage et met à jour l'URL de l'avatar dans la table 'users'.

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à Supabase

const emojis = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😎', '🤩', '🥳',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐒', '🐔',
  '🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥭', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣',
  '🚀', '🛸', '🛰️', '🚁', '🚂', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚌', '🚍', '🚎', '🚐', '🚑',
  '🏠', '🏡', '🏘️', '🏢', '🏣', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼',
  '💡', '⏰', '⏳', '⌚', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📸', '📹', '🎥', '🎙️', '🎧',
  '📚', '📖', '📝', '✏️', '🖍️', '🖌️', '📏', '📐', '✂️', '📌', '📎', '🔗', '🔓', '🔒', '🔑', '🗝️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'
];

const AvatarSelectionModal = ({ currentAvatar, onClose, onSave }) => {
  const { supabase, currentUser } = useUser();
  const [selectedEmoji, setSelectedEmoji] = useState(currentAvatar.length === 1 ? currentAvatar : '👤');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar.length > 1 ? currentAvatar : null); // Pour l'aperçu de l'image

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("La taille de l'image ne doit pas dépasser 2 Mo.");
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setSelectedEmoji(null); // Désélectionne l'emoji si une image est choisie
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (file) {
        // Upload de l'image vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.uid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars') // Assurez-vous d'avoir un bucket 'avatars' dans Supabase Storage
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Permet de remplacer si le fichier existe déjà
          });

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique de l'image
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error("Impossible de récupérer l'URL publique de l'avatar.");
        }

        await onSave(publicUrlData.publicUrl); // Passe l'URL publique au parent
      } else if (selectedEmoji) {
        await onSave(selectedEmoji); // Passe l'emoji au parent
      } else {
        toast.error("Veuillez sélectionner un avatar ou télécharger une image.");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'avatar:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          Choisir votre Avatar
        </h2>

        <div className="mb-6">
          <p className="text-lg text-text font-semibold mb-3">Aperçu de l'avatar actuel :</p>
          <div className="w-24 h-24 mx-auto rounded-full bg-neutralBg flex items-center justify-center text-5xl border-2 border-primary overflow-hidden">
            {previewUrl ? (
                <img src={previewUrl} alt="Aperçu de l'avatar" className="w-full h-full object-cover" />
            ) : (
                <span className="text-5xl">{selectedEmoji || currentAvatar}</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-text mb-3">Sélectionner un Emoji :</h3>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 rounded-lg bg-neutralBg">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedEmoji(emoji);
                  setFile(null); // Désélectionne le fichier si un emoji est choisi
                  setPreviewUrl(null);
                }}
                className={`p-2 rounded-full text-3xl transition duration-150 hover:bg-primary/20 
                            ${selectedEmoji === emoji ? 'bg-primary/40' : 'bg-transparent'}`}
                disabled={loading}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-text mb-3">Ou Télécharger une Image (Max 2MB) :</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-text file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0 file:text-sm file:font-semibold
                       file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={loading || (!selectedEmoji && !file)}
            className="w-full sm:w-auto bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder l\'Avatar'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
