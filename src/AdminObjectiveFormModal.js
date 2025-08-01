import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabaseClient";
import toast from "react-hot-toast";

export default function AdminObjectiveFormModal({ closeModal, onObjectiveAdded }) {
  const [objective, setObjective] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!objective.trim()) {
      toast.error("Veuillez entrer un objectif.");
      return;
    }

    const { error } = await supabase.from("objectives").insert([{ content: objective }]);

    if (error) {
      toast.error("Erreur lors de l'ajout de l'objectif.");
    } else {
      toast.success("Objectif ajouté avec succès !");
      onObjectiveAdded();
      closeModal();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Ajouter un objectif</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nouvel objectif"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="modal-input"
          />
          <div className="modal-actions">
            <button type="submit" className="modal-button confirm">
              Ajouter
            </button>
            <button type="button" className="modal-button cancel" onClick={closeModal}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
