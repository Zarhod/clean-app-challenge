import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useUserContext } from './UserContext';
import { supabase } from './supabase';

const AdminLoginButton = () => {
  const { setUser } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const email = prompt('Entrez votre email :');
    const password = prompt('Entrez votre mot de passe :');

    if (!email || !password) {
      setError("Champs manquants");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Mauvais email ou mot de passe.");
      setLoading(false);
      return;
    }

    if (data?.user) {
      setUser(data.user);
    }

    setLoading(false);
  };

  return (
    <>
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Connexion...' : 'Connexion Admin'}
      </Button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </>
  );
};

export default AdminLoginButton;
