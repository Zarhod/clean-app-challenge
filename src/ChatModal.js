// src/ChatModal.js
// Modale de chat en temps réel, mise à jour pour utiliser Supabase.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Pour accéder à supabase et currentUser

const ChatModal = ({ onClose }) => {
  const { currentUser, supabase } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fonction pour faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Écoute les messages du chat en temps réel via Supabase
  useEffect(() => {
    if (!supabase) return;

    // Fonction de récupération initiale et de mise en place du listener
    const setupChatListener = async () => {
      setLoading(true);
      try {
        // Récupération des messages existants
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('timestamp', { ascending: true })
          .limit(100); // Limite le nombre de messages pour éviter des chargements trop lourds

        if (error) throw error;

        const mappedMessages = data.map(msg => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.user_name,
          userAvatar: msg.user_avatar,
          messageText: msg.message_text,
          timestamp: msg.timestamp,
        }));
        setMessages(mappedMessages);
        
      } catch (err) {
        console.error("Erreur lors du chargement des messages du chat Supabase:", err);
        toast.error("Erreur lors du chargement des messages du chat.");
      } finally {
        setLoading(false);
      }

      // S'abonne aux nouveaux messages via Realtime
      const channel = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
          const newMsg = payload.new;
          setMessages(prevMessages => [...prevMessages, {
            id: newMsg.id,
            userId: newMsg.user_id,
            userName: newMsg.user_name,
            userAvatar: newMsg.user_avatar,
            messageText: newMsg.message_text,
            timestamp: newMsg.timestamp,
          }]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupChatListener();

  }, [supabase]);

  // Fait défiler vers le bas à chaque nouveau message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: currentUser.uid,
          user_name: currentUser.displayName || currentUser.email,
          user_avatar: currentUser.avatar || '👤',
          message_text: newMessage.trim(),
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message Supabase:", error);
      toast.error("Erreur lors de l'envoi du message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg h-[90vh] flex flex-col animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4 text-center">
          Chat Communautaire
        </h2>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-neutralBg rounded-lg mb-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
              <p className="ml-3 text-lightText">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-lightText">Aucun message pour le moment. Soyez le premier !</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex items-start gap-3 ${msg.userId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
              >
                {msg.userId !== currentUser.uid && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {msg.userAvatar && msg.userAvatar.startsWith('http') ? (
                        <img src={msg.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span>{msg.userAvatar || '👤'}</span>
                    )}
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[80%] ${
                    msg.userId === currentUser.uid
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-accent text-text rounded-bl-none'
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">
                    {msg.userId === currentUser.uid ? 'Vous' : msg.userName}
                  </p>
                  <p className="text-sm break-words">{msg.messageText}</p>
                  <span className="text-xs opacity-75 block mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.userId === currentUser.uid && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {msg.userAvatar && msg.userAvatar.startsWith('http') ? (
                        <img src={msg.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span>{msg.userAvatar || '👤'}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Envoyer
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-full shadow-md 
                     transition duration-300 ease-in-out transform hover:scale-105 text-sm w-full"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
