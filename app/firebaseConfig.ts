// app/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAibpWTKsk1XU7eFnzmMovkQtfAbkZy6Ro",
  authDomain: "anduin-56b42.firebaseapp.com",
  projectId: "anduin-56b42",
  storageBucket: "anduin-56b42.firebasestorage.app",
  messagingSenderId: "91913026172",
  appId: "1:91913026172:web:0caa8a3992e4bfc51227f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
