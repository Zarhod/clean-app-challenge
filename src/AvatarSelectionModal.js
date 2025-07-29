// src/AvatarSelectionModal.js
import React, { useState } from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Assurez-vous que ce chemin est correct

const avatars = ['😀', '😂', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🦋', '🐢', '🐍', '🐉', '🐳', '🐬', '🐠', '🐙', '🦀', '🦞', '🦐', '🦑', '🐡', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🦅', '🦆', '🦢', '🦩', '🦜', '🐦', '🐧', '🦉', '🦚', '🦃', '🐓', '🐔', '🐣', '🐤', '🐥', '👶', '👦', '👧', '🧑', '👨', '👩', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧟', '🧞', '👨‍🦯', '👩‍🦯', '👨‍🦼', '👩‍🦼', '👨‍🦽', '👩‍🦽', '🗣️', '👤', '👥', '🫂'];

const AvatarSelectionModal = ({ currentAvatar, onClose, onSave }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSave = () => {
    onSave(selectedAvatar);
  };

  return (
    <ListAndInfoModal title="Sélectionner un Avatar" onClose={onClose} sizeClass="max-w-xs sm:max-w-md">
      <div className="text-center mb-4">
        <p className="text-lg text-gray-700 mb-2">Votre avatar actuel:</p>
        <span className="text-5xl">{currentAvatar}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Choisissez un nouvel avatar:</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-gray-50 custom-scrollbar">
          {avatars.map((avatar, index) => (
            <div
              key={index}
              className={`flex items-center justify-center text-3xl p-1.5 rounded-full cursor-pointer transition-all duration-200
                          ${selectedAvatar === avatar ? 'bg-primary text-white scale-110 shadow-lg' : 'hover:bg-gray-200'}`}
              onClick={() => setSelectedAvatar(avatar)}
            >
              {avatar}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-xs mt-2">Nouvel avatar sélectionné: <span className="text-xl align-middle">{selectedAvatar}</span></p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
          disabled={selectedAvatar === currentAvatar}
        >
          Enregistrer
        </button>
      </div>
    </ListAndInfoModal>
  );
};

export default AvatarSelectionModal;
