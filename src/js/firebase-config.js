// Firebase initialization and Firestore export// src/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiZuMZC4cU0Bi_wEP4jEZgVCd0z0WYTII",
  authDomain: "clientmanagementz.firebaseapp.com",
  projectId: "clientmanagementz",
  storageBucket: "clientmanagementz.firebasestorage.app",
  messagingSenderId: "490220086139",
  appId: "1:490220086139:web:78665777e886f784e093de"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
