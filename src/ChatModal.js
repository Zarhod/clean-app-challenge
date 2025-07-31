// src/ChatModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { collection, query, orderBy, addDoc, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const emojiReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🥳', '✨'];

const ChatModal = ({ onClose }) => {
  const { currentUser, db, setCurrentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null); // Pour le défilement automatique

  // Fonction pour faire défiler vers le bas des messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Marque tous les messages comme lus lorsque le chat est ouvert
  useEffect(() => {
    if (currentUser && db) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const now = new Date().toISOString();
      // Met à jour le timestamp de dernière lecture de l'utilisateur
      updateDoc(userDocRef, { lastReadTimestamp: now })
        .then(() => {
          // Met à jour le currentUser dans le contexte après la mise à jour Firestore
          setCurrentUser(prevUser => ({ ...prevUser, lastReadTimestamp: now }));
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour du timestamp de lecture:", error);
          // toast.error("Erreur lors de la mise à jour du statut de lecture."); // Désactivé pour ne pas spammer
        });
    }
  }, [currentUser, db, setCurrentUser]); // setCurrentUser est une dépendance stable du contexte

  // Écoute des messages en temps réel
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() // Convertir le timestamp Firestore en ISO string
      }));
      setMessages(fetchedMessages);
      setLoading(false);
      scrollToBottom(); // Défile vers le bas après le chargement initial et les nouvelles messages
    }, (error) => {
      console.error("Erreur lors du chargement des messages du chat:", error);
      toast.error("Erreur lors du chargement des messages du chat.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Défile vers le bas chaque fois que les messages sont mis à jour
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !db) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderAvatar: currentUser.avatar || '👤',
        senderPhotoURL: currentUser.photoURL || null, // Ajout de photoURL
        timestamp: serverTimestamp(), // Utilise le timestamp du serveur
        reactions: {} // Initialise les réactions
      });
      setNewMessage('');
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message.");
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    if (!currentUser || !db) {
      toast.error("Vous devez être connecté pour réagir.");
      return;
    }
    const messageRef = doc(db, 'chat_messages', messageId);
    const message = messages.find(msg => msg.id === messageId);

    if (message) {
      const currentReactions = message.reactions || {};
      const userReactionKey = currentUser.uid;

      // Si l'utilisateur a déjà réagi avec cet emoji, retire la réaction
      if (currentReactions[emoji] && currentReactions[emoji].includes(userReactionKey)) {
        const updatedUsers = currentReactions[emoji].filter(id => id !== userReactionKey);
        if (updatedUsers.length === 0) {
          delete currentReactions[emoji]; // Supprime l'emoji si plus personne ne l'utilise
        } else {
          currentReactions[emoji] = updatedUsers;
        }
      } else {
        // Ajoute la réaction
        currentReactions[emoji] = [...(currentReactions[emoji] || []), userReactionKey];
      }

      try {
        await updateDoc(messageRef, { reactions: currentReactions });
      } catch (error) {
        console.error("Error updating reaction:", error);
        toast.error("Erreur lors de l'ajout de la réaction.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[999] p-4">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-lg h-[90vh] flex flex-col text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">Chat Général</h3>

        {/* Zone d'affichage des messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 mb-4 rounded-lg bg-neutralBg border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-lightText text-md">Aucun message pour le moment. Soyez le premier à envoyer un message !</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex items-start mb-4 ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== currentUser?.uid && ( // Avatar du destinataire à gauche
                  msg.senderPhotoURL ? (
                    <img src={msg.senderPhotoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0" />
                  ) : (
                    <span className="text-3xl mr-2 flex-shrink-0">{msg.senderAvatar || '👤'}</span>
                  )
                )}
                <div className={`chat-message-bubble max-w-[75%] p-3 rounded-xl shadow-sm relative ${msg.senderId === currentUser?.uid ? 'bg-primary/90 text-white rounded-br-none' : 'bg-white/90 text-text rounded-bl-none'}`}>
                  <p className="font-semibold text-sm mb-1" style={{ color: msg.senderId === currentUser?.uid ? 'white' : 'var(--color-primary)' }}>
                    {msg.senderName}
                  </p>
                  <p className="text-sm break-words" style={{ color: msg.senderId === currentUser?.uid ? 'white' : 'var(--color-text)' }}>{msg.text}</p>
                  {msg.timestamp && (
                    <p className="text-xs text-right mt-1" style={{ color: msg.senderId === currentUser?.uid ? 'rgba(255,255,255,0.7)' : 'var(--color-light-text)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {/* Affichage des réactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="absolute -bottom-3 -right-1 flex flex-wrap gap-0.5 bg-neutralBg rounded-full px-1 py-0.5 shadow-md border border-gray-200">
                      {Object.entries(msg.reactions).map(([emoji, usersReacted]) => usersReacted.length > 0 && (
                        <span key={emoji} className="text-xs" title={`${usersReacted.length} personnes ont réagi avec ${emoji}`}>
                          {emoji} {usersReacted.length}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Boutons de réaction */}
                  {currentUser && (
                    <div className="absolute -top-3 -left-1 flex flex-wrap gap-0.5 bg-neutralBg rounded-full px-1 py-0.5 shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {emojiReactions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={(e) => { e.stopPropagation(); handleAddReaction(msg.id, emoji); }}
                          className="text-xs p-0.5 hover:scale-125 transition-transform"
                          title={`Réagir avec ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.senderId === currentUser?.uid && ( // Avatar de l'expéditeur à droite
                  msg.senderPhotoURL ? (
                    <img src={msg.senderPhotoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover ml-2 flex-shrink-0" />
                  ) : (
                    <span className="text-3xl ml-2 flex-shrink-0">{msg.senderAvatar || '👤'}</span>
                  )
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Élément factice pour le défilement automatique */}
        </div>

        {/* Zone de saisie de message */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none custom-scrollbar bg-neutralBg text-text"
            rows="2"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading || !currentUser}
          ></textarea>
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-xl shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex-shrink-0"
            disabled={loading || newMessage.trim() === '' || !currentUser}
          >
            Envoyer
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm self-center"
        >
          Fermer le Chat
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
