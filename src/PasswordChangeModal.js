import React, { useState } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Pour accéder à auth et currentUser

const PasswordChangeModal = ({ onClose }) => {
  const { auth, currentUser } = useUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      toast.error("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      if (!currentUser || !currentUser.email) {
        toast.error("Impossible de changer le mot de passe. Utilisateur non connecté ou email manquant.");
        setLoading(false);
        return;
      }

      // Re-authentifier l'utilisateur avec son mot de passe actuel
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Mettre à jour le mot de passe
      await updatePassword(currentUser, newPassword);

      toast.success("Votre mot de passe a été modifié avec succès !");
      onClose();
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      let errorMessage = "Erreur lors du changement de mot de passe. Veuillez réessayer.";
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = "Le mot de passe actuel est incorrect.";
          break;
        case 'auth/requires-recent-login':
          errorMessage = "Veuillez vous reconnecter pour changer votre mot de passe (session expirée).";
          break;
        case 'auth/weak-password':
          errorMessage = "Le nouveau mot de passe est trop faible. Veuillez en choisir un plus fort.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Problème de connexion réseau. Veuillez vérifier votre connexion.";
          break;
        default:
          errorMessage = `Erreur: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">
          Changer le Mot de Passe
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-text text-left mb-1">Mot de Passe Actuel</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Votre mot de passe actuel"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text text-left mb-1">Nouveau Mot de Passe</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-text text-left mb-1">Confirmer Nouveau Mot de Passe</label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-success hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin-fast mr-2"></div>
                Changement...
              </div>
            ) : (
              'Changer le Mot de Passe'
            )}
          </button>
        </form>

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
