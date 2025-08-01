import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabaseClient";
import toast from "react-hot-toast";

export default function AdminUserManagementModal({ closeModal }) {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newRole, setNewRole] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users_profiles").select("*");

    if (error) {
      toast.error("Erreur lors du chargement des utilisateurs.");
    } else {
      setUsers(data);
    }
  };

  const handleRoleChange = async (userId) => {
    const { error } = await supabase
      .from("users_profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du rôle.");
    } else {
      toast.success("Rôle mis à jour !");
      setEditingUserId(null);
      setNewRole("");
      fetchUsers();
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Gestion des utilisateurs</h2>
        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id} className="user-list-item">
              <span>{user.name || user.email || "Utilisateur"}</span>
              {editingUserId === user.id ? (
                <>
                  <input
                    type="text"
                    placeholder="Nouveau rôle"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="modal-input"
                  />
                  <button
                    className="modal-button confirm"
                    onClick={() => handleRoleChange(user.id)}
                  >
                    Valider
                  </button>
                </>
              ) : (
                <>
                  <span className="user-role">{user.role || "aucun rôle"}</span>
                  <button
                    className="modal-button small"
                    onClick={() => {
                      setEditingUserId(user.id);
                      setNewRole(user.role || "");
                    }}
                  >
                    Modifier
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <button className="modal-button cancel" onClick={closeModal}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
