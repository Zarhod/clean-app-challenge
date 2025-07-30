// src/ChatFloatingButton.js
import React, { useState } from 'react';
import ChatModal from './ChatModal'; // Importe la modale de chat

const ChatFloatingButton = ({ currentUser }) => {
  const [showChatModal, setShowChatModal] = useState(false);

  if (!currentUser) {
    return null; // Ne pas afficher le bouton si l'utilisateur n'est pas connecté
  }

  return (
    <>
      <button
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-secondary text-white p-4 rounded-full shadow-xl 
                   transition duration-300 ease-in-out transform hover:scale-110 z-40
                   flex items-center justify-center text-2xl sm:text-3xl font-bold"
        aria-label="Ouvrir le chat"
      >
        💬
      </button>

      {showChatModal && (
        <ChatModal
          currentUser={currentUser}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </>
  );
};

export default ChatFloatingButton;
