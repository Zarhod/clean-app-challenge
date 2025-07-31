// src/AdminCongratulatoryMessagesModal.js
// Ce composant permet aux administrateurs de gérer les messages de félicitations.
// Mis à jour pour utiliser Supabase.

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext'; // Pour accéder à supabase et isAdmin

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const { supabase, isAdmin } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('congratulatory_messages')
        .select('*');
      if (error) throw error;
      setMessages(data);
    } catch (err) {
      console.error("Erreur lors du chargement des messages de félicitation Supabase:", err);
      toast.error(`Erreur lors du chargement des messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
      // Optionnel: Écouter les changements en temps réel sur la table 'congratulatory_messages'
      // const channel = supabase.channel('congrat_messages_changes')
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'congratulatory_messages' }, payload => {
      //     fetchMessages(); // Recharger les messages en cas de changement
      //   })
      //   .subscribe();
      // return () => supabase.removeChannel(channel);
    }
  }, [isAdmin, fetchMessages, supabase]);

  const handleAddMessage = async () => {
    if (!isAdmin) {
      toast.error("Accès refusé.");
      return;
    }
    if (!newMessageText.trim()) {
      toast.error("Le message ne peut pas être vide.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('congratulatory_messages')
        .insert({ texte_message: newMessageText.trim() });
      if (error) throw error;
      toast.success("Message ajouté avec succès !");
      setNewMessageText('');
      fetchMessages();
    } catch (err) {
      console.error("Erreur lors de l'ajout du message Supabase:", err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!isAdmin) {
      toast.error("Accès refusé.");
      return;
    }
    setMessageToDelete(messageId);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('congratulatory_messages')
        .delete()
        .eq('id', messageToDelete);
      if (error) throw error;
      toast.success("Message supprimé avec succès !");
      setMessageToDelete(null);
      fetchMessages();
    } catch (err) {
      console.error("Erreur lors de la suppression du message Supabase:", err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <ListAndInfoModal title="Gestion des Messages de Félicitation" onClose={onClose}>
        <p className="text-center text-error font-semibold">Accès refusé. Vous n'êtes pas administrateur.</p>
      </ListAndInfoModal>
    );
  }

  return (
    <ListAndInfoModal title="Gestion des Messages de Félicitation" onClose={onClose} sizeClass="max-w-full sm:max-w-md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-primary mb-2">Ajouter un nouveau message</h3>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-2"
          rows="3"
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder="Entrez un nouveau message de félicitation..."
          disabled={loading}
        ></textarea>
        <button
          onClick={handleAddMessage}
          disabled={loading || !newMessageText.trim()}
          className="w-full bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm"
        >
          {loading ? 'Ajout...' : 'Ajouter le Message'}
        </button>
      </div>

      <h3 className="text-lg font-bold text-secondary mb-3 text-center">Messages existants</h3>
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="ml-3 text-lightText">Chargement des messages...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar p-2 rounded-lg bg-neutralBg">
          {messages.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucun message de félicitation configuré.</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm border border-neutralBg/50">
                <p className="text-text text-sm flex-1 mr-2">{msg.texte_message}</p>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs flex-shrink-0"
                  disabled={loading}
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {messageToDelete && (
        <ConfirmActionModal
          title="Supprimer le Message ?"
          message="Êtes-vous sûr de vouloir supprimer ce message de félicitation ? Cette action est irréversible."
          confirmText="Oui, Supprimer"
          confirmButtonClass="bg-error hover:bg-red-700"
          cancelText="Annuler"
          onConfirm={confirmDeleteMessage}
          onCancel={() => setMessageToDelete(null)}
          loading={loading}
        />
      )}
    </ListAndInfoModal>
  );
};

export default AdminCongratulatoryMessagesModal;
