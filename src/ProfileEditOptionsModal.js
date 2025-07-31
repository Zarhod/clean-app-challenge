// src/ProfileEditOptionsModal.js
// Ce composant fournit des options pour modifier le profil de l'utilisateur.

import React from 'react';

const ProfileEditOptionsModal = ({ onClose, onOpenAvatar, onOpenPassword }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          Modifier le Profil
        </h2>

        <div className="flex flex-col gap-4">
          <button
            onClick={onOpenAvatar}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 text-base"
          >
            Changer l'Avatar
          </button>
          <button
            onClick={onOpenPassword}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 text-base"
          >
            Changer le Mot de Passe
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 text-base"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditOptionsModal;
