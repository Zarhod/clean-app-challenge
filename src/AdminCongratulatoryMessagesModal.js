// src/AdminCongratulatoryMessagesModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext'; // Pour db et isAdmin

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const { db, isAdmin } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'congratulatory_messages'), (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
      setLoading(false);
    }, (error) => {
      toast.error("Erreur lors du chargement des messages de félicitation.");
      console.error("Error fetching congratulatory messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

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
    try {
      await addDoc(collection(db, 'congratulatory_messages'), {
        Texte_Message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewMessage('');
      toast.success("Message ajouté avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'ajout du message.");
      console.error("Error adding message:", error);
    } finally {
      setLoading(false);
    }
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
    try {
      await deleteDoc(doc(db, 'congratulatory_messages', messageId));
      toast.success("Message supprimé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la suppression du message.");
      console.error("Error deleting message:", error);
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setMessageToDelete(null);
    }
  }, [isAdmin, db]);

  return (
    <>
      <ListAndInfoModal title="Gérer les Messages de Félicitation" onClose={onClose} sizeClass="max-w-lg">
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-2"
            rows="3"
            placeholder="Ajouter un nouveau message de félicitation..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          ></textarea>
          <button
            onClick={handleAddMessage}
            disabled={loading || newMessage.trim() === ''}
            className="w-full bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter le Message'}
          </button>
        </div>

        <h3 className="text-xl font-bold text-secondary mb-3 text-center">Messages Actuels</h3>
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
            <p className="ml-3 text-lightText">Chargement des messages...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
            {messages.length === 0 ? (
              <p className="text-center text-lightText text-md">Aucun message de félicitation configuré.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm border border-neutralBg/50">
                  <p className="text-text text-sm flex-1 mr-2">{msg.Texte_Message}</p>
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
      </ListAndInfoModal>

      {showConfirmDeleteModal && (
        <ConfirmActionModal
          title="Confirmer la Suppression"
          message="Êtes-vous sûr de vouloir supprimer ce message de félicitation ? Cette action est irréversible."
          confirmText="Oui, Supprimer"
          confirmButtonClass="bg-error hover:bg-red-700"
          cancelText="Non, Annuler"
          onConfirm={() => handleDeleteMessage(messageToDelete, true)}
          onCancel={() => { setShowConfirmDeleteModal(false); setMessageToDelete(null); }}
          loading={loading}
        />
      )}
    </>
  );
};

export default AdminCongratulatoryMessagesModal;
