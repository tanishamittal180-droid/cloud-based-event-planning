import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-5MVjP6o1I4h1I6Rx0gdFllmCdRE5eTw",
  authDomain: "real-time-cloud-event-rsvp.firebaseapp.com",
  projectId: "real-time-cloud-event-rsvp",
  storageBucket: "real-time-cloud-event-rsvp.firebasestorage.app",
  messagingSenderId: "574012647915",
  appId: "1:574012647915:web:311ab5bcb9cae1845351ae",
  measurementId: "G-T6HVS8471R"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
