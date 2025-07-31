// src/AdminUserManagementModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ListAndInfoModal from './ListAndInfoModal';
import ConfirmActionModal from './ConfirmActionModal';
import { useUser } from './UserContext'; // Pour db et isAdmin

const AdminUserManagementModal = ({ onClose, realisations }) => {
  const { db, isAdmin, currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUserRealisations, setSelectedUserRealisations] = useState([]);
  const [showUserRealisationsModal, setShowUserRealisationsModal] = useState(false);

  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      toast.error("Erreur lors du chargement des utilisateurs.");
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleToggleAdmin = useCallback(async (userUid, currentAdminStatus) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (userUid === currentUser.uid) {
      toast.error("Vous ne pouvez pas modifier votre propre statut d'administrateur.");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userUid), {
        isAdmin: !currentAdminStatus
      });
      toast.success(`Statut administrateur de ${users.find(u => u.id === userUid)?.displayName} mis à jour.`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut administrateur.");
      console.error("Error updating admin status:", error);
    } finally {
      setLoading(false);
    }
  }, [db, isAdmin, users, currentUser]);

  const handleUpdatePoints = useCallback(async (userUid, newPoints) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userUid), {
        totalCumulativePoints: parseInt(newPoints, 10) // Assurez-vous que c'est un nombre
      });
      toast.success(`Points de ${users.find(u => u.id === userUid)?.displayName} mis à jour.`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour des points.");
      console.error("Error updating points:", error);
    } finally {
      setLoading(false);
    }
  }, [db, isAdmin, users]);

  const handleDeleteUser = useCallback(async (userUid, confirmed = false) => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      return;
    }
    if (userUid === currentUser.uid) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (!confirmed) {
      setUserToDelete(userUid);
      setShowConfirmDeleteModal(true);
      return;
    }

    setLoading(true);
    try {
      // Supprimer le document utilisateur dans Firestore
      await deleteDoc(doc(db, 'users', userUid));

      // Optionnel: Supprimer les réalisations associées à cet utilisateur
      const userRealisationsQuery = query(collection(db, 'realisations'), where('userId', '==', userUid));
      const userRealisationsSnapshot = await getDocs(userRealisationsQuery);
      const deletePromises = userRealisationsSnapshot.docs.map(d => deleteDoc(doc(db, 'realisations', d.id)));
      await Promise.all(deletePromises);

      toast.success(`Utilisateur ${users.find(u => u.id === userUid)?.displayName} et ses réalisations supprimés.`);
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'utilisateur.");
      console.error("Error deleting user:", error);
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setUserToDelete(null);
    }
  }, [db, isAdmin, users, currentUser]);

  const handleViewUserRealisations = (user) => {
    const userSpecificRealisations = realisations.filter(r => r.userId === user.id);
    setSelectedUserRealisations(userSpecificRealisations);
    setShowUserRealisationsModal(true);
  };

  return (
    <>
      <ListAndInfoModal title="Gestion des Utilisateurs" onClose={onClose} sizeClass="max-w-2xl sm:max-w-4xl">
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-4 border-t-transparent rounded-full animate-spin-fast"></div>
            <p className="ml-3 text-lightText">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-lightText text-md">Aucun utilisateur enregistré.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar p-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-neutralBg/50">
                <div className="flex items-center mb-3 sm:mb-0 sm:mr-4 flex-grow">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200" />
                  ) : (
                    <span className="text-4xl leading-none w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 mr-3">
                      {user.avatar || '👤'}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-text text-lg">{user.displayName}</p>
                    <p className="text-lightText text-sm">{user.email}</p>
                    <p className="text-lightText text-xs">UID: {user.id}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 items-end sm:items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-text mr-2">Admin:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={user.isAdmin}
                        onChange={() => handleToggleAdmin(user.id, user.isAdmin)}
                        disabled={loading || user.id === currentUser.uid} // Désactiver pour l'utilisateur actuel
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-text mr-2">Points:</span>
                    <input
                      type="number"
                      value={user.totalCumulativePoints}
                      onChange={(e) => handleUpdatePoints(user.id, e.target.value)}
                      className="w-20 p-1 border border-gray-300 rounded-md text-sm text-center"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleViewUserRealisations(user)}
                      className="bg-secondary hover:bg-teal-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs"
                      disabled={loading}
                    >
                      Voir Réalisations
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 text-xs"
                      disabled={loading || user.id === currentUser.uid} // Désactiver pour l'utilisateur actuel
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ListAndInfoModal>

      {showConfirmDeleteModal && (
        <ConfirmActionModal
          title="Confirmer la Suppression de l'Utilisateur"
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses réalisations ? Cette action est irréversible."
          confirmText="Oui, Supprimer"
          confirmButtonClass="bg-error hover:bg-red-700"
          cancelText="Non, Annuler"
          onConfirm={() => handleDeleteUser(userToDelete, true)}
          onCancel={() => { setShowConfirmDeleteModal(false); setUserToDelete(null); }}
          loading={loading}
        />
      )}

      {showUserRealisationsModal && (
        <ListAndInfoModal title={`Réalisations de ${selectedUserRealisations[0]?.displayName || 'l\'utilisateur'}`} onClose={() => setShowUserRealisationsModal(false)} sizeClass="max-w-xl">
          {selectedUserRealisations.length === 0 ? (
            <p className="text-center text-lightText text-md mt-4">Aucune réalisation trouvée pour cet utilisateur.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar p-2">
              {selectedUserRealisations.map((realisation) => (
                <div key={realisation.id} className="bg-neutralBg rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="font-semibold text-text text-sm">{realisation.taskName}</p>
                  <p className="text-lightText text-xs">Points: {realisation.pointsGagnes}</p>
                  <p className="text-lightText text-xs">Date: {new Date(realisation.timestamp.toDate ? realisation.timestamp.toDate() : realisation.timestamp).toLocaleDateString('fr-FR')}</p>
                  <p className="text-lightText text-xs">Statut: {realisation.statut}</p>
                </div>
              ))}
            </div>
          )}
        </ListAndInfoModal>
      )}
    </>
  );
};

export default AdminUserManagementModal;
