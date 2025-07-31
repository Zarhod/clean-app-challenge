// src/firebase.js
// Configuration et initialisation de Firebase

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';

// Les variables globales __firebase_config, __app_id et __initial_auth_token
// sont fournies par l'environnement Canvas.
// Il est crucial de les utiliser pour l'initialisation de Firebase.

const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      // Fallback local pour le développement si non défini dans l'environnement Canvas
      apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw",
      authDomain: "clean-app-challenge.firebaseapp.com",
      projectId: "clean-app-challenge",
      storageBucket: "clean-app-challenge.firebasestorage.app",
      messagingSenderId: "689290653968",
      appId: "1:689290653968:web:c55ebf0cc8efcef35b7595"
    };

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Obtient les instances de Firestore et Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Gère l'authentification initiale avec le jeton personnalisé fourni par Canvas
// ou se connecte anonymement si aucun jeton n'est disponible.
async function authenticateFirebase() {
  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
      console.log("Authentification Firebase réussie avec le jeton personnalisé.");
    } else {
      await signInAnonymously(auth);
      console.log("Authentification Firebase anonyme réussie.");
    }
  } catch (error) {
    console.error("Erreur d'authentification Firebase:", error);
    // En production, vous pourriez vouloir afficher un message d'erreur à l'utilisateur
    // ou rediriger vers une page d'erreur.
  }
}

// Appelle la fonction d'authentification au démarrage de l'application
authenticateFirebase();

export { db, auth };

