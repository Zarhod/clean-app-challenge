// src/ProfileEditOptionsModal.js
import React, { useState, useEffect } from 'react';
import AvatarSelectionModal from './AvatarSelectionModal';
import PasswordChangeModal from './PasswordChangeModal';
import { useUser } from './UserContext';

const ProfileEditOptionsModal = ({ onClose }) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { currentUser, updateUserAvatar } = useUser();
  const [currentAvatar, setCurrentAvatar] = useState(currentUser?.avatar || null);

  useEffect(() => {
    setCurrentAvatar(currentUser?.avatar || null);
  }, [currentUser]);

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const handleAvatarSelected = (newAvatar) => {
    setCurrentAvatar(newAvatar);
    updateUserAvatar(newAvatar); // met à jour dans Firestore/Firebase
    setShowAvatarModal(false);
  };

  const closeAndReset = () => {
    setShowAvatarModal(false);
    setShowPasswordModal(false);
    onClose();
  };

  return (
    <>
      {!showAvatarModal && !showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-fade-in">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-5">
              ✏️ Modifier le Profil
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition"
              >
                Changer l’avatar
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition"
              >
                Changer le mot de passe
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={closeAndReset}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarModal && (
        <AvatarSelectionModal
          currentAvatar={currentAvatar}
          onClose={handleCloseAvatarModal}
          onAvatarSelected={handleAvatarSelected}
          isOpen={true}
        />
      )}

      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
};

export default ProfileEditOptionsModal;
