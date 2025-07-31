import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { collection, query, orderBy, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore'; // serverTimestamp supprimé
import { toast } from 'react-toastify';

const ChatModal = ({ onClose }) => {
  const { currentUser, db, setCurrentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Marque tous les messages comme lus lorsque le chat est ouvert
  useEffect(() => {
    if (currentUser && db) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const now = new Date().toISOString();
      updateDoc(userDocRef, { lastReadTimestamp: now })
        .then(() => {
          setCurrentUser(prevUser => ({ ...prevUser, lastReadTimestamp: now }));
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour du timestamp de lecture:", error);
        });
    }
  }, [currentUser, db, setCurrentUser]);

  // Écouteur de messages en temps réel
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'chat_messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setLoading(false);
    }, (error) => {
      toast.error("Erreur lors du chargement des messages.");
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Défilement vers le bas après le chargement des messages ou l'envoi d'un nouveau message
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
        senderPhotoURL: currentUser.photoURL || null,
        timestamp: new Date().toISOString(), // Utilise ISO string pour la compatibilité
      });
      setNewMessage('');
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message.");
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg h-[90vh] flex flex-col justify-between animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4 text-center">Chat Général</h3>

        {/* Zone d'affichage des messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 mb-4 bg-neutralBg rounded-lg border border-gray-200 flex flex-col space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-lightText text-md flex-grow flex items-center justify-center">Aucun message pour le moment. Soyez le premier à envoyer un message !</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== currentUser?.uid && (
                  msg.senderPhotoURL ? (
                    <img src={msg.senderPhotoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-2xl flex-shrink-0">{msg.senderAvatar || '👤'}</span>
                  )
                )}
                <div className={`p-3 rounded-xl shadow-sm max-w-[75%] ${msg.senderId === currentUser?.uid ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-text rounded-bl-none'}`}>
                  <p className="font-semibold text-sm mb-1">{msg.senderName || 'Anonyme'}</p>
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === currentUser?.uid ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.senderId === currentUser?.uid && (
                  currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-2xl flex-shrink-0">{currentUser.avatar || '👤'}</span>
                  )
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
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
