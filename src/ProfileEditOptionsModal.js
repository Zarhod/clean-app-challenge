import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const ProfileEditOptionsModal = ({ onClose, onOpenAvatar, onOpenPassword }) => {
  return (
    <ListAndInfoModal title="Modifier le Profil" onClose={onClose} sizeClass="max-w-xs">
      <div className="flex flex-col space-y-4">
        <button
          onClick={onOpenAvatar}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Changer mon Avatar
        </button>
        <button
          onClick={onOpenPassword}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Changer mon Mot de Passe
        </button>
      </div>
    </ListAndInfoModal>
  );
};

export default ProfileEditOptionsModal;
