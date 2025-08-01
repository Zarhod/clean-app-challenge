import { useState } from "react";
import { supabase } from "../../supabase/supabaseClient";
import toast from "react-hot-toast";

export default function AdminTaskFormModal({ closeModal, onTaskAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    const { error } = await supabase.from("tasks").insert([
      {
        title,
        description,
      },
    ]);

    if (error) {
      toast.error("Erreur lors de l'ajout de la tâche.");
    } else {
      toast.success("Tâche ajoutée avec succès !");
      onTaskAdded();
      closeModal();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Ajouter une tâche</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modal-input"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="modal-textarea"
          ></textarea>
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
