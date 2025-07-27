import React, { useState } from 'react';

function AdminLoginButton({ isAdmin, onLogin, onLogout, onOpenAdminPanel, buttonClass }) {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
    setPassword('');
    setShowLogin(false);
  };

  if (isAdmin) {
    return (
      <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onOpenAdminPanel}
          className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm sm:text-base"
        >
          Panneau Admin
        </button>
        <button
          onClick={onLogout}
          className={`${buttonClass || 'bg-gray-600 hover:bg-gray-700'} text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm sm:text-base`}
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={() => setShowLogin(!showLogin)}
        className={`${buttonClass || 'bg-gray-600 hover:bg-gray-700'} text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 text-sm sm:text-base`}
      >
        Admin
      </button>
      {showLogin && (
        <div className="absolute right-0 mt-2 p-4 bg-card rounded-lg shadow-xl z-10 w-64">
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
            <button
              type="submit"
              className="bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 text-sm"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 text-sm"
            >
              Annuler
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminLoginButton;
