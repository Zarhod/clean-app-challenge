// src/firebase.js
// Ce fichier initialise Firebase et exporte les services nécessaires.

// Importez les fonctions nécessaires des SDK Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Votre configuration Firebase
// REMPLACEZ CES VALEURS par celles obtenues à l'étape 1 de la console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDs0UtfVH2UIhAi5gDFF7asrNmVwQF03sw", 
  authDomain: "clean-app-challenge.firebaseapp.com", 
  projectId: "clean-app-challenge", 
  storageBucket: "clean-app-challenge.firebasestorage.app", 
  messagingSenderId: "689290653968", 
  appId: "1:689290653968:web:c55ebf0cc8efcef35b7595",
  measurementId: "G-VQKBD9HJCK"
};

// Initialisez Firebase
const app = initializeApp(firebaseConfig);

// Obtenez les instances des services que vous utiliserez
export const auth = getAuth(app);
export const db = getFirestore(app);

// Vous pouvez ajouter d'autres services si nécessaire, par exemple:
// import { getStorage } from 'firebase/storage';
// export const storage = getStorage(app);
