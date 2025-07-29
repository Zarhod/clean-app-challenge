// src/AvatarSelectionModal.js
import React, { useState } from 'react';

const AvatarSelectionModal = ({ currentAvatar, onClose, onSave }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Liste d'emojis pour les avatars (curated)
  const avatarOptions = [
    '😀', '😁', '😂', '😇', '😈', '😉', '😊', '😍', '😎', '🤓', '🤔', '🤫', '😶', '😐', '🙄', '😴', '🥳', '🤩',
    '🤖', '👾', '👽', '👻', '🎃', '😺', '🐶', '🐱', '🦁', '🐯', '🐼', '🐸', '🐙', '🐠', '🦋', '🐝', '🐞', '🕷️',
    '🌳', '🌲', '🌴', '🌵', '🌱', '🌿', '🌸', '🌼', '🌻', '🌎', '🌈', '☀️', '⭐', '✨', '⚡️', '🔥', '💥', '💧',
    '🍎', '🍊', '🍌', '🍉', '🍓', '🍍', '🍕', '🍔', '🍟', '🍩', '🍪', '🎂', '☕️', '🍺', '🏆', '🥇', '🥈', '🥉',
    '⚽️', '🏀', '🎮', '🎲', '🧩', '📚', '🎨', '🎵', '✈️', '🚀', '🚗', '🚲', '🏠', '💡', '⏰', '🎁', '🎈', '🎉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '✅', '👍', '💪', '🧠', '👀', '👣', '👂', '👃',
    '🧑‍💻', '🧑‍🍳', '🧑‍🔧', '🧑‍🔬', '🧑‍🚀', '🧑‍🚒', '🧑‍🎤', '🧑‍🎨', '🧑‍🎓', '🧑‍🏫', '🧑‍⚖️', '🧑‍🌾', '🧑‍🏭', '🧑‍💼', '🧑‍👮', '🧑‍🕵️',
    '👨', '👩', '🧑', '👴', '👵', '👶', '👧', '👦', '🧑‍🤝‍🧑', '🫂', '🗣️', '👤'
  ];

  const handleSave = () => {
    onSave(selectedAvatar);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Sélectionner un Avatar</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 max-h-80 overflow-y-auto custom-scrollbar mb-6 p-2 border rounded-lg bg-neutralBg">
          {avatarOptions.map((avatar, index) => (
            <div
              key={index}
              className={`cursor-pointer p-2 rounded-lg transition duration-200 ease-in-out transform hover:scale-110 
                          ${selectedAvatar === avatar ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => setSelectedAvatar(avatar)}
            >
              <span className="text-2xl sm:text-3xl block text-center">{avatar}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
          >
            Enregistrer l'Avatar
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
