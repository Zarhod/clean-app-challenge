import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const ProfileEditOptionsModal = ({ onClose, onOpenAvatarSelection, onOpenPasswordChange }) => {
  return (
    <ListAndInfoModal title="Options de Profil" onClose={onClose} sizeClass="max-w-xs sm:max-w-sm">
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => {
            onOpenAvatarSelection();
            onClose(); // Ferme cette modale après avoir ouvert la sélection d'avatar
          }}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-md"
        >
          Changer d'Avatar
        </button>
        <button
          onClick={() => {
            onOpenPasswordChange();
            onClose(); // Ferme cette modale après avoir ouvert la modale de changement de mot de passe
          }}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-md"
        >
          Changer de Mot de Passe
        </button>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-md"
        >
          Fermer
        </button>
      </div>
    </ListAndInfoModal>
  );
};

export default ProfileEditOptionsModal;
