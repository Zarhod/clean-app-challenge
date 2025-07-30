// src/ChatModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { collection, query, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const ChatModal = ({ onClose }) => {
  const { currentUser, db } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null); // Pour le défilement automatique

  // Fonction pour faire défiler vers le bas des messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!db) return;

    // Requête pour obtenir les messages, triés par timestamp ascendant
    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'));
    
    // Écouteur en temps réel pour les messages
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setLoading(false);
      // Défilement vers le bas après le chargement/mise à jour des messages
      // Utiliser un timeout pour s'assurer que le DOM est mis à jour
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error("Erreur lors du chargement des messages du chat:", error);
      toast.error("Erreur lors du chargement des messages du chat.");
      setLoading(false);
    });

    // Nettoyage de l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, [db]); // Dépendance à 'db' pour re-configurer l'écouteur si 'db' change

  // Gère l'envoi d'un nouveau message
  const handleSendMessage = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    if (newMessage.trim() === '' || !currentUser || !db) return; // Ne rien faire si le message est vide ou l'utilisateur n'est pas connecté

    setNewMessage(''); // Efface l'entrée immédiatement pour une meilleure expérience utilisateur
    try {
      await addDoc(collection(db, 'chat_messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderAvatar: currentUser.avatar || '👤',
        messageText: newMessage.trim(),
        timestamp: serverTimestamp(), // Utilise le timestamp du serveur pour la cohérence
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Erreur lors de l'envoi du message.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg h-[90vh] flex flex-col animate-fade-in-scale border border-primary/20 mx-auto relative">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4 text-center">Chat Communautaire</h2>

        {/* Zone d'affichage des messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 mb-4 space-y-4 bg-neutralBg rounded-xl shadow-inner">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des messages...</p>
            </div>
          ) : (
            messages.length === 0 ? (
              <p className="text-center text-lightText text-md mt-4">Soyez le premier à envoyer un message !</p>
            ) : (
              messages.map((msg, index) => {
                const isMyMessage = msg.senderId === currentUser?.uid;
                // Convertit le timestamp Firestore en objet Date si disponible, sinon utilise une chaîne de chargement
                const messageTime = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Chargement...';

                return (
                  <div key={msg.id || index} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar de l'expéditeur (pour les messages des autres) */}
                    {!isMyMessage && (
                      <span className="text-3xl flex-shrink-0">{msg.senderAvatar || '👤'}</span>
                    )}
                    {/* Bulle de message */}
                    <div className={`flex flex-col max-w-[75%] p-3 rounded-xl shadow-md animate-fade-in-up 
                                     ${isMyMessage ? 'bg-primary text-white rounded-br-none' : 'bg-white text-text rounded-bl-none'}`}>
                      <span className={`text-xs font-semibold mb-1 ${isMyMessage ? 'text-white/80' : 'text-primary'}`}>
                        {msg.senderName}
                      </span>
                      <p className="text-sm break-words">
                        {msg.messageText}
                      </p>
                      <span className={`text-xs mt-1 self-end ${isMyMessage ? 'text-white/60' : 'text-gray-500'}`}>
                        {messageTime}
                      </span>
                    </div>
                    {/* Avatar de l'expéditeur (pour mes propres messages) */}
                    {isMyMessage && (
                      <span className="text-3xl flex-shrink-0">{msg.senderAvatar || '👤'}</span>
                    )}
                  </div>
                );
              })
            )
          )}
          <div ref={messagesEndRef} /> {/* Élément factice pour le défilement automatique */}
        </div>

        {/* Zone de saisie de message */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none custom-scrollbar"
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
