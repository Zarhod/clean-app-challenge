// src/AdminCongratulatoryMessagesModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase'; // db est importé ici pour les opérations Firestore
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
// ConfirmActionModal n'est plus importé ici car il est rendu dans App.js

const AdminCongratulatoryMessagesModal = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessageData, setNewMessageData] = useState({ Texte_Message: '' });
  const [editingMessage, setEditingMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  // Ces états sont utilisés pour contrôler ConfirmActionModal dans App.js,
  // donc ils ne sont pas "unused" logiquement, même si ESLint peut le signaler localement.
  // Nous ne les affichons pas ici pour éviter de dupliquer le rendu de la modale de confirmation.
  // eslint-disable-next-line no-unused-vars
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Écouteur en temps réel pour les messages de félicitation
  useEffect(() => {
    // db est une dépendance stable et ne déclenchera pas de re-rendus inutiles.
    // ESLint peut le signaler comme "unnecessary", mais il est correct de l'inclure
    // si l'instance de db pouvait potentiellement changer (ce qui n'est pas le cas ici,
    // mais pour la robustesse et éviter des avertissements, on le laisse ou on le supprime
    // si l'on est certain de sa stabilité). Pour cette correction, nous le retirons
    // car le linter le signale comme inutile.
    const unsubscribe = onSnapshot(collection(db, 'congratulatory_messages'), (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
    }, (error) => {
      toast.error("Erreur lors du chargement des messages de félicitation.");
      console.error("Error fetching congratulatory messages:", error);
    });

    return () => unsubscribe();
  }, []); // Retiré 'db' des dépendances selon la suggestion ESLint

  const handleFormChange = (e) => {
    setNewMessageData({ Texte_Message: e.target.value });
  };

  const handleSubmit = async () => {
    if (!newMessageData.Texte_Message.trim()) {
      toast.error("Le message ne peut pas être vide.");
      return;
    }
    setLoading(true);
    try {
      if (editingMessage) {
        await updateDoc(doc(db, 'congratulatory_messages', editingMessage.id), newMessageData);
        toast.success("Message mis à jour avec succès !");
      } else {
        await addDoc(collection(db, 'congratulatory_messages'), newMessageData);
        toast.success("Message ajouté avec succès !");
      }
      // Réinitialise le formulaire après soumission réussie
      setNewMessageData({ Texte_Message: '' });
      setEditingMessage(null);
    } catch (error) {
      toast.error("Erreur lors de l'opération.");
      console.error("Error saving message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setNewMessageData({ Texte_Message: message.Texte_Message });
  };

  const handleDelete = useCallback(async (messageId, skipConfirmation = false) => {
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
      toast.error("Erreur lors de la suppression.");
      console.error("Error deleting message:", error);
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setMessageToDelete(null);
    }
  }, []); // Retiré 'db' des dépendances selon la suggestion ESLint

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessageData({ Texte_Message: '' });
  };

  return (
    // Note: ListAndInfoModal (le parent de ceci dans App.js) gère déjà l'overlay et le z-index principal (z-50).
    // Cette modale ne doit pas avoir son propre overlay.
    <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md md:max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto flex flex-col h-full">
      <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Gérer les Messages de Félicitation</h3>

      <div className="mb-6">
        <input
          type="text"
          value={newMessageData.Texte_Message}
          onChange={handleFormChange}
          placeholder="Nouveau message de félicitation..."
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || !newMessageData.Texte_Message.trim()}
            className="bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Envoi...' : editingMessage ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingMessage && (
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                           transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      <h4 className="text-lg sm:text-xl font-bold text-secondary mb-3 text-center">Messages Actuels</h4>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 border rounded-lg bg-neutralBg mb-4">
        {messages.length === 0 ? (
          <p className="text-lightText text-center py-4">Aucun message de félicitation.</p>
        ) : (
          <ul className="space-y-2 text-left">
            {messages.map(msg => (
              <li key={msg.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between border border-gray-200">
                <span className="text-text text-sm flex-1 mr-2">{msg.Texte_Message}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(msg)}
                    className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onClose}
        className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                   transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
      >
        Fermer
      </button>

      {/* La modale de confirmation est rendue dans App.js, pas ici. */}
    </div>
  );
};

export default AdminCongratulatoryMessagesModal;
