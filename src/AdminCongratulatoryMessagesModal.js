import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext';
import { supabase } from './supabase';

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const { isAdmin } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('congratulatory_messages')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des messages.");
      console.error(error);
    } else {
      setMessages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('congratulatory_messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'congratulatory_messages' },
        fetchMessages
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddMessage = async () => {
    if (!isAdmin) {
      toast.error("Action réservée aux administrateurs.");
      return;
    }

    if (newMessage.trim() === '') {
      toast.warn("Veuillez écrire un message.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('congratulatory_messages').insert([
      {
        Texte_Message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);

    if (error) {
      toast.error("Erreur lors de l'ajout.");
      console.error(error);
    } else {
      toast.success("Message ajouté !");
      setNewMessage('');
      fetchMessages();
    }

    setLoading(false);
  };

  const handleDeleteMessage = useCallback(
    async (id, confirmed = false) => {
      if (!isAdmin) {
        toast.error("Action réservée aux administrateurs.");
        return;
      }

      if (!confirmed) {
        setMessageToDelete(id);
        setShowConfirmDeleteModal(true);
        return;
      }

      setLoading(true);

      const { error } = await supabase
        .from('congratulatory_messages')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Erreur lors de la suppression.");
        console.error(error);
      } else {
        toast.success("Message supprimé.");
        setShowConfirmDeleteModal(false);
        setMessageToDelete(null);
        fetchMessages();
      }

      setLoading(false);
    },
    [isAdmin]
  );

  return (
    <>
      <ListAndInfoModal title="Messages de Félicitations" onClose={onClose} sizeClass="max-w-lg">
        <div className="mb-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 text-sm mb-2"
            rows="3"
            placeholder="Ajouter un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAddMessage}
            disabled={loading || newMessage.trim() === ''}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>

        <h3 className="text-xl font-bold text-center mb-3">Messages existants</h3>

        {loading ? (
          <div className="text-center">Chargement...</div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">Aucun message pour le moment.</p>
        ) : (
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((msg) => (
              <li key={msg.id} className="bg-white rounded p-3 shadow flex justify-between items-center">
                <span className="text-sm text-gray-800">{msg.Texte_Message}</span>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </ListAndInfoModal>

      {showConfirmDeleteModal && (
        <ConfirmActionModal
          title="Confirmation"
          message="Confirmer la suppression de ce message ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          loading={loading}
          onConfirm={() => handleDeleteMessage(messageToDelete, true)}
          onCancel={() => {
            setShowConfirmDeleteModal(false);
            setMessageToDelete(null);
          }}
        />
      )}
    </>
  );
};

export default AdminCongratulatoryMessagesModal;
