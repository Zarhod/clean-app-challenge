import React from 'react';
import { useUser } from './UserContext';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';

const AdminLoginButton = () => {
  const { user } = useUser();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      toast.error("Erreur lors de la connexion.");
      console.error("Login error:", error.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion.");
      console.error("Logout error:", error.message);
    }
  };

  return (
    <button onClick={user ? handleLogout : handleLogin} className="admin-login-button">
      {user ? 'Se déconnecter' : 'Connexion Admin'}
    </button>
  );
};

export default AdminLoginButton;
