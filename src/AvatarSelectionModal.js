// src/AvatarSelectionModal.js
import React, { useState } from 'react';

const AvatarSelectionModal = ({ currentAvatar, onClose, onSave }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Liste d'emojis pour les avatars (curated pour ne pas être excessive)
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
    onSave(selectedAvatar); // onSave est géré par App.js pour mettre à jour Supabase et le contexte
  };

  return (
    // z-index: 50 pour la modale principale
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto flex flex-col h-[80vh]">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Sélectionner un Avatar</h3>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 mb-4 bg-neutralBg rounded-lg border border-gray-200 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {avatarOptions.map((avatar, index) => (
            <button
              key={index}
              onClick={() => setSelectedAvatar(avatar)}
              className={`p-2 rounded-lg text-3xl sm:text-4xl flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110
                          ${selectedAvatar === avatar ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-gray-100 text-text shadow-sm'}`}
            >
              {avatar}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
          >
            Enregistrer l'Avatar
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
