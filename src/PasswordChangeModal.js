// src/PasswordChangeModal.js
// Ce composant permet à l'utilisateur de changer son mot de passe via Supabase Auth.

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à Supabase

const PasswordChangeModal = ({ onClose, currentUser }) => {
  const { supabase } = useUser();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) { // Supabase par défaut requiert 6 caractères minimum
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      // Supabase n'a pas de méthode pour "réauthentifier" avec l'ancien mot de passe côté client
      // La méthode `updateUser` est utilisée pour changer le mot de passe de l'utilisateur actuellement connecté.
      const { error } = await supabase.auth.updateUser({ // data retiré
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Mot de passe mis à jour avec succès !");
      onClose();
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe Supabase:", error);
      let errorMessage = "Erreur lors de la mise à jour du mot de passe.";
      if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le nouveau mot de passe doit contenir au moins 6 caractères.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          Changer le Mot de Passe
        </h2>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <label htmlFor="newPassword" className="block text-text text-left font-medium mb-2 text-sm">Nouveau Mot de Passe</label>
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-7"
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-text text-left font-medium mb-2 text-sm">Confirmer le Nouveau Mot de Passe</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-7"
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full sm:w-auto bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Mise à jour...' : 'Changer le Mot de Passe'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
