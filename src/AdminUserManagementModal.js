import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import { useUser } from './UserContext'; // Pour db et isAdmin

const AdminUserManagementModal = ({ onClose, realisations }) => {
  const { db, isAdmin } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        console.error("Firestore DB non disponible.");
        toast.error("Erreur: Base de données non connectée.");
        setLoading(false);
        return;
      }
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Calculer le nombre de tâches par utilisateur
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
  }, [db, realisations]); // Ajout de db aux dépendances

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminStatus = async (userId, currentIsAdmin) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      if (!db) {
        console.error("Firestore DB non disponible.");
        toast.error("Erreur: Base de données non connectée.");
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isAdmin: !currentIsAdmin });
      toast.success(`Statut administrateur de l'utilisateur mis à jour !`);
      fetchUsers(); // Re-fetch pour mettre à jour la liste
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut admin.");
      console.error("Erreur toggleAdminStatus:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ListAndInfoModal title="Gestion des Utilisateurs" onClose={onClose} sizeClass="max-w-md">
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
          <p className="ml-3 text-lightText">Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
          {users.length === 0 ? (
            <p className="text-center text-lightText text-lg">Aucun utilisateur enregistré.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="bg-neutralBg rounded-xl p-4 shadow-md border border-primary/10 flex flex-col sm:flex-row items-center justify-between">
                <div className="text-center sm:text-left mb-2 sm:mb-0">
                  <p className="text-lg font-semibold text-secondary">{user.displayName || user.email}</p>
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
    </ListAndInfoModal>
  );
};

export default AdminUserManagementModal;
