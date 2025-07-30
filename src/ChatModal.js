// src/ChatModal.js
import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';

const ChatModal = ({ currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null); // Pour le défilement automatique

  // Écouteur en temps réel pour les messages
  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'), limit(50)); // Limite à 50 derniers messages
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    }, (error) => {
      toast.error("Erreur lors du chargement des messages du chat.");
      console.error("Error fetching chat messages:", error);
    });

    return () => unsubscribe(); // Nettoyage de l'écouteur
  }, []);

  // Défilement automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') {
      toast.warn("Le message ne peut pas être vide.");
      return;
    }

    try {
      await addDoc(collection(db, 'chat_messages'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userAvatar: currentUser.avatar || '👤', // Conserve l'avatar dans la BDD au cas où vous voudriez l'afficher plus tard
        text: newMessage,
        timestamp: serverTimestamp() // Utilise le timestamp du serveur
      });
      setNewMessage('');
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message.");
      console.error("Error sending message:", error);
    }
  };

  return (
    // z-index: 50 pour la modale principale du chat
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-xl text-center animate-fade-in-scale border border-primary/20 mx-auto flex flex-col h-[80vh]">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Chat Communautaire 💬</h3>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 mb-4 bg-neutralBg rounded-lg border border-gray-200">
          {messages.length === 0 ? (
            <p className="text-lightText text-center py-4">Aucun message pour le moment. Soyez le premier à discuter !</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start mb-3 ${msg.userId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar supprimé ici pour une interface plus épurée */}
                <div
                  className={`p-3 rounded-lg max-w-[75%] ${
                    msg.userId === currentUser.uid
                      ? 'bg-primary text-white rounded-tr-none' // Bulle de l'utilisateur actuel
                      : 'bg-white text-text rounded-tl-none border border-gray-200' // Bulle des autres utilisateurs
                  } shadow-md`}
                >
                  <p className="font-semibold text-sm mb-1">
                    {msg.userId === currentUser.uid ? 'Vous' : msg.userName}
                  </p>
                  <p className="text-sm break-words">{msg.text}</p>
                  {msg.timestamp && (
                    <span className={`block text-xs mt-1 ${msg.userId === currentUser.uid ? 'text-white/70' : 'text-lightText'}`}>
                      {new Date(msg.timestamp.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Élément pour le défilement */}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-sm"
          >
            Envoyer
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Fermer le Chat
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
