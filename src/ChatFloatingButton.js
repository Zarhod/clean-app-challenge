// src/ChatFloatingButton.js
import React, { useState, useEffect } from 'react';
import ChatModal from './ChatModal'; // Importe la nouvelle ChatModal
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ChatFloatingButton = ({ currentUser, db }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser || !db) {
      setUnreadCount(0); // Réinitialise le compteur si pas d'utilisateur ou de DB
      return;
    }

    // Récupère le timestamp de la dernière lecture de l'utilisateur
    const lastReadTimestamp = currentUser.lastReadTimestamp;

    // Requête pour les messages non lus
    // Si lastReadTimestamp est null, tous les messages sont considérés comme non lus
    const q = lastReadTimestamp
      ? query(collection(db, 'chat_messages'), where('timestamp', '>', lastReadTimestamp))
      : collection(db, 'chat_messages');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        const message = doc.data();
        // Ne compte pas les messages envoyés par l'utilisateur lui-même comme non lus
        if (message.senderId !== currentUser.uid) {
          count++;
        }
      });
      setUnreadCount(count);
    }, (error) => {
      console.error("Erreur lors du calcul des messages non lus:", error);
      setUnreadCount(0); // En cas d'erreur, réinitialise le compteur
    });

    return () => unsubscribe();
  }, [currentUser, db]); // Dépendances pour re-exécuter l'effet si l'utilisateur ou la DB changent

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
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* La modale du chat est rendue conditionnellement */}
      {showChatModal && (
        <ChatModal onClose={() => setShowChatModal(false)} />
      )}
    </>
  );
};

export default ChatFloatingButton;
