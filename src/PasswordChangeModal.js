// src/PasswordChangeModal.js
import React, { useState } from 'react';
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { toast } from 'react-toastify';

const PasswordChangeModal = ({ onClose, embedded = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Aucun utilisateur connecté.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success("Mot de passe mis à jour avec succès !");
      onClose();
    } catch (error) {
      console.error("Erreur de mise à jour du mot de passe:", error);
      if (error.code === 'auth/wrong-password') {
        toast.error("Mot de passe actuel incorrect.");
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error("Veuillez vous reconnecter pour changer votre mot de passe.");
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 animate-fade-in mx-auto">
      <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
        🔒 Changer le mot de passe
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Mot de passe actuel
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 shadow-sm p-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 shadow-sm p-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 shadow-sm p-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow transition"
          >
            {loading ? 'Mise à jour...' : 'Changer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-full shadow transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      {content}
    </div>
  );
};

export default PasswordChangeModal;
