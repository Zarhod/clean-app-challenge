/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2', // Bleu clair
        secondary: '#50E3C2', // Vert d'eau
        accent: '#F5A623', // Orange vif
        text: '#333333', // Texte sombre
        lightText: '#666666', // Texte gris clair
        background: '#F8F8F8', // Fond très clair
        neutralBg: '#E0E0E0', // Gris neutre
        card: '#FFFFFF', // Fond de carte blanc
        success: '#4CAF50', // Vert succès
        error: '#F44336', // Rouge erreur
        warning: '#FFC107', // Jaune avertissement
        info: '#2196F3', // Bleu info
        'podium-gold': '#FFD700',
        'podium-silver': '#C0C0C0',
        'podium-bronze': '#CD7F32',
      },
      animation: {
        'spin-fast': 'spin 0.8s linear infinite',
        'fade-in-scale': 'fadeInScale 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Ceci active les classes comme 'form-checkbox'
  ],
};
