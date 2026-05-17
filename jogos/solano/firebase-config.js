import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCd8GfbF2MHAwe8OMWtb3t_hnsw9XOS3Qo",
  authDomain: "simulador-pense-offgrid.firebaseapp.com",
  projectId: "simulador-pense-offgrid",
  storageBucket: "simulador-pense-offgrid.firebasestorage.app",
  messagingSenderId: "769349304562",
  appId: "1:769349304562:web:09020b10e57724905b906b",
  measurementId: "G-3X1NM12RLR"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
