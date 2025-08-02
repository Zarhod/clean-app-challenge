import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';

const AdminBadgeManager = ({ onClose }) => {
  const { db } = useUser();
  const [badges, setBadges] = useState([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '', description: '', rule: '' });

  useEffect(() => {
    const fetchBadges = async () => {
      if (!db) return;
      const badgeRef = collection(db, 'badges');
      const snapshot = await getDocs(badgeRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBadges(data);
    };

    fetchBadges();
  }, [db]);

  const handleAddBadge = async () => {
    if (!newBadge.name || !newBadge.icon || !newBadge.description || !newBadge.rule) {
      toast.error('Tous les champs sont requis.');
      return;
    }

    try {
      await addDoc(collection(db, 'badges'), newBadge);
      toast.success('Badge ajouté avec succès');
      setNewBadge({ name: '', icon: '', description: '', rule: '' });
      const snapshot = await getDocs(collection(db, 'badges'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBadges(data);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du badge");
    }
  };

  const handleDeleteBadge = async (id) => {
    try {
      await deleteDoc(doc(db, 'badges', id));
      toast.success('Badge supprimé');
      setBadges(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Gestion des Badges</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nom"
            value={newBadge.name}
            onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Icone (ex: 🌟)"
            value={newBadge.icon}
            onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Description"
            value={newBadge.description}
            onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
            className="border p-2 rounded col-span-1 sm:col-span-2"
          />
          <select
            value={newBadge.rule}
            onChange={(e) => setNewBadge({ ...newBadge, rule: e.target.value })}
            className="border p-2 rounded col-span-1 sm:col-span-2"
          >
            <option value="">Choisir une règle d’attribution</option>
            <option value="level_1">Atteindre le niveau 1</option>
            <option value="xp_100">Atteindre 100 XP</option>
            <option value="urgent_task_done">Compléter une tâche urgente</option>
          </select>
        </div>

        <button
          onClick={handleAddBadge}
          className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-full font-semibold transition"
        >
          Ajouter le badge
        </button>

        <hr className="my-4" />

        <h3 className="font-bold mb-2">Badges existants :</h3>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {badges.map((badge) => (
            <li key={badge.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <p className="font-semibold">{badge.icon} {badge.name}</p>
                <p className="text-sm text-gray-600">{badge.description}</p>
                <p className="text-xs text-gray-500 italic">Règle : {badge.rule}</p>
              </div>
              <button
                onClick={() => handleDeleteBadge(badge.id)}
                className="text-red-500 hover:text-red-700 font-bold text-sm"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-full transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default AdminBadgeManager;
