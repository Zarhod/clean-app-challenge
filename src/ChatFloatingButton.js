// src/ChatFloatingButton.js
import React, { useState } from 'react';
import ChatModal from './ChatModal'; // Importe la nouvelle ChatModal

const ChatFloatingButton = ({ currentUser }) => {
  const [showChatModal, setShowChatModal] = useState(false);

  // Le bouton ne s'affiche que si l'utilisateur est connecté
  if (!currentUser) {
    return null; 
  }

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat */}
      <button
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 bg-accent hover:bg-yellow-600 text-white p-4 rounded-full shadow-xl
                   transition duration-300 ease-in-out transform hover:scale-110 z-[999] flex items-center justify-center text-2xl"
        aria-label="Ouvrir le chat"
      >
        💬
      </button>

      {/* La modale du chat est rendue conditionnellement */}
      {showChatModal && (
        <ChatModal onClose={() => setShowChatModal(false)} />
      )}
    </>
  );
};

export default ChatFloatingButton;
