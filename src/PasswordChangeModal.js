import React, { useState } from 'react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';

const PasswordChangeModal = ({ onClose, currentUser }) => {
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
        setLoading(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      toast.success("Mot de passe mis à jour avec succès !");
      onClose();
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      let errorMessage = "Erreur lors de la mise à jour du mot de passe.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Le mot de passe actuel est incorrect.";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Veuillez vous reconnecter pour changer votre mot de passe.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Le nouveau mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ListAndInfoModal title="Changer le Mot de Passe" onClose={onClose} sizeClass="max-w-xs sm:max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-2"
            required
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </ListAndInfoModal>
  );
};

export default PasswordChangeModal;
