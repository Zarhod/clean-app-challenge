import React, { useState } from 'react';

function AdminLoginButton({ isAdmin, onLogin, onLogout, onOpenAdminPanel }) {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
    setPassword('');
    setShowLogin(false);
  };

  const commonButtonClasses = "bg-gray-700 hover:bg-gray-800 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-300 text-xs sm:text-sm";

  if (isAdmin) {
    return (
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col sm:flex-row gap-1 sm:gap-2 z-10">
        <button
          onClick={onOpenAdminPanel}
          className={`${commonButtonClasses}`}
        >
          Panneau Admin
        </button>
        <button
          onClick={onLogout}
          className={`${commonButtonClasses}`}
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
      <button
        onClick={() => setShowLogin(!showLogin)}
        className={`${commonButtonClasses}`}
      >
        Admin
      </button>
      {showLogin && (
        <div className="absolute right-0 mt-2 p-3 bg-card rounded-lg shadow-xl z-20 w-56 sm:w-64 border border-primary/20">
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2">
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
