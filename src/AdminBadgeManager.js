// src/AdminBadgeManager.js
import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AdminBadgeManager = ({ onClose }) => {
  const { db } = useUser();
  const [badges, setBadges] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      if (!db) return;
      const snapshot = await getDocs(collection(db, 'badges'));
      const badgeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBadges(badgeList);
    };
    fetchBadges();
  }, [db]);

  const handleAddBadge = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !icon.trim()) {
      toast.error("Tous les champs sont requis.");
      return;
    }

    try {
      await addDoc(collection(db, 'badges'), {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        createdAt: new Date().toISOString()
      });
      toast.success("Badge ajouté !");
      setName('');
      setDescription('');
      setIcon('');
    } catch (err) {
      toast.error("Erreur lors de l'ajout du badge.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 overflow-auto">
      <div className="bg-card rounded-2xl p-6 sm:p-8 w-full max-w-2xl relative shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-primary mb-4">Gestion des Badges</h2>

        <form onSubmit={handleAddBadge} className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-semibold">Nom du badge</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Premier Niveau"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Description</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Atteindre le niveau 1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Icône (emoji)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ex: 🥇"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-secondary text-white py-2 rounded-full font-bold transition"
          >
            Ajouter le badge
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-secondary">Badges existants :</h3>
          {badges.length === 0 ? (
            <p className="text-sm text-lightText">Aucun badge enregistré.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {badges.map((badge) => (
                <li key={badge.id} className="bg-background rounded p-2 shadow flex justify-between">
                  <span>{badge.icon} <strong>{badge.name}</strong></span>
                  <span className="text-xs text-gray-500">{badge.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AdminBadgeManager;
