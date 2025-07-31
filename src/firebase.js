/* global __firebase_config */ // Déclare __firebase_config comme globale pour ESLint

// Ce fichier a pour unique rôle de fournir l'objet de configuration Firebase.
// Il ne doit PAS initialiser l'application Firebase (pas d'appel à initializeApp ici).
// Il ne doit PAS exporter 'app', 'auth', ou 'db' directement.

// La variable globale __firebase_config est fournie par l'environnement de déploiement (Cloudflare Pages).
// Elle contient vos secrets REACT_APP_FIREBASE_... transformés en un objet JSON.
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      // #####################################################################################
      // # IMPORTANT : COLLEZ VOS INFORMATIONS FIREBASE ICI                                #
      // # Remplacez les valeurs ci-dessous par les VRAIES informations de votre projet Firebase. #
      // # Vous les trouverez dans la console Firebase (Paramètres du projet > Vos applications > Votre application web). #
      // # Ces valeurs seront utilisées si __firebase_config n'est pas fournie par l'environnement. #
      // #####################################################################################
      apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw",
      authDomain: "clean-app-challenge.firebaseapp.com",
      projectId: "clean-app-challenge",
      storageBucket: "clean-app-challenge.firebasestorage.app",
      messagingSenderId: "689290653968",
      appId: "1:689290653968:web:c55ebf0cc8efcef35b7595"
      // #####################################################################################
    };

// Exporter uniquement l'objet de configuration.
// C'est la SEULE exportation de ce fichier.
export { firebaseConfig };
