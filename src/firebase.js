// src/firebase.js
// Initialisation de Firebase

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Les variables globales sont fournies par l'environnement Canvas
// Assurez-vous qu'elles sont définies, sinon utilisez des valeurs par défaut pour le développement local
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw",
      authDomain: "clean-app-challenge.firebaseapp.com",
      projectId: "clean-app-challenge",
      storageBucket: "clean-app-challenge.firebasestorage.app",
      messagingSenderId: "689290653968",
      appId: "1:689290653968:web:c55ebf0cc8efcef35b7595"
    };

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Exporter les services et l'instance de l'application
export { app, auth, db };
