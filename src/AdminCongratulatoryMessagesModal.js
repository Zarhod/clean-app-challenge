// src/AdminCongratulatoryMessagesModal.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal'; // Assurez-vous que ce chemin est correct
import ConfirmActionModal from './ConfirmActionModal'; // Assurez-vous que ce chemin est correct

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null); // Message en cours d'édition
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "congratulatory_messages"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des messages.");
      console.error("Erreur fetchMessages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleAddOrUpdateMessage = async () => {
    if (!newMessage.trim()) {
      toast.warn("Le message ne peut pas être vide.");
      return;
    }

    setLoading(true);
    try {
      if (editingMessage) {
        // Mise à jour d'un message existant
        await updateDoc(doc(db, "congratulatory_messages", editingMessage.id), {
          Texte_Message: newMessage
        });
        toast.success("Message mis à jour avec succès !");
      } else {
        // Ajout d'un nouveau message
        await addDoc(collection(db, "congratulatory_messages"), {
          Texte_Message: newMessage
        });
        toast.success("Message ajouté avec succès !");
      }
      setNewMessage('');
      setEditingMessage(null);
      fetchMessages(); // Recharger les messages après modification/ajout
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du message.");
      console.error("Erreur saveMessage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setMessageToDelete(messageId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "congratulatory_messages", messageToDelete));
      toast.success("Message supprimé avec succès !");
      fetchMessages(); // Recharger les messages après suppression
    } catch (error) {
      toast.error("Erreur lors de la suppression du message.");
      console.error("Erreur deleteMessage:", error);
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setMessageToDelete(null);
    }
  };

  return (
    <ListAndInfoModal
      title="Gérer les Messages de Félicitation"
      onClose={onClose}
      sizeClass="max-w-full sm:max-w-md md:max-w-lg"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-primary mb-2">
          {editingMessage ? 'Modifier le Message' : 'Ajouter un Nouveau Message'}
        </h3>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Entrez votre message de félicitation..."
          rows="3"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y"
          disabled={loading}
        />
        <button
          onClick={handleAddOrUpdateMessage}
          disabled={loading || !newMessage.trim()}
          className="w-full bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm mt-3"
        >
          {loading ? 'Enregistrement...' : (editingMessage ? 'Mettre à jour' : 'Ajouter le Message')}
        </button>
        {editingMessage && (
          <button
            onClick={() => {
              setEditingMessage(null);
              setNewMessage('');
            }}
            disabled={loading}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm mt-2"
          >
            Annuler l'édition
          </button>
        )}
      </div>

      <h3 className="text-lg font-bold text-secondary mb-3 text-center">Messages Existants</h3>
      {loading && messages.length === 0 ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="ml-3 text-lightText">Chargement des messages...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <p className="text-center text-lightText text-md">Aucun message de félicitation n'a été ajouté.</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-lg p-3 shadow-sm border border-neutralBg/50 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <p className="text-text text-sm flex-1 mb-2 sm:mb-0">{msg.Texte_Message}</p>
                <div className="flex gap-2 flex-wrap justify-end sm:justify-start">
                  <button
                    onClick={() => {
                      setEditingMessage(msg);
                      setNewMessage(msg.Texte_Message);
                    }}
                    className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showConfirmDelete && (
        <ConfirmActionModal
          title="Confirmer la Suppression"
          message="Êtes-vous sûr de vouloir supprimer ce message de félicitation ? Cette action est irréversible."
          confirmText="Oui, Supprimer"
          cancelText="Non, Annuler"
          onConfirm={confirmDelete}
          onCancel={() => { setShowConfirmDelete(false); setMessageToDelete(null); }}
          loading={loading}
        />
      )}
    </ListAndInfoModal>
  );
};

export default AdminCongratulatoryMessagesModal;
