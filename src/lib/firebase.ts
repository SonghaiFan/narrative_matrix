import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGYfb3fSqz3HmNtscJ_0UnA3GMjeAhk9g",
  authDomain: "user-study-narrative-matrix.firebaseapp.com",
  projectId: "user-study-narrative-matrix",
  storageBucket: "user-study-narrative-matrix.firebasestorage.app",
  messagingSenderId: "433289544791",
  appId: "1:433289544791:web:592020b5231908d7dbcf12",
  measurementId: "G-HK6N87TF4Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
