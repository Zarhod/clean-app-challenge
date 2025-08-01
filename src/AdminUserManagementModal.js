// src/AdminUserManagementModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { supabase } from './supabase';

const AdminUserManagementModal = ({ onClose, realisations }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: usersData, error } = await supabase
        .from("users")
        .select("*");

      if (error) {
        throw error;
      }

      setUsers(usersData || []);

      const counts = {};
      realisations.forEach(real => {
        if (real.userId) {
          counts[real.userId] = (counts[real.userId] || 0) + 1;
        }
      });
      setTaskCounts(counts);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs.");
      console.error("Erreur fetchUsers:", error);
    } finally {
      setLoading(false);
    }
  }, [realisations]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminStatus = async (userId, currentStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ isAdmin: !currentStatus })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast.success(`Statut administrateur mis à jour pour l'utilisateur ${userId}.`);
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut administrateur.");
      console.error("Erreur toggleAdminStatus:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Gestion des Utilisateurs</h2>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
            <p className="ml-3 text-lightText">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            {users.length === 0 ? (
              <p className="text-center text-lightText text-lg">Aucun utilisateur enregistré.</p>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-neutralBg rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                  <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                    <p className="font-bold text-text text-lg truncate">{user.displayName || user.email}</p>
                    <p className="text-sm text-lightText">ID: {user.id}</p>
                    <p className="text-sm text-lightText">Tâches complétées: {taskCounts[user.id] || 0}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isAdmin ? 'bg-success text-white' : 'bg-gray-300 text-gray-800'}`}>
                      {user.isAdmin ? 'Admin' : 'Utilisateur'}
                    </span>
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                      className={`py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs font-semibold
                        ${user.isAdmin ? 'bg-warning hover:bg-yellow-600 text-white' : 'bg-primary hover:bg-blue-600 text-white'}`}
                      disabled={loading}
                    >
                      {user.isAdmin ? 'Rétrograder' : 'Promouvoir Admin'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default AdminUserManagementModal;
