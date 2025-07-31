// src/ChatFloatingButton.js
// Bouton flottant pour ouvrir le chat, affichant le nombre de messages non lus.
// Mis à jour pour utiliser Supabase.

import React, { useState } from 'react';
import ChatModal from './ChatModal'; // Assurez-vous que ChatModal est également mis à jour pour Supabase

const ChatFloatingButton = ({ currentUser, supabase }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Le comptage des messages non lus est maintenant géré dans UserContext et passé via useUser()
  // Ici, on utilise simplement la prop `unreadMessagesCount` du contexte.
  const { unreadMessagesCount, markMessagesAsRead } = currentUser ? supabase.auth.currentUser : { unreadMessagesCount: 0, markMessagesAsRead: () => {} };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (unreadMessagesCount > 0) {
      markMessagesAsRead(); // Marque les messages comme lus quand le chat est ouvert
    }
  };

  if (!currentUser) {
    return null; // N'affiche pas le bouton si l'utilisateur n'est pas connecté
  }

  return (
    <>
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-xl 
                   hover:bg-secondary transition duration-300 ease-in-out transform hover:scale-110 
                   flex items-center justify-center z-50"
        aria-label="Ouvrir le chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 sm:h-8 sm:w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        {unreadMessagesCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadMessagesCount}
          </span>
        )}
      </button>

      {isChatOpen && (
        <ChatModal
          onClose={() => setIsChatOpen(false)}
          currentUser={currentUser}
          supabase={supabase}
        />
      )}
    </>
  );
};

export default ChatFloatingButton;
