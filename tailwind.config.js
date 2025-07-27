/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50', // Vert (pour les éléments principaux, boutons, etc.)
        secondary: '#2196F3', // Bleu (pour les titres, accents)
        accent: '#FFC107', // Jaune/Orange (pour les éléments interactifs secondaires, alertes)
        background: '#F0F2F5', // Gris clair (fond général)
        card: '#FFFFFF', // Blanc (fond des cartes, sections)
        text: '#333333', // Gris foncé (texte principal)
        lightText: '#666666', // Gris moyen (texte secondaire)
        neutralBg: '#E0E0E0', // Gris neutre (pour les arrière-plans subtils)
        error: '#F44366', // Rouge (messages d'erreur, actions dangereuses)
        success: '#4CAF50', // Vert (messages de succès, actions positives)
        warning: '#FF9800', // Orange (messages d'avertissement)
        
        // Couleurs spécifiques pour le podium
        'podium-gold': '#FFD700',   // Or
        'podium-silver': '#C0C0C0', // Argent
        'podium-bronze': '#CD7F32', // Bronze
      },
      animation: {
        'spin-fast': 'spin 0.8s linear infinite', // Pour le spinner de chargement
        'fade-in-scale': 'fadeInScale 0.5s ease-out forwards', // Pour les popups
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
