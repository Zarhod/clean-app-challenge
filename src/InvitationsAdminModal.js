import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useUser } from "./UserContext";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";

const generateCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

const InvitationsAdminModal = ({ open, onClose }) => {
  const { db } = useUser();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "invitations"));
    setCodes(
      snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (open && db) fetchCodes();
    // eslint-disable-next-line
  }, [open, db]);

  const handleCreate = async () => {
    setGenerating(true);
    try {
      const code = generateCode();
      await addDoc(collection(db, "invitations"), {
        code,
        createdAt: new Date().toISOString(),
        used: false,
      });
      toast.success("Invitation créée !");
      await fetchCodes();
    } catch (err) {
      toast.error("Erreur lors de la création.");
    }
    setGenerating(false);
  };

  const handleCopy = code => {
    navigator.clipboard.writeText(code);
    toast.info("Code copié !");
  };

  return (
    <Dialog open={open} onClose={onClose} className="z-[1002] fixed inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-auto shadow-xl flex flex-col gap-5 z-10">
        <Dialog.Title className="text-xl font-bold text-primary text-center mb-3">
          🎟️ Invitations à l’établissement
        </Dialog.Title>

        <button
          className="bg-primary hover:bg-secondary text-white font-semibold px-4 py-2 rounded-full shadow transition mb-2 mx-auto"
          onClick={handleCreate}
          disabled={generating}
        >
          + Générer une invitation
        </button>

        <div className="max-h-72 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center text-gray-400">Chargement...</div>
          ) : codes.length === 0 ? (
            <div className="text-center text-gray-400">Aucune invitation générée.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-1 font-bold">Code</th>
                  <th className="py-1 font-bold">Statut</th>
                  <th className="py-1 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(invite => (
                  <tr key={invite.id} className="border-t last:border-b">
                    <td className="py-1 text-center font-mono">{invite.code}</td>
                    <td className="py-1 text-center">
                      {invite.used ? (
                        <span className="text-green-600 font-semibold">Utilisé</span>
                      ) : (
                        <span className="text-yellow-600">Non utilisé</span>
                      )}
                    </td>
                    <td className="py-1">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCopy(invite.code)}
                          className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200"
                        >
                          Copier
                        </button>
                        {/* Suppression / révoquer ici au besoin */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-full font-semibold"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </Dialog>
  );
};

export default InvitationsAdminModal;
