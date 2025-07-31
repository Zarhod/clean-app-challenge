import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Pour db, currentUser, et isAdmin

const ChatModal = ({ onClose, onMarkMessagesAsRead }) => {
  const { db, currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Listen for chat messages
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'), limit(100)); // Limit to last 100 messages
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setLoading(false);
      scrollToBottom(); // Scroll to bottom on new messages
      if (currentUser) {
        onMarkMessagesAsRead(); // Mark messages as read when chat is open
      }
    }, (error) => {
      toast.error("Erreur lors du chargement des messages du chat.");
      console.error("Error fetching chat messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, onMarkMessagesAsRead]); // Added onMarkMessagesAsRead to dependencies

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') {
      toast.error("Le message ne peut pas être vide.");
      return;
    }
    if (!currentUser) {
      toast.error("Veuillez vous connecter pour envoyer un message.");
      return;
    }
    if (!db) {
      toast.error("Base de données non disponible.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        userId: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email,
        avatar: currentUser.photoURL || currentUser.avatar || '👤',
        text: newMessage.trim(),
        timestamp: serverTimestamp(), // Use server timestamp for consistency
      });
      setNewMessage('');
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message.");
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Envoyé...';
    // Firebase serverTimestamp is a special object, convert it to Date if it's not already
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-md animate-fade-in-scale border border-primary/20 mx-auto flex flex-col h-[90vh]">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4 text-center">Chat Global</h3>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 mb-4 bg-neutralBg rounded-lg border border-gray-100 flex flex-col space-y-3">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-lightText text-md">Aucun message pour le moment. Soyez le premier à saluer !</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.userId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                {msg.userId !== currentUser?.uid && (
                  <div className="flex-shrink-0">
                    {msg.avatar && msg.avatar.startsWith('http') ? (
                      <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <span className="text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">{msg.avatar || '👤'}</span>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-xl shadow-sm relative ${
                    msg.userId === currentUser?.uid
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-text rounded-bl-none border border-neutralBg'
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">
                    {msg.userId === currentUser?.uid ? 'Vous' : msg.displayName}
                  </p>
                  <p className="text-sm break-words">{msg.text}</p>
                  <span className={`absolute text-xs ${msg.userId === currentUser?.uid ? 'bottom-1 left-3 text-white/80' : 'bottom-1 right-3 text-lightText/80'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                {msg.userId === currentUser?.uid && (
                  <div className="flex-shrink-0">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-primary" />
                    ) : (
                      <span className="text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white">{currentUser?.avatar || '👤'}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Dummy div for scrolling */}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={loading || !currentUser}
          />
          <button
            type="submit"
            disabled={loading || !currentUser || newMessage.trim() === ''}
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Envoyer
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 text-md"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
