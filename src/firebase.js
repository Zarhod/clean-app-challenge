/* global __firebase_config */ // Déclare __firebase_config comme globale pour ESLint

// src/firebase.js
// Ce fichier a pour unique rôle de fournir l'objet de configuration Firebase.
// Il ne doit PAS initialiser l'application Firebase (pas d'appel à initializeApp ici).

// La variable globale __firebase_config est fournie par l'environnement de déploiement (Cloudflare Pages).
// Elle contient vos secrets REACT_APP_FIREBASE_... transformés en un objet JSON.
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      // ATTENTION : Ces valeurs sont des FALLBACKS/PLACEHOLDERS pour le développement local
      // ou si __firebase_config n'est pas correctement injectée par l'environnement.
      // Pour la production, vos VRAIES clés doivent venir de Cloudflare Pages.
      // Si ces placeholders sont utilisés en production, l'application ne se connectera PAS.
      apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw",
      authDomain: "clean-app-challenge.firebaseapp.com",
      projectId: "clean-app-challenge",
      storageBucket: "clean-app-challenge.firebasestorage.app",
      messagingSenderId: "689290653968",
      appId: "1:689290653968:web:c55ebf0cc8efcef35b7595"
    };

// Exporter uniquement l'objet de configuration.
// Les instances 'app', 'auth', 'db' ne sont PAS initialisées ici.
// Elles seront initialisées et exportées par UserContext.js via le hook useUser().
export { firebaseConfig };
