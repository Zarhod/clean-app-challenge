// src/AdminUserManagementModal.js
// Ce composant permet aux administrateurs de gérer les utilisateurs (réinitialiser les points, changer les rôles).
// Mis à jour pour utiliser Supabase.

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext'; // Pour accéder à supabase et currentUser

const AdminUserManagementModal = ({ onClose, realisations }) => {
  const { supabase, currentUser, isAdmin, setCurrentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToReset, setUserToReset] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToToggleAdmin, setUserToToggleAdmin] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) throw error;

      // Calculer les points hebdomadaires et cumulatifs à jour pour chaque utilisateur
      const updatedUsers = data.map(user => {
        const userRealisations = realisations.filter(real => real.userId === user.id);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay(); 
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
        const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        let currentWeeklyPoints = 0;
        let currentTotalCumulativePoints = 0;

        userRealisations.forEach(real => {
          const realDate = new Date(real.timestamp);
          realDate.setHours(0, 0, 0, 0);
          
          if (realDate >= startOfCurrentWeek) {
            currentWeeklyPoints += parseFloat(real.pointsGagnes || 0);
          }
          currentTotalCumulativePoints += parseFloat(real.pointsGagnes || 0);
        });

        return {
          ...user,
          weekly_points: currentWeeklyPoints,
          total_cumulative_points: currentTotalCumulativePoints,
        };
      });

      setUsers(updatedUsers);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs Supabase:", err);
      toast.error(`Erreur lors du chargement des utilisateurs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, realisations]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      // Optionnel: Écouter les changements en temps réel sur la table 'users' si nécessaire
      // const channel = supabase.channel('users_changes')
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
      //     fetchUsers(); // Recharger les utilisateurs en cas de changement
      //   })
      //   .subscribe();
      // return () => supabase.removeChannel(channel);
    }
  }, [isAdmin, fetchUsers, supabase]);

  const handleResetPoints = async (user) => {
    if (!isAdmin) {
      toast.error("Accès refusé.");
      return;
    }
    setUserToReset(user);
  };

  const confirmResetPoints = async () => {
    if (!userToReset) return;
    setLoading(true);
    try {
      // Réinitialiser les points de l'utilisateur dans la table 'users'
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          weekly_points: 0, 
          total_cumulative_points: 0,
          previous_weekly_points: userToReset.weekly_points, // Conserver l'ancien score hebdomadaire
          xp: 0, // Réinitialiser l'XP et le niveau aussi
          level: 1
        })
        .eq('id', userToReset.id);
      if (userUpdateError) throw userUpdateError;

      // Supprimer les réalisations de cet utilisateur
      const { error: realisationsDeleteError } = await supabase
        .from('realizations')
        .delete()
        .eq('user_id', userToReset.id);
      if (realisationsDeleteError) throw realisationsDeleteError;

      toast.success(`Points et réalisations de ${userToReset.display_name} réinitialisés !`);
      setUserToReset(null);
      fetchUsers(); // Recharger la liste des utilisateurs
    } catch (err) {
      console.error("Erreur lors de la réinitialisation des points Supabase:", err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!isAdmin) {
      toast.error("Accès refusé.");
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      // Supprimer les réalisations de l'utilisateur
      const { error: realisationsDeleteError } = await supabase
        .from('realizations')
        .delete()
        .eq('user_id', userToDelete.id);
      if (realisationsDeleteError) throw realisationsDeleteError;

      // Supprimer les messages de chat de l'utilisateur
      const { error: chatMessagesDeleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userToDelete.id);
      if (chatMessagesDeleteError) throw chatMessagesDeleteError;

      // Supprimer l'utilisateur de la table 'users'
      const { error: userTableDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);
      if (userTableDeleteError) throw userTableDeleteError;

      // Supprimer l'utilisateur de Supabase Auth
      // Note: Seuls les utilisateurs avec un rôle 'service_role' peuvent supprimer des utilisateurs via l'API.
      // Si cette fonction est appelée côté client, elle peut échouer si les règles RLS ne sont pas configurées pour cela.
      // Pour les applications client-side, il est souvent préférable de "désactiver" l'utilisateur plutôt que de le supprimer complètement d'Auth.
      // Pour une suppression complète, cela nécessiterait une fonction Supabase Edge Function ou un backend.
      // Pour l'instant, nous nous contentons de la suppression de la table 'users' et des données associées.
      // Si vous voulez supprimer l'utilisateur de Supabase Auth, vous devrez le faire manuellement dans le tableau de bord
      // ou implémenter une fonction Edge Function.
      // Exemple: await supabase.auth.admin.deleteUser(userToDelete.id); // Ceci nécessite une clé service_role, non exposée côté client.
      
      toast.success(`Utilisateur ${userToDelete.display_name} et ses données supprimés !`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur Supabase:", err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminStatus = async (user) => {
    if (!isAdmin || user.id === currentUser.uid) { // Un admin ne peut pas se retirer ses propres droits
      toast.error("Accès refusé ou action non autorisée.");
      return;
    }
    setUserToToggleAdmin(user);
  };

  const confirmToggleAdminStatus = async () => {
    if (!userToToggleAdmin) return;
    setLoading(true);
    try {
      const newAdminStatus = !userToToggleAdmin.is_admin;
      const { error } = await supabase
        .from('users')
        .update({ is_admin: newAdminStatus })
        .eq('id', userToToggleAdmin.id);
      if (error) throw error;

      toast.success(`Statut admin de ${userToToggleAdmin.display_name} mis à jour : ${newAdminStatus ? 'Admin' : 'Utilisateur'}.`);
      setUserToToggleAdmin(null);
      fetchUsers();
    } catch (err) {
      console.error("Erreur lors de la modification du statut admin Supabase:", err);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <ListAndInfoModal title="Gestion des Utilisateurs" onClose={onClose}>
        <p className="text-center text-error font-semibold">Accès refusé. Vous n'êtes pas administrateur.</p>
      </ListAndInfoModal>
    );
  }

  return (
    <ListAndInfoModal title="Gestion des Utilisateurs" onClose={onClose} sizeClass="max-w-full sm:max-w-md md:max-w-lg">
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="ml-3 text-lightText">Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucun utilisateur enregistré.</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="bg-neutralBg rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text text-lg truncate">{user.display_name || user.email}</p>
                  <p className="text-sm text-lightText">Email: {user.email}</p>
                  <p className="text-sm text-lightText">Points Hebdo: {user.weekly_points} | Cumulatif: {user.total_cumulative_points}</p>
                  <p className="text-sm text-lightText">Admin: {user.is_admin ? 'Oui' : 'Non'}</p>
                  <p className="text-xs text-lightText">ID: {user.id}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                  <button
                    onClick={() => handleResetPoints(user)}
                    className="bg-accent hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    disabled={loading}
                  >
                    Réinitialiser Points
                  </button>
                  <button
                    onClick={() => handleToggleAdminStatus(user)}
                    className={`font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs
                                ${user.is_admin ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    disabled={loading || user.id === currentUser.uid} // Empêche de se retirer ses propres droits
                  >
                    {user.is_admin ? 'Rétrograder' : 'Promouvoir Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs"
                    disabled={loading || user.id === currentUser.uid} // Empêche de se supprimer soi-même
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {userToReset && (
        <ConfirmActionModal
          title={`Réinitialiser les points de ${userToReset.display_name}?`}
          message="Cette action réinitialisera ses points hebdomadaires et cumulatifs à zéro et supprimera toutes ses réalisations. Voulez-vous continuer ?"
          confirmText="Oui, Réinitialiser"
          confirmButtonClass="bg-error hover:bg-red-700"
          cancelText="Annuler"
          onConfirm={confirmResetPoints}
          onCancel={() => setUserToReset(null)}
          loading={loading}
        />
      )}

      {userToDelete && (
        <ConfirmActionModal
          title={`Supprimer l'utilisateur ${userToDelete.display_name}?`}
          message="Cette action supprimera l'utilisateur de la base de données, toutes ses réalisations et messages de chat. Cette action est irréversible. Voulez-vous continuer ?"
          confirmText="Oui, Supprimer"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          cancelText="Annuler"
          onConfirm={confirmDeleteUser}
          onCancel={() => setUserToDelete(null)}
          loading={loading}
        />
      )}

      {userToToggleAdmin && (
        <ConfirmActionModal
          title={`Changer le statut admin de ${userToToggleAdmin.display_name}?`}
          message={`Voulez-vous ${userToToggleAdmin.is_admin ? 'rétrograder' : 'promouvoir'} ${userToToggleAdmin.display_name} ${userToToggleAdmin.is_admin ? 'au statut d\'utilisateur simple' : 'au statut d\'administrateur'}?`}
          confirmText="Oui, Confirmer"
          confirmButtonClass="bg-blue-600 hover:bg-blue-700"
          cancelText="Annuler"
          onConfirm={confirmToggleAdminStatus}
          onCancel={() => setUserToToggleAdmin(null)}
          loading={loading}
        />
      )}
    </ListAndInfoModal>
  );
};

export default AdminUserManagementModal;
