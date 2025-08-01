import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext';
import { supabase } from './supabaseClient';

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const { isAdmin } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
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

    fetchMessages();

    const subscription = supabase
      .channel('congratulatory_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'congratulatory_messages' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAddMessage = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (newMessage.trim() === '') {
      toast.warn("Le message ne peut pas être vide.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('congratulatory_messages')
      .insert({
        Texte_Message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      });

    if (error) {
      toast.error("Erreur lors de l'ajout du message.");
      console.error(error);
    } else {
      toast.success("Message ajouté avec succès !");
      setNewMessage('');
    }
    setLoading(false);
  };

  const handleDeleteMessage = useCallback(async (messageId, skipConfirmation = false) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }

    if (!skipConfirmation) {
      setMessageToDelete(messageId);
      setShowConfirmDeleteModal(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('congratulatory_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error("Erreur lors de la suppression du message.");
      console.error(error);
    } else {
      toast.success("Message supprimé avec succès !");
    }

    setLoading(false);
    setShowConfirmDeleteModal(false);
    setMessageToDelete(null);
  }, [isAdmin]);

  return (
    <ListAndInfoModal
      title="Messages de félicitation"
      items={messages}
      loading={loading}
      onClose={onClose}
      onAdd={handleAddMessage}
      onDelete={handleDeleteMessage}
      newItemValue={newMessage}
      onNewItemChange={(e) => setNewMessage(e.target.value)}
      placeholder="Ajouter un nouveau message"
    >
      {showConfirmDeleteModal && (
        <ConfirmActionModal
          message="Voulez-vous vraiment supprimer ce message ?"
          onConfirm={() => handleDeleteMessage(messageToDelete, true)}
          onCancel={() => {
            setShowConfirmDeleteModal(false);
            setMessageToDelete(null);
          }}
        />
      )}
    </ListAndInfoModal>
  );
};

export default AdminCongratulatoryMessagesModal;
