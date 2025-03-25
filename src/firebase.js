import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAq6Kd0c9z_x3Z96AFnEL7iK-nizFKMY1o",
  authDomain: "crown-invitational.firebaseapp.com",
  databaseURL: "https://crown-invitational-default-rtdb.firebaseio.com",
  projectId: "crown-invitational",
  storageBucket: "crown-invitational.firebasestorage.app",
  messagingSenderId: "502730869948",
  appId: "1:502730869948:web:6d6dae6990b2419cd214b9",
  measurementId: "G-YBZT950GXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { database, ref, push, set, onValue };