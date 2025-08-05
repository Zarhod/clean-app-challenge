// src/AdminCongratulatoryMessagesModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext';

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const { db, isAdmin } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      collection(db, 'congratulatory_messages'),
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(fetchedMessages);
        setLoading(false);
      },
      (error) => {
        toast.error("Erreur lors du chargement des messages.");
        console.error("Erreur snapshot:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  const handleAddMessage = async () => {
    if (!isAdmin) return toast.error("Accès refusé.");
    if (!newMessage.trim()) return toast.warn("Message vide.");
    setLoading(true);
    try {
      await addDoc(collection(db, 'congratulatory_messages'), {
        Texte_Message: newMessage.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewMessage('');
      toast.success("Message ajouté !");
    } catch (error) {
      toast.error("Erreur à l'ajout.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = useCallback(async (id, skip = false) => {
    if (!isAdmin) return toast.error("Accès refusé.");
    if (!skip) {
      setMessageToDelete(id);
      setShowConfirmDeleteModal(true);
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'congratulatory_messages', id));
      toast.success("Message supprimé !");
    } catch (error) {
      toast.error("Erreur suppression.");
      console.error(error);
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setMessageToDelete(null);
    }
  }, [db, isAdmin]);

  return (
    <>
      <ListAndInfoModal
        title="Messages de Félicitations"
        onClose={onClose}
        sizeClass="w-full max-w-[95vw] sm:max-w-lg md:max-w-xl h-[90vh] overflow-y-auto rounded-2xl p-6 animate-fade-in"
      >
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="Ajouter un nouveau message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAddMessage}
            disabled={loading || !newMessage.trim()}
            className="w-full mt-2 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter le Message'}
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-teal-500 mb-4 text-center">Messages Actuels</h3>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-fast"></div>
            <p className="ml-3 text-lightText text-sm sm:text-base">Chargement des messages...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {messages.length === 0 ? (
              <p className="text-center text-lightText text-sm">Aucun message configuré.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-200"
                >
                  <p className="text-text text-sm flex-1 mr-2">{msg.Texte_Message}</p>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-full shadow-sm transition duration-300 text-xs"
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
          message="Êtes-vous sûr de vouloir supprimer ce message ?"
          confirmText="Oui, Supprimer"
          confirmButtonClass="bg-error hover:bg-red-700"
          cancelText="Non, Annuler"
          onConfirm={() => handleDeleteMessage(messageToDelete, true)}
          onCancel={() => {
            setShowConfirmDeleteModal(false);
            setMessageToDelete(null);
          }}
          loading={loading}
        />
      )}
    </>
  );
};

export default AdminCongratulatoryMessagesModal;
