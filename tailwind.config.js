/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Active le mode sombre basé sur la classe 'dark' sur l'élément html
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2', // Bleu vif
        secondary: '#50E3C2', // Vert d'eau
        success: '#7ED321', // Vert pour succès
        error: '#D0021B', // Rouge pour erreur
        warning: '#F5A623', // Orange pour avertissement
        info: '#4A4A4A', // Gris foncé pour info
        accent: '#F8E71C', // Jaune vif pour accent
        text: '#333333', // Texte principal
        lightText: '#666666', // Texte secondaire
        neutralBg: '#F8F8F8', // Fond neutre
        card: '#FFFFFF', // Fond des cartes/modales
        'podium-gold': '#FFD700', // Or pour le 1er
        'podium-silver': '#C0C0C0', // Argent pour le 2ème
        'podium-bronze': '#CD7F32', // Bronze pour le 3ème
        'background-light': '#87CEEB', // Light Sky Blue
        'background-dark': '#4682B4', // Steel Blue
      },
      keyframes: {
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-fast': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: '360deg' },
        }
      },
      animation: {
        'fade-in-scale': 'fade-in-scale 0.3s ease-out forwards',
        'spin-fast': 'spin-fast 0.8s linear infinite',
      },
      zIndex: {
        '999': '999',
        '1000': '1000',
      }
    },
  },
  plugins: [],
};
