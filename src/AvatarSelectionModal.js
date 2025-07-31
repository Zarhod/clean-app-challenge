// src/AvatarSelectionModal.js
import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useUser } from './UserContext'; // Pour accéder à currentUser et db

const AvatarSelectionModal = ({ currentAvatar, currentPhotoURL, onClose, onSave }) => {
  const { currentUser, db } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(currentPhotoURL);
  const [avatarType, setAvatarType] = useState(currentPhotoURL ? 'photo' : 'emoji'); // Détermine le type initial
  const [loading, setLoading] = useState(false);

  // Liste d'emojis pour les avatars (curated pour ne pas être excessive)
  const avatarOptions = [
    '😀', '😁', '😂', '😇', '😈', '😉', '😊', '😍', '😎', '🤓', '🤔', '🤫', '😶', '😐', '🙄', '😴', '🥳', '🤩',
    '🤖', '👾', '👽', '👻', '🎃', '😺', '🐶', '🐱', '🦁', '🐯', '🐼', '🐸', '🐙', '🐠', '🦋', '🐝', '🐞', '🕷️',
    '🌳', '🌲', '🌴', '🌵', '🌱', '🌿', '🌸', '🌼', '🌻', '🌎', '🌈', '☀️', '⭐', '✨', '⚡️', '🔥', '💥', '💧',
    '🍎', '🍊', '🍌', '🍉', '🍓', '🍍', '🍕', '🍔', '🍟', '🍩', '🍪', '🎂', '☕️', '🍺', '🏆', '🥇', '🥈', '🥉',
    '⚽️', '🏀', '🎮', '🎲', '🧩', '📚', '🎨', '🎵', '✈️', '🚀', '🚗', '🚲', '🏠', '💡', '⏰', '🎁', '🎈', '🎉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
  ];

  useEffect(() => {
    // Si l'utilisateur change d'avis et revient à l'emoji, réinitialise la photo
    if (avatarType === 'emoji') {
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } else { // Si passe en mode photo, réinitialise l'emoji
      setSelectedAvatar(null);
    }
  }, [avatarType]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSelectedAvatar(null); // Désélectionne l'emoji si une photo est choisie
    } else {
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  };

  const uploadPhoto = async (userId, file) => {
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const deleteOldPhoto = async (photoURL) => {
    if (!photoURL || !currentUser) return;
    const storage = getStorage();
    const photoRef = ref(storage, photoURL); // Crée une référence à partir de l'URL
    try {
      await deleteObject(photoRef);
      console.log("Ancienne photo supprimée de Storage.");
    } catch (error) {
      // Ignore si le fichier n'existe pas ou si l'utilisateur n'a pas les permissions
      console.warn("Impossible de supprimer l'ancienne photo (peut-être déjà supprimée ou permissions insuffisantes):", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let newAvatarValue = null;
    let newPhotoURLValue = null;

    if (avatarType === 'emoji') {
      newAvatarValue = selectedAvatar;
      // Si on passe d'une photo à un emoji, supprimer l'ancienne photo
      if (currentPhotoURL) {
        await deleteOldPhoto(currentPhotoURL);
      }
    } else { // avatarType === 'photo'
      if (selectedPhoto) {
        // Supprimer l'ancienne photo si elle existe et est différente
        if (currentPhotoURL && photoPreview !== currentPhotoURL) {
          await deleteOldPhoto(currentPhotoURL);
        }
        newPhotoURLValue = await uploadPhoto(currentUser.uid, selectedPhoto);
      } else {
        // Si l'utilisateur choisit "photo" mais ne sélectionne rien, et qu'il y avait une photo, la conserver
        // Ou si on retire la photo, la supprimer
        if (photoPreview === null && currentPhotoURL) { // L'utilisateur a retiré la photo
          await deleteOldPhoto(currentPhotoURL);
          newPhotoURLValue = null;
        } else {
          newPhotoURLValue = currentPhotoURL; // Conserver la photo existante si aucune nouvelle n'est sélectionnée
        }
      }
    }
    
    // Appelle la fonction onSave passée par le parent avec les nouvelles valeurs
    // OnSave doit gérer la mise à jour dans Firestore
    onSave({ newAvatar: newAvatarValue, newPhotoURL: newPhotoURLValue });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">
          Changer votre Avatar
        </h3>

        <div className="flex justify-center items-center mb-4 space-x-4">
          <span className="text-gray-700 font-medium">Emoji</span>
          <label htmlFor="avatarTypeToggle" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="avatarTypeToggle"
              className="sr-only peer"
              checked={avatarType === 'photo'}
              onChange={() => setAvatarType(prev => prev === 'emoji' ? 'photo' : 'emoji')}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className="text-gray-700 font-medium">Photo</span>
        </div>

        {avatarType === 'emoji' ? (
          <>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 mb-4 bg-neutralBg rounded-lg border border-gray-200">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-2 rounded-lg text-3xl sm:text-4xl flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110
                              ${selectedAvatar === avatar ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-gray-100 text-text shadow-sm'}`}
                  disabled={loading}
                >
                  {avatar}
                </button>
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
              disabled={loading}
            />
            {photoPreview && (
              <img src={photoPreview} alt="Aperçu de l'avatar" className="mt-4 w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md" />
            )}
            {!photoPreview && <p className="text-sm text-gray-500 mt-2">Aucune photo sélectionnée.</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer l\'Avatar'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
